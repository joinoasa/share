# OASA shared drive

The drive members use for big files: CAD, video, photos, datasheets and finished work. Built on Cloudflare R2 with [R2 Explorer](https://github.com/G4brym/R2-Explorer) (MIT).

| Address | Who | Bucket |
|---|---|---|
| **[share.joinoasa.org](https://share.joinoasa.org)** | Every member (GitHub sign-in, joinoasa org) | `oasa-files` |
| **[share-admin.joinoasa.org](https://share-admin.joinoasa.org)** | Admins only | `oasa-admin` |
| *(no address)* | The nightly backup Worker only | `oasa-backup` |

## How it's kept safe

- **GitHub sign-in only**, through Cloudflare Access. Only members of the `joinoasa` GitHub org get in, and the org requires two-factor sign-in. Leaving the org removes access right away.
- **One bucket per Worker.** The members' drive can't see admin files or the backup.
- **No side doors:** `workers.dev` and preview addresses are off, so every request goes through Access.
- **Nightly backup** at 07:23 UTC. It never deletes, and keeps the previous copy of a changed file for 30 days. R2 has no recycle bin, so this is how deleted files come back.
- **Agent key:** an R2 key that can read and write `oasa-files` only. It lives in GitHub secrets and 1Password, never in files.

## What's here

| Path | What |
|---|---|
| `src/drive.js` | Both drives (R2 Explorer settings) |
| `src/backup.js` | Backup logic; `src/backup-worker.js` runs it nightly |
| `wrangler.drive.jsonc`, `wrangler.admin.jsonc`, `wrangler.backup.jsonc` | One Worker each |
| `drive/` | The `00 Start Here` guides and folder READMEs, copied into the drive on every push (`.github/workflows/sync-drive.yml`) |
| `test/` | Backup tests |

## Work on it

```bash
npm ci
npm test               # backup tests
npm run check:deploy   # bundles all three Workers without deploying
```

Cloudflare Workers Builds deploys each Worker on every push to `main`. Access settings and the bucket lifecycle rule are in the Cloudflare dashboard; [`access/share.md`](https://github.com/joinoasa/admin/blob/main/access/share.md) in the admin repo records them.

## License

Apache-2.0. R2 Explorer is MIT, by Gabriel Massadas.
