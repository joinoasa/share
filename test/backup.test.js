import { test } from 'node:test';
import assert from 'node:assert/strict';
import { backupBucket, runBackup } from '../src/backup.js';

// A small in-memory stand-in for an R2 bucket binding. Pages lists at `pageSize`.
function fakeBucket(files = {}, pageSize = 2) {
	const store = new Map();
	let n = 0;
	const put = (key, body, opts = {}) => {
		store.set(key, { body: String(body), etag: `e${++n}`, customMetadata: opts.customMetadata ?? {}, httpMetadata: opts.httpMetadata ?? {} });
	};
	for (const [k, v] of Object.entries(files)) put(k, v);
	return {
		store,
		async list({ prefix = '', cursor } = {}) {
			const keys = [...store.keys()].filter((k) => k.startsWith(prefix)).sort();
			const start = cursor ? Number(cursor) : 0;
			const page = keys.slice(start, start + pageSize);
			const truncated = start + pageSize < keys.length;
			return {
				objects: page.map((key) => ({ key, etag: store.get(key).etag, size: store.get(key).body.length, customMetadata: store.get(key).customMetadata })),
				truncated,
				cursor: truncated ? String(start + pageSize) : undefined,
			};
		},
		async get(key) {
			const o = store.get(key);
			return o ? { body: o.body, httpMetadata: o.httpMetadata, customMetadata: o.customMetadata } : null;
		},
		async put(key, body, opts) {
			put(key, body, opts);
		},
	};
}

const day = '2026-10-28';

test('copies everything on the first run', async () => {
	const src = fakeBucket({ 'a.txt': 'A', 'docs/b.md': 'B', 'c.png': 'C' });
	const dst = fakeBucket();
	const s = await backupBucket({ src, dst, prefix: 'oasa-files', day, budget: { ops: 900 } });
	assert.equal(s.copied, 3);
	assert.equal(dst.store.get('oasa-files/docs/b.md').body, 'B');
	assert.equal(s.complete, true);
});

test('skips unchanged files, versions changed ones, never deletes', async () => {
	const src = fakeBucket({ 'a.txt': 'A', 'b.txt': 'B' });
	const dst = fakeBucket();
	await backupBucket({ src, dst, prefix: 'oasa-files', day: '2026-10-27', budget: { ops: 900 } });

	await src.put('a.txt', 'A2');
	src.store.delete('b.txt');
	const s = await backupBucket({ src, dst, prefix: 'oasa-files', day, budget: { ops: 900 } });

	assert.equal(s.copied, 1);
	assert.equal(s.versioned, 1);
	assert.equal(dst.store.get('oasa-files/a.txt').body, 'A2');
	assert.equal(dst.store.get(`_versions/${day}/oasa-files/a.txt`).body, 'A');
	assert.equal(dst.store.get('oasa-files/b.txt').body, 'B', 'deleted file stays in the backup');

	const again = await backupBucket({ src, dst, prefix: 'oasa-files', day, budget: { ops: 900 } });
	assert.equal(again.copied, 0);
	assert.equal(again.unchanged, 1);
});

test('stops at the budget and finishes on the next run', async () => {
	const files = Object.fromEntries(Array.from({ length: 10 }, (_, i) => [`f${i}`, String(i)]));
	const src = fakeBucket(files);
	const dst = fakeBucket();
	const first = await backupBucket({ src, dst, prefix: 'p', day, budget: { ops: 12 } });
	assert.equal(first.complete, false);
	assert.ok(first.copied > 0 && first.copied < 10);
	const second = await backupBucket({ src, dst, prefix: 'p', day, budget: { ops: 900 } });
	assert.equal(first.copied + second.copied, 10);
	assert.equal(second.complete, true);
});

test('runBackup covers both drives and writes a report', async () => {
	const env = { SRC_FILES: fakeBucket({ x: '1' }), SRC_ADMIN: fakeBucket({ y: '2' }), BACKUP: fakeBucket() };
	const report = await runBackup(env, new Date('2026-10-28T07:23:00Z'));
	assert.deepEqual(report.results.map((r) => r.copied), [1, 1]);
	assert.ok(env.BACKUP.store.has('oasa-files/x'));
	assert.ok(env.BACKUP.store.has('oasa-admin/y'));
	assert.ok(env.BACKUP.store.has('_reports/last-run.json'));
});
