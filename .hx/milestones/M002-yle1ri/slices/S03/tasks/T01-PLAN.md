---
estimated_steps: 17
estimated_files: 12
skills_used: []
---

# T01: Milestone completion bugs + SUMMARY render unification

Port commits c1a80e20d (4 state corruption bugs) and 82779b24d (SUMMARY render unification) across 8 source files and 4 test files.

Commit c1a80e20d — 4 state corruption bugs:
1. workflow-projections.ts: Change `|| sliceRow.full_uat_md` to `|| "TBD"` at L32-33 and L116 in renderPlanContent/renderRoadmapContent. At L192: remove `taskRow.full_summary_md ||` from the What Happened fallback (becomes just `taskRow.narrative`).
2. workflow-reconcile.ts: Extract `replaySliceComplete()` function that calls `getSliceTasks(milestoneId, sliceId)`, checks all tasks have `status === "done"`, then calls `updateSliceStatus("done")`. Replace the raw `updateSliceStatus("done")` call in the `case "complete_slice"` block with the new function.
3. worktree-resolver.ts: After the `mergeMilestoneToMain` success block in `_mergeWorktreeMode()`, add a secondary `teardownAutoWorktree(originalBase, milestoneId)` in a try/catch best-effort block.
4. Create `src/resources/extensions/hx/milestone-validation-gates.ts` (new 56-line module): import `_getAdapter()` from `./hx-db.js`, define `insertMilestoneValidationGates(milestoneId, sliceId, verdict, validatedAt)` inserting gate IDs `MV01`, `MV02`, `MV03`, `MV04`. In `tools/validate-milestone.ts`: add `import { getMilestoneSlices } from "../hx-db.js"` and `import { insertMilestoneValidationGates } from "../milestone-validation-gates.js"`; after `insertAssessment` in transaction, call `insertMilestoneValidationGates(...)`.
5. types.ts: Extend `GateScope` to `"slice" | "task" | "milestone"` and extend `GateId` to also include `"MV01" | "MV02" | "MV03" | "MV04"`.

Commit 82779b24d — SUMMARY render unification:
1. hx-db.ts: Add `VerificationEvidenceRow` interface export and `getVerificationEvidence(milestoneId, sliceId, taskId): VerificationEvidenceRow[]` function querying the `verification_evidence` table.
2. workflow-projections.ts: Change `renderSummaryContent` signature to accept optional 4th param `evidence?: Array<{command: string; exit_code: number; verdict: string; duration_ms: number}>`. Rewrite body to use YAML list format for key_files/key_decisions (with `  - ` prefix lines), compute `verificationResult` from evidence, add verification/evidence/deviations/known_issues/files sections. In `renderSummaryProjection`, call `getVerificationEvidence(milestoneId, sliceId, taskId)` and pass to `renderSummaryContent`.
3. tools/complete-task.ts: Replace the local `renderSummaryMarkdown(params)` function. Import `renderSummaryContent` from `../workflow-projections.js` and `TaskRow` from `../hx-db.js`. Build a `TaskRow`-shaped object (`paramsToTaskRow(params, completedAt)`) then call `renderSummaryContent(taskRow, params.sliceId, params.milestoneId, params.verificationEvidence)`.

IMPORTANT: The YAML list format in renderSummaryContent MUST use `key_files:\n  - item` format (not `key_files: ["item"]`) — this is what parseSummary() expects.

Tests to write/update:
- NEW: `src/resources/extensions/hx/tests/state-corruption-2945.test.ts` (405-line test, replace `.gsd` → `.hx`, `gsd-db` → `hx-db`, `GSD_STALE_STATE` → `HX_STALE_STATE`)
- UPDATE: `src/resources/extensions/hx/tests/validate-milestone-write-order.test.ts` (insert slice rows before validation for FK constraint)
- UPDATE: `src/resources/extensions/hx/tests/workflow-projections.test.ts` (expect "TBD" not full_summary_md, update YAML format expectations)
- NEW: `src/resources/extensions/hx/tests/summary-render-parity.test.ts` (221-line test, adapt `.gsd`→`.hx` paths)

## Inputs

- `src/resources/extensions/hx/workflow-projections.ts`
- `src/resources/extensions/hx/workflow-reconcile.ts`
- `src/resources/extensions/hx/worktree-resolver.ts`
- `src/resources/extensions/hx/tools/validate-milestone.ts`
- `src/resources/extensions/hx/types.ts`
- `src/resources/extensions/hx/hx-db.ts`
- `src/resources/extensions/hx/tools/complete-task.ts`
- `src/resources/extensions/hx/tests/workflow-projections.test.ts`
- `src/resources/extensions/hx/tests/validate-milestone-write-order.test.ts`

## Expected Output

- `src/resources/extensions/hx/milestone-validation-gates.ts`
- `src/resources/extensions/hx/tests/state-corruption-2945.test.ts`
- `src/resources/extensions/hx/tests/summary-render-parity.test.ts`
- `src/resources/extensions/hx/workflow-projections.ts`
- `src/resources/extensions/hx/workflow-reconcile.ts`
- `src/resources/extensions/hx/worktree-resolver.ts`
- `src/resources/extensions/hx/types.ts`
- `src/resources/extensions/hx/hx-db.ts`
- `src/resources/extensions/hx/tools/complete-task.ts`
- `src/resources/extensions/hx/tools/validate-milestone.ts`

## Verification

npx tsc --noEmit && node --test dist-test/src/resources/extensions/hx/tests/state-corruption-2945.test.js dist-test/src/resources/extensions/hx/tests/summary-render-parity.test.js dist-test/src/resources/extensions/hx/tests/workflow-projections.test.js dist-test/src/resources/extensions/hx/tests/validate-milestone-write-order.test.js

## Observability Impact

getVerificationEvidence() exposes evidence rows via DB. MV01-MV04 gate rows written to gate_results table on milestone validation.
