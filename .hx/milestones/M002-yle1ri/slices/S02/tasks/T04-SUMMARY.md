---
id: T04
parent: S02
milestone: M002-yle1ri
provides: []
requires: []
affects: []
key_files: ["src/resources/extensions/hx/preferences-models.ts", "src/resources/extensions/hx/preferences-types.ts", "src/resources/extensions/hx/prompts/plan-slice.md", "src/resources/extensions/hx/prompts/execute-task.md", "src/resources/extensions/hx/prompts/complete-slice.md", "src/resources/extensions/hx/captures.ts", "src/resources/extensions/hx/triage-resolution.ts"]
key_decisions: ["stampCaptureMilestone uses bold-field pattern (ResolvedInMilestone) consistent with existing captures.ts field serialization convention", "loadActionableCaptures filter: exclude only when resolvedInMilestone is set AND differs from currentMilestoneId — un-stamped entries remain actionable", "stampCaptureMilestone called for all three actionable cases including quick-task (where markCaptureExecuted is not called), so stale filtering still applies on next run"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "Ran npx tsc --noEmit (0 errors, 28.1s). Ran all 5 task-plan grep checks — all pass. Compiled test suite (1157 files in 7.8s). Ran full test suite: 3100 pass / 0 fail / 3 skip, matching S01 baseline exactly. GSD/gsd naming regression grep across 7 modified files: 0 hits."
completed_at: 2026-04-04T12:10:31.566Z
blocker_discovered: false
---

# T04: Ported 5 upstream metadata fixes (preferences unit types, prompt autonomous guards, captures milestone staleness); typecheck clean, 3100/3103 tests pass with 0 new failures

> Ported 5 upstream metadata fixes (preferences unit types, prompt autonomous guards, captures milestone staleness); typecheck clean, 3100/3103 tests pass with 0 new failures

## What Happened
---
id: T04
parent: S02
milestone: M002-yle1ri
key_files:
  - src/resources/extensions/hx/preferences-models.ts
  - src/resources/extensions/hx/preferences-types.ts
  - src/resources/extensions/hx/prompts/plan-slice.md
  - src/resources/extensions/hx/prompts/execute-task.md
  - src/resources/extensions/hx/prompts/complete-slice.md
  - src/resources/extensions/hx/captures.ts
  - src/resources/extensions/hx/triage-resolution.ts
key_decisions:
  - stampCaptureMilestone uses bold-field pattern (ResolvedInMilestone) consistent with existing captures.ts field serialization convention
  - loadActionableCaptures filter: exclude only when resolvedInMilestone is set AND differs from currentMilestoneId — un-stamped entries remain actionable
  - stampCaptureMilestone called for all three actionable cases including quick-task (where markCaptureExecuted is not called), so stale filtering still applies on next run
duration: ""
verification_result: passed
completed_at: 2026-04-04T12:10:31.568Z
blocker_discovered: false
---

# T04: Ported 5 upstream metadata fixes (preferences unit types, prompt autonomous guards, captures milestone staleness); typecheck clean, 3100/3103 tests pass with 0 new failures

**Ported 5 upstream metadata fixes (preferences unit types, prompt autonomous guards, captures milestone staleness); typecheck clean, 3100/3103 tests pass with 0 new failures**

## What Happened

Applied Fix #3066 to preferences-models.ts (added worktree-merge to completion group) and preferences-types.ts (added 5 new unit types to KNOWN_UNIT_TYPES). Applied Fix #3240 by inserting autonomous execution guard paragraphs into all three executor prompt files (plan-slice.md, execute-task.md, complete-slice.md). Applied Fix #3084 to captures.ts: added resolvedInMilestone field to CaptureEntry, new stampCaptureMilestone() function, updated loadActionableCaptures() to accept and use currentMilestoneId for stale filtering, updated parser and entries.push(). Wired milestone staleness into triage-resolution.ts: added stampCaptureMilestone to imports, passed mid to loadActionableCaptures, stamped each processed capture in all three case branches. Full typecheck and test suite ran clean.

## Verification

Ran npx tsc --noEmit (0 errors, 28.1s). Ran all 5 task-plan grep checks — all pass. Compiled test suite (1157 files in 7.8s). Ran full test suite: 3100 pass / 0 fail / 3 skip, matching S01 baseline exactly. GSD/gsd naming regression grep across 7 modified files: 0 hits.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx tsc --noEmit` | 0 | ✅ pass | 28100ms |
| 2 | `grep -c 'worktree-merge' src/resources/extensions/hx/preferences-types.ts | grep -q '[1-9]'` | 0 | ✅ pass | 100ms |
| 3 | `grep -c 'Autonomous execution' src/resources/extensions/hx/prompts/plan-slice.md | grep -q '[1-9]'` | 0 | ✅ pass | 100ms |
| 4 | `grep -c 'resolvedInMilestone' src/resources/extensions/hx/captures.ts | grep -q '[1-9]'` | 0 | ✅ pass | 100ms |
| 5 | `grep -c 'stampCaptureMilestone' src/resources/extensions/hx/triage-resolution.ts | grep -q '[1-9]'` | 0 | ✅ pass | 100ms |
| 6 | `node scripts/compile-tests.mjs` | 0 | ✅ pass | 7800ms |
| 7 | `node --test dist-test/src/resources/extensions/hx/tests/*.test.js` | 0 | ✅ pass | 58400ms |
| 8 | `grep -rn '\bgsd\b|\bGSD\b' [7 modified files]` | 0 | ✅ pass | 200ms |


## Deviations

None — all five steps matched the task plan. validate-milestone, rewrite-docs, discuss-milestone, discuss-slice were already in preferences-models.ts with correct cases; only KNOWN_UNIT_TYPES array was missing them.

## Known Issues

None.

## Files Created/Modified

- `src/resources/extensions/hx/preferences-models.ts`
- `src/resources/extensions/hx/preferences-types.ts`
- `src/resources/extensions/hx/prompts/plan-slice.md`
- `src/resources/extensions/hx/prompts/execute-task.md`
- `src/resources/extensions/hx/prompts/complete-slice.md`
- `src/resources/extensions/hx/captures.ts`
- `src/resources/extensions/hx/triage-resolution.ts`


## Deviations
None — all five steps matched the task plan. validate-milestone, rewrite-docs, discuss-milestone, discuss-slice were already in preferences-models.ts with correct cases; only KNOWN_UNIT_TYPES array was missing them.

## Known Issues
None.
