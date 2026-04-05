# S02: Slice-Level Parallelism

**Goal:** Port the slice-level parallelism subsystem from upstream into hx-ai: add HX_SLICE_LOCK isolation to state.ts (both paths) and dispatch-guard.ts, then implement slice-parallel-eligibility.ts, slice-parallel-conflict.ts, and slice-parallel-orchestrator.ts with full HX naming and tests.
**Demo:** After this: After this: slice parallel orchestrator files exist with HX naming; 3 test files pass; state.ts handles HX_SLICE_LOCK in both paths

## Tasks
- [x] **T01: Added HX_SLICE_LOCK env var isolation to both state derivation paths and dispatch-guard.ts, mirroring the HX_MILESTONE_LOCK pattern; 4 new tests pass** — Add HX_SLICE_LOCK env var isolation to both state derivation paths (deriveStateFromDb and _deriveStateImpl in state.ts) and to the positional-ordering check in dispatch-guard.ts. Mirrors the existing HX_MILESTONE_LOCK pattern exactly. Add tests for the new isolation behavior.
  - Estimate: 45m
  - Files: src/resources/extensions/hx/state.ts, src/resources/extensions/hx/dispatch-guard.ts, src/resources/extensions/hx/tests/derive-state-db.test.ts, src/resources/extensions/hx/tests/dispatch-guard.test.ts
  - Verify: grep -n 'HX_SLICE_LOCK' src/resources/extensions/hx/state.ts src/resources/extensions/hx/dispatch-guard.ts | wc -l | xargs -I{} test {} -ge 4 && npx tsc --noEmit && npm run test:unit 2>&1 | grep -E 'pass|fail'
- [x] **T02: Created slice-parallel-eligibility.ts with analyzeSliceParallelEligibility() and formatSliceEligibilityReport(), plus 9 passing tests covering all 4 required scenarios** — Create slice-parallel-eligibility.ts implementing analyzeSliceParallelEligibility() and formatSliceEligibilityReport(). Uses getMilestoneSlices + getSliceTasks from hx-db.ts. Pattern: adapt parallel-eligibility.ts (milestone-level) to the slice level. Create matching test file covering 4 scenarios.
  - Estimate: 60m
  - Files: src/resources/extensions/hx/slice-parallel-eligibility.ts, src/resources/extensions/hx/tests/slice-parallel-eligibility.test.ts
  - Verify: npx tsc --noEmit && npm run test:unit 2>&1 | grep -E 'pass|fail' && grep -rn '\bGSD\b\|\bgsd\b' src/resources/extensions/hx/slice-parallel-eligibility.ts | wc -l | xargs test 0 -eq
- [x] **T03: Created slice-parallel-conflict.ts with detectSliceConflicts() and buildSliceFileSets(), 4 tests pass** — Create slice-parallel-conflict.ts implementing detectSliceConflicts() and buildSliceFileSets(). Uses getSliceTasks from hx-db.ts to build per-slice file sets, then set intersection for overlap detection. Pattern: adapt parallel-merge.ts conflict detection to the slice level. Create matching test file.
  - Estimate: 45m
  - Files: src/resources/extensions/hx/slice-parallel-conflict.ts, src/resources/extensions/hx/tests/slice-parallel-conflict.test.ts
  - Verify: npx tsc --noEmit && npm run test:unit 2>&1 | grep -E 'pass|fail' && grep -rn '\bGSD\b\|\bgsd\b' src/resources/extensions/hx/slice-parallel-conflict.ts | wc -l | xargs test 0 -eq
- [ ] **T04: Implement slice-parallel-orchestrator.ts and tests** — Create slice-parallel-orchestrator.ts implementing startSliceParallel(), stopSliceParallel(), getSliceWorkerStatuses(). Uses acquireSliceLock/releaseSliceLock from hx-db.ts. Workers spawn via child_process spawn with HX_SLICE_LOCK=MID/SID env var. No worktree creation — slice workers share the milestone's filesystem. Pattern: simplified parallel-orchestrator.ts (omit worktree creation, budget splitting, monitor overlay). Create matching test file.
  - Estimate: 90m
  - Files: src/resources/extensions/hx/slice-parallel-orchestrator.ts, src/resources/extensions/hx/tests/slice-parallel-orchestrator.test.ts
  - Verify: npx tsc --noEmit && npm run test:unit 2>&1 | grep -E 'pass|fail' && grep -rn '\bGSD\b\|\bgsd\b' src/resources/extensions/hx/slice-parallel-orchestrator.ts | wc -l | xargs test 0 -eq && grep -c 'HX_SLICE_LOCK' src/resources/extensions/hx/slice-parallel-orchestrator.ts | xargs test 0 -lt
