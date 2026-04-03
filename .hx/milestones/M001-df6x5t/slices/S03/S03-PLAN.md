# S03: DB Tool Names & Prompts

**Goal:** All gsd_* tool names in DB registrations, prompt files, test assertions, and secondary references are renamed to hx_*. The 13 missing alias tools are registered with hx_* names.
**Demo:** After this: After this: all gsd_plan_milestone etc. tool registrations are hx_plan_milestone. All 29 prompt files reference hx_* names.

## Tasks
- [x] **T01: Renamed all 53 gsd_ occurrences in 29 prompt files, added 13 registerAlias calls to db-tools.ts, and cleaned gsd_ refs from worker.md and key-rules-gotchas.md** — Rename all 53 gsd_ occurrences in 29 prompt .md files to hx_ using a single perl batch substitution. Add 13 registerAlias calls to db-tools.ts so alias tools (hx_save_decision, hx_milestone_plan, etc.) are actually registered. Update worker.md (gsd_scout → hx_scout, gsd_execute_parallel → hx_execute_parallel) and key-rules-gotchas.md (<gsd_paths> → <hx_paths>).

Steps:
1. Run `perl -pi -e 's/gsd_/hx_/g' src/resources/extensions/hx/prompts/*.md` to batch-rename all gsd_ → hx_ in prompt files. This works because every gsd_ tool name maps 1:1 to hx_ by prefix swap.
2. Verify: `grep -rn 'gsd_' src/resources/extensions/hx/prompts/ | wc -l` returns 0.
3. Add 13 registerAlias calls to db-tools.ts after each canonical tool's pi.registerTool call. The alias pairs are: decisionSaveTool→hx_save_decision, requirementUpdateTool→hx_update_requirement, summarySaveTool→hx_save_summary, milestoneGenerateIdTool→hx_generate_milestone_id, planMilestoneTool→hx_milestone_plan, planSliceTool→hx_slice_plan, planTaskTool→hx_task_plan, taskCompleteTool→hx_complete_task, sliceCompleteTool→hx_complete_slice, milestoneCompleteTool→hx_milestone_complete, milestoneValidateTool→hx_milestone_validate, replanSliceTool→hx_slice_replan, reassessRoadmapTool→hx_roadmap_reassess. Use the existing registerAlias helper: `registerAlias(pi, varName, "hx_alias_name", "hx_canonical_name")`.
4. Update `src/resources/agents/worker.md` line 12: change `gsd_scout` → `hx_scout` and `gsd_execute_parallel` → `hx_execute_parallel`.
5. Update `src/resources/skills/create-hx-extension/references/key-rules-gotchas.md`: change `<gsd_paths>` → `<hx_paths>` and `</gsd_paths>` → `</hx_paths>`.
6. Verify: `grep -rn 'gsd_' src/resources/extensions/hx/prompts/ src/resources/extensions/hx/bootstrap/db-tools.ts src/resources/agents/worker.md src/resources/skills/create-hx-extension/references/key-rules-gotchas.md | wc -l` returns 0.
  - Estimate: 25m
  - Files: src/resources/extensions/hx/prompts/*.md, src/resources/extensions/hx/bootstrap/db-tools.ts, src/resources/agents/worker.md, src/resources/skills/create-hx-extension/references/key-rules-gotchas.md
  - Verify: grep -rn 'gsd_' src/resources/extensions/hx/prompts/ | wc -l  # must be 0
grep -rn 'gsd_' src/resources/extensions/hx/bootstrap/db-tools.ts | wc -l  # must be 0
grep -c 'registerAlias' src/resources/extensions/hx/bootstrap/db-tools.ts  # must be >= 14 (1 def + 13 calls)
grep -c 'gsd_' src/resources/agents/worker.md  # must be 0
grep -c 'gsd_' src/resources/skills/create-hx-extension/references/key-rules-gotchas.md  # must be 0
- [x] **T02: Renamed all gsd_ occurrences in 12 hx test files plus 3 secondary files; typecheck exits 0 with zero errors** — Update all 12+ test files (78 gsd_ occurrences), plus headless-progress.test.ts, partial-builder.test.ts, and troubleshooting.md. This must happen after T01 because tests assert prompt content that was changed in T01.

Steps:
1. Rewrite tool-naming.test.ts RENAME_MAP from gsd_* to hx_* names. Update the comment on line 3 from 'gsd_concept_action' to 'hx_concept_action'. The 13 canonical/alias pairs become: hx_decision_save/hx_save_decision, hx_requirement_update/hx_update_requirement, hx_summary_save/hx_save_summary, hx_milestone_generate_id/hx_generate_milestone_id, hx_task_complete/hx_complete_task, hx_slice_complete/hx_complete_slice, hx_plan_milestone/hx_milestone_plan, hx_plan_slice/hx_slice_plan, hx_plan_task/hx_task_plan, hx_replan_slice/hx_slice_replan, hx_reassess_roadmap/hx_roadmap_reassess, hx_complete_milestone/hx_milestone_complete, hx_validate_milestone/hx_milestone_validate. Assert 27 tools.
2. Run batch `perl -pi -e 's/gsd_/hx_/g'` on these test files: prompt-contracts.test.ts, plan-slice-prompt.test.ts, journal-query-tool.test.ts, gsd-tools.test.ts, write-intercept.test.ts, complete-milestone.test.ts, complete-slice.test.ts, derive-state-db.test.ts, milestone-id-reservation.test.ts, sqlite-unavailable-gate.test.ts, integration/run-uat.test.ts.
3. Fix write-intercept.test.ts: The assertion `BLOCKED_WRITE_ERROR.includes('gsd_complete_task')` must become `BLOCKED_WRITE_ERROR.includes('hx_complete_task')` — the source constant already uses hx_complete_task (broken before S03).
4. Update secondary files: src/tests/headless-progress.test.ts (2 test description strings), src/resources/extensions/claude-code-cli/tests/partial-builder.test.ts (1 mock tool name gsd_plan_slice → hx_plan_slice), docs/troubleshooting.md (line 345: all 6 tool names).
5. Verify: `grep -rn 'gsd_' src/resources/extensions/hx/tests/ | grep -v gsd_engine | wc -l` returns 0.
6. Run `npm run typecheck:extensions` — must exit 0 with zero errors.
  - Estimate: 30m
  - Files: src/resources/extensions/hx/tests/tool-naming.test.ts, src/resources/extensions/hx/tests/prompt-contracts.test.ts, src/resources/extensions/hx/tests/plan-slice-prompt.test.ts, src/resources/extensions/hx/tests/journal-query-tool.test.ts, src/resources/extensions/hx/tests/gsd-tools.test.ts, src/resources/extensions/hx/tests/write-intercept.test.ts, src/resources/extensions/hx/tests/complete-milestone.test.ts, src/resources/extensions/hx/tests/complete-slice.test.ts, src/resources/extensions/hx/tests/derive-state-db.test.ts, src/resources/extensions/hx/tests/milestone-id-reservation.test.ts, src/resources/extensions/hx/tests/sqlite-unavailable-gate.test.ts, src/resources/extensions/hx/tests/integration/run-uat.test.ts, src/tests/headless-progress.test.ts, src/resources/extensions/claude-code-cli/tests/partial-builder.test.ts, docs/troubleshooting.md
  - Verify: grep -rn 'gsd_' src/resources/extensions/hx/tests/ | grep -v gsd_engine | wc -l  # must be 0
grep -rn 'gsd_' src/tests/headless-progress.test.ts src/resources/extensions/claude-code-cli/tests/partial-builder.test.ts docs/troubleshooting.md | wc -l  # must be 0
npm run typecheck:extensions  # must exit 0
