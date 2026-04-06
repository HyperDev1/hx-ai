---
estimated_steps: 1
estimated_files: 2
skills_used: []
---

# T03: Implement slice-parallel-conflict.ts and tests

Create slice-parallel-conflict.ts implementing detectSliceConflicts() and buildSliceFileSets(). Uses getSliceTasks from hx-db.ts to build per-slice file sets, then set intersection for overlap detection. Pattern: adapt parallel-merge.ts conflict detection to the slice level. Create matching test file.

## Inputs

- ``src/resources/extensions/hx/parallel-merge.ts` — file-overlap detection pattern to adapt (milestone-level → slice-level)`
- ``src/resources/extensions/hx/hx-db.ts` — getSliceTasks for task file lists`
- ``src/resources/extensions/hx/slice-parallel-eligibility.ts` — produced by T02; SliceParallelCandidates.fileOverlaps shape to keep consistent`

## Expected Output

- ``src/resources/extensions/hx/slice-parallel-conflict.ts` — new file: SliceConflictResult interface; detectSliceConflicts(basePath, milestoneId, sliceIds[]) → Promise<SliceConflictResult>; buildSliceFileSets(milestoneId, sliceIds[]) → Map<string, string[]>`
- ``src/resources/extensions/hx/tests/slice-parallel-conflict.test.ts` — new file: 3 tests (no overlap → empty conflicts, partial overlap → reported, full overlap → all files listed)`

## Verification

npx tsc --noEmit && npm run test:unit 2>&1 | grep -E 'pass|fail' && grep -rn '\bGSD\b\|\bgsd\b' src/resources/extensions/hx/slice-parallel-conflict.ts | wc -l | xargs test 0 -eq
