# Use the drive as a folder on your computer

Most members just use the browser. If you move a lot of big files, you can mount the drive as a folder with [rclone](https://rclone.org) (free, Windows, Mac and Linux).

1. Ask an admin for a **personal drive key** (they open an *Access request* in the admin repo). It reaches only the members' drive, and it's removed when you leave OASA.
2. Install rclone, then run `rclone config` and pick **Cloudflare R2** (provider `Cloudflare`). Enter the key and the endpoint your admin gives you.
3. Mount it: `rclone mount oasa:oasa-files ~/OASA-drive --vfs-cache-mode writes`.

Keep the key in your password manager. Never put it in a file you share or a repo.
