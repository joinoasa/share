// oasa-share-backup: runs once a night (wrangler.backup.jsonc) and copies both drives
// into the oasa-backup bucket. It has no web address.
import { runBackup } from './backup.js';

export default {
	async scheduled(event, env, ctx) {
		ctx.waitUntil(
			runBackup(env, new Date(event.scheduledTime)).then((report) => console.log(JSON.stringify(report))),
		);
	},
	async fetch() {
		return new Response('Not found', { status: 404 });
	},
};
