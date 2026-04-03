---
id: M001-df6x5t
title: "GSD → HX Complete Rename"
status: complete
completed_at: 2026-04-03T22:14:37.221Z
key_decisions:
  - D001: Preserve migrate-gsd-to-hx.ts untouched — backward-compat migration code for .gsd/ → .hx/ directory migration. Still valid: the file is unchanged, contains 4 GSD-named exports, and will continue to serve users upgrading from GSD.
  - D002: Rename native platform packages in source only, no npm registry publish. Still valid: source files updated to @hx-build scope; actual registry publish is a separate CI/deployment concern.
  - D003: Exclude gsd_engine binary path strings from S01 scope; defer to S04. Retired: S04 completed the rename — all gsd_engine strings replaced with hx_engine in native.ts.
  - D004: Keep batchParseGsdFiles N-API runtime call unchanged in hx-parser/index.ts until S04 renames the Rust binary. Retired: S04 renamed the Rust function and the TS call site — 0 GSD hits remain in native boundary.
  - D005: Use @hx-build/engine-* scope (not @hyperlab/engine-*) for native platform packages. Still valid: native.ts require path uses @hx-build and all 5 platform package.json names match.
  - K001 pattern: Synchronous foreground perl loops required for all file writes in git worktrees — async_bash jobs do not persist writes. Still valid: this is a fundamental worktree I/O behavior, not a temporary constraint.
  - Import aliasing pattern: Use 'import { oldName as newLocalAlias }' for callers of protected exports from migrate-gsd-to-hx.ts. Still valid: guided-flow.ts and auto-start.ts both use this pattern.
key_files:
  - src/resources/extensions/hx/types.ts
  - src/resources/extensions/hx/preferences-types.ts
  - src/resources/extensions/hx/native-parser-bridge.ts
  - src/resources/extensions/hx/bootstrap/db-tools.ts
  - src/resources/extensions/hx/paths.ts
  - packages/native/src/hx-parser/index.ts
  - packages/native/src/hx-parser/types.ts
  - packages/native/src/native.ts
  - native/crates/engine/src/hx_parser.rs
  - native/crates/engine/src/lib.rs
  - web/proxy.ts
  - web/lib/pty-manager.ts
  - web/lib/hx-workspace-store.tsx
  - web/package-lock.json
  - packages/pi-coding-agent/src/modes/rpc/rpc-mode.ts
  - packages/daemon/src/daemon.test.ts
  - .github/workflows/ci.yml
  - .github/workflows/pipeline.yml
  - docker/entrypoint.sh
  - src/resources/extensions/hx/migrate-gsd-to-hx.ts
lessons_learned:
  - async_bash jobs do not persist file writes in git worktrees — all perl -pi substitutions must be run synchronously in foreground shell loops. This is the K001 pattern that must be applied to all future worktree milestones.
  - Batch rename scripts must order longer substitution strings before shorter substrings to prevent partial-match collisions (e.g. GSD_WEB_HOST_KIND before GSD_WEB_HOST).
  - Migration test files require manual review before batch rename — they reference both old and new names as test fixtures, causing duplicate const declarations (TS2451) if naively renamed. Rename to a third name (e.g. legacyHome instead of hxHome) to avoid conflicts.
  - Two-pass strategy is reliable for large test directories: first pass for type/function names, second pass for any additional names discovered during verification grep.
  - When a protected file exports functions, use import aliasing (as newLocalAlias) in callers rather than modifying the protected file.
  - The grep exclusion pattern for Rust N-API cast calls must match the actual cast syntax: '(native as Record<string, Function>).batchParseGsdFiles' — a simpler regex for 'native.batchParseGsdFiles' will not match.
  - S04 native platform scope correction: D002 planned @hyperlab scope but the codebase already used @hx-build in native.ts require paths. Always verify existing code before committing to a new naming scheme.
  - A rename-only milestone can still fix bugs: the rpc-mode.ts/bridge-service.ts GSD_WEB_BRIDGE_TUI mismatch was a pre-existing silent bug discovered during S02 env var scan.
  - typecheck:extensions is a reliable proxy for rename correctness — if it passes with zero errors after a rename, the TypeScript type system confirms all references are consistent.
  - R011 (test:unit / test:integration execution) cannot be verified in a git worktree without the full dev dependency set (esbuild). Plan for post-merge verification of test execution in future rename milestones.
---

# M001-df6x5t: GSD → HX Complete Rename

**Eliminated all residual GSD identifiers from the codebase across 377 files — every type, env var, tool name, native binding, package name, variable, prompt, doc, and CI reference now uses HX naming.**

## What Happened

M001-df6x5t executed a complete GSD→HX rename across the entire codebase in 5 sequential slices, touching 377 files and making 2577 insertions / 2823 deletions.

**S01 — TypeScript Types & Internal Variables (high risk):** Renamed ~500+ GSD*/gsd* TypeScript identifiers across 100+ files. This included ~37 unique type names (GSDState→HXState, GSDPreferences→HXPreferences, GSDMilestone→HXMilestone, etc.), ~9 variable name patterns (gsdDir→hxDir, gsdHome→hxHome, gsdBinPath→hxBinPath, etc.), and ~20 additional function names discovered during verification (inlineGsdRootFile, syncGsdStateToWorktree, bootstrapGsdDirectory, resolveGsdBin, registerGsdExtension, etc.). The migrate-gsd-to-hx.ts file was preserved untouched (R009). Three S04-scope carve-outs were deliberately left: batchParseGsdFiles N-API runtime call string, and two interface property declarations in native-parser-bridge.ts. Import aliasing was used in guided-flow.ts and auto-start.ts for protected function imports. A critical correction was made in ops.ts where T01's batch rename had over-applied and renamed the protected import — reverted in T02. In migrate-gsd-to-hx.test.ts, gsdHome was renamed to legacyHome (not hxHome) to avoid a TS2451 duplicate const. After S01, npm run typecheck:extensions passed with zero errors.

**S02 — Environment Variables & Web Module (medium risk):** Renamed all 43+ GSD_* environment variables to HX_* across web/, packages/, tests/, scripts/, CI workflows, and Docker — 34 files across 3 tasks. A critical embedded-terminal bug was fixed: rpc-mode.ts still read GSD_WEB_BRIDGE_TUI while bridge-service.ts wrote HX_WEB_BRIDGE_TUI — silently breaking the embedded terminal feature. The daemon.test.ts was also fixed to set HX_DAEMON_CONFIG instead of GSD_DAEMON_CONFIG. web/package-lock.json was updated from gsd-web to hx-web. Exhaustive grep across all source file types returned 0 hits.

**S03 — DB Tool Names & Prompts (medium risk):** Updated db-tools.ts to register 13 alias calls mapping hx_* canonical names for all legacy gsd_* variants. Renamed all 29 prompt files to use hx_* tool names via perl -pi batch substitution. Updated 12 hx test files to assert hx_* names. write-intercept.test.ts broken assertion (gsd_complete_task) was automatically fixed. typecheck:extensions continued to pass.

**S04 — Native Rust Engine & Bindings (high risk):** Renamed the Rust source file from gsd_parser.rs to hx_parser.rs, updated lib.rs to use mod hx_parser, renamed N-API exported functions (batch_parse_gsd_files→batch_parse_hx_files, scan_gsd_tree→scan_hx_tree) with js_name attributes, renamed all 5 platform package.json files from @gsd-build/engine-* to @hx-build/engine-*, updated native.ts to load @hx-build/engine-* packages, cleared the 3 S01 carve-out TODOs in hx-parser/index.ts and native-parser-bridge.ts. Note: D002 originally said @hyperlab but D005 corrected this to @hx-build to match the existing require path in native.ts.

**S05 — Docs, CI/CD, Tests & Final Verification (low risk):** Fixed the CI break in ci.yml (referenced deleted extensions/gsd/tests/ path), renamed 5 production source identifiers (_gsdEpipeGuard, detectV2Gsd, gsdPrefix), renamed ~170 GSD hits across 20 test files, git-mv'd 4 gsd-named test files to hx-named equivalents, updated all scripts/CI/Docker/docs/CHANGELOG.md/.plans/ files (~330 hits across 17 .plans/ files). Final comprehensive grep across all file types returned 0 hits outside migrate-gsd-to-hx.ts — proving R012.

**Key implementation pattern discovered:** async_bash jobs do not persist file writes in git worktrees due to I/O race conditions. All perl -pi substitutions had to be run synchronously in foreground shell loops (K001 pattern). This was discovered in S01/T01 and applied consistently throughout all subsequent tasks and slices.

## Success Criteria Results

## Success Criteria Results

- **Vision: Eliminate all residual GSD identifiers from the codebase** ✅ MET  
  Final comprehensive grep across all file types (*.ts, *.tsx, *.js, *.mjs, *.sh, *.ps1, *.yml, *.yaml, *.md, *.rs, *.json) returns **0 hits** outside migrate-gsd-to-hx.ts (the intentionally preserved backward-compat migration file) and auto-generated package-lock.json. Verified independently during milestone validation.

- **S01: tsc compiles with zero GSD type references; all GSD* types are HX*, all gsdDir variables are hxDir** ✅ MET  
  `npm run typecheck:extensions` exits 0. `grep -rn 'GSD[A-Za-z]\|Gsd[A-Z]\|gsd[A-Z]' --include='*.ts' --include='*.tsx'` returns 0 hits (excluding allowed exceptions: migrate-gsd-to-hx.ts, gsd_engine binary path strings, batchParseGsdFiles N-API call — all S04-owned and cleared in S04). HXState confirmed in types.ts.

- **S02: all GSD_* env vars are HX_*; package name is hx-web** ✅ MET  
  `grep -rn 'GSD_'` across all source returns 0 hits. pty-manager.ts prefix uses `HX_WEB_`. rpc-mode.ts reads `HX_WEB_BRIDGE_TUI`. web/package-lock.json shows `hx-web`. Embedded terminal bug fixed as a bonus.

- **S03: all gsd_* tool registrations are hx_*; 29 prompt files reference hx_* names** ✅ MET  
  `grep -rn 'gsd_' src/resources/extensions/hx/prompts/` returns 0. registerAlias count is 14 (1 def + 13 calls) in db-tools.ts. typecheck passes.

- **S04: Rust source is hx_parser.rs, binary is hx_engine.*.node, JS bindings call batchParseHxFiles/scanHxTree** ✅ MET  
  hx_parser.rs exists, gsd_parser.rs absent. lib.rs references `mod hx_parser`. All 5 platform npm packages use `@hx-build/engine-*` with `hx_engine.node`. TS bridge files show 0 GSD hits.

- **S05: grep -rni gsd returns zero hits outside migration code; all docs, CI, Docker use HX naming** ✅ MET  
  Final comprehensive grep confirmed 0 hits. CI broken path fixed (extensions/gsd → 0 hits). All 4 gsd-named test files renamed to hx-*. All docs, CI workflows, Docker, and .plans/ files updated.

- **R009 constraint: migrate-gsd-to-hx.ts preserved untouched** ✅ MET  
  `git diff src/resources/extensions/hx/migrate-gsd-to-hx.ts | wc -l` → 0. File has 4 GSD-named exports intact. The 7 remaining GSD_ hits in grep are in migrate-gsd-to-hx.ts and migrate-gsd-to-hx.test.ts — both intentional.

## Definition of Done Results

## Definition of Done Results

- **All slices are [x]** ✅ — S01, S02, S03, S04, S05 all marked complete with verified_result: passed
- **All slice summaries exist** ✅ — S01-SUMMARY.md, S02-SUMMARY.md, S03-SUMMARY.md, S04-SUMMARY.md, S05-SUMMARY.md all present in .hx/milestones/M001-df6x5t/slices/
- **Cross-slice integration points work correctly** ✅  
  - S01→S04 carve-out TODOs cleared: batchParseGsdFiles N-API call and interface properties renamed in S04
  - S01→S02: K001 worktree write pattern established by S01, adopted by S02 without conflicts
  - S01→S03: Clean type names from S01 consumed by S03 with no conflicts
  - S01+S02+S03+S04→S05: Final grep returned 0 hits, confirming all upstream slices delivered completely
- **Code changes exist** ✅ — `git diff --stat HEAD $(git merge-base HEAD main) -- ':!.hx/'` shows 377 files changed, 2577 insertions(+), 2823 deletions(-)
- **typecheck:extensions passes** ✅ — npm run typecheck:extensions exits 0 with zero errors
- **Zero GSD references outside migration code** ✅ — Final comprehensive grep returns 0 hits
- **Milestone validation completed** ✅ — VALIDATION.md exists with verdict: pass (remediation_round: 0)

## Requirement Outcomes

## Requirement Outcomes

| Req | Status | Evidence |
|-----|--------|----------|
| R001 — All TS type/interface names use HX prefix | **active → validated** | `grep -rn 'GSD[A-Za-z]\|Gsd[A-Z]\|gsd[A-Z]' --include='*.ts' --include='*.tsx'` returns 0 hits (excl. allowed exceptions). ~37 types renamed across ~100+ files. typecheck:extensions exits 0. |
| R002 — All env vars use HX_ prefix | **active → validated** | `grep -rn 'GSD_'` across all .ts/.tsx/.js/.sh/.yml/.yaml/.json returns 0 hits (excl. migrate-gsd-to-hx.ts and test). 43+ env vars renamed. |
| R003 — All DB tool names use hx_ prefix | **active → validated** | `grep -rn 'gsd_' src/resources/extensions/hx/prompts/` returns 0. 13 registerAlias calls in db-tools.ts. All 12 hx test files assert hx_* names. |
| R004 — Native Rust engine uses hx naming | **active → validated** | hx_parser.rs exists; gsd_parser.rs absent; lib.rs uses mod hx_parser; all 5 @hx-build/engine-* platform packages updated; batchParseHxFiles/scanHxTree N-API exports renamed. |
| R005 — Internal variable names use hx prefix | **active → validated** | grep for all gsd* variable patterns returns 0 hits outside S04-scope exceptions. ~30 variable names, ~250+ usages renamed across ~60 files. |
| R006 — Web module uses HX naming | **active → validated** | hx-web package name in package-lock.json; HX_WEB_* env vars throughout; pty-manager.ts uses HX_WEB_ prefix filter; rpc-mode.ts reads HX_WEB_BRIDGE_TUI. |
| R007 — Docker, CI/CD, docs use HX naming | **active → validated** | All 5 GitHub Actions workflows updated; docker/entrypoint.sh and docker-compose.full.yaml updated; README.md, CHANGELOG.md, docs/*.md all updated; .plans/ files updated (~330 hits). |
| R008 — File renames from gsd to hx | **active → validated** | All old gsd-named files absent; new hx-named present. 4 test files git-mv'd (gsd-db.test.ts→hx-db.test.ts, etc.); Rust source gsd_parser.rs→hx_parser.rs; all 7 old gsd-named native package dirs renamed. |
| R009 — migrate-gsd-to-hx.ts preserved | **active → validated** | git diff returns 0 lines on this file throughout all slices. File contains 4 GSD-named exports intact. The 7 GSD_ hits remaining in grep are in this file and its test — both intentional. |
| R010 — TypeScript compilation passes | **active → validated** | npm run typecheck:extensions exits 0 with zero errors — verified after S01, S02, S03, S04, S05, and independently during validation. |
| R011 — All existing tests pass | **active → partially validated** | Test files renamed and content updated (all grep checks pass). TypeScript compilation passes. Unit/integration test execution could not be run in worktree environment (missing esbuild dev dependency — pre-existing infrastructure issue). Must be verified in main repo after merge. |
| R012 — Zero gsd/GSD references remain | **active → validated** | Final comprehensive grep across all file types returns 0 hits outside migrate-gsd-to-hx.ts (intentionally preserved). Independently verified during milestone validation.

## Deviations

1. S01 rename list expanded: ~20 additional function names beyond the 29 in the task plan were renamed (inlineGsdRootFile, syncGsdStateToWorktree, bootstrapGsdDirectory, resolveGsdBin, GsdCommandDefinition, GsdDispatchContext, registerGsdExtension, etc.).\n2. ops.ts over-rename: T01 batch rename incorrectly renamed handleGsdToHxMigration→handleHxToHxMigration in ops.ts; reverted in T02.\n3. migrate-gsd-to-hx.test.ts: gsdHome renamed to legacyHome (not hxHome) to avoid TS2451 duplicate const.\n4. D002 scope correction to @hx-build: D002 originally planned @hyperlab/engine-* scope but D005 corrected to @hx-build/engine-* to match existing require path in native.ts.\n5. S05 also cleaned up residual PS1 internal variables, CI paths, and .plans/ files that earlier slices documented as out-of-scope follow-ups.\n6. S02 T01 pty-manager.ts: bulk perl script missed the startsWith("GSD_WEB_") string literal; required manual Edit fixup after bulk apply.

## Follow-ups

1. **R011 post-merge verification**: Run npm run test:unit and npm run test:integration in main repo after merge to confirm renamed test files execute cleanly.\n2. **Native binary CI build**: The renamed Rust source (hx_parser.rs, batch_parse_hx_files, scan_hx_tree) must be compiled in the CI build-native workflow to produce hx_engine.*.node binaries.\n3. **npm registry publish**: The 5 @hx-build/engine-* platform packages need to be published to npm (or whichever registry) so the runtime loader can find them. D002 explicitly deferred this.\n4. **package-lock.json**: The auto-generated lock file will be correct after the next npm install in main repo.\n5. **CI env var secrets**: Any CI/CD secrets (repository secrets, environment variables in GitHub Actions settings) named GSD_* need to be renamed to HX_* in the GitHub repository settings — these are not in source code and thus not covered by this milestone.
