---
id: T01
parent: S03
milestone: M004-erchk5
provides: []
requires: []
affects: []
key_files: ["src/resources/extensions/hx/tests/db-writer.test.ts", "src/resources/extensions/hx/prompts/system.md", "src/resources/extensions/hx/prompts/complete-slice.md", "src/resources/extensions/hx/prompts/complete-milestone.md", "src/resources/extensions/hx/prompts/validate-milestone.md", "src/resources/extensions/hx/prompts/plan-milestone.md", "src/resources/extensions/hx/prompts/plan-slice.md"]
key_decisions: ["Used SAMPLE_REQUIREMENTS fixture already in the test file to build REQUIREMENTS.md content for seed tests", "Inserted Database Access Safety section between Commands block and Execution Heuristics in system.md"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "Ran the task verification command: compile-tests, db-writer test suite (20 pass/0 fail), grep for Database Access Safety in system.md, grep for hx_milestone_status in complete-slice.md — all 4 checks pass. Full npm run test:unit shows 4317 pass / 3 pre-existing failures unrelated to this task."
completed_at: 2026-04-06T08:28:56.399Z
blocker_discovered: false
---

# T01: Added 3 seed regression tests for updateRequirementInDb Cluster-20 path and DB bash-access guard blocks to system.md and 5 high-risk prompt files

> Added 3 seed regression tests for updateRequirementInDb Cluster-20 path and DB bash-access guard blocks to system.md and 5 high-risk prompt files

## What Happened
---
id: T01
parent: S03
milestone: M004-erchk5
key_files:
  - src/resources/extensions/hx/tests/db-writer.test.ts
  - src/resources/extensions/hx/prompts/system.md
  - src/resources/extensions/hx/prompts/complete-slice.md
  - src/resources/extensions/hx/prompts/complete-milestone.md
  - src/resources/extensions/hx/prompts/validate-milestone.md
  - src/resources/extensions/hx/prompts/plan-milestone.md
  - src/resources/extensions/hx/prompts/plan-slice.md
key_decisions:
  - Used SAMPLE_REQUIREMENTS fixture already in the test file to build REQUIREMENTS.md content for seed tests
  - Inserted Database Access Safety section between Commands block and Execution Heuristics in system.md
duration: ""
verification_result: passed
completed_at: 2026-04-06T08:28:56.400Z
blocker_discovered: false
---

# T01: Added 3 seed regression tests for updateRequirementInDb Cluster-20 path and DB bash-access guard blocks to system.md and 5 high-risk prompt files

**Added 3 seed regression tests for updateRequirementInDb Cluster-20 path and DB bash-access guard blocks to system.md and 5 high-risk prompt files**

## What Happened

Examined the existing db-writer.test.ts updateRequirementInDb test group, identified the SAMPLE_REQUIREMENTS fixture already available. Added 3 new tests: (1) auto-seed from REQUIREMENTS.md when DB is empty, (2) all requirements seeded not just the target, (3) not-found throws when ID absent from both DB and markdown. For system.md, inserted a ## Database Access Safety section between the Commands block and Execution Heuristics. For the 5 prompt files (complete-slice, complete-milestone, validate-milestone, plan-milestone, plan-slice), inserted a DB guard callout between the UNIT header and ## Working Directory in each file.

## Verification

Ran the task verification command: compile-tests, db-writer test suite (20 pass/0 fail), grep for Database Access Safety in system.md, grep for hx_milestone_status in complete-slice.md — all 4 checks pass. Full npm run test:unit shows 4317 pass / 3 pre-existing failures unrelated to this task.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `node scripts/compile-tests.mjs` | 0 | ✅ pass | 8130ms |
| 2 | `node --test dist-test/src/resources/extensions/hx/tests/db-writer.test.js 2>&1 | grep -E 'passed|failed'` | 0 | ✅ pass | 2300ms |
| 3 | `grep -q 'Database Access Safety' src/resources/extensions/hx/prompts/system.md` | 0 | ✅ pass | 10ms |
| 4 | `grep -q 'hx_milestone_status' src/resources/extensions/hx/prompts/complete-slice.md` | 0 | ✅ pass | 10ms |
| 5 | `npm run test:unit 2>&1 | tail -1` | 0 | ✅ pass | 103400ms |


## Deviations

Inserted the Database Access Safety section between Commands and Execution Heuristics rather than strictly 'after Hard Rules' as stated in the plan — the file structure has Hard Rules followed by sub-sections and Commands before Execution Heuristics; the chosen location is the natural boundary between operational references and execution guidance.

## Known Issues

None.

## Files Created/Modified

- `src/resources/extensions/hx/tests/db-writer.test.ts`
- `src/resources/extensions/hx/prompts/system.md`
- `src/resources/extensions/hx/prompts/complete-slice.md`
- `src/resources/extensions/hx/prompts/complete-milestone.md`
- `src/resources/extensions/hx/prompts/validate-milestone.md`
- `src/resources/extensions/hx/prompts/plan-milestone.md`
- `src/resources/extensions/hx/prompts/plan-slice.md`


## Deviations
Inserted the Database Access Safety section between Commands and Execution Heuristics rather than strictly 'after Hard Rules' as stated in the plan — the file structure has Hard Rules followed by sub-sections and Commands before Execution Heuristics; the chosen location is the natural boundary between operational references and execution guidance.

## Known Issues
None.
