// Nightly backup logic for the OASA shared drive.
//
// Copies new and changed files from a source bucket into the backup bucket under
// `<prefix>/`. It never deletes anything, so a file deleted from the drive stays in the
// backup. When a file changes, the previous backup copy moves to
// `_versions/<YYYY-MM-DD>/<prefix>/<key>` first (a lifecycle rule on the backup bucket
// clears `_versions/` after 30 days).
//
// R2 calls are counted against `budget.ops`, because a Worker run on the free plan can
// make about 1,000 of them. Whatever doesn't fit carries over to the next night.

const MAX_SINGLE_PUT = 5_000_000_000; // R2 limit for one put (5 GB)

async function listAll(bucket, prefix, budget) {
	const out = [];
	let cursor;
	do {
		if (budget.ops < 1) return { objects: out, complete: false };
		budget.ops -= 1;
		const page = await bucket.list({ prefix, cursor, include: ['customMetadata'] });
		out.push(...page.objects);
		cursor = page.truncated ? page.cursor : undefined;
	} while (cursor);
	return { objects: out, complete: true };
}

export async function backupBucket({ src, dst, prefix, day, budget }) {
	const stats = { prefix, copied: 0, versioned: 0, unchanged: 0, skipped: [], complete: true };

	const backed = await listAll(dst, `${prefix}/`, budget);
	const sourceEtag = new Map(backed.objects.map((o) => [o.key, o.customMetadata?.['source-etag']]));
	const source = await listAll(src, undefined, budget);
	if (!backed.complete || !source.complete) stats.complete = false;

	for (const obj of source.objects) {
		const key = `${prefix}/${obj.key}`;
		const had = sourceEtag.has(key);
		if (had && sourceEtag.get(key) === obj.etag) {
			stats.unchanged += 1;
			continue;
		}
		if (obj.size > MAX_SINGLE_PUT) {
			stats.skipped.push(obj.key);
			continue;
		}
		const cost = had ? 4 : 2;
		if (budget.ops < cost) {
			stats.complete = false;
			break;
		}

		if (had) {
			budget.ops -= 2;
			const old = await dst.get(key);
			if (old) {
				await dst.put(`_versions/${day}/${key}`, old.body, {
					httpMetadata: old.httpMetadata,
					customMetadata: old.customMetadata,
				});
				stats.versioned += 1;
			}
		}

		budget.ops -= 2;
		const body = await src.get(obj.key);
		if (!body) continue; // deleted since the list
		await dst.put(key, body.body, {
			httpMetadata: body.httpMetadata,
			customMetadata: { ...body.customMetadata, 'source-etag': obj.etag },
		});
		stats.copied += 1;
	}
	return stats;
}

export async function runBackup(env, now = new Date()) {
	const day = now.toISOString().slice(0, 10);
	const budget = { ops: 900 };
	const results = [];
	for (const [prefix, src] of [
		['oasa-files', env.SRC_FILES],
		['oasa-admin', env.SRC_ADMIN],
	]) {
		results.push(await backupBucket({ src, dst: env.BACKUP, prefix, day, budget }));
	}
	const report = { ranAt: now.toISOString(), opsLeft: budget.ops, results };
	await env.BACKUP.put('_reports/last-run.json', JSON.stringify(report, null, 2), {
		httpMetadata: { contentType: 'application/json' },
	});
	return report;
}
