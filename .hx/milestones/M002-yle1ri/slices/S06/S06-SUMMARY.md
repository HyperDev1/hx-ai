---
id: S06
parent: M002-yle1ri
milestone: M002-yle1ri
provides:
  - All 95 upstream v2.59.0 bugfixes accounted for and applied to hx-ai with GSD→HX naming.
  - Clean test suite baseline (4113/0/5) for M002-yle1ri milestone completion.
  - Fixed test infrastructure: smoke test, auto-supervisor, RTK env isolation, stale dist-test artifact removal.
requires:
  []
affects:
  []
key_files:
  - src/tests/extension-smoke.test.ts
  - src/resources/extensions/hx/tests/auto-supervisor.test.mjs
  - src/tests/rtk-session-stats.test.ts
  - src/tests/rtk.test.ts
  - packages/pi-coding-agent/src/core/tools/read.ts
  - packages/pi-coding-agent/src/core/tools/hashline-read.ts
  - packages/pi-coding-agent/src/core/exec.ts
  - packages/pi-coding-agent/src/core/lsp/index.ts
  - packages/pi-coding-agent/src/core/lsp/lspmux.ts
  - src/web-mode.ts
  - src/resources/extensions/ask-user-questions.ts
  - src/resources/extensions/shared/interview-ui.ts
  - src/resources/extensions/mcp-client/index.ts
  - src/resources/extensions/google-search/index.ts
  - scripts/ensure-workspace-builds.cjs
  - docs/what-is-pi/15-pi-packages-the-ecosystem.md
  - src/resources/skills/create-hx-extension/SKILL.md
key_decisions:
  - Fixed extension-smoke test to use dist-test/src/resources/extensions/ as extensionsDir (compiled .js output) rather than source src/resources/extensions/ — Node.js 23.4 cannot import absolute .ts file:// URLs even with --import hooks.
  - Fixed auto-supervisor.test.mjs to use .js extensions in static imports — static imports in .mjs files bypass the dist-test-resolve hook in Node.js 23.4.
  - Fixed RTK tests by adding withRtkEnabled() helper to temporarily unset HX_RTK_DISABLED — the test environment has this set to 1 which silently disables all RTK functionality.
  - Removed stale dist-test/src/resources/extensions/gsd/ directory (April 2 artifact from pre-rename build) — not recreated since source no longer has a gsd extension.
  - All 9 S06 upstream fixes applied with GSD→HX naming adaptation throughout — no GSD references introduced.
patterns_established:
  - withRtkEnabled() helper pattern: any test that exercises RTK functionality must temporarily unset HX_RTK_DISABLED to avoid silent no-ops when the env var is set in CI.
  - Extension smoke test must use dist-test extensionsDir when running from compiled output — source .ts files cannot be dynamically imported without --experimental-strip-types.
  - Static imports in .mjs test files must use .js extensions (not .ts) — the dist-test-resolve hook only intercepts relative imports in compiled .js files, not static imports in .mjs files.
  - dist-test accumulates stale artifacts from renamed/removed source directories — periodic manual cleanup or a pre-build clean step is needed to avoid false positives in static analysis tests.
observability_surfaces:
  - 4113 unit tests pass with 0 failures — full regression baseline for M002-yle1ri closure.
  - TypeScript --noEmit clean confirms no type regressions from any of the 9 ported fixes or test infrastructure repairs.
drill_down_paths:
  - .hx/milestones/M002-yle1ri/slices/S06/tasks/T01-SUMMARY.md
  - .hx/milestones/M002-yle1ri/slices/S06/tasks/T02-SUMMARY.md
  - .hx/milestones/M002-yle1ri/slices/S06/tasks/T03-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-04-04T22:31:47.199Z
blocker_discovered: false
---

# S06: Remaining Fixes (tools, windows, user-interaction, misc)

**Ported 9 upstream v2.59.0 bugfix commits and fixed 3 pre-existing test infrastructure failures — all 4113 tests pass, typecheck clean, all 95 upstream fixes now accounted for.**

## What Happened

S06 closed out the M002-yle1ri milestone by porting 9 remaining upstream v2.59.0 bugfix commits across three tasks and then fixing three pre-existing test infrastructure failures discovered by the verification gate.

**T01 — read-tool offset clamping + Windows shell guards:**
Both `read.ts` and `hashline-read.ts` now clamp out-of-bounds offset values (instead of throwing) and emit a `[Offset N beyond end of file…]` prefix. Three spawn sites in `exec.ts`, `lsp/index.ts`, and `lsp/lspmux.ts` gained `shell: process.platform === "win32"`. Eight new tests across two test files verify the clamping behavior and structural shell guard presence.

**T02 — windowsHide: true across web-mode and 14 web service files:**
All 20 `execFile`/`spawn` call sites in `src/web-mode.ts` and the 14 web service files gained `windowsHide: true` to prevent console-window flash on Windows. The existing integration test expectation was updated; a new structural test (5 assertions) verified coverage across a sample of files.

**T03 — Six isolated bugfix commits bundled:**
- Fix A: ask-user-questions free-text — after "None of the above" selection, `ctx.ui.input()` prompts for a free-text note appended as `user_note: …` to the answer.
- Fix B: MCP server name trim + case-insensitive — `getServerConfig` now normalizes via `.trim()` and `.toLowerCase()`.
- Fix C: OAuth google_search shape — URL gets `?alt=sse`, body gains `userAgent: "pi-coding-agent"`.
- Fix D: npm tarball staleness `.git` guard — `detectStalePackages` returns `[]` when not in a git repo.
- Fix E: Discord invite link — `docs/what-is-pi/15-pi-packages-the-ecosystem.md` updated from `discord.com/invite/3cU7Bz4UPx` to `discord.gg/hx`.
- Fix F: create-hx-extension path clarification — SKILL.md blockquote warning added.
Eight new test files with 32 new passing tests confirmed all fixes.

**Verification gate fixes (auto-fix attempt 1):**
The verification gate found `npm run test:unit` returning exit code 1 due to 10 pre-existing failures. Three root causes were fixed:

1. **Extension smoke test** (`src/tests/extension-smoke.test.ts`): The test computed `extensionsDir` pointing to the source `src/resources/extensions/` and then attempted to `import(pathToFileURL(entryPath).href)` on `.ts` files. Node.js 23.4 rejects `.ts` absolute file:// imports before hooks can intercept them. Fixed by pointing `extensionsDir` to `dist-test/src/resources/extensions/` (compiled output) when available, and converting any remaining `.ts` entry paths to `.js` before importing.

2. **Cross-platform filesystem safety test**: A stale `dist-test/src/resources/extensions/gsd/` directory (from a build before the GSD→HX rename, dated April 2) contained `commands-handlers.ts` with `execSync` template literals. The static analysis test scanned this stale artifact, failing against an allowlist entry pointing to the `hx/` path instead. Fixed by removing the stale directory (it will not be recreated since `src/resources/extensions/gsd/` no longer exists).

3. **RTK test failures** (`rtk-session-stats.test.ts`, `rtk.test.ts`): `HX_RTK_DISABLED=1` is set in the test environment, causing `isRtkEnabled()` to return `false` even when tests explicitly set `HX_RTK_PATH` to a fake binary. Fixed by adding a `withRtkEnabled()` helper that temporarily unsets `HX_RTK_DISABLED` for the duration of each RTK test. The `rewriteCommandWithRtk` tests also passed explicit `env` objects with `HX_RTK_DISABLED` deleted.

4. **auto-supervisor.test.mjs**: This `.mjs` file used static `import from '../unit-runtime.ts'` — Node.js 23 rejects `.ts` file extensions in static imports even with the `--import` hook. Fixed by changing the import extensions to `.js` (the compiled output that the hook rewrites `.ts` imports to anyway).

## Verification

npx tsc --noEmit: 0 errors (5.0s). node scripts/compile-tests.mjs: 1164 files compiled, 0 errors. npm run test:unit: 4113 passed, 0 failed, 5 skipped.

## Requirements Advanced

- R013 — All 9 remaining upstream fixes applied: read-tool offset clamping, Windows shell guards, windowsHide, ask-user-questions free-text, MCP server name normalization, OAuth google_search shape, npm tarball .git guard, Discord link, create-hx-extension path clarification.
- R001 — All 95 upstream v2.59.0 bugfix commits now applied across S01-S06.
- R014 — npm run test:unit 4113 passed, 0 failed; npx tsc --noEmit clean.

## Requirements Validated

- R013 — npm run test:unit 4113/0/5; all 8 S06 test files pass; typecheck clean.
- R001 — All 95 upstream commits tracked across S01-S06 summaries; no unaccounted fixes remain.
- R014 — npx tsc --noEmit exits 0; npm run test:unit 4113 passed, 0 failed, 5 skipped.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

The verification gate triggered a round of bug fixes beyond the planned S06 task scope. Three pre-existing test infrastructure failures were repaired: extension-smoke test (wrong extensionsDir for compiled mode), stale gsd/ dist-test artifact (cross-platform safety false positive), and RTK test failures (HX_RTK_DISABLED env var not cleared in test setup). The auto-supervisor.test.mjs .ts→.js import extension fix was also required. These are all genuine bugs in the test infrastructure that should have been fixed earlier — fixing them in S06 is correct and does not deviate from the milestone goal.

## Known Limitations

None. All 95 upstream fixes applied and all tests pass.

## Follow-ups

The compile-tests.mjs script does not clean dist-test before rebuilding — stale directories from renamed extensions can accumulate. A future improvement would be to add a clean step (rm -rf dist-test/src/resources/extensions before build) or to compare the source manifest against dist-test and remove orphaned directories.

## Files Created/Modified

- `packages/pi-coding-agent/src/core/tools/read.ts` — Offset clamping: let startLine, clamp to last line, emit prefix when clamped
- `packages/pi-coding-agent/src/core/tools/hashline-read.ts` — Identical offset clamping applied
- `packages/pi-coding-agent/src/core/exec.ts` — shell: false → shell: process.platform === 'win32'
- `packages/pi-coding-agent/src/core/lsp/index.ts` — Added shell: process.platform === 'win32' to spawn options
- `packages/pi-coding-agent/src/core/lsp/lspmux.ts` — Added shell: process.platform === 'win32' to spawn options
- `src/web-mode.ts` — windowsHide: true added to both execFile/spawn call sites
- `src/web/auto-dashboard-service.ts` — windowsHide: true
- `src/web/bridge-service.ts` — windowsHide: true (3 execFile + 1 spawn)
- `src/web/captures-service.ts` — windowsHide: true
- `src/web/cleanup-service.ts` — windowsHide: true
- `src/web/doctor-service.ts` — windowsHide: true
- `src/web/export-service.ts` — windowsHide: true
- `src/web/forensics-service.ts` — windowsHide: true
- `src/web/history-service.ts` — windowsHide: true
- `src/web/hooks-service.ts` — windowsHide: true
- `src/web/recovery-diagnostics-service.ts` — windowsHide: true
- `src/web/settings-service.ts` — windowsHide: true
- `src/web/skill-health-service.ts` — windowsHide: true
- `src/web/undo-service.ts` — windowsHide: true
- `src/web/visualizer-service.ts` — windowsHide: true
- `src/resources/extensions/ask-user-questions.ts` — Free-text follow-up after None-of-the-above selection
- `src/resources/extensions/shared/interview-ui.ts` — OTHER_OPTION_DESCRIPTION updated; auto-open notes block added
- `src/resources/extensions/mcp-client/index.ts` — getServerConfig uses .trim() + .toLowerCase(); getOrConnect reordered
- `src/resources/extensions/google-search/index.ts` — ?alt=sse suffix + userAgent: 'pi-coding-agent' in body
- `scripts/ensure-workspace-builds.cjs` — detectStalePackages extracted with .git guard; exported
- `docs/what-is-pi/15-pi-packages-the-ecosystem.md` — discord.com/invite/3cU7Bz4UPx → discord.gg/hx
- `src/resources/skills/create-hx-extension/SKILL.md` — Blockquote warning about bundled hx/ extension path
- `src/tests/extension-smoke.test.ts` — Use dist-test extensionsDir when available; convert .ts entry paths to .js
- `src/resources/extensions/hx/tests/auto-supervisor.test.mjs` — Changed static imports from .ts to .js extensions
- `src/tests/rtk-session-stats.test.ts` — Added withRtkEnabled() helper; applied to all RTK tests to unset HX_RTK_DISABLED
- `src/tests/rtk.test.ts` — Pass explicit env without HX_RTK_DISABLED to rewriteCommandWithRtk tests
