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

## Worktree file write reliability (M001/S01/T01)

**Rule:** In git worktree environments, background `async_bash` jobs and `xargs`-based approaches to `perl -pi` do NOT reliably persist file writes. Only synchronous foreground shell loops (`while IFS= read -r FILE; do perl -pi /script.pl "$FILE"; done`) reliably modify tracked files.

**Pattern:** Write the perl substitution script to a temp file (`/tmp/renames.pl`) then invoke `perl -pi /tmp/renames.pl "$FILE"` in a synchronous while loop. Avoid: `eval "perl -pi -e '...' $FILES"` (arg length limit), `xargs perl -pi -e "..."` (quoting issues with multiple substitutions), async_bash loops (background process isolation).

## Import aliasing for protected function exports (M001/S01/T01)

**Rule:** When callers reference identifiers exported from a file that cannot be modified (e.g., backward-compat migration code), use import aliasing to rename at the call site:
```typescript
import { oldFunctionName as newLocalName } from "./protected-file.js";
```
This clears verification greps without touching the protected file's exports.

## Gsd*/GSD* rename exceptions — Rust N-API interface declarations (M001/S01)

TypeScript interface property declarations that mirror Rust N-API function names (e.g., `batchParseGsdFiles:` and `scanGsdTree:` in `native-parser-bridge.ts`) must be left unchanged until S04 renames the Rust bindings. The T01 verification filter excluded only `native.scanGsdTree` and `native.batchParseGsdFiles` (method call syntax) but not bare property declarations. This is expected — 2 remaining hits are S04 scope.

## Verification grep exclusion gap — native Function cast calls (M001/S01/T02)

**Rule:** The T02 verification grep pattern excludes `native\.batchParseGsdFiles` but this only matches `native.batchParseGsdFiles` directly. The hx-parser/index.ts calls the native binary via cast: `(native as Record<string, Function>).batchParseGsdFiles(`. This does NOT match the exclusion pattern, leaving a count of 1 (not 0). This is intentional — the Rust binary still exports `batchParseGsdFiles` (renamed in S04), so the call string must stay unchanged until S04.

**Pattern:** When a native binary function is called via TypeScript's indexed access `obj.funcName(`, don't rename it until the binary itself is renamed. The TS wrapper function and interface declaration can be renamed first; only the string literal used as the runtime property key must wait.

## Edit tool misses Rust tokens with duplicate struct context — use sed instead (M001/S04/T01)

**Rule:** When renaming a Rust type that appears in multiple structural contexts (e.g., `struct ParsedHxFile`, `Vec<ParsedGsdFile>`, `parsed_files.push(ParsedGsdFile {`), the Edit tool can miss occurrences because the match requires exact surrounding text. Use `sed -i '' 's/OldName/NewName/g'` for bulk identifier replacement in Rust files with repeated token patterns.

**Pattern:** After any Edit-based Rust rename, always verify with `grep -n OldName file.rs` before proceeding. If hits remain, fall back to sed.

## Glob is safer than explicit file lists for homogeneous test fixture updates (M001/S04/T02)

**Rule:** When updating binary path strings across many similar test files (e.g., all `*.test.mjs` in `__tests__/`), use a shell glob rather than listing files explicitly. The glob catches files added since the plan was written. In S04/T02, the plan listed 13 files but 15 existed — the for-loop caught all automatically.

**Pattern:** `for f in dir/*.test.mjs; do sed -i '' 's/old/new/g' "$f"; done` is more robust than a hardcoded list.

## GSD→HX batch rename: test files can have duplicate variable names from renaming (M001/S01/T02)

**Rule:** When test files test migration (e.g., migrate-gsd-to-hx.test.ts), they often have BOTH `gsdHome` (source dir) and `hxHome` (dest dir) variables. Batch renaming `gsdHome` → `hxHome` creates duplicate `const hxHome` declarations (TS2451 error). Fix by renaming the original `gsdHome` to `legacyHome` or `sourceHome` instead.

**Pattern:** Review migration test files manually before or after batch renaming — they uniquely reference both old and new names as test fixtures.

## A rename-only milestone can uncover pre-existing runtime bugs (M001/S02/T02)

**Rule:** When renaming env vars, always check that both the write side and read side of each variable are updated together. In M001, `rpc-mode.ts` still read `GSD_WEB_BRIDGE_TUI` while `bridge-service.ts` already wrote `HX_WEB_BRIDGE_TUI` — this was a silent pre-existing bug that broke the embedded terminal feature. Similarly, `daemon.test.ts` set `GSD_DAEMON_CONFIG` but the daemon read `HX_DAEMON_CONFIG`.

**Pattern:** Grep both for the old name and for any "split" references where the key appears on one side but not the other. `grep -rn 'BRIDGE_TUI\|DAEMON_CONFIG'` finds all occurrences of both sides.

## Requirements DB vs REQUIREMENTS.md: always seed the DB before using hx_requirement_update (M001 close)

**Rule:** The `hx_requirement_update` tool updates requirements stored in the HX database (hx.db). If requirements were defined only in REQUIREMENTS.md (not seeded to the DB), the tool will return "Requirement RXXX not found." In this case, update REQUIREMENTS.md directly.

**Pattern:** At project kickoff, either seed requirements via the HX API or accept that requirement updates must be applied directly to REQUIREMENTS.md. Verify DB state with `sqlite3 .hx/hx.db "SELECT COUNT(*) FROM requirements;"` before calling hx_requirement_update.

## Import aliasing prevents scope creep into protected files (M001/S01)

**Rule:** When a protected file (like migrate-gsd-to-hx.ts) exports functions with old naming, callers should use import aliasing (`import { oldName as newLocalAlias }`) rather than modifying the protected file. This keeps the protected file untouched while allowing callers to use new naming conventions internally.

**Pattern:** `import { migrateProjectGsdToHx as migrateProject } from './migrate-gsd-to-hx.js'` — the alias hides the old name at the call site without touching the protected file.

## CI secret environment variables are not in source control (M001 close)

**Rule:** After a large env var rename (GSD_* → HX_*), remember that GitHub Actions secrets and environment variables configured in the GitHub repository settings UI are NOT in source control. The source rename is complete, but any `GSD_*` secrets in the GitHub repo settings must be manually renamed or duplicated in the GitHub UI.

**Pattern:** After any env var rename milestone, audit the GitHub repository's "Secrets and variables" settings page to rename any matching secrets. This cannot be automated via source-only changes.
