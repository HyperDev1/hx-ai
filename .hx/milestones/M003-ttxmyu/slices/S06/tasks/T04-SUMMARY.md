---
id: T04
parent: S06
milestone: M003-ttxmyu
provides: []
requires: []
affects: []
key_files: ["src/resources/extensions/hx/commands-handlers.ts", "src/resources/extensions/hx/auto-start.ts", "src/resources/extensions/hx/auto.ts", "src/resources/extensions/hx/auto-dashboard.ts", "src/resources/extensions/hx/auto/session.ts", "src/resources/extensions/hx/auto/phases.ts", "src/resources/extensions/hx/roadmap-slices.ts", "src/resources/extensions/hx/auto-prompts.ts", "src/resources/extensions/hx/bootstrap/sanitize-complete-milestone.ts", "src/resources/extensions/hx/bootstrap/db-tools.ts", "src/resources/extensions/hx/tests/steer-worktree-path.test.ts", "src/resources/extensions/hx/tests/cold-resume-db-reopen.test.ts", "src/resources/extensions/hx/tests/dashboard-model-label-ordering.test.ts"]
key_decisions: ["checkRemoteAutoSession returns { running } not { isRunning } — used .running in steer condition", "resolveModelWithFallbacksForUnit('execute-task') used for preferences bootstrap — 'default' would miss the switch case", "Dashboard model display parses provider/id from dispatched model string", "Test files use node:test + readFileSync source analysis (not vitest)", "Cluster 13 already correct — no change needed"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "npx tsc --noEmit → 0 errors. npm run test:unit --reporter=dot → 4281 passed, 0 failed, 5 skipped (15 new tests). Targeted 3-file test run for new tests → 15/15 pass. Grep confirmed Cluster 13 already correct."
completed_at: 2026-04-05T19:33:09.262Z
blocker_discovered: false
---

# T04: Seven surgical patches to auto-mode orchestration: steer worktree routing, preferences model bootstrap, cold-resume DB reopen, dashboard dispatched-model label, heavy checkmark detection, complete-milestone sanitization, and slice CONTEXT.md injection — tsc clean, 4281 tests pass (15 new)

> Seven surgical patches to auto-mode orchestration: steer worktree routing, preferences model bootstrap, cold-resume DB reopen, dashboard dispatched-model label, heavy checkmark detection, complete-milestone sanitization, and slice CONTEXT.md injection — tsc clean, 4281 tests pass (15 new)

## What Happened
---
id: T04
parent: S06
milestone: M003-ttxmyu
key_files:
  - src/resources/extensions/hx/commands-handlers.ts
  - src/resources/extensions/hx/auto-start.ts
  - src/resources/extensions/hx/auto.ts
  - src/resources/extensions/hx/auto-dashboard.ts
  - src/resources/extensions/hx/auto/session.ts
  - src/resources/extensions/hx/auto/phases.ts
  - src/resources/extensions/hx/roadmap-slices.ts
  - src/resources/extensions/hx/auto-prompts.ts
  - src/resources/extensions/hx/bootstrap/sanitize-complete-milestone.ts
  - src/resources/extensions/hx/bootstrap/db-tools.ts
  - src/resources/extensions/hx/tests/steer-worktree-path.test.ts
  - src/resources/extensions/hx/tests/cold-resume-db-reopen.test.ts
  - src/resources/extensions/hx/tests/dashboard-model-label-ordering.test.ts
key_decisions:
  - checkRemoteAutoSession returns { running } not { isRunning } — used .running in steer condition
  - resolveModelWithFallbacksForUnit('execute-task') used for preferences bootstrap — 'default' would miss the switch case
  - Dashboard model display parses provider/id from dispatched model string
  - Test files use node:test + readFileSync source analysis (not vitest)
  - Cluster 13 already correct — no change needed
duration: ""
verification_result: passed
completed_at: 2026-04-05T19:33:09.263Z
blocker_discovered: false
---

# T04: Seven surgical patches to auto-mode orchestration: steer worktree routing, preferences model bootstrap, cold-resume DB reopen, dashboard dispatched-model label, heavy checkmark detection, complete-milestone sanitization, and slice CONTEXT.md injection — tsc clean, 4281 tests pass (15 new)

**Seven surgical patches to auto-mode orchestration: steer worktree routing, preferences model bootstrap, cold-resume DB reopen, dashboard dispatched-model label, heavy checkmark detection, complete-milestone sanitization, and slice CONTEXT.md injection — tsc clean, 4281 tests pass (15 new)**

## What Happened

Seven cluster patches applied:

Cluster 4 (steer worktree): commands-handlers.ts now routes appendOverride to the worktree path when auto is active or a remote session is running, falling back to basePath. Uses getAutoWorktreePath + checkRemoteAutoSession.

Cluster 5 (preferences bootstrap): auto-start.ts now resolves the execute-task model from preferences via resolveModelWithFallbacksForUnit and uses it to fill missing provider/id in startModelSnapshot when ctx.model has no provider.

Cluster 10 (complete-milestone sanitization): Created bootstrap/sanitize-complete-milestone.ts with sanitizeCompleteMilestoneParams that coerces all fields to typed values. Wired into db-tools.ts before handleCompleteMilestone.

Cluster 13 (merge failure): Already correct — worktree-resolver.ts already had /hx dispatch complete-milestone in backticks. No change.

Cluster 14 (cold resume + checkmarks): Exported openProjectDbIfPresent from auto-start.ts. In auto.ts resume path, call it before rebuildState. Updated roadmap-slices.ts to accept U+2714 and U+2705 checkmarks alongside U+2713 in all three detection sites.

Cluster 15 (dashboard model label): Added currentDispatchedModelId to AutoSession class + reset(). Extended WidgetStateAccessors with getCurrentDispatchedModelId(). Updated auto-dashboard.ts to parse and prefer dispatched model over stale cmdCtx.model. Wired in auto.ts. phases.ts resets at unit start and sets after selectAndApplyModel.

Cluster 21 (slice CONTEXT.md injection): Added inlineFileOptional calls for S##-CONTEXT.md in buildCompleteSlicePrompt, buildReplanSlicePrompt, and buildReassessRoadmapPrompt in auto-prompts.ts.

Three test files written (15 tests) using node:test + source-analysis pattern. All 4281 tests pass, tsc clean.

## Verification

npx tsc --noEmit → 0 errors. npm run test:unit --reporter=dot → 4281 passed, 0 failed, 5 skipped (15 new tests). Targeted 3-file test run for new tests → 15/15 pass. Grep confirmed Cluster 13 already correct.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx tsc --noEmit` | 0 | ✅ pass | 4400ms |
| 2 | `npm run test:unit -- --reporter=dot` | 0 | ✅ pass | 74500ms |
| 3 | `targeted 3-file test run (15 new tests)` | 0 | ✅ pass | 7200ms |


## Deviations

Cluster 4: used .running not .isRunning on checkRemoteAutoSession result. Cluster 5: used 'execute-task' unit type (not 'default' which returns undefined). Test approach: rewrote from vitest to node:test source-analysis pattern. Cluster 14: also updated title-prefix strip regex for U+2714/U+2705.

## Known Issues

None.

## Files Created/Modified

- `src/resources/extensions/hx/commands-handlers.ts`
- `src/resources/extensions/hx/auto-start.ts`
- `src/resources/extensions/hx/auto.ts`
- `src/resources/extensions/hx/auto-dashboard.ts`
- `src/resources/extensions/hx/auto/session.ts`
- `src/resources/extensions/hx/auto/phases.ts`
- `src/resources/extensions/hx/roadmap-slices.ts`
- `src/resources/extensions/hx/auto-prompts.ts`
- `src/resources/extensions/hx/bootstrap/sanitize-complete-milestone.ts`
- `src/resources/extensions/hx/bootstrap/db-tools.ts`
- `src/resources/extensions/hx/tests/steer-worktree-path.test.ts`
- `src/resources/extensions/hx/tests/cold-resume-db-reopen.test.ts`
- `src/resources/extensions/hx/tests/dashboard-model-label-ordering.test.ts`


## Deviations
Cluster 4: used .running not .isRunning on checkRemoteAutoSession result. Cluster 5: used 'execute-task' unit type (not 'default' which returns undefined). Test approach: rewrote from vitest to node:test source-analysis pattern. Cluster 14: also updated title-prefix strip regex for U+2714/U+2705.

## Known Issues
None.
