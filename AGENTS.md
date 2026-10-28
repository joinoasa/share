# AGENTS.md: working in the OASA share repo

Read by AI agents and useful for people too. The shared rules are at [joinoasa.org/docs/agents/](https://joinoasa.org/docs/agents/); this file adds to them and never loosens them.

This repo controls who can reach OASA's files, so a person reviews every change.

## Rules

1. **Never weaken the way in.** Keep `workers_dev: false` and `preview_urls: false`, keep `cfAccessTeamName`, and never add a route that skips Cloudflare Access.
2. **One bucket per Worker.** Don't bind `oasa-admin` or `oasa-backup` to the members' drive.
3. **The backup never deletes.** Keep it add-only.
4. **No secrets** in files, logs, issues or chat. Keys live in GitHub secrets and 1Password.
5. Run `npm test` and `npm run check:deploy` before every pull request, and paste `python3 tools/oasa-files/oasa_toml.py run --markdown` output (from the website repo) when you have it.

## Writing to the drive as an agent

- Use the `oasa-files` bucket only, through its S3-compatible API.
- Write under `Agents/<repo or task>/`. Don't overwrite or delete people's files.
- In GitHub Actions use the `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` and `R2_ACCOUNT_ID` secrets with `--region auto` and endpoint `https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com`.
- `drive/00 Start Here/` is copied over the drive on every push, so edit the guides here, not in the drive.

## Writing style

Short, clear, not wordy. Guides are for new members, including people who don't code.
