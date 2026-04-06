---
estimated_steps: 8
estimated_files: 15
skills_used: []
---

# T02: Update all test files and remaining secondary files to hx_ names; run typecheck verification

Update all 12+ test files (78 gsd_ occurrences), plus headless-progress.test.ts, partial-builder.test.ts, and troubleshooting.md. This must happen after T01 because tests assert prompt content that was changed in T01.

Steps:
1. Rewrite tool-naming.test.ts RENAME_MAP from gsd_* to hx_* names. Update the comment on line 3 from 'gsd_concept_action' to 'hx_concept_action'. The 13 canonical/alias pairs become: hx_decision_save/hx_save_decision, hx_requirement_update/hx_update_requirement, hx_summary_save/hx_save_summary, hx_milestone_generate_id/hx_generate_milestone_id, hx_task_complete/hx_complete_task, hx_slice_complete/hx_complete_slice, hx_plan_milestone/hx_milestone_plan, hx_plan_slice/hx_slice_plan, hx_plan_task/hx_task_plan, hx_replan_slice/hx_slice_replan, hx_reassess_roadmap/hx_roadmap_reassess, hx_complete_milestone/hx_milestone_complete, hx_validate_milestone/hx_milestone_validate. Assert 27 tools.
2. Run batch `perl -pi -e 's/gsd_/hx_/g'` on these test files: prompt-contracts.test.ts, plan-slice-prompt.test.ts, journal-query-tool.test.ts, gsd-tools.test.ts, write-intercept.test.ts, complete-milestone.test.ts, complete-slice.test.ts, derive-state-db.test.ts, milestone-id-reservation.test.ts, sqlite-unavailable-gate.test.ts, integration/run-uat.test.ts.
3. Fix write-intercept.test.ts: The assertion `BLOCKED_WRITE_ERROR.includes('gsd_complete_task')` must become `BLOCKED_WRITE_ERROR.includes('hx_complete_task')` — the source constant already uses hx_complete_task (broken before S03).
4. Update secondary files: src/tests/headless-progress.test.ts (2 test description strings), src/resources/extensions/claude-code-cli/tests/partial-builder.test.ts (1 mock tool name gsd_plan_slice → hx_plan_slice), docs/troubleshooting.md (line 345: all 6 tool names).
5. Verify: `grep -rn 'gsd_' src/resources/extensions/hx/tests/ | grep -v gsd_engine | wc -l` returns 0.
6. Run `npm run typecheck:extensions` — must exit 0 with zero errors.

## Inputs

- ``src/resources/extensions/hx/prompts/*.md` — T01 output: all prompt files already use hx_* names (tests assert prompt content)`
- ``src/resources/extensions/hx/bootstrap/db-tools.ts` — T01 output: 27 tools registered with hx_* names`
- ``src/resources/extensions/hx/tests/tool-naming.test.ts` — RENAME_MAP with gsd_* names, expects 27 tools`
- ``src/resources/extensions/hx/tests/prompt-contracts.test.ts` — 33 gsd_ assertions against prompt content`
- ``src/resources/extensions/hx/tests/plan-slice-prompt.test.ts` — 8 gsd_ occurrences`
- ``src/resources/extensions/hx/tests/journal-query-tool.test.ts` — 5 gsd_journal_query references`
- ``src/resources/extensions/hx/tests/gsd-tools.test.ts` — 4 test name strings with gsd_*`
- ``src/resources/extensions/hx/tests/write-intercept.test.ts` — broken assertion: gsd_complete_task should be hx_complete_task`
- ``src/resources/extensions/hx/tests/complete-milestone.test.ts` — 2 gsd_ occurrences`
- ``src/resources/extensions/hx/tests/complete-slice.test.ts` — 1 gsd_slice_complete reference`
- ``src/resources/extensions/hx/tests/derive-state-db.test.ts` — 3 gsd_ comments`
- ``src/resources/extensions/hx/tests/milestone-id-reservation.test.ts` — 1 gsd_ comment`
- ``src/resources/extensions/hx/tests/sqlite-unavailable-gate.test.ts` — 1 gsd_ comment`
- ``src/resources/extensions/hx/tests/integration/run-uat.test.ts` — 3 gsd_ occurrences`
- ``src/tests/headless-progress.test.ts` — 2 gsd_ test description strings`
- ``src/resources/extensions/claude-code-cli/tests/partial-builder.test.ts` — 1 mock tool name gsd_plan_slice`
- ``docs/troubleshooting.md` — line 345 with 6 gsd_* tool name references`

## Expected Output

- ``src/resources/extensions/hx/tests/tool-naming.test.ts` — RENAME_MAP uses hx_* names`
- ``src/resources/extensions/hx/tests/prompt-contracts.test.ts` — all assertions use hx_* patterns`
- ``src/resources/extensions/hx/tests/plan-slice-prompt.test.ts` — all hx_* references`
- ``src/resources/extensions/hx/tests/journal-query-tool.test.ts` — hx_journal_query`
- ``src/resources/extensions/hx/tests/gsd-tools.test.ts` — hx_* test names`
- ``src/resources/extensions/hx/tests/write-intercept.test.ts` — fixed assertion uses hx_complete_task`
- ``src/resources/extensions/hx/tests/complete-milestone.test.ts` — hx_complete_milestone`
- ``src/resources/extensions/hx/tests/complete-slice.test.ts` — hx_slice_complete`
- ``src/resources/extensions/hx/tests/derive-state-db.test.ts` — hx_* comments`
- ``src/resources/extensions/hx/tests/milestone-id-reservation.test.ts` — hx_* comment`
- ``src/resources/extensions/hx/tests/sqlite-unavailable-gate.test.ts` — hx_* comment`
- ``src/resources/extensions/hx/tests/integration/run-uat.test.ts` — hx_summary_save`
- ``src/tests/headless-progress.test.ts` — hx_plan_milestone, hx_decision_save descriptions`
- ``src/resources/extensions/claude-code-cli/tests/partial-builder.test.ts` — hx_plan_slice mock`
- ``docs/troubleshooting.md` — hx_* tool names`

## Verification

grep -rn 'gsd_' src/resources/extensions/hx/tests/ | grep -v gsd_engine | wc -l  # must be 0
grep -rn 'gsd_' src/tests/headless-progress.test.ts src/resources/extensions/claude-code-cli/tests/partial-builder.test.ts docs/troubleshooting.md | wc -l  # must be 0
npm run typecheck:extensions  # must exit 0
