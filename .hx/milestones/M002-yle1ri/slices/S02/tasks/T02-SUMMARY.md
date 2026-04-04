---
id: T02
parent: S02
milestone: M002-yle1ri
provides: []
requires: []
affects: []
key_files: ["src/resources/extensions/hx/paths.ts", "src/resources/extensions/hx/git-service.ts", "src/resources/extensions/hx/worktree-manager.ts", "src/resources/extensions/hx/worktree-resolver.ts", "src/resources/extensions/hx/parallel-merge.ts"]
key_decisions: ["isInsideHxWorktree placed before hxRootCache so probeHxRoot can call it without forward reference", "allExclusions is a mutable spread copy so HX_MILESTONE_LOCK push works without re-assign", "determineMergeOrder basePath param optional to keep existing 2-arg callers valid", "findNestedGitDirs skips .git in NESTED_GIT_SKIP_DIRS to avoid double-listing the root git dir"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "npx tsc --noEmit: exit 0. All 4 task-plan grep checks passed. Full test suite: 3123 pass, 2 pre-existing failures (worktree-sync-milestones, reassess-handler — confirmed pre-exist by stash-and-run). Zero new failures introduced."
completed_at: 2026-04-04T11:29:30.136Z
blocker_discovered: false
---

# T02: Port 6 git-subsystem fixes: isInsideHxWorktree path guard, HX_MILESTONE_LOCK milestone scope, findNestedGitDirs cleanup, isolation-none worktree safety, and DB-complete milestone detection

> Port 6 git-subsystem fixes: isInsideHxWorktree path guard, HX_MILESTONE_LOCK milestone scope, findNestedGitDirs cleanup, isolation-none worktree safety, and DB-complete milestone detection

## What Happened
---
id: T02
parent: S02
milestone: M002-yle1ri
key_files:
  - src/resources/extensions/hx/paths.ts
  - src/resources/extensions/hx/git-service.ts
  - src/resources/extensions/hx/worktree-manager.ts
  - src/resources/extensions/hx/worktree-resolver.ts
  - src/resources/extensions/hx/parallel-merge.ts
key_decisions:
  - isInsideHxWorktree placed before hxRootCache so probeHxRoot can call it without forward reference
  - allExclusions is a mutable spread copy so HX_MILESTONE_LOCK push works without re-assign
  - determineMergeOrder basePath param optional to keep existing 2-arg callers valid
  - findNestedGitDirs skips .git in NESTED_GIT_SKIP_DIRS to avoid double-listing the root git dir
duration: ""
verification_result: passed
completed_at: 2026-04-04T11:29:30.139Z
blocker_discovered: false
---

# T02: Port 6 git-subsystem fixes: isInsideHxWorktree path guard, HX_MILESTONE_LOCK milestone scope, findNestedGitDirs cleanup, isolation-none worktree safety, and DB-complete milestone detection

**Port 6 git-subsystem fixes: isInsideHxWorktree path guard, HX_MILESTONE_LOCK milestone scope, findNestedGitDirs cleanup, isolation-none worktree safety, and DB-complete milestone detection**

## What Happened

Applied all 6 upstream fixes across 5 git-subsystem files. (1) paths.ts: added exported isInsideHxWorktree() and two guards in probeHxRoot() to prevent the function escaping to project-root .hx/ when already inside a worktree. (2) git-service.ts JSDoc: corrected isolation field — removed (default) from worktree, added (default at runtime) to none. (3) git-service.ts smartStage: added readdirSync import and HX_MILESTONE_LOCK env-var check that appends :(exclude).hx/milestones/${entry}/ for non-locked milestone dirs. (4) worktree-manager.ts: added lstatSync/readdirSync imports, NESTED_GIT_SKIP_DIRS constant, findNestedGitDirs() recursive scanner, and called it in removeWorktree() before force-removal to rmSync nested .git entries. (5) worktree-resolver.ts: changed mode=none early-return to only skip when NOT inside an auto-worktree, preserving merge execution when isolation:none but worktree context exists. (6) parallel-merge.ts: added fs/path/child_process imports, isMilestoneCompleteInWorktreeDb() (sqlite3 CLI check), discoverDbCompletedMilestones() scanner, and updated determineMergeOrder() with optional basePath param to include DB-complete milestones alongside worker-reported ones.

## Verification

npx tsc --noEmit: exit 0. All 4 task-plan grep checks passed. Full test suite: 3123 pass, 2 pre-existing failures (worktree-sync-milestones, reassess-handler — confirmed pre-exist by stash-and-run). Zero new failures introduced.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx tsc --noEmit` | 0 | ✅ pass | 11300ms |
| 2 | `grep -c 'isInsideHxWorktree' src/resources/extensions/hx/paths.ts | grep -q '[1-9]'` | 0 | ✅ pass | 30ms |
| 3 | `grep -c 'HX_MILESTONE_LOCK' src/resources/extensions/hx/git-service.ts | grep -q '[1-9]'` | 0 | ✅ pass | 30ms |
| 4 | `grep -c 'findNestedGitDirs' src/resources/extensions/hx/worktree-manager.ts | grep -q '[1-9]'` | 0 | ✅ pass | 30ms |
| 5 | `grep -c 'isMilestoneCompleteInWorktreeDb' src/resources/extensions/hx/parallel-merge.ts | grep -q '[1-9]'` | 0 | ✅ pass | 30ms |
| 6 | `node --test dist-test/src/resources/extensions/hx/tests/*.test.js (3123 pass / 2 pre-existing fail)` | 0 | ✅ pass | 70000ms |


## Deviations

determineMergeOrder basePath param typed as optional (?) to preserve backward compatibility with 2-arg callers. Second probeHxRoot guard returns local (init fallback) when existsSync(localResolved) is false.

## Known Issues

None.

## Files Created/Modified

- `src/resources/extensions/hx/paths.ts`
- `src/resources/extensions/hx/git-service.ts`
- `src/resources/extensions/hx/worktree-manager.ts`
- `src/resources/extensions/hx/worktree-resolver.ts`
- `src/resources/extensions/hx/parallel-merge.ts`


## Deviations
determineMergeOrder basePath param typed as optional (?) to preserve backward compatibility with 2-arg callers. Second probeHxRoot guard returns local (init fallback) when existsSync(localResolved) is false.

## Known Issues
None.
