# Knowledge

Append-only register of project-specific rules, patterns, and lessons learned.

---

## K001 — CLI Environment Commands (2026-04-03)

Three CLI entry points map to three runtime environments:

| Command | Source | `HX_ENV` | Use Case |
|---|---|---|---|
| `hx` | `dist/loader.js` (npm global install) | `production` | Stable release from npm registry |
| `hx-dev` | `src/loader.ts` via `--experimental-strip-types` | `staging` | Live TypeScript source — active development |
| `hx-local` | `dist/loader.js` (local repo build) | `local` | Locally built dist — build verification |

Key files:
- `scripts/hx-dev.js` — spawns TS source with `HX_ENV=staging`
- `scripts/hx-local.js` — spawns local dist with `HX_ENV=local`
- `src/loader.ts` — reads `HX_ENV` (defaults to `production`), sets `process.title`, shows env tag in `--version` and first-run banner

Rules:
- `HX_ENV` is set by the launch script, never by the user's `.env` file.
- `hx --version` prints bare version for production, appends `(staging)` or `(local)` for non-prod.
- `process.title` shows `hx` for prod, `hx [staging]` or `hx [local]` for others — visible in `ps` output.
- Currently all three point to the same local repo via `npm link`. To switch `hx` to true prod: `npm unlink -g @hyperlab/hx && npm install -g @hyperlab/hx`.
