---
id: T03
parent: S01
milestone: M002-yle1ri
provides: []
requires: []
affects: []
key_files: ["src/resources/extensions/hx/workflow-manifest.ts", "src/resources/extensions/hx/migrate-external.ts", "src/resources/extensions/hx/bootstrap/dynamic-tools.ts", "src/resources/extensions/hx/auto-post-unit.ts", "src/resources/extensions/hx/tests/workflow-manifest.test.ts"]
key_decisions: ["toNumeric uses Number(val) || 0; exit_code/duration_ms preserve null via null-check wrapper", "isInsideWorktree guard placed as first statement in migrateToExternalState", "External symlink layout /.hx/projects/<hash>/worktrees/ added after /.hx/worktrees/ check", "DB-unavailable retry guard placed around regenerateIfMissing (the DB-querying retry path)", "compile-tests.mjs must run from main project; worktree files re-esbuild-compiled+patched after"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "tsc --noEmit (worktree): exit 0. node scripts/compile-tests.mjs (main project): exit 0. node --test workflow-manifest.test.js: 11/11 pass. Regression: derive-state-db.test.js 28/28, vacuum-recovery.test.js 6/6, unit-ownership.test.js 17/17. Total 62/62 pass."
completed_at: 2026-04-04T10:09:03.157Z
blocker_discovered: false
---

# T03: Applied four upstream data safety fixes (toNumeric coercion, worktree migration guard, symlink layout detection, DB retry guard); 11+62 tests pass

> Applied four upstream data safety fixes (toNumeric coercion, worktree migration guard, symlink layout detection, DB retry guard); 11+62 tests pass

## What Happened
---
id: T03
parent: S01
milestone: M002-yle1ri
key_files:
  - src/resources/extensions/hx/workflow-manifest.ts
  - src/resources/extensions/hx/migrate-external.ts
  - src/resources/extensions/hx/bootstrap/dynamic-tools.ts
  - src/resources/extensions/hx/auto-post-unit.ts
  - src/resources/extensions/hx/tests/workflow-manifest.test.ts
key_decisions:
  - toNumeric uses Number(val) || 0; exit_code/duration_ms preserve null via null-check wrapper
  - isInsideWorktree guard placed as first statement in migrateToExternalState
  - External symlink layout /.hx/projects/<hash>/worktrees/ added after /.hx/worktrees/ check
  - DB-unavailable retry guard placed around regenerateIfMissing (the DB-querying retry path)
  - compile-tests.mjs must run from main project; worktree files re-esbuild-compiled+patched after
duration: ""
verification_result: passed
completed_at: 2026-04-04T10:09:03.158Z
blocker_discovered: false
---

# T03: Applied four upstream data safety fixes (toNumeric coercion, worktree migration guard, symlink layout detection, DB retry guard); 11+62 tests pass

**Applied four upstream data safety fixes (toNumeric coercion, worktree migration guard, symlink layout detection, DB retry guard); 11+62 tests pass**

## What Happened

Applied four upstream data-safety bugfixes with GSD→HX adaptation. Fix 1 (#2962): added toNumeric(val: unknown): number helper to workflow-manifest.ts and applied it to sequence (slices), sequence (tasks), and exit_code/duration_ms (verification_evidence) fields, preventing silent silent NaN from TEXT-affinity SQLite columns. Fix 2 (#2970): added isInsideWorktree import + early return guard as first statement of migrateToExternalState(), preventing migration from corrupting shared state when run from a worktree. Fix 3 (#2517): added /.hx/projects/<hash>/worktrees/ symlink layout detection in resolveProjectRootDbPath() after existing /.hx/worktrees/ check; added structured stderr diagnostic to ensureDbOpen() catch block. Fix 4 (#2517): added DB-unavailable guard around the regenerateIfMissing retry call in postUnitPreVerification(), emitting hx-db: stderr message when skipped. Added 3 new coercion tests (string 42→42, null→0, null→0) to workflow-manifest.test.ts. The initial AUTO-FIX ATTEMPT 1 failures were caused by the verification gate running compile-tests.mjs from the worktree directory (no esbuild); the correct invocation is from the main project directory. After compile-tests.mjs, worktree-modified files must be re-esbuild-compiled and import-patched.

## Verification

tsc --noEmit (worktree): exit 0. node scripts/compile-tests.mjs (main project): exit 0. node --test workflow-manifest.test.js: 11/11 pass. Regression: derive-state-db.test.js 28/28, vacuum-recovery.test.js 6/6, unit-ownership.test.js 17/17. Total 62/62 pass.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx tsc --noEmit (worktree)` | 0 | ✅ pass | 4700ms |
| 2 | `node scripts/compile-tests.mjs (main project)` | 0 | ✅ pass | 6900ms |
| 3 | `node --test dist-test/.../workflow-manifest.test.js` | 0 | ✅ pass (11/11) | 321ms |
| 4 | `node --test dist-test/.../derive-state-db.test.js` | 0 | ✅ pass (28/28) | 282ms |
| 5 | `node --test dist-test/.../vacuum-recovery.test.js` | 0 | ✅ pass (6/6) | 39ms |
| 6 | `node --test dist-test/.../unit-ownership.test.js` | 0 | ✅ pass (17/17) | 195ms |


## Deviations

exit_code/duration_ms in verification_evidence use null-preserving toNumeric pattern (not plain toNumeric()) since the interface declares them as number | null. The retry mechanism guarded is regenerateIfMissing (not an explicit loop). Verification gate initially ran compile-tests.mjs from worktree — fixed by running from main project.

## Known Issues

None.

## Files Created/Modified

- `src/resources/extensions/hx/workflow-manifest.ts`
- `src/resources/extensions/hx/migrate-external.ts`
- `src/resources/extensions/hx/bootstrap/dynamic-tools.ts`
- `src/resources/extensions/hx/auto-post-unit.ts`
- `src/resources/extensions/hx/tests/workflow-manifest.test.ts`


## Deviations
exit_code/duration_ms in verification_evidence use null-preserving toNumeric pattern (not plain toNumeric()) since the interface declares them as number | null. The retry mechanism guarded is regenerateIfMissing (not an explicit loop). Verification gate initially ran compile-tests.mjs from worktree — fixed by running from main project.

## Known Issues
None.
