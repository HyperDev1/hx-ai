---
id: T02
parent: S01
milestone: M002-yle1ri
provides: []
requires: []
affects: []
key_files: ["src/resources/extensions/hx/state.ts", "src/resources/extensions/hx/hx-db.ts", "src/resources/extensions/hx/tests/derive-state-db.test.ts", "src/resources/extensions/hx/tests/vacuum-recovery.test.ts"]
key_decisions: ["Fix 3 ghost check: DB row+slices=not ghost, DB row alone=still ghost, worktree .git file=not ghost", "Post-compile-tests.mjs re-compilation required for worktree isolation", "Import patching via sed after esbuild compile for .ts→.js specifiers"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "tsc --noEmit: exit 0. compile-tests.mjs: exit 0. node --test derive-state-db.test.js: 28/28 pass. node --test vacuum-recovery.test.js: 6/6 pass. node --test unit-ownership.test.js: 17/17 pass (T01 regression)."
completed_at: 2026-04-04T09:56:14.944Z
blocker_discovered: false
---

# T02: Applied state.ts triple fix (unconditional DB derive, slice reconciliation, ghost+worktree check) and hx-db.ts VACUUM recovery; 28/28 + 6/6 tests pass

> Applied state.ts triple fix (unconditional DB derive, slice reconciliation, ghost+worktree check) and hx-db.ts VACUUM recovery; 28/28 + 6/6 tests pass

## What Happened
---
id: T02
parent: S01
milestone: M002-yle1ri
key_files:
  - src/resources/extensions/hx/state.ts
  - src/resources/extensions/hx/hx-db.ts
  - src/resources/extensions/hx/tests/derive-state-db.test.ts
  - src/resources/extensions/hx/tests/vacuum-recovery.test.ts
key_decisions:
  - Fix 3 ghost check: DB row+slices=not ghost, DB row alone=still ghost, worktree .git file=not ghost
  - Post-compile-tests.mjs re-compilation required for worktree isolation
  - Import patching via sed after esbuild compile for .ts→.js specifiers
duration: ""
verification_result: passed
completed_at: 2026-04-04T09:56:14.945Z
blocker_discovered: false
---

# T02: Applied state.ts triple fix (unconditional DB derive, slice reconciliation, ghost+worktree check) and hx-db.ts VACUUM recovery; 28/28 + 6/6 tests pass

**Applied state.ts triple fix (unconditional DB derive, slice reconciliation, ghost+worktree check) and hx-db.ts VACUUM recovery; 28/28 + 6/6 tests pass**

## What Happened

Applied 4 upstream bugfixes with GSD→HX adaptation. Fix 1 (#2631): removed if(dbMilestones.length>0) guard in deriveState() — DB path now always runs when available. Fix 2 (#2533): slice disk→DB reconciliation loop in deriveStateFromDb() — scans slice dirs on disk and inserts missing slices into DB. Fix 3 (#3041): isGhostMilestone enhanced with worktree .git file check + DB row+slices check. Fix 4 (#2519): VACUUM recovery in openDatabase() on initSchema failure for file-backed DBs. Added 3 new ghost tests to derive-state-db.test.ts and created vacuum-recovery.test.ts with 6 tests. Compilation workaround: worktree esbuild output uses .ts import specifiers; patched to .js via sed for plain node --test compatibility.

## Verification

tsc --noEmit: exit 0. compile-tests.mjs: exit 0. node --test derive-state-db.test.js: 28/28 pass. node --test vacuum-recovery.test.js: 6/6 pass. node --test unit-ownership.test.js: 17/17 pass (T01 regression).

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx tsc --noEmit (worktree)` | 0 | ✅ pass | 5300ms |
| 2 | `node scripts/compile-tests.mjs (main project)` | 0 | ✅ pass | 8500ms |
| 3 | `node --test dist-test/.../derive-state-db.test.js` | 0 | ✅ pass | 413ms |
| 4 | `node --test dist-test/.../vacuum-recovery.test.js` | 0 | ✅ pass | 274ms |
| 5 | `node --test dist-test/.../unit-ownership.test.js` | 0 | ✅ pass | 286ms |


## Deviations

Fix 3 semantics refined: DB row alone (no slices) is still a ghost; DB row + slices = not ghost. Task plan implied DB row alone suffices. Compilation workaround required: compile-tests.mjs overwrites dist-test from main src/, worktree files re-compiled and import-patched after.

## Known Issues

None.

## Files Created/Modified

- `src/resources/extensions/hx/state.ts`
- `src/resources/extensions/hx/hx-db.ts`
- `src/resources/extensions/hx/tests/derive-state-db.test.ts`
- `src/resources/extensions/hx/tests/vacuum-recovery.test.ts`


## Deviations
Fix 3 semantics refined: DB row alone (no slices) is still a ghost; DB row + slices = not ghost. Task plan implied DB row alone suffices. Compilation workaround required: compile-tests.mjs overwrites dist-test from main src/, worktree files re-compiled and import-patched after.

## Known Issues
None.
