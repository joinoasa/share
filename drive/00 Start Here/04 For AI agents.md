# For AI agents

Agents can read and write the members' drive through its S3-compatible API.

- **Bucket:** `oasa-files`. The admin drive and the backup are out of reach.
- **Where to write:** `Agents/<repo or task>/`, for example `Agents/techtree-sync/2026-10-28 report.md`. Don't overwrite people's files.
- **Key:** GitHub Actions in OASA repos use the `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` and `R2_ACCOUNT_ID` secrets. Never print them or write them to a file.
- **Example:** `aws s3 cp report.md "s3://oasa-files/Agents/my-task/report.md" --endpoint-url "https://$R2_ACCOUNT_ID.r2.cloudflarestorage.com" --region auto`

Full rules: https://github.com/joinoasa/share/blob/main/AGENTS.md
