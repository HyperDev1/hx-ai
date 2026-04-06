---
estimated_steps: 8
estimated_files: 4
skills_used: []
---

# T01: Rename gsd_ → hx_ in all prompt files, add registerAlias calls to db-tools.ts, update agent/skill refs

Rename all 53 gsd_ occurrences in 29 prompt .md files to hx_ using a single perl batch substitution. Add 13 registerAlias calls to db-tools.ts so alias tools (hx_save_decision, hx_milestone_plan, etc.) are actually registered. Update worker.md (gsd_scout → hx_scout, gsd_execute_parallel → hx_execute_parallel) and key-rules-gotchas.md (<gsd_paths> → <hx_paths>).

Steps:
1. Run `perl -pi -e 's/gsd_/hx_/g' src/resources/extensions/hx/prompts/*.md` to batch-rename all gsd_ → hx_ in prompt files. This works because every gsd_ tool name maps 1:1 to hx_ by prefix swap.
2. Verify: `grep -rn 'gsd_' src/resources/extensions/hx/prompts/ | wc -l` returns 0.
3. Add 13 registerAlias calls to db-tools.ts after each canonical tool's pi.registerTool call. The alias pairs are: decisionSaveTool→hx_save_decision, requirementUpdateTool→hx_update_requirement, summarySaveTool→hx_save_summary, milestoneGenerateIdTool→hx_generate_milestone_id, planMilestoneTool→hx_milestone_plan, planSliceTool→hx_slice_plan, planTaskTool→hx_task_plan, taskCompleteTool→hx_complete_task, sliceCompleteTool→hx_complete_slice, milestoneCompleteTool→hx_milestone_complete, milestoneValidateTool→hx_milestone_validate, replanSliceTool→hx_slice_replan, reassessRoadmapTool→hx_roadmap_reassess. Use the existing registerAlias helper: `registerAlias(pi, varName, "hx_alias_name", "hx_canonical_name")`.
4. Update `src/resources/agents/worker.md` line 12: change `gsd_scout` → `hx_scout` and `gsd_execute_parallel` → `hx_execute_parallel`.
5. Update `src/resources/skills/create-hx-extension/references/key-rules-gotchas.md`: change `<gsd_paths>` → `<hx_paths>` and `</gsd_paths>` → `</hx_paths>`.
6. Verify: `grep -rn 'gsd_' src/resources/extensions/hx/prompts/ src/resources/extensions/hx/bootstrap/db-tools.ts src/resources/agents/worker.md src/resources/skills/create-hx-extension/references/key-rules-gotchas.md | wc -l` returns 0.

## Inputs

- ``src/resources/extensions/hx/prompts/*.md` — 29 files containing 53 gsd_ tool name references`
- ``src/resources/extensions/hx/bootstrap/db-tools.ts` — registerAlias helper defined but never called; 14 canonical hx_* tools already registered`
- ``src/resources/agents/worker.md` — line 12 references gsd_scout, gsd_execute_parallel`
- ``src/resources/skills/create-hx-extension/references/key-rules-gotchas.md` — <gsd_paths> XML tags`

## Expected Output

- ``src/resources/extensions/hx/prompts/*.md` — all 29 files now reference hx_* tool names, zero gsd_ references`
- ``src/resources/extensions/hx/bootstrap/db-tools.ts` — 13 registerAlias calls added; 27 total tools (14 canonical + 13 aliases)`
- ``src/resources/agents/worker.md` — hx_scout, hx_execute_parallel`
- ``src/resources/skills/create-hx-extension/references/key-rules-gotchas.md` — <hx_paths> XML tags`

## Verification

grep -rn 'gsd_' src/resources/extensions/hx/prompts/ | wc -l  # must be 0
grep -rn 'gsd_' src/resources/extensions/hx/bootstrap/db-tools.ts | wc -l  # must be 0
grep -c 'registerAlias' src/resources/extensions/hx/bootstrap/db-tools.ts  # must be >= 14 (1 def + 13 calls)
grep -c 'gsd_' src/resources/agents/worker.md  # must be 0
grep -c 'gsd_' src/resources/skills/create-hx-extension/references/key-rules-gotchas.md  # must be 0
