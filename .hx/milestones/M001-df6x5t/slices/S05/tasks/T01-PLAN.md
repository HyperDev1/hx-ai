---
estimated_steps: 54
estimated_files: 25
skills_used: []
---

# T01: Rename GSD identifiers in production source, CI critical path, and all test files

This task fixes the **critical CI break** (ci.yml references deleted `extensions/gsd/tests/` path), renames the 5 remaining production source identifiers, renames all test file content (~170 hits across ~20 files), and git-mv's 4 gsd-named test files.

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

## Inputs

- ``src/resources/extensions/hx/bootstrap/register-extension.ts` — has _gsdEpipeGuard`
- ``src/resources/extensions/hx/detection.ts` — has detectV2Gsd`
- ``web/components/hx/files-view.tsx` — has gsdPrefix`
- ``web/components/hx/sidebar.tsx` — has gsdPrefix`
- ``.github/workflows/ci.yml` — has broken extensions/gsd/tests/ paths`
- ``src/tests/integration/e2e-headless.test.ts` — has runGsd/spawnGsd`
- ``src/tests/integration/e2e-smoke.test.ts` — has runGsd`
- ``src/resources/extensions/hx/tests/integration/git-service.test.ts` — has GSD-Unit: assertions`
- ``src/resources/extensions/hx/tests/integration/parallel-merge.test.ts` — has GSD-Milestone: assertions`
- ``src/resources/extensions/hx/tests/debug-logger.test.ts` — has createTempGsdDir`
- ``src/resources/extensions/hx/tests/worktree-db-same-file.test.ts` — has mainGsd/wtGsd`
- ``src/resources/extensions/hx/tests/preferences-worktree-sync.test.ts` — has srcGsd/dstGsd`
- ``src/resources/extensions/hx/tests/draft-promotion.test.ts` — has gsd2/gsd3`
- ``src/resources/extensions/hx/tests/marketplace-test-fixtures.ts` — has gsd2Root`
- ``tests/repro-worktree-bug/verify-integration.mjs` — has gsdRoot/GSD_HOME/GSD_PROJECT_ROOT`
- ``tests/repro-worktree-bug/verify-fix.mjs` — has gsdRoot/GSD_HOME`
- ``tests/repro-worktree-bug/repro.mjs` — has gsdIdx/gsdMarker`

## Expected Output

- ``.github/workflows/ci.yml` — broken paths fixed: extensions/gsd/ → extensions/hx/`
- ``src/resources/extensions/hx/bootstrap/register-extension.ts` — _gsdEpipeGuard → _hxEpipeGuard`
- ``src/resources/extensions/hx/detection.ts` — detectV2Gsd → detectV2Hx`
- ``web/components/hx/files-view.tsx` — gsdPrefix → hxPrefix`
- ``web/components/hx/sidebar.tsx` — gsdPrefix → hxPrefix`
- ``src/tests/integration/e2e-headless.test.ts` — runGsd→runHx, spawnGsd→spawnHx`
- ``src/tests/integration/e2e-smoke.test.ts` — runGsd→runHx`
- ``src/resources/extensions/hx/tests/integration/git-service.test.ts` — GSD-Unit→HX-Unit`
- ``src/resources/extensions/hx/tests/integration/parallel-merge.test.ts` — GSD-Milestone→HX-Milestone`
- ``src/resources/extensions/hx/tests/hx-db.test.ts` — renamed from gsd-db.test.ts`
- ``src/resources/extensions/hx/tests/hx-inspect.test.ts` — renamed from gsd-inspect.test.ts`
- ``src/resources/extensions/hx/tests/hx-recover.test.ts` — renamed from gsd-recover.test.ts`
- ``src/resources/extensions/hx/tests/hx-tools.test.ts` — renamed from gsd-tools.test.ts`
- ``tests/repro-worktree-bug/verify-integration.mjs` — all gsd* identifiers renamed to hx*`
- ``tests/repro-worktree-bug/verify-fix.mjs` — all gsd* identifiers renamed to hx*`
- ``tests/repro-worktree-bug/repro.mjs` — all gsd* identifiers renamed to hx*`

## Verification

npm run typecheck:extensions exits 0 && grep -rn 'runGsd\|spawnGsd\|_gsdEpipeGuard\|detectV2Gsd\|gsdPrefix\|createTempGsdDir\|GSD-Unit\|GSD-Milestone\|mainGsd\|wtGsd\|srcGsd\|dstGsd\|gsd2Root' --include='*.ts' --include='*.tsx' --include='*.mjs' . | grep -v node_modules | grep -v '.hx/' | grep -v migrate-gsd-to-hx | wc -l returns 0 && test ! -f src/resources/extensions/hx/tests/gsd-db.test.ts && test -f src/resources/extensions/hx/tests/hx-db.test.ts && grep 'extensions/gsd' .github/workflows/ci.yml | wc -l returns 0
