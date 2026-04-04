---
id: T01
parent: S02
milestone: M002-yle1ri
provides: []
requires: []
affects: []
key_files: ["src/resources/extensions/hx/auto-worktree.ts"]
key_decisions: ["restoreShelter implemented as local closure over shelterBase/milestonesBase to avoid repeating the restore loop at each of the 3 exit paths", "statSync imported directly (no alias) — no naming conflict in this file", "nativeMergeAbort added to existing native-git-bridge.js import block"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "npx tsc --noEmit returned exit 0 (no output). All 4 grep checks from the task verification command passed (mcp.json count=2, MERGE_HEAD count=6, milestone-shelter count=1, statSync count=4). node --test on auto-worktree-auto-resolve.test.js: 11/11 pass."
completed_at: 2026-04-04T11:18:12.479Z
blocker_discovered: false
---

# T01: Port 5 upstream auto-worktree.ts fixes: DB truncation guard, mcp.json sync, MERGE_HEAD stale-artifact cleanup, nativeMergeAbort on error paths, and milestone shelter before stash

> Port 5 upstream auto-worktree.ts fixes: DB truncation guard, mcp.json sync, MERGE_HEAD stale-artifact cleanup, nativeMergeAbort on error paths, and milestone shelter before stash

## What Happened
---
id: T01
parent: S02
milestone: M002-yle1ri
key_files:
  - src/resources/extensions/hx/auto-worktree.ts
key_decisions:
  - restoreShelter implemented as local closure over shelterBase/milestonesBase to avoid repeating the restore loop at each of the 3 exit paths
  - statSync imported directly (no alias) — no naming conflict in this file
  - nativeMergeAbort added to existing native-git-bridge.js import block
duration: ""
verification_result: passed
completed_at: 2026-04-04T11:18:12.481Z
blocker_discovered: false
---

# T01: Port 5 upstream auto-worktree.ts fixes: DB truncation guard, mcp.json sync, MERGE_HEAD stale-artifact cleanup, nativeMergeAbort on error paths, and milestone shelter before stash

**Port 5 upstream auto-worktree.ts fixes: DB truncation guard, mcp.json sync, MERGE_HEAD stale-artifact cleanup, nativeMergeAbort on error paths, and milestone shelter before stash**

## What Happened

Applied all 5 upstream fixes to src/resources/extensions/hx/auto-worktree.ts. (1) DB truncation guard: added statSync import and changed the unconditional unlinkSync(wtDb) to check statSync(wtDb).size === 0 first. (2) mcp.json sync: added to ROOT_STATE_FILES const and to copyPlanningArtifacts for...of loop. (3) MERGE_HEAD pre-merge cleanup: added a loop over [SQUASH_MSG, MERGE_MSG, MERGE_HEAD] before nativeMergeSquash to unlinkSync stale merge artifacts. (4) nativeMergeAbort on error paths: imported nativeMergeAbort from native-git-bridge.js; added abort+cleanup before both error throws (dirty-tree and code-conflict); replaced single SQUASH_MSG cleanup in success path with the same 3-file loop. (5) Milestone shelter: before stash, cpSync non-active milestone dirs to .hx/.milestone-shelter and rmSync originals; added restoreShelter() closure called on all three exit paths (dirty-tree error, conflict error, success); stash args extended with :(exclude).hx/milestones pathspec.

## Verification

npx tsc --noEmit returned exit 0 (no output). All 4 grep checks from the task verification command passed (mcp.json count=2, MERGE_HEAD count=6, milestone-shelter count=1, statSync count=4). node --test on auto-worktree-auto-resolve.test.js: 11/11 pass.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx tsc --noEmit` | 0 | ✅ pass | 4800ms |
| 2 | `grep -c 'mcp.json' src/resources/extensions/hx/auto-worktree.ts | grep -q '[1-9]'` | 0 | ✅ pass | 50ms |
| 3 | `grep -c 'MERGE_HEAD' src/resources/extensions/hx/auto-worktree.ts | grep -q '[3-9]'` | 0 | ✅ pass | 50ms |
| 4 | `grep -c 'milestone-shelter' src/resources/extensions/hx/auto-worktree.ts | grep -q '[1-9]'` | 0 | ✅ pass | 50ms |
| 5 | `grep -c 'statSync' src/resources/extensions/hx/auto-worktree.ts | grep -q '[1-9]'` | 0 | ✅ pass | 50ms |
| 6 | `node --test dist-test/src/resources/extensions/hx/tests/auto-worktree-auto-resolve.test.js` | 0 | ✅ pass (11/11) | 3100ms |


## Deviations

restoreShelter implemented as a local closure function instead of repeated inline code at each exit — functionally equivalent but cleaner. Stash pathspec appended inline in args array.

## Known Issues

None.

## Files Created/Modified

- `src/resources/extensions/hx/auto-worktree.ts`


## Deviations
restoreShelter implemented as a local closure function instead of repeated inline code at each exit — functionally equivalent but cleaner. Stash pathspec appended inline in args array.

## Known Issues
None.
