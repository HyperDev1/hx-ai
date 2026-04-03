---
id: T01
parent: S03
milestone: M001-df6x5t
provides: []
requires: []
affects: []
key_files: ["src/resources/extensions/hx/bootstrap/db-tools.ts", "src/resources/extensions/hx/prompts/reassess-roadmap.md", "src/resources/extensions/hx/prompts/replan-slice.md", "src/resources/agents/worker.md", "src/resources/skills/create-hx-extension/references/key-rules-gotchas.md"]
key_decisions: ["Used perl -pi batch substitution for atomic rename across all 29 prompt files in one command", "Placed each registerAlias call on the line immediately after its canonical pi.registerTool() call for locality"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "All 5 task-plan verification checks passed: 0 gsd_ in prompts, 0 gsd_ in db-tools.ts, 14 registerAlias lines (1 def + 13 calls), 0 gsd_ in worker.md, 0 gsd_ in key-rules-gotchas.md. npm run typecheck:extensions exits 0 with zero errors."
completed_at: 2026-04-03T20:59:40.754Z
blocker_discovered: false
---

# T01: Renamed all 53 gsd_ occurrences in 29 prompt files, added 13 registerAlias calls to db-tools.ts, and cleaned gsd_ refs from worker.md and key-rules-gotchas.md

> Renamed all 53 gsd_ occurrences in 29 prompt files, added 13 registerAlias calls to db-tools.ts, and cleaned gsd_ refs from worker.md and key-rules-gotchas.md

## What Happened
---
id: T01
parent: S03
milestone: M001-df6x5t
key_files:
  - src/resources/extensions/hx/bootstrap/db-tools.ts
  - src/resources/extensions/hx/prompts/reassess-roadmap.md
  - src/resources/extensions/hx/prompts/replan-slice.md
  - src/resources/agents/worker.md
  - src/resources/skills/create-hx-extension/references/key-rules-gotchas.md
key_decisions:
  - Used perl -pi batch substitution for atomic rename across all 29 prompt files in one command
  - Placed each registerAlias call on the line immediately after its canonical pi.registerTool() call for locality
duration: ""
verification_result: passed
completed_at: 2026-04-03T20:59:40.755Z
blocker_discovered: false
---

# T01: Renamed all 53 gsd_ occurrences in 29 prompt files, added 13 registerAlias calls to db-tools.ts, and cleaned gsd_ refs from worker.md and key-rules-gotchas.md

**Renamed all 53 gsd_ occurrences in 29 prompt files, added 13 registerAlias calls to db-tools.ts, and cleaned gsd_ refs from worker.md and key-rules-gotchas.md**

## What Happened

Executed four-part rename plan: (1) perl batch-replaced all 53 gsd_ occurrences in 29 prompt .md files; (2) added 13 registerAlias calls to db-tools.ts immediately after each canonical pi.registerTool call, covering all alias pairs (hx_save_decision/hx_decision_save, hx_update_requirement/hx_requirement_update, hx_save_summary/hx_summary_save, hx_generate_milestone_id/hx_milestone_generate_id, hx_milestone_plan/hx_plan_milestone, hx_slice_plan/hx_plan_slice, hx_task_plan/hx_plan_task, hx_complete_task/hx_task_complete, hx_complete_slice/hx_slice_complete, hx_milestone_complete/hx_complete_milestone, hx_milestone_validate/hx_validate_milestone, hx_slice_replan/hx_replan_slice, hx_roadmap_reassess/hx_reassess_roadmap); (3) updated worker.md line 12 gsd_scout→hx_scout and gsd_execute_parallel→hx_execute_parallel; (4) changed <gsd_paths> tags to <hx_paths> in key-rules-gotchas.md.

## Verification

All 5 task-plan verification checks passed: 0 gsd_ in prompts, 0 gsd_ in db-tools.ts, 14 registerAlias lines (1 def + 13 calls), 0 gsd_ in worker.md, 0 gsd_ in key-rules-gotchas.md. npm run typecheck:extensions exits 0 with zero errors.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `grep -rn 'gsd_' src/resources/extensions/hx/prompts/ | wc -l` | 0 | ✅ pass | 50ms |
| 2 | `grep -rn 'gsd_' src/resources/extensions/hx/bootstrap/db-tools.ts | wc -l` | 0 | ✅ pass | 30ms |
| 3 | `grep -c 'registerAlias' src/resources/extensions/hx/bootstrap/db-tools.ts` | 0 | ✅ pass (14) | 30ms |
| 4 | `grep -c 'gsd_' src/resources/agents/worker.md` | 1 | ✅ pass (0 matches) | 20ms |
| 5 | `grep -c 'gsd_' src/resources/skills/create-hx-extension/references/key-rules-gotchas.md` | 1 | ✅ pass (0 matches) | 20ms |
| 6 | `npm run typecheck:extensions` | 0 | ✅ pass | 11200ms |


## Deviations

None.

## Known Issues

prompt-contracts.test.ts and tool-naming.test.ts now fail because they assert old gsd_* names — expected at this stage, fixed in T02. test:unit script cannot compile in this worktree (missing esbuild, pre-existing worktree issue).

## Files Created/Modified

- `src/resources/extensions/hx/bootstrap/db-tools.ts`
- `src/resources/extensions/hx/prompts/reassess-roadmap.md`
- `src/resources/extensions/hx/prompts/replan-slice.md`
- `src/resources/agents/worker.md`
- `src/resources/skills/create-hx-extension/references/key-rules-gotchas.md`


## Deviations
None.

## Known Issues
prompt-contracts.test.ts and tool-naming.test.ts now fail because they assert old gsd_* names — expected at this stage, fixed in T02. test:unit script cannot compile in this worktree (missing esbuild, pre-existing worktree issue).
