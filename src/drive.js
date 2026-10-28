// share.joinoasa.org and share-admin.joinoasa.org: the R2 Explorer drive.
// Each Worker only sees the bucket bound in its wrangler config.
// Cloudflare Access signs people in (GitHub only) before any request reaches this code,
// and R2 Explorer checks the Access token again on every /api/ call.
import { R2Explorer } from 'r2-explorer';

export default R2Explorer({
	readonly: false,
	cfAccessTeamName: 'joinoasa',
	emailRouting: false,
	showHiddenFiles: false,
});
