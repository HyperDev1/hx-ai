---
id: T01
parent: S03
milestone: M002-yle1ri
provides: []
requires: []
affects: []
key_files: ["src/resources/extensions/hx/workflow-projections.ts", "src/resources/extensions/hx/workflow-reconcile.ts", "src/resources/extensions/hx/worktree-resolver.ts", "src/resources/extensions/hx/milestone-validation-gates.ts", "src/resources/extensions/hx/tools/validate-milestone.ts", "src/resources/extensions/hx/tools/complete-task.ts", "src/resources/extensions/hx/hx-db.ts", "src/resources/extensions/hx/types.ts", "src/resources/extensions/hx/tests/state-corruption-2945.test.ts", "src/resources/extensions/hx/tests/summary-render-parity.test.ts", "src/resources/extensions/hx/tests/workflow-projections.test.ts", "src/resources/extensions/hx/tests/validate-milestone-write-order.test.ts"]
key_decisions: ["Used 'quality_gates' table (not 'gate_results') — verified against actual DB schema", "Skip gate insertion when no slices exist to avoid FK violation; empty-string guard pattern", "paramsToTaskRow builds TaskRow-shaped object making renderSummaryContent reusable from complete-task", "YAML list format ('  - item') required for key_files/key_decisions for parseSummary() compatibility"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "npx tsc --noEmit → clean. node scripts/compile-tests.mjs → 1162 files compiled. node --test dist-test/.../state-corruption-2945.test.js dist-test/.../summary-render-parity.test.js dist-test/.../workflow-projections.test.js dist-test/.../validate-milestone-write-order.test.js → 63 pass, 0 fail."
completed_at: 2026-04-04T12:53:53.575Z
blocker_discovered: false
---

# T01: Port commits c1a80e20d and 82779b24d: fix 4 state corruption bugs and unify SUMMARY render with YAML list format and evidence table

> Port commits c1a80e20d and 82779b24d: fix 4 state corruption bugs and unify SUMMARY render with YAML list format and evidence table

## What Happened
---
id: T01
parent: S03
milestone: M002-yle1ri
key_files:
  - src/resources/extensions/hx/workflow-projections.ts
  - src/resources/extensions/hx/workflow-reconcile.ts
  - src/resources/extensions/hx/worktree-resolver.ts
  - src/resources/extensions/hx/milestone-validation-gates.ts
  - src/resources/extensions/hx/tools/validate-milestone.ts
  - src/resources/extensions/hx/tools/complete-task.ts
  - src/resources/extensions/hx/hx-db.ts
  - src/resources/extensions/hx/types.ts
  - src/resources/extensions/hx/tests/state-corruption-2945.test.ts
  - src/resources/extensions/hx/tests/summary-render-parity.test.ts
  - src/resources/extensions/hx/tests/workflow-projections.test.ts
  - src/resources/extensions/hx/tests/validate-milestone-write-order.test.ts
key_decisions:
  - Used 'quality_gates' table (not 'gate_results') — verified against actual DB schema
  - Skip gate insertion when no slices exist to avoid FK violation; empty-string guard pattern
  - paramsToTaskRow builds TaskRow-shaped object making renderSummaryContent reusable from complete-task
  - YAML list format ('  - item') required for key_files/key_decisions for parseSummary() compatibility
duration: ""
verification_result: passed
completed_at: 2026-04-04T12:53:53.577Z
blocker_discovered: false
---

# T01: Port commits c1a80e20d and 82779b24d: fix 4 state corruption bugs and unify SUMMARY render with YAML list format and evidence table

**Port commits c1a80e20d and 82779b24d: fix 4 state corruption bugs and unify SUMMARY render with YAML list format and evidence table**

## What Happened

Implemented two upstream bugfix commit ports. Fixed 4 state corruption bugs: (1) renderPlanContent/renderRoadmapContent demo fallback now uses 'TBD' not stale full_uat_md, (2) replaySliceComplete() guard added to workflow-reconcile.ts preventing premature slice-done state, (3) best-effort worktree teardown added after successful merge in worktree-resolver.ts, (4) new milestone-validation-gates.ts module writing MV01-MV04 gate rows on validate-milestone. Types extended with GateScope 'milestone' and GateId MV01-MV04. SUMMARY render unified: hx-db.ts gains VerificationEvidenceRow and getVerificationEvidence(), renderSummaryContent rewritten with YAML list format and optional evidence param, renderSummaryProjection passes evidence through, complete-task.ts uses unified renderSummaryContent via paramsToTaskRow(). 4 test files updated/created, 63 tests all pass, typecheck clean.

## Verification

npx tsc --noEmit → clean. node scripts/compile-tests.mjs → 1162 files compiled. node --test dist-test/.../state-corruption-2945.test.js dist-test/.../summary-render-parity.test.js dist-test/.../workflow-projections.test.js dist-test/.../validate-milestone-write-order.test.js → 63 pass, 0 fail.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx tsc --noEmit` | 0 | ✅ pass | 6500ms |
| 2 | `node scripts/compile-tests.mjs` | 0 | ✅ pass | 4200ms |
| 3 | `node --test dist-test/src/resources/extensions/hx/tests/state-corruption-2945.test.js dist-test/src/resources/extensions/hx/tests/summary-render-parity.test.js dist-test/src/resources/extensions/hx/tests/workflow-projections.test.js dist-test/src/resources/extensions/hx/tests/validate-milestone-write-order.test.js` | 0 | ✅ pass (63/63 tests) | 7700ms |


## Deviations

Plan referenced 'gate_results' table; actual table in DB schema is 'quality_gates' — fixed to use correct name. Plan said use milestoneId as fallback slice_id for gate insertion; changed to skip gate insertion entirely when no slices exist (avoids FK violation). insertVerificationEvidence function start line accidentally omitted during edit — corrected. renderSummaryContent What Happened section heading unchanged (plan implied it might change but tests expected original heading).

## Known Issues

None.

## Files Created/Modified

- `src/resources/extensions/hx/workflow-projections.ts`
- `src/resources/extensions/hx/workflow-reconcile.ts`
- `src/resources/extensions/hx/worktree-resolver.ts`
- `src/resources/extensions/hx/milestone-validation-gates.ts`
- `src/resources/extensions/hx/tools/validate-milestone.ts`
- `src/resources/extensions/hx/tools/complete-task.ts`
- `src/resources/extensions/hx/hx-db.ts`
- `src/resources/extensions/hx/types.ts`
- `src/resources/extensions/hx/tests/state-corruption-2945.test.ts`
- `src/resources/extensions/hx/tests/summary-render-parity.test.ts`
- `src/resources/extensions/hx/tests/workflow-projections.test.ts`
- `src/resources/extensions/hx/tests/validate-milestone-write-order.test.ts`


## Deviations
Plan referenced 'gate_results' table; actual table in DB schema is 'quality_gates' — fixed to use correct name. Plan said use milestoneId as fallback slice_id for gate insertion; changed to skip gate insertion entirely when no slices exist (avoids FK violation). insertVerificationEvidence function start line accidentally omitted during edit — corrected. renderSummaryContent What Happened section heading unchanged (plan implied it might change but tests expected original heading).

## Known Issues
None.
