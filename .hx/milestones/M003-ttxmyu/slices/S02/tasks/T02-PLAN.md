---
estimated_steps: 1
estimated_files: 2
skills_used: []
---

# T02: Implement slice-parallel-eligibility.ts and tests

Create slice-parallel-eligibility.ts implementing analyzeSliceParallelEligibility() and formatSliceEligibilityReport(). Uses getMilestoneSlices + getSliceTasks from hx-db.ts. Pattern: adapt parallel-eligibility.ts (milestone-level) to the slice level. Create matching test file covering 4 scenarios.

## Inputs

- ``src/resources/extensions/hx/parallel-eligibility.ts` — milestone-level eligibility template to adapt (analyzeParallelEligibility → analyzeSliceParallelEligibility, milestones → slices)`
- ``src/resources/extensions/hx/hx-db.ts` — getMilestoneSlices (line ~1620), getSliceTasks (available), acquireSliceLock (line 1755) for type reference`
- ``src/resources/extensions/hx/tests/capability-router.test.ts` — pattern for DB-backed test setup with insertSlice/insertTask helpers`

## Expected Output

- ``src/resources/extensions/hx/slice-parallel-eligibility.ts` — new file: SliceEligibilityResult and SliceParallelCandidates interfaces; analyzeSliceParallelEligibility(basePath, milestoneId) → SliceParallelCandidates; formatSliceEligibilityReport(candidates) → string`
- ``src/resources/extensions/hx/tests/slice-parallel-eligibility.test.ts` — new file: 4 tests (single eligible slice, two independent slices both eligible, dependent slices only first eligible, file overlap detection)`

## Verification

npx tsc --noEmit && npm run test:unit 2>&1 | grep -E 'pass|fail' && grep -rn '\bGSD\b\|\bgsd\b' src/resources/extensions/hx/slice-parallel-eligibility.ts | wc -l | xargs test 0 -eq
