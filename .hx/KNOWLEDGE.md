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

## compile-tests.mjs skips the integration/ subdirectory (M002/S05/T04)

**Rule:** `scripts/compile-tests.mjs` has a `SKIP_DIRS` exclusion that prevents compilation of files in `tests/integration/`. Any test file placed in `src/resources/extensions/hx/tests/integration/` will NOT appear in `dist-test/` and will silently not run.

**Pattern:** Always place new test files in the flat `src/resources/extensions/hx/tests/` directory. If the plan says "tests/integration/", place the file one level up (flat `tests/`) and add an explicit compile step if integration isolation is truly needed.

**Exception:** T05 ported the T04 test to `tests/integration/` and added a manual compile step to `scripts/compile-tests.mjs`. This is the approved pattern if integration/ placement is truly required — add the sub-path explicitly to the compile script.

## Porting worktree changes to main project when gates run from main CWD (M002/S05/T05)

**Rule:** The auto-fix gate runs tests from the main project CWD (`/Users/beratcan/Desktop/GithubProjects/hx-ai`), not from the worktree. Any test files or source changes that exist only in the worktree's `dist-test/` will not be found by the gate.

**Pattern:** When a task creates new test files and those tests must pass the auto-fix gate, apply the same changes to both the worktree AND the main project. Use `cp` to mirror the source files and re-run `node scripts/compile-tests.mjs` in the main project.

## IIFE pattern for conditional spread in buildBeforeAgentStartResult (M002/S05/T03)

**Rule:** When adding a conditional injection to `buildBeforeAgentStartResult()` that should not restructure the return shape, use an IIFE spread pattern:
```typescript
...(() => {
  const marker = readForensicsMarker(basePath);
  if (!injection && marker) {
    clearForensicsMarker(basePath);
    return { injection: { customType: "hx-forensics", content: marker.content } };
  }
  return {};
})()
```
This keeps the conditional logic inline without extracting extra variables that bloat the surrounding function.

## splitCompletedKey null semantics for hook/* keys (M002/S05/T02)

**Rule:** `splitCompletedKey` returns `null` for `hook/<name>` keys with NO id remainder (i.e., exactly `hook/name` with nothing after the slash), not just any malformed input. A key like `hook/telegram-progress/M007/S01` is valid (type=`hook/telegram-progress`, id=`M007/S01`). Only keys with zero slashes or hook keys with no segment after the hook name return null.

**Pattern:** When using splitCompletedKey, always null-check the result before destructuring. Log/skip null entries rather than crashing.

## Node.js 23.4 cannot import absolute .ts file:// URLs even with --import hooks

The `resolve` hook in Node.js 23 is **not invoked** for absolute `file://` URLs pointing to `.ts` files — Node.js rejects the extension at the filesystem level before hooks run. This means any test that does `import(pathToFileURL('/path/to/file.ts').href)` will fail with `ERR_UNKNOWN_FILE_EXTENSION` regardless of what hooks are registered. Similarly, static `import` statements in `.mjs` files that reference `.ts` files bypass hooks.

**Fix:** When running compiled tests from `dist-test/`, use the compiled `.js` counterpart. For the extension smoke test: use `dist-test/src/resources/extensions/` as extensionsDir. For `.mjs` test files with static imports: use `.js` extensions (the dist-test-resolve hook rewrites `.ts`→`.js` for relative imports in compiled `.js` files, but not in `.mjs` static imports).

## HX_RTK_DISABLED=1 is set in this development environment

Any test that exercises RTK functionality (rtk-session-stats, rewriteCommandWithRtk, etc.) must explicitly unset `HX_RTK_DISABLED` during the test. Use a helper pattern:
```ts
function withRtkEnabled(): () => void {
  const prev = process.env.HX_RTK_DISABLED;
  delete process.env.HX_RTK_DISABLED;
  return () => {
    if (prev === undefined) delete process.env.HX_RTK_DISABLED;
    else process.env.HX_RTK_DISABLED = prev;
  };
}
```
Call the returned function in the `finally` block.

## dist-test accumulates stale directories from renamed/removed source extensions

The `compile-tests.mjs` script does **not** clean `dist-test/` before rebuilding — it only overwrites files that still exist in source. If a directory is renamed or removed (e.g., `gsd/` → `hx/`), the old directory persists in `dist-test/` indefinitely. This causes static analysis tests that scan `dist-test/src/` to find ghost files. Periodically run `rm -rf dist-test/src/resources/extensions/<old-name>` when renaming extension directories, or add a manifest-diff cleanup step to `compile-tests.mjs`.

## deleteSlice disk-DB symmetry is a critical invariant (M002/S03)

**Rule:** Any DB row deletion for a slice, task, or milestone must also remove the corresponding disk artifact directory. If only the DB row is deleted, `deriveState()` reconciliation will re-insert the deleted row on the next cycle (it scans disk and inserts any missing entries).

**Pattern:** Always pair `deleteSlice(db, id)` with `rmSync(slicePath, { recursive: true, force: true })`. Same applies to tasks and milestones. The disk-DB symmetry invariant must be maintained in both directions — creation and deletion.

## When porting upstream TUI changes, verify each item individually (M002/S04)

**Rule:** hx-ai is frequently ahead of upstream on TUI changes (the fork has independent improvements). In the S04 28-file TUI audit, 12 of 15 items were already correct in hx-ai and required no changes. Do NOT assume all upstream TUI fixes need to be applied — check each one.

**Pattern:** For each upstream TUI fix, `grep -n <pattern> <file>` in hx-ai before writing any code. If the fix is already there (same or equivalent implementation), mark it N/A and move on. Only the 3 items that were genuinely different required code changes.

## upstream 'quality_gates' vs 'gate_results' table name divergence (M002/S03)

**Rule:** The upstream gsd-2 codebase refers to gate rows in some files as written to a 'gate_results' table, but the actual hx-ai DB schema uses 'quality_gates'. Always verify the table name against the actual schema (`sqlite3 .hx/hx.db ".schema quality_gates"`) before porting any gate-writing code.

**Pattern:** grep for both names in the actual schema file (hx-db.ts CREATE TABLE statements) before writing any INSERT INTO queries for gate rows. The safe name to use is 'quality_gates'.

## Forensics marker pattern — reusable context-injection template (M002/S05)

**Rule:** The forensics persistence pattern (write JSON to `.hx/runtime/<type>-marker.json` after an investigation, inject as a named custom-type context block on the next agent turn, then clear the marker) is a general template for "remember this for next turn" use cases.

**Pattern:**
1. After completing work: `writeFileSync(markerPath, JSON.stringify({ content: report, timestamp: Date.now() }))`
2. In `buildBeforeAgentStartResult()`: check for marker, if present clear it and return `{ injection: { customType: "hx-<type>", content: marker.content } }`
3. In `system-context.ts`: handle `customType === "hx-<type>"` to inject as a named context block

The pattern handles cold-start re-injection (the agent was stopped and restarted) correctly because the marker persists on disk across process restarts.

## Capability-routing: scoreModel returns 1.0 for unknown model profiles (M003/S01)

**Rule:** `scoreModel` returns 1.0 (perfect score) for models with no entry in `MODEL_CAPABILITY_PROFILES`, not 0 or a penalty. This preserves pass-through semantics — unknown models should not be silently demoted.

**Pattern:** When adding new models to the capability layer, they will silently score 1.0 (winning over known models that don't fully match requirements) until a profile entry is added. Always add a profile entry alongside any new model addition to MODEL_CAPABILITY_TIER.

## Capability-routing: test vision requirements via metadata.tags not metadata.visionRequired (M003/S01/T04)

**Rule:** `computeTaskRequirements` reads `metadata.tags` (e.g., `['vision']`) to detect vision requirements, NOT the `metadata.visionRequired` boolean. The boolean is set in `extractTaskMetadata` from content scanning, but `computeTaskRequirements` checks for the `'vision'` string in the tags array.

**Pattern:** In capability-router tests, set `tags: ['vision']` to simulate a vision task. Setting `visionRequired: true` directly on metadata will NOT trigger vision routing unless the tags path is also activated.

## selectionMethod is a required field on RoutingDecision — all return paths must set it (M003/S01/T02)

**Rule:** `selectionMethod` was added as a required (non-optional) field on `RoutingDecision`. All 5 return paths in `resolveModelForComplexity` set it explicitly. Do not make it optional — callers that log or switch on it would need null-checks everywhere.

**Pattern:** When extending RoutingDecision with new required fields, trace all return paths in resolveModelForComplexity (early-exit for unknown model, downgrade path, escalate path, default-model path, normal path) and update each one.
