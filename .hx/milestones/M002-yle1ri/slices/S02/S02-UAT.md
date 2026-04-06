# S02: Worktree/Git & Auto-mode Fixes — UAT

**Milestone:** M002-yle1ri
**Written:** 2026-04-04T12:14:00.904Z

## UAT Type
UAT mode: artifact-driven

## Preconditions
- Worktree is at `/Users/beratcan/Desktop/GithubProjects/hx-ai/.hx/worktrees/M002-yle1ri`
- All source files have been compiled (dist-test current)
- S01 baseline established (3100 pass / 3 skip)

## Test Cases

### TC-01: DB Truncation Guard
**Target:** `src/resources/extensions/hx/auto-worktree.ts`

1. Search for `statSync` near the `unlinkSync(wtDb)` call:
   ```
   grep -n 'statSync\|unlinkSync.*wtDb\|size === 0' src/resources/extensions/hx/auto-worktree.ts
   ```
2. **Expected:** Lines show `statSync(wtDb).size === 0` as condition before `unlinkSync(wtDb)` — unconditional delete is gone.

### TC-02: mcp.json in ROOT_STATE_FILES and copyPlanningArtifacts
**Target:** `src/resources/extensions/hx/auto-worktree.ts`

1. Check ROOT_STATE_FILES and copyPlanningArtifacts:
   ```
   grep -n 'mcp.json' src/resources/extensions/hx/auto-worktree.ts
   ```
2. **Expected:** At least 2 occurrences — one in ROOT_STATE_FILES const, one in copyPlanningArtifacts loop.

### TC-03: MERGE_HEAD 3-file Cleanup Loop
**Target:** `src/resources/extensions/hx/auto-worktree.ts`

1. Search for MERGE_HEAD cleanup presence:
   ```
   grep -n 'MERGE_HEAD\|SQUASH_MSG\|MERGE_MSG' src/resources/extensions/hx/auto-worktree.ts
   ```
2. **Expected:** At least 6 occurrences total — cleanup loop before nativeMergeSquash, cleanup on dirty-tree error path, cleanup on conflict error path, cleanup on success path. SQUASH_MSG and MERGE_MSG appear alongside MERGE_HEAD in each loop.

### TC-04: nativeMergeAbort on Error Paths
**Target:** `src/resources/extensions/hx/auto-worktree.ts`

1. Check nativeMergeAbort import and usage:
   ```
   grep -n 'nativeMergeAbort' src/resources/extensions/hx/auto-worktree.ts
   ```
2. **Expected:** Import from native-git-bridge.js, plus at least 2 call sites (dirty-tree path, conflict error path).

### TC-05: Milestone Shelter Logic
**Target:** `src/resources/extensions/hx/auto-worktree.ts`

1. Check shelter references:
   ```
   grep -n 'milestone-shelter\|shelterBase\|restoreShelter' src/resources/extensions/hx/auto-worktree.ts
   ```
2. **Expected:** shelterBase variable, restoreShelter function definition, calls on exit paths. milestone-shelter path string appears.

### TC-06: isInsideHxWorktree Guard
**Target:** `src/resources/extensions/hx/paths.ts`

1. Check function definition and export:
   ```
   grep -n 'isInsideHxWorktree\|worktrees' src/resources/extensions/hx/paths.ts
   ```
2. **Expected:** Exported function with regex test for `\.hx[\/\\]worktrees` pattern, called within probeHxRoot().

### TC-07: HX_MILESTONE_LOCK Scoping in smartStage
**Target:** `src/resources/extensions/hx/git-service.ts`

1. Check env var usage:
   ```
   grep -n 'HX_MILESTONE_LOCK\|exclude.*milestones' src/resources/extensions/hx/git-service.ts
   ```
2. **Expected:** `process.env.HX_MILESTONE_LOCK` check, `:(exclude).hx/milestones/` pathspec construction for non-locked entries.

### TC-08: findNestedGitDirs and NESTED_GIT_SKIP_DIRS
**Target:** `src/resources/extensions/hx/worktree-manager.ts`

1. Check function and constant:
   ```
   grep -n 'findNestedGitDirs\|NESTED_GIT_SKIP_DIRS' src/resources/extensions/hx/worktree-manager.ts
   ```
2. **Expected:** NESTED_GIT_SKIP_DIRS Set constant, findNestedGitDirs exported function, call in removeWorktree().

### TC-09: isolation-none Worktree Safety
**Target:** `src/resources/extensions/hx/worktree-resolver.ts`

1. Check mode=none conditional:
   ```
   grep -n 'mode.*none\|inWorktree\|isInAutoWorktree' src/resources/extensions/hx/worktree-resolver.ts
   ```
2. **Expected:** `if (mode === "none" && !inWorktree)` condition — skips only when outside an auto-worktree, not unconditionally.

### TC-10: DB-Complete Milestone Detection
**Target:** `src/resources/extensions/hx/parallel-merge.ts`

1. Check DB detection functions:
   ```
   grep -n 'isMilestoneCompleteInWorktreeDb\|discoverDbCompletedMilestones' src/resources/extensions/hx/parallel-merge.ts
   ```
2. **Expected:** Both exported functions present; determineMergeOrder includes basePath parameter for DB-complete milestone discovery.

### TC-11: hx auto Subcommand
**Target:** `src/cli.ts`, `src/help-text.ts`

1. Check subcommand and help text:
   ```
   grep -n "'auto'\|hx auto" src/cli.ts src/help-text.ts
   ```
2. **Expected:** Subcommand block in cli.ts that shifts 'auto' and forwards to headless, alias mention in help-text.ts.

### TC-12: Empty-Content Abort Fast-Path
**Target:** `src/resources/extensions/hx/bootstrap/agent-end-recovery.ts`

1. Check empty content detection:
   ```
   grep -n 'hasEmptyContent\|hasErrorMessage\|resolveAgentEnd' src/resources/extensions/hx/bootstrap/agent-end-recovery.ts
   ```
2. **Expected:** `hasEmptyContent` and `hasErrorMessage` variables, `resolveAgentEnd(event); return;` in the fast-path branch.

### TC-13: stopAuto Null-Unit Guard
**Target:** `src/resources/extensions/hx/auto/phases.ts`

1. Check guard:
   ```
   grep -n 'currentUnit\?' src/resources/extensions/hx/auto/phases.ts | head -10
   ```
2. **Expected:** Optional chaining on `s.currentUnit?.startedAt` and `if (s.currentUnit)` guard around closeoutUnit call.

### TC-14: shouldBlockQueueExecution Gate
**Target:** `src/resources/extensions/hx/bootstrap/write-gate.ts`

1. Check gate function and constants:
   ```
   grep -n 'shouldBlockQueueExecution\|QUEUE_SAFE_TOOLS\|HX_DIR_RE\|BASH_READ_ONLY_RE' src/resources/extensions/hx/bootstrap/write-gate.ts
   ```
2. **Expected:** All 4 identifiers present. shouldBlockQueueExecution is exported.

### TC-15: turn_end Quick-Branch Cleanup
**Target:** `src/resources/extensions/hx/bootstrap/register-hooks.ts`

1. Check turn_end handler:
   ```
   grep -n 'cleanupQuickBranch\|turn_end' src/resources/extensions/hx/bootstrap/register-hooks.ts
   ```
2. **Expected:** turn_end event handler present, calls cleanupQuickBranch(process.cwd()) guarded by isAutoActive().

### TC-16: worktree-merge Unit Type in Preferences
**Target:** `src/resources/extensions/hx/preferences-types.ts`, `src/resources/extensions/hx/preferences-models.ts`

1. Check KNOWN_UNIT_TYPES and switch case:
   ```
   grep -n 'worktree-merge' src/resources/extensions/hx/preferences-types.ts src/resources/extensions/hx/preferences-models.ts
   ```
2. **Expected:** Appears in KNOWN_UNIT_TYPES array and in resolveModelWithFallbacksForUnit() switch case.

### TC-17: Autonomous Execution Guards in Prompts
**Target:** `src/resources/extensions/hx/prompts/plan-slice.md`, `execute-task.md`, `complete-slice.md`

1. Check guard paragraphs:
   ```
   grep -l 'Autonomous execution' src/resources/extensions/hx/prompts/plan-slice.md src/resources/extensions/hx/prompts/execute-task.md src/resources/extensions/hx/prompts/complete-slice.md
   ```
2. **Expected:** All 3 files listed (grep -l returns filename if found).

### TC-18: Captures Milestone Staleness
**Target:** `src/resources/extensions/hx/captures.ts`, `src/resources/extensions/hx/triage-resolution.ts`

1. Check staleness field and stamping:
   ```
   grep -n 'resolvedInMilestone\|stampCaptureMilestone' src/resources/extensions/hx/captures.ts src/resources/extensions/hx/triage-resolution.ts
   ```
2. **Expected:** resolvedInMilestone appears multiple times in captures.ts (interface, parser, writer, filter). stampCaptureMilestone exported from captures.ts and called in triage-resolution.ts.

### TC-19: Typecheck
1. Run: `npx tsc --noEmit`
2. **Expected:** Exit 0, no output.

### TC-20: No GSD Naming Regressions
1. Run:
   ```
   grep -rn '\bgsd\b\|\bGSD\b' src/resources/extensions/hx/auto-worktree.ts src/resources/extensions/hx/paths.ts src/resources/extensions/hx/git-service.ts src/resources/extensions/hx/worktree-manager.ts src/resources/extensions/hx/worktree-resolver.ts src/resources/extensions/hx/parallel-merge.ts src/cli.ts src/resources/extensions/hx/bootstrap/agent-end-recovery.ts src/resources/extensions/hx/auto/phases.ts src/resources/extensions/hx/bootstrap/write-gate.ts src/resources/extensions/hx/bootstrap/register-hooks.ts src/resources/extensions/hx/preferences-models.ts src/resources/extensions/hx/preferences-types.ts src/resources/extensions/hx/captures.ts src/resources/extensions/hx/triage-resolution.ts
   ```
2. **Expected:** Zero output (no GSD/gsd references in any S02-modified file).

### TC-21: Test Suite Regression
1. Compile and run tests:
   ```
   cd /path/to/main/project && node scripts/compile-tests.mjs && node --test dist-test/src/resources/extensions/hx/tests/*.test.js
   ```
2. **Expected:** ≥3100 pass, 0 new failures vs S01 baseline (3 pre-existing skips allowed).

## Edge Cases

- **TC-01 edge:** If wtDb doesn't exist at all, statSync will throw — verify the guard is inside an existsSync check or try/catch.
- **TC-05 edge:** restoreShelter should be a no-op when `.hx/.milestone-shelter/` doesn't exist (e.g., first merge with only 1 milestone). Verify `existsSync(shelterBase)` guard.
- **TC-09 edge:** If both `mode === "none"` AND `inWorktree` is true, merge must NOT be skipped. This is the fixed behavior — verify the condition is `&& !inWorktree` not `|| inWorktree`.
- **TC-12 edge:** Empty-content fast-path only fires when `content.length === 0` AND no errorMessage. A provider error with content=[] but errorMessage set should still trigger pauseAuto.
- **TC-10 edge:** If sqlite3 binary is not on PATH, `isMilestoneCompleteInWorktreeDb` should return false silently (not throw). Verify spawnSync handles this.

