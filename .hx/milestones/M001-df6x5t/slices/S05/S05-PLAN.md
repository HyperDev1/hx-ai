# S05: Docs, CI/CD, Tests & Final Verification

**Goal:** Eliminate all remaining GSD/gsd identifiers from production source, tests, scripts, CI/CD, docs, and .plans/ — leaving zero hits outside migrate-gsd-to-hx.ts. TypeScript compiles, the refined final grep returns 0, and the broken ci.yml path is fixed.
**Demo:** After this: After this: grep -rni gsd returns zero hits outside migration code. All tests pass. All docs, CI, Docker use HX naming.

## Tasks
- [x] **T01: Fixed critical CI break and renamed all gsd identifiers from production source, 20 test files, and repro scripts — zero remaining hits in all targeted patterns** — This task fixes the **critical CI break** (ci.yml references deleted `extensions/gsd/tests/` path), renames the 5 remaining production source identifiers, renames all test file content (~170 hits across ~20 files), and git-mv's 4 gsd-named test files.

## Steps

1. **Fix ci.yml broken paths** (CRITICAL — live CI break):
   - Lines 233,239,240: `extensions/gsd/tests/` → `extensions/hx/tests/`
   - Lines 90-93: Update the `.gsd/` directory check — change step name to `Ensure .gsd/ is not checked in` (keep as-is, this checks for the legacy directory which should NOT exist — it's correct behavior to check for `.gsd/`)

2. **Fix production source identifiers** using `perl -pi -e` synchronous foreground loops (K001 pattern):
   - `src/resources/extensions/hx/bootstrap/register-extension.ts`: `_gsdEpipeGuard` → `_hxEpipeGuard` (3 hits on lines 31,32,38)
   - `src/resources/extensions/hx/detection.ts`: `detectV2Gsd` → `detectV2Hx` (2 hits on lines 288,356)
   - `web/components/hx/files-view.tsx`: `gsdPrefix` → `hxPrefix` (3 hits on lines 1057,1067,1069)
   - `web/components/hx/sidebar.tsx`: `gsdPrefix` → `hxPrefix` (3 hits on lines 334,335,336)

3. **Run `npm run typecheck:extensions`** to verify production renames don't break types.

4. **Rename test TS file content** using bulk perl -pi script. Write substitution patterns to /tmp/s05-t01-test-renames.pl:
   - `runGsd` → `runHx` (e2e-headless.test.ts, e2e-smoke.test.ts)
   - `spawnGsd` → `spawnHx` (e2e-headless.test.ts)
   - `createTempGsdDir` → `createTempHxDir` (debug-logger.test.ts)
   - `GSD-Unit:` → `HX-Unit:` (git-service.test.ts)
   - `GSD-Milestone:` → `HX-Milestone:` (parallel-merge.test.ts)
   - `openDatabase(gsdDbPath)` → `openDatabase(hxDbPath)` (auto-start-cold-db-bootstrap.test.ts)
   - `mainGsd` → `mainHx` (worktree-db-same-file.test.ts)
   - `wtGsd` → `wtHx` (worktree-db-same-file.test.ts)
   - `srcGsd` → `srcHx` (preferences-worktree-sync.test.ts)
   - `dstGsd` → `dstHx` (preferences-worktree-sync.test.ts)
   - `gsd2Root` → `hx2Root` (marketplace-test-fixtures.ts)
   - `gsd2` → `hx2` (session-lock-multipath.test.ts, draft-promotion.test.ts)
   - `gsd3` → `hx3` (draft-promotion.test.ts)
   - `gsdRoot` → `hxRoot` in comments only (rewrite-count-persist.test.ts, memory-leak-guards.test.ts)
   Apply with foreground `while IFS= read -r FILE; do perl -pi /tmp/s05-t01-test-renames.pl "$FILE"; done`

5. **git mv** the 4 gsd-named test files (no content changes needed — they're already clean inside):
   - `git mv src/resources/extensions/hx/tests/gsd-db.test.ts src/resources/extensions/hx/tests/hx-db.test.ts`
   - `git mv src/resources/extensions/hx/tests/gsd-inspect.test.ts src/resources/extensions/hx/tests/hx-inspect.test.ts`
   - `git mv src/resources/extensions/hx/tests/gsd-recover.test.ts src/resources/extensions/hx/tests/hx-recover.test.ts`
   - `git mv src/resources/extensions/hx/tests/gsd-tools.test.ts src/resources/extensions/hx/tests/hx-tools.test.ts`
   Verify: no files import these by old name (`grep -rn 'gsd-db\|gsd-inspect\|gsd-recover\|gsd-tools' . --include='*.ts' --include='*.yml' | grep -v '.hx/' | grep -v node_modules` returns 0).

6. **Rename repro-worktree-bug .mjs files** (~85 hits across 3 files). Write substitution patterns to /tmp/s05-t01-mjs-renames.pl:
   - `gsdRoot` → `hxRoot` (function name + calls + comments)
   - `gsdIdx` → `hxIdx`
   - `gsdMarker` → `hxMarker`
   - `gsdHome` → `hxHome`
   - `gsdReal` → `hxReal`
   - `GSD_HOME` → `HX_HOME`
   - `GSD_PROJECT_ROOT` → `HX_PROJECT_ROOT`
   - `USER_GSD` → `USER_HX`
   - `PROJECT_GSD_STORAGE` → `PROJECT_HX_STORAGE`
   - `PROJECT_GSD_LINK` → `PROJECT_HX_LINK`
   - `probeGsdRoot` → `probeHxRoot` (comment)
   - `candidateGsdPath` → `candidateHxPath`
   Apply to: tests/repro-worktree-bug/verify-integration.mjs, verify-fix.mjs, repro.mjs

7. **Verify** all test renames with targeted grep.

## Constraints
- K001: synchronous foreground perl loops required for writes in git worktrees.
- R009: migrate-gsd-to-hx.ts must NOT be touched.
- The ci.yml `.gsd/` directory existence check on lines 90-93 is CORRECT behavior — it verifies the legacy directory is not checked into git. Do NOT rename `.gsd` to `.hx` there.
- `gsd2`/`gsd3` in draft-promotion.test.ts are local variable names (not env vars) — rename to `hx2`/`hx3`.
- In the perl substitution script, put longer strings before shorter substrings to avoid partial-match collisions (e.g. `gsd2Root` before `gsd2`).
  - Estimate: 45m
  - Files: .github/workflows/ci.yml, src/resources/extensions/hx/bootstrap/register-extension.ts, src/resources/extensions/hx/detection.ts, web/components/hx/files-view.tsx, web/components/hx/sidebar.tsx, src/tests/integration/e2e-headless.test.ts, src/tests/integration/e2e-smoke.test.ts, src/resources/extensions/hx/tests/integration/git-service.test.ts, src/resources/extensions/hx/tests/integration/parallel-merge.test.ts, src/resources/extensions/hx/tests/debug-logger.test.ts, src/resources/extensions/hx/tests/auto-start-cold-db-bootstrap.test.ts, src/resources/extensions/hx/tests/session-lock-multipath.test.ts, src/resources/extensions/hx/tests/worktree-db-same-file.test.ts, src/resources/extensions/hx/tests/preferences-worktree-sync.test.ts, src/resources/extensions/hx/tests/draft-promotion.test.ts, src/resources/extensions/hx/tests/marketplace-test-fixtures.ts, src/resources/extensions/hx/tests/rewrite-count-persist.test.ts, src/resources/extensions/hx/tests/memory-leak-guards.test.ts, src/resources/extensions/hx/tests/gsd-db.test.ts, src/resources/extensions/hx/tests/gsd-inspect.test.ts, src/resources/extensions/hx/tests/gsd-recover.test.ts, src/resources/extensions/hx/tests/gsd-tools.test.ts, tests/repro-worktree-bug/verify-integration.mjs, tests/repro-worktree-bug/verify-fix.mjs, tests/repro-worktree-bug/repro.mjs
  - Verify: npm run typecheck:extensions exits 0 && grep -rn 'runGsd\|spawnGsd\|_gsdEpipeGuard\|detectV2Gsd\|gsdPrefix\|createTempGsdDir\|GSD-Unit\|GSD-Milestone\|mainGsd\|wtGsd\|srcGsd\|dstGsd\|gsd2Root' --include='*.ts' --include='*.tsx' --include='*.mjs' . | grep -v node_modules | grep -v '.hx/' | grep -v migrate-gsd-to-hx | wc -l returns 0 && test ! -f src/resources/extensions/hx/tests/gsd-db.test.ts && test -f src/resources/extensions/hx/tests/hx-db.test.ts && grep 'extensions/gsd' .github/workflows/ci.yml | wc -l returns 0
- [x] **T02: Renamed all GSD identifiers in scripts, CI/CD workflows, GitHub templates, and vscode-extension — case-sensitive grep returns 0 hits, typecheck exits 0, 46 tests pass** — This task renames all remaining GSD identifiers in build/deploy infrastructure: scripts, CI/CD workflow files, GitHub issue/PR templates, and the vscode-extension package-lock.json.

## Steps

1. **Rename script file content** using bulk perl -pi substitution (K001 pattern). Write /tmp/s05-t02-script-renames.pl with patterns:

   For `scripts/recover-hx-1364.ps1` (15 hits):
   - `$gsdIgnoreLine` → `$hxIgnoreLine`
   - `$GsdIsSymlink` → `$HxIsSymlink`
   - `$gsdDir` → `$hxDir`
   Apply with: `perl -pi -e 's/\$gsdIgnoreLine/\$hxIgnoreLine/g; s/\$GsdIsSymlink/\$HxIsSymlink/g; s/\$gsdDir/\$hxDir/g;' scripts/recover-hx-1364.ps1`

   For `scripts/parallel-monitor.mjs` (9 hits):
   - `findGsdLoader` → `findHxLoader`
   - `GSD_LOADER` → `HX_LOADER`
   - `GSD_MILESTONE_LOCK` → `HX_MILESTONE_LOCK`
   - `GSD_PROJECT_ROOT` → `HX_PROJECT_ROOT`
   - `GSD_PARALLEL_WORKER` → `HX_PARALLEL_WORKER`

   For `scripts/dist-test-resolve.mjs` (3 hits): `GSD_ALIASES` → `HX_ALIASES`
   For `scripts/pr-risk-check.mjs` (1 hit): `GSD2 PR Risk Report` → `HX PR Risk Report`
   For `scripts/rtk-benchmark.mjs` (1 hit): `GSD_RTK_PATH` → `HX_RTK_PATH`
   For `scripts/compile-tests.mjs` (1 hit): `gsdNodeModules` → `hxNodeModules` in comment
   For `scripts/verify-s04.sh` (2 hits): `has_gsd` → `has_hx`

2. **Rename CI/CD workflow content** using perl -pi substitution:

   For `.github/workflows/pipeline.yml` (~19 hits):
   - `gsd-ci-builder` → `hx-ci-builder`
   - `ghcr.io/gsd-build/gsd-pi` → `ghcr.io/gsd-build/hx-pi`
   - `gsd-pi@` → `hx-pi@` (npm package references)
   - `gsd-pi` → `hx-pi` (standalone references)
   - `ghcr.io/gsd-build/gsd-ci-builder` → `ghcr.io/gsd-build/hx-ci-builder`
   - `GSD v` → `HX v` in Discord webhook message
   - `npm i gsd-pi` → `npm i hx-pi`
   Note: Per D002/R020, rename package names in source only; no registry ops.

   For `.github/workflows/build-native.yml` (~18 hits):
   - `libgsd_engine` → `libhx_engine`
   - `gsd_engine.dll` → `hx_engine.dll`
   - `gsd_engine.node` → `hx_engine.node`
   - `@gsd-build/engine-` → `@hx-build/engine-`
   - `gsd-pi@` → `hx-pi@`
   - `gsd-pi` → `hx-pi` (npm view)

   For `.github/workflows/cleanup-dev-versions.yml` (1 hit): `gsd-pi` → `hx-pi`

   For `.github/workflows/ai-triage.yml` (4 hits):
   - `gsd-build/GSD-2` → `gsd-build/hx` (or appropriate repo name)
   - `GSD-2` → `HX` in project name references

3. **Rename GitHub templates**:
   - `.github/ISSUE_TEMPLATE/bug_report.yml`: Replace GSD references with HX, `/gsd` commands with `/hx`, `.gsd/` paths with `.hx/`, `gsd_version` id with `hx_version`
   - `.github/ISSUE_TEMPLATE/feature_request.yml`: Replace GSD references with HX, `/gsd` with `/hx`, `.gsd/` with `.hx/`
   - `.github/PULL_REQUEST_TEMPLATE.md`: Replace `gsd extension` → `hx extension`, `GSD workflow` → `HX workflow`

4. **Fix vscode-extension/package-lock.json**: Change `"name": "gsd-2"` → `"name": "hx"` on both line 2 and line 8.

5. **Verify** all changes with targeted grep.

## Constraints
- K001: synchronous foreground perl loops required for writes in git worktrees.
- D002/R020: Rename package names in source only — no npm registry operations.
- The `.github/workflows/ai-triage.yml` references `gsd-build/GSD-2` which is the GitHub repo path — per R021, actual repo rename is out of scope, but source references should be updated for consistency.
- Longer substitution strings must come before shorter substrings in perl scripts to prevent partial matches.
  - Estimate: 30m
  - Files: scripts/recover-hx-1364.ps1, scripts/parallel-monitor.mjs, scripts/dist-test-resolve.mjs, scripts/pr-risk-check.mjs, scripts/rtk-benchmark.mjs, scripts/compile-tests.mjs, scripts/verify-s04.sh, .github/workflows/pipeline.yml, .github/workflows/build-native.yml, .github/workflows/cleanup-dev-versions.yml, .github/workflows/ai-triage.yml, .github/ISSUE_TEMPLATE/bug_report.yml, .github/ISSUE_TEMPLATE/feature_request.yml, .github/PULL_REQUEST_TEMPLATE.md, vscode-extension/package-lock.json
  - Verify: grep -rn 'gsd\|GSD\|Gsd' scripts/ .github/ vscode-extension/package-lock.json --include='*.ps1' --include='*.mjs' --include='*.sh' --include='*.js' --include='*.yml' --include='*.yaml' --include='*.md' --include='*.json' | grep -v node_modules | grep -v '.hx/' | grep -v migrate-gsd-to-hx | wc -l returns 0
- [x] **T03: Renamed all remaining GSD identifiers in docs, .plans/, CHANGELOG, source local vars, and prompt templates — final grep returns 0, typecheck exits 0, all tests pass** — This task completes the milestone by renaming all documentation references and running the final comprehensive verification grep that proves R012 (zero remaining GSD/gsd references excluding migration code).

## Steps

1. **Rename docs/ content** using bulk perl -pi substitution. Write /tmp/s05-t03-doc-renames.pl with patterns:
   - `GSD_HOME` → `HX_HOME`
   - `GSD_PROJECT_ID` → `HX_PROJECT_ID`
   - `GSD_STATE_DIR` → `HX_STATE_DIR`
   - `GSD_CODING_AGENT_DIR` → `HX_CODING_AGENT_DIR`
   - `GSD_DURABLE_PATHS` → `HX_DURABLE_PATHS`
   - `GSD_FIXTURE_MODE` → `HX_FIXTURE_MODE`
   - `GSD_FIXTURE_DIR` → `HX_FIXTURE_DIR`
   - `GSD_WEB_PROJECT_CWD` → `HX_WEB_PROJECT_CWD`
   - `GSD_MILESTONE_LOCK` → `HX_MILESTONE_LOCK`
   - `GSD_PARALLEL_WORKER` → `HX_PARALLEL_WORKER`
   - `GSD_VERSION` → `HX_VERSION`
   - `GSD_RTK_DISABLED` → `HX_RTK_DISABLED`
   - `GSDAppShell` → `HXAppShell`
   - `gsd_parser.rs` → `hx_parser.rs`
   - `gsd-pi` → `hx-pi`
   Apply to all files matching: `docs/*.md`, `docs/superpowers/**/*.md`, `docker/README.md`, `README.md`

2. **Rename CHANGELOG.md** identifiers. This is historical release documentation — preserve version numbers and dates, only rename GSD identifiers:
   - `gsd_slice_complete` → `hx_slice_complete`
   - `GSD_PROJECT_ID` → `HX_PROJECT_ID`
   - `GSD_HOME` → `HX_HOME`
   - `GSDError` → `HXError`
   - `gsd_generate_milestone_id` → `hx_generate_milestone_id`
   - `gsdVersion` → `hxVersion`
   - `GSD_VERSION` → `HX_VERSION`
   - `GSD v` → `HX v` (release notes prefix, if appropriate)

3. **Rename .plans/ content** (330 hits across 17 files) using bulk perl -pi loop. Key substitutions:
   - `GSD_` → `HX_` (env var prefix in all contexts)
   - `GSD[A-Z]` patterns: `GSDPreferences` → `HXPreferences`, `GSDState` → `HXState`, `GSDMilestone` → `HXMilestone`, etc.
   - `gsd_` → `hx_` (tool names)
   - `gsd-parser.rs` → `hx-parser.rs`
   - `ParsedGsdFile` → `ParsedHxFile`
   - `GsdTreeEntry` → `HxTreeEntry`
   - `batchParseGsdFiles` → `batchParseHxFiles`
   - `scanGsdTree` → `scanHxTree`
   - `gsdDir` → `hxDir`
   - `gsdHome` → `hxHome`
   - `gsd-pi` → `hx-pi`
   - `gsd-web` → `hx-web`
   Apply to: `find .plans/ -name '*.md' -type f`

4. **Run final comprehensive verification** — this is the R012 proof:
   ```bash
   grep -rn 'gsd\|GSD\|Gsd' . \
     --include='*.ts' --include='*.tsx' --include='*.js' --include='*.mjs' \
     --include='*.sh' --include='*.ps1' --include='*.yml' --include='*.yaml' \
     --include='*.md' --include='*.rs' --include='*.json' \
     --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.next \
     --exclude-dir=.git --exclude-dir=.hx \
     | grep -v migrate-gsd-to-hx \
     | grep -v 'package-lock.json' \
     | wc -l
   ```
   Must return 0. If any hits remain, fix them and re-verify.

5. **Run `npm run typecheck:extensions`** — final confirmation that compilation passes (R010).

6. **Verify git mv'd files** exist at new paths and old paths are gone.

## Constraints
- K001: synchronous foreground perl loops for writes in git worktrees.
- R009: migrate-gsd-to-hx.ts must NOT appear in grep exclusion failures.
- CHANGELOG.md: These are historical entries — update identifiers but preserve factual accuracy of release notes.
- .plans/ files may contain `GSD` in mixed contexts (prose, code blocks, identifiers) — the bulk rename should cover all patterns.
- The final grep uses case-sensitive `gsd|GSD|Gsd` to catch all three casings that appear in identifiers while avoiding false positives from words like `SettingsData` (which contains `gsD` with uppercase D, not matching any of our three patterns).
- Root `package-lock.json` is excluded from final grep — it's auto-generated and will be correct after next `npm install`.
  - Estimate: 30m
  - Files: docs/configuration.md, docs/FILE-SYSTEM-MAP.md, docs/ADR-001-branchless-worktree-architecture.md, docs/PRD-branchless-worktree-architecture.md, docs/ci-cd-pipeline.md, docs/web-interface.md, docs/parallel-orchestration.md, docker/README.md, README.md, CHANGELOG.md, .plans/
  - Verify: grep -rn 'gsd\|GSD\|Gsd' . --include='*.ts' --include='*.tsx' --include='*.js' --include='*.mjs' --include='*.sh' --include='*.ps1' --include='*.yml' --include='*.yaml' --include='*.md' --include='*.rs' --include='*.json' --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.next --exclude-dir=.git --exclude-dir=.hx | grep -v migrate-gsd-to-hx | grep -v 'package-lock.json' | wc -l returns 0 && npm run typecheck:extensions exits 0
