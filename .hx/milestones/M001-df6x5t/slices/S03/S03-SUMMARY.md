---
id: S03
parent: M001-df6x5t
milestone: M001-df6x5t
provides:
  - All 29 prompt files reference hx_* tool names exclusively
  - db-tools.ts registers 13 alias tools (hx_save_decision, hx_milestone_plan, hx_slice_plan, hx_task_plan, hx_complete_task, hx_complete_slice, hx_milestone_complete, hx_milestone_validate, hx_slice_replan, hx_roadmap_reassess, hx_update_requirement, hx_save_summary, hx_generate_milestone_id)
  - All 12 hx test files assert hx_* tool names
  - typecheck:extensions passes with zero errors
requires:
  - slice: S01
    provides: HX* TypeScript types and hx variable names — S03 files were in a clean state post-S01 with no type conflicts
affects:
  - S04 — gsd_engine literal is still present in test files (intentionally excluded); S04 renames the binary
  - S05 — final grep audit depends on S03 completeness for the prompt/test/tool-name domains
key_files:
  - src/resources/extensions/hx/bootstrap/db-tools.ts
  - src/resources/extensions/hx/tests/tool-naming.test.ts
  - src/resources/extensions/hx/tests/prompt-contracts.test.ts
  - src/resources/extensions/hx/tests/gsd-tools.test.ts
  - src/resources/extensions/hx/tests/write-intercept.test.ts
  - src/resources/extensions/hx/prompts/reassess-roadmap.md
  - src/resources/extensions/hx/prompts/replan-slice.md
  - src/resources/agents/worker.md
  - src/resources/skills/create-hx-extension/references/key-rules-gotchas.md
  - docs/troubleshooting.md
key_decisions:
  - Used perl -pi batch substitution for atomic rename across all 29 prompt files in one command
  - Placed each registerAlias call immediately after its canonical pi.registerTool() call for locality
  - Manually rewrote RENAME_MAP in tool-naming.test.ts; batch rename used for all other test files
  - write-intercept.test.ts broken assertion (gsd_complete_task) was fixed automatically by the batch rename since the source constant already used hx_complete_task
patterns_established:
  - perl -pi batch substitution is reliable for renaming tool name strings across .md files in a worktree when run synchronously
  - registerAlias calls should be placed immediately after their canonical pi.registerTool() call for code locality and readability
  - When test files assert tool names (like tool-naming.test.ts RENAME_MAP), they require semantic rewrite, not just batch substitution
observability_surfaces:
  - none
drill_down_paths:
  - .hx/milestones/M001-df6x5t/slices/S03/tasks/T01-SUMMARY.md
  - .hx/milestones/M001-df6x5t/slices/S03/tasks/T02-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-04-03T21:04:30.882Z
blocker_discovered: false
---

# S03: DB Tool Names & Prompts

**Renamed all gsd_ tool names to hx_ across 29 prompt files, 12+ test files, and db-tools.ts; added 13 registerAlias calls; typecheck passes with zero errors.**

## What Happened

S03 renamed every gsd_ tool name reference to hx_ across four categories of files: (1) 29 prompt .md files (53 occurrences), (2) db-tools.ts tool registrations (13 new registerAlias calls added), (3) 12 hx test files including tool-naming.test.ts RENAME_MAP rewrite, and (4) 3 secondary files (headless-progress.test.ts, partial-builder.test.ts, docs/troubleshooting.md). The worker.md agent prompt was also updated (gsd_scout→hx_scout, gsd_execute_parallel→hx_execute_parallel) and key-rules-gotchas.md had its XML tags corrected (&lt;gsd_paths&gt;→&lt;hx_paths&gt;).

T01 used perl -pi batch substitution for atomic rename across all 29 prompt files in a single command, then manually added the 13 registerAlias calls to db-tools.ts, each placed immediately after its canonical pi.registerTool() call. T02 manually rewrote the RENAME_MAP in tool-naming.test.ts (the most complex file requiring semantic understanding of canonical/alias pairs), then batch-renamed the remaining 11 test files. The write-intercept.test.ts broken assertion was fixed automatically by the batch rename since the source constant already used hx_complete_task.

All verification checks passed across both tasks: zero gsd_ hits in prompts, db-tools.ts, all test files (excluding gsd_engine literal), worker.md, key-rules-gotchas.md, and secondary files. npm run typecheck:extensions exits 0 with zero errors in ~11.6s.

## Verification

8 verification checks run and passed:
1. grep -rn 'gsd_' src/resources/extensions/hx/prompts/ | wc -l → 0 ✅
2. grep -rn 'gsd_' src/resources/extensions/hx/bootstrap/db-tools.ts | wc -l → 0 ✅
3. grep -c 'registerAlias' src/resources/extensions/hx/bootstrap/db-tools.ts → 14 (1 def + 13 calls) ✅
4. grep -c 'gsd_' src/resources/agents/worker.md → 0 ✅
5. grep -c 'gsd_' src/resources/skills/create-hx-extension/references/key-rules-gotchas.md → 0 ✅
6. grep -rn 'gsd_' src/resources/extensions/hx/tests/ | grep -v gsd_engine | wc -l → 0 ✅
7. grep -rn 'gsd_' src/tests/headless-progress.test.ts src/resources/extensions/claude-code-cli/tests/partial-builder.test.ts docs/troubleshooting.md | wc -l → 0 ✅
8. npm run typecheck:extensions → exit 0, zero errors ✅

## Requirements Advanced

- R003 — All 14 canonical tool names and their 13 aliases now use hx_* prefix in both registrations (db-tools.ts) and all 29 prompt files. gsd_* tool names are fully eliminated from this domain.
- R010 — npm run typecheck:extensions exits 0 with zero errors after all S03 renames, confirming no type breakage.

## Requirements Validated

- R003 — grep -rn 'gsd_' src/resources/extensions/hx/prompts/ returns 0; grep -rn 'gsd_' db-tools.ts returns 0; registerAlias count is 14 (1 def + 13 calls); all 12 test files assert hx_* names.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

None. All tasks executed exactly as planned.

## Known Limitations

test:unit cannot compile in this worktree (missing esbuild — pre-existing worktree environment issue, not caused by S03). gsd_engine literal in test files is intentionally excluded from gsd_ checks since it refers to the native binary, which is S04 scope.

## Follow-ups

S04 must rename the Rust binary gsd_engine.*.node → hx_engine.*.node and the TS bindings layer. S05 final grep audit will confirm zero residual gsd_ hits excluding migration code.

## Files Created/Modified

- `src/resources/extensions/hx/bootstrap/db-tools.ts` — Added 13 registerAlias calls for alias tool names (hx_save_decision, hx_milestone_plan, etc.)
- `src/resources/extensions/hx/prompts/*.md (29 files)` — Batch-renamed 53 gsd_ occurrences to hx_ across all prompt files
- `src/resources/extensions/hx/tests/tool-naming.test.ts` — Manually rewrote RENAME_MAP with hx_* canonical/alias pairs; updated assertion to 27 tools
- `src/resources/extensions/hx/tests/prompt-contracts.test.ts` — Batch-renamed gsd_ → hx_ in tool name assertions
- `src/resources/extensions/hx/tests/gsd-tools.test.ts` — Batch-renamed gsd_ → hx_ in tool name assertions
- `src/resources/extensions/hx/tests/write-intercept.test.ts` — Fixed broken assertion (gsd_complete_task → hx_complete_task) via batch rename
- `src/resources/extensions/hx/tests/plan-slice-prompt.test.ts` — Batch-renamed gsd_ → hx_ in test assertions
- `src/resources/extensions/hx/tests/journal-query-tool.test.ts` — Batch-renamed gsd_ → hx_ in test assertions
- `src/resources/extensions/hx/tests/complete-milestone.test.ts` — Batch-renamed gsd_ → hx_ in test assertions
- `src/resources/extensions/hx/tests/complete-slice.test.ts` — Batch-renamed gsd_ → hx_ in test assertions
- `src/resources/extensions/hx/tests/derive-state-db.test.ts` — Batch-renamed gsd_ → hx_ in test assertions
- `src/resources/extensions/hx/tests/milestone-id-reservation.test.ts` — Batch-renamed gsd_ → hx_ in test assertions
- `src/resources/extensions/hx/tests/sqlite-unavailable-gate.test.ts` — Batch-renamed gsd_ → hx_ in test assertions
- `src/resources/extensions/hx/tests/integration/run-uat.test.ts` — Batch-renamed gsd_ → hx_ in test assertions
- `src/resources/agents/worker.md` — Updated gsd_scout → hx_scout, gsd_execute_parallel → hx_execute_parallel
- `src/resources/skills/create-hx-extension/references/key-rules-gotchas.md` — Changed <gsd_paths> → <hx_paths> XML tags
- `src/tests/headless-progress.test.ts` — Updated 2 test description strings with gsd_ → hx_
- `src/resources/extensions/claude-code-cli/tests/partial-builder.test.ts` — Updated mock tool name gsd_plan_slice → hx_plan_slice
- `docs/troubleshooting.md` — Updated 6 tool names on line 345 from gsd_ to hx_
