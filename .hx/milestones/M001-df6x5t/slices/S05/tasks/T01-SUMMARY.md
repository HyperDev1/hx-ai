---
id: T01
parent: S05
milestone: M001-df6x5t
provides: []
requires: []
affects: []
key_files: [".github/workflows/ci.yml", "src/resources/extensions/hx/bootstrap/register-extension.ts", "src/resources/extensions/hx/detection.ts", "web/components/hx/files-view.tsx", "web/components/hx/sidebar.tsx", "src/tests/integration/e2e-headless.test.ts", "src/tests/integration/e2e-smoke.test.ts", "src/resources/extensions/hx/tests/hx-db.test.ts", "src/resources/extensions/hx/tests/hx-inspect.test.ts", "src/resources/extensions/hx/tests/hx-recover.test.ts", "src/resources/extensions/hx/tests/hx-tools.test.ts", "tests/repro-worktree-bug/verify-integration.mjs", "tests/repro-worktree-bug/verify-fix.mjs", "tests/repro-worktree-bug/repro.mjs"]
key_decisions: ["Used foreground perl -pi -e loops per K001 (git worktree write requirement)", "Left ci.yml .gsd/ directory existence check intact — it correctly verifies the legacy dir is not checked in", "Put longer substitution strings before shorter substrings in perl scripts to prevent partial-match collisions"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "npm run typecheck:extensions exits 0. grep for all targeted gsd patterns in .ts/.tsx/.mjs returns 0. gsd-db.test.ts absent, hx-db.test.ts present. grep extensions/gsd in ci.yml returns 0. Ran 25 renamed hx-* test suite tests (25/25 pass), 21 content-renamed test tests (21/21 pass), 69 integration tests for git-service and parallel-merge (69/69 pass)."
completed_at: 2026-04-03T21:51:30.447Z
blocker_discovered: false
---

# T01: Fixed critical CI break and renamed all gsd identifiers from production source, 20 test files, and repro scripts — zero remaining hits in all targeted patterns

> Fixed critical CI break and renamed all gsd identifiers from production source, 20 test files, and repro scripts — zero remaining hits in all targeted patterns

## What Happened
---
id: T01
parent: S05
milestone: M001-df6x5t
key_files:
  - .github/workflows/ci.yml
  - src/resources/extensions/hx/bootstrap/register-extension.ts
  - src/resources/extensions/hx/detection.ts
  - web/components/hx/files-view.tsx
  - web/components/hx/sidebar.tsx
  - src/tests/integration/e2e-headless.test.ts
  - src/tests/integration/e2e-smoke.test.ts
  - src/resources/extensions/hx/tests/hx-db.test.ts
  - src/resources/extensions/hx/tests/hx-inspect.test.ts
  - src/resources/extensions/hx/tests/hx-recover.test.ts
  - src/resources/extensions/hx/tests/hx-tools.test.ts
  - tests/repro-worktree-bug/verify-integration.mjs
  - tests/repro-worktree-bug/verify-fix.mjs
  - tests/repro-worktree-bug/repro.mjs
key_decisions:
  - Used foreground perl -pi -e loops per K001 (git worktree write requirement)
  - Left ci.yml .gsd/ directory existence check intact — it correctly verifies the legacy dir is not checked in
  - Put longer substitution strings before shorter substrings in perl scripts to prevent partial-match collisions
duration: ""
verification_result: passed
completed_at: 2026-04-03T21:51:30.448Z
blocker_discovered: false
---

# T01: Fixed critical CI break and renamed all gsd identifiers from production source, 20 test files, and repro scripts — zero remaining hits in all targeted patterns

**Fixed critical CI break and renamed all gsd identifiers from production source, 20 test files, and repro scripts — zero remaining hits in all targeted patterns**

## What Happened

Executed all 7 steps: (1) Fixed 3 broken ci.yml paths extensions/gsd/tests/ → extensions/hx/tests/ while leaving the .gsd/ existence check intact. (2) Renamed 4 production source files: _gsdEpipeGuard→_hxEpipeGuard, detectV2Gsd→detectV2Hx, gsdPrefix→hxPrefix. (3) TypeScript typecheck passed. (4) Applied bulk perl -pi substitutions across 13 test files covering all runGsd, spawnGsd, GSD-Unit, GSD-Milestone, gsdDbPath, mainGsd, wtGsd, srcGsd, dstGsd, gsd2Root, gsd2, gsd3, gsdRoot patterns. (5) git-mv'd 4 gsd-named test files to hx-* names with zero import breakage. (6) Renamed all gsd*/GSD_* identifiers in 3 repro-worktree-bug mjs files. (7) All verification greps return 0 hits, 115 total tests pass across renamed files.

## Verification

npm run typecheck:extensions exits 0. grep for all targeted gsd patterns in .ts/.tsx/.mjs returns 0. gsd-db.test.ts absent, hx-db.test.ts present. grep extensions/gsd in ci.yml returns 0. Ran 25 renamed hx-* test suite tests (25/25 pass), 21 content-renamed test tests (21/21 pass), 69 integration tests for git-service and parallel-merge (69/69 pass).

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm run typecheck:extensions` | 0 | ✅ pass | 41500ms |
| 2 | `grep -rn 'runGsd|spawnGsd|_gsdEpipeGuard|detectV2Gsd|gsdPrefix|createTempGsdDir|GSD-Unit|GSD-Milestone|mainGsd|wtGsd|srcGsd|dstGsd|gsd2Root' --include='*.ts' --include='*.tsx' --include='*.mjs' . | grep -v node_modules | grep -v '.hx/' | grep -v migrate-gsd-to-hx | wc -l` | 0 | ✅ pass (0 hits) | 500ms |
| 3 | `test ! -f src/resources/extensions/hx/tests/gsd-db.test.ts` | 0 | ✅ pass | 10ms |
| 4 | `test -f src/resources/extensions/hx/tests/hx-db.test.ts` | 0 | ✅ pass | 10ms |
| 5 | `grep 'extensions/gsd' .github/workflows/ci.yml | wc -l` | 0 | ✅ pass (0 hits) | 10ms |
| 6 | `node --import ./src/resources/extensions/hx/tests/resolve-ts.mjs --experimental-strip-types --test hx-db hx-inspect hx-recover hx-tools` | 0 | ✅ pass (25/25) | 4606ms |
| 7 | `node --import ./src/resources/extensions/hx/tests/resolve-ts.mjs --experimental-strip-types --test debug-logger worktree-db-same-file preferences-worktree-sync draft-promotion marketplace-test-fixtures` | 0 | ✅ pass (21/21) | 7300ms |
| 8 | `node --import ./src/resources/extensions/hx/tests/resolve-ts.mjs --experimental-strip-types --test git-service.test.ts parallel-merge.test.ts` | 0 | ✅ pass (69/69) | 11100ms |


## Deviations

None. All steps executed as planned.

## Known Issues

None. test:unit requires esbuild which is not installed in the worktree (only in parent node_modules) — this is pre-existing infrastructure not caused by this task.

## Files Created/Modified

- `.github/workflows/ci.yml`
- `src/resources/extensions/hx/bootstrap/register-extension.ts`
- `src/resources/extensions/hx/detection.ts`
- `web/components/hx/files-view.tsx`
- `web/components/hx/sidebar.tsx`
- `src/tests/integration/e2e-headless.test.ts`
- `src/tests/integration/e2e-smoke.test.ts`
- `src/resources/extensions/hx/tests/hx-db.test.ts`
- `src/resources/extensions/hx/tests/hx-inspect.test.ts`
- `src/resources/extensions/hx/tests/hx-recover.test.ts`
- `src/resources/extensions/hx/tests/hx-tools.test.ts`
- `tests/repro-worktree-bug/verify-integration.mjs`
- `tests/repro-worktree-bug/verify-fix.mjs`
- `tests/repro-worktree-bug/repro.mjs`


## Deviations
None. All steps executed as planned.

## Known Issues
None. test:unit requires esbuild which is not installed in the worktree (only in parent node_modules) — this is pre-existing infrastructure not caused by this task.
