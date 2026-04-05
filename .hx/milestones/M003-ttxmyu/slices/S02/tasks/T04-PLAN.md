---
estimated_steps: 1
estimated_files: 2
skills_used: []
---

# T04: Implement slice-parallel-orchestrator.ts and tests

Create slice-parallel-orchestrator.ts implementing startSliceParallel(), stopSliceParallel(), getSliceWorkerStatuses(). Uses acquireSliceLock/releaseSliceLock from hx-db.ts. Workers spawn via child_process spawn with HX_SLICE_LOCK=MID/SID env var. No worktree creation — slice workers share the milestone's filesystem. Pattern: simplified parallel-orchestrator.ts (omit worktree creation, budget splitting, monitor overlay). Create matching test file.

## Inputs

- ``src/resources/extensions/hx/parallel-orchestrator.ts` — full milestone orchestrator as structural template (lines 536-600: spawnWorker pattern; lines 47-60: WorkerInfo interface; lines 313-350: getWorkerStatuses)`
- ``src/resources/extensions/hx/hx-db.ts` — acquireSliceLock (line 1755), releaseSliceLock (line 1782), cleanExpiredSliceLocks (line 1808)`
- ``src/resources/extensions/hx/slice-parallel-eligibility.ts` — produced by T02`
- ``src/resources/extensions/hx/slice-parallel-conflict.ts` — produced by T03`
- ``src/resources/extensions/hx/tests/dispatch-guard.test.ts` — insertSlice/setupRepo test helper patterns`

## Expected Output

- ``src/resources/extensions/hx/slice-parallel-orchestrator.ts` — new file: SliceWorkerInfo interface; module-level workers Map<string, SliceWorkerInfo>; startSliceParallel(basePath, milestoneId, sliceIds[]) → Promise<{started, errors}>; stopSliceParallel(basePath, sliceId?) → Promise<void>; getSliceWorkerStatuses() → SliceWorkerInfo[]; internal spawnSliceWorker(basePath, milestoneId, sliceId) → boolean; HX_SLICE_LOCK=MID/SID set on spawned child env; HX_PARALLEL_DEPTH prevents nested spawn`
- ``src/resources/extensions/hx/tests/slice-parallel-orchestrator.test.ts` — new file: 4 tests (lock acquisition success path, lock already held → skip, getSliceWorkerStatuses returns correct state, stopSliceParallel cleans up + releases lock)`

## Verification

npx tsc --noEmit && npm run test:unit 2>&1 | grep -E 'pass|fail' && grep -rn '\bGSD\b\|\bgsd\b' src/resources/extensions/hx/slice-parallel-orchestrator.ts | wc -l | xargs test 0 -eq && grep -c 'HX_SLICE_LOCK' src/resources/extensions/hx/slice-parallel-orchestrator.ts | xargs test 0 -lt

## Observability Impact

Worker PID and state tracked in SliceWorkerInfo; getSliceWorkerStatuses() provides inspection surface. Lock acquisition failures logged (slice skipped when acquireSliceLock returns false).
