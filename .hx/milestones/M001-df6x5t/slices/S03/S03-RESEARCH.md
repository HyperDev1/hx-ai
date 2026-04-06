# S03: DB Tool Names & Prompts — Research

**Date:** 2026-04-03
**Slice:** S03 — DB Tool Names & Prompts
**Requirement:** R003

## Summary

S03 owns R003: all DB tool names and prompt references must change from `gsd_*` to `hx_*`. The DB tool **registrations** (the `name:` field in each tool object in `db-tools.ts`) have already been renamed to `hx_*` as part of an earlier operation — 14 canonical tools are already `hx_*`. However three things remain incomplete:

1. **Alias tools are not registered.** The `registerAlias` helper function exists in `db-tools.ts` but is never called. The `tool-naming.test.ts` expects 27 tools (13 canonical + 13 aliases + 1 gate tool), but only 14 are registered. The alias names need to change from `gsd_*` form (e.g. `gsd_save_decision` → `hx_save_decision`) to `hx_*` form, and `registerAlias` calls need to be added back.

2. **All 29 prompt files still reference `gsd_*` tool names.** 38 prompt files exist; 29 contain `gsd_*` references (53 total occurrences). These must be updated to `hx_*`.

3. **Test files reference `gsd_*` names.** Multiple test files assert the prompts and tool registrations contain `gsd_*` names — these must be updated in lock-step with the prompt files.

The `gsd_engine` binary path strings (in `packages/native/src/native.ts`) and `gsd_parser.rs` references are S04 scope and must NOT be touched here.

## Recommendation

**Rename in two passes:**
- Pass 1: Update all 29 prompt `.md` files with `perl -pi` substitutions (`gsd_` → `hx_`) in a synchronous foreground loop (same pattern established in S01).
- Pass 2: Update test files, agent `.md` files, skill `.md` files, and add missing `registerAlias` calls to `db-tools.ts` using the new `hx_*` alias names.

The test files are tightly coupled to the prompt file content — they assert specific strings like `result.includes("gsd_plan_slice")`. Both must be updated atomically or tests will fail after prompt update.

**The `tool-naming.test.ts` requires full rewrite** of its `RENAME_MAP` to use `hx_*` names. The test also asserts `27` registered tools — once aliases are actually registered, this assertion should still hold (13 canonical + 13 aliases + 1 gate).

## Implementation Landscape

### Key Files

**Primary — DB tool registration:**
- `src/resources/extensions/hx/bootstrap/db-tools.ts` — Contains `registerAlias` function (defined but never called). 14 canonical tools registered with `hx_*` names. Needs `registerAlias(pi, planMilestoneTool, "hx_milestone_plan", "hx_plan_milestone")` calls etc. for all 13 alias pairs.
- `src/resources/extensions/hx/bootstrap/journal-tools.ts` — Already uses `hx_journal_query`. No changes needed.

**Primary — Prompt files (29 files with gsd_ references, 53 occurrences):**
- `src/resources/extensions/hx/prompts/` — All 38 `.md` files. ~29 files contain `gsd_*` tool name references.
  - Highest hit counts: `discuss-headless.md` (7), `discuss.md` (5), `rethink.md` (3), `queue.md` (3), `plan-milestone.md` (3), `complete-slice.md` (3), `complete-milestone.md` (3)
  - All need: `gsd_plan_milestone` → `hx_plan_milestone`, `gsd_summary_save` → `hx_summary_save`, `gsd_decision_save` → `hx_decision_save`, `gsd_plan_slice` → `hx_plan_slice`, `gsd_plan_task` → `hx_plan_task`, `gsd_complete_slice` → `hx_complete_slice`, `gsd_complete_milestone` → `hx_complete_milestone`, `gsd_requirement_update` → `hx_requirement_update`, `gsd_milestone_generate_id` → `hx_milestone_generate_id`, `gsd_task_complete` → `hx_task_complete`, `gsd_slice_complete` → `hx_slice_complete`, `gsd_save_gate_result` → `hx_save_gate_result`, `gsd_validate_milestone` → `hx_validate_milestone`, `gsd_replan_slice` → `hx_replan_slice`, `gsd_reassess_roadmap` → `hx_reassess_roadmap`, `gsd_save_decision` → `hx_save_decision`, `gsd_scout` → `hx_scout`
  - One special case: `system.md` line 115 has `gsd_* tools` (partial pattern) — needs updating to `hx_* tools`
  - `rethink.md` line 20 has "No gsd_* tool API exists" — needs updating
  - `create-hx-extension/references/key-rules-gotchas.md` has `<gsd_paths>` XML tag — this is a section label, should be renamed to `<hx_paths>` 

**Primary — Test files (must update in lock-step with prompts):**
- `src/resources/extensions/hx/tests/tool-naming.test.ts` — Full `RENAME_MAP` rewrite from `gsd_*` to `hx_*`. New canonical names: `hx_decision_save`, `hx_requirement_update`, `hx_summary_save`, `hx_milestone_generate_id`, `hx_task_complete`, `hx_slice_complete`, `hx_plan_milestone`, `hx_plan_slice`, `hx_plan_task`, `hx_replan_slice`, `hx_reassess_roadmap`, `hx_complete_milestone`, `hx_validate_milestone`. New alias names: `hx_save_decision`, `hx_update_requirement`, `hx_save_summary`, `hx_generate_milestone_id`, `hx_complete_task`, `hx_complete_slice`, `hx_milestone_plan`, `hx_slice_plan`, `hx_task_plan`, `hx_slice_replan`, `hx_roadmap_reassess`, `hx_milestone_complete`, `hx_milestone_validate`. Tool count assertion: still 27.
- `src/resources/extensions/hx/tests/prompt-contracts.test.ts` — 33 occurrences of `gsd_*`. All assertions that prompt files contain specific tool names must be updated to `hx_*`.
- `src/resources/extensions/hx/tests/plan-slice-prompt.test.ts` — 8 occurrences. Test description strings + `result.includes("gsd_plan_slice")` etc. must use `hx_*`.
- `src/resources/extensions/hx/tests/journal-query-tool.test.ts` — Test asserts `pi.tools[0].name === "gsd_journal_query"` (5 occurrences). Must update to `"hx_journal_query"`.
- `src/resources/extensions/hx/tests/gsd-tools.test.ts` — Test description strings only (3 comments): `'gsd_decision_save'`, `'gsd_requirement_update'`, `'gsd_summary_save'`. These are `test('...')` name strings. Update to `hx_*` in descriptions.
- `src/resources/extensions/hx/tests/derive-state-db.test.ts` — 3 comment references to `gsd_plan_milestone` / `gsd_milestone_generate_id` in test name strings. Update.
- `src/resources/extensions/hx/tests/write-intercept.test.ts` — 1 occurrence: `assert.ok(BLOCKED_WRITE_ERROR.includes('gsd_complete_task'))`. The `BLOCKED_WRITE_ERROR` constant in `write-intercept.ts` already uses `hx_complete_task` (not `gsd_complete_task`). This test assertion is broken — update to `hx_complete_task`.
- `src/resources/extensions/hx/tests/complete-milestone.test.ts` — 2 occurrences: comment + prompt assertion `"Do NOT call \`gsd_complete_milestone\`"`. The prompt file (`complete-milestone.md`) uses `gsd_complete_milestone` and will be updated; update test in lock-step.
- `src/resources/extensions/hx/tests/complete-slice.test.ts` — 1 occurrence: `'gsd_slice_complete tool'` string literal. Update.
- `src/resources/extensions/hx/tests/milestone-id-reservation.test.ts` — 1 comment. Update.
- `src/resources/extensions/hx/tests/sqlite-unavailable-gate.test.ts` — 1 comment. Update.
- `src/resources/extensions/hx/tests/integration/run-uat.test.ts` — 3 occurrences: test name + assertion against `gsd_summary_save` + comment. Update.

**Secondary — Other non-hx-extension files:**
- `src/resources/agents/worker.md` — Line 12: `gsd_scout`, `gsd_execute_parallel`. Change to `hx_scout`, `hx_execute_parallel`.
- `src/tests/headless-progress.test.ts` — 2 occurrences: `it('summarizes gsd_plan_milestone ...')` and `it('summarizes gsd_decision_save ...')`. These are `it()` description strings only — the actual assertions already use `hx_*` tool names. Update description strings.
- `src/resources/extensions/claude-code-cli/tests/partial-builder.test.ts` — 1 occurrence: `name: "gsd_plan_slice"`. This is a mock tool_use content_block used to test JSON partial streaming. Can be updated to `hx_plan_slice`.
- `docs/troubleshooting.md` — Line 345: mentions `gsd_decision_save`, `gsd_save_decision`, `gsd_requirement_update`, `gsd_update_requirement`, `gsd_summary_save`, `gsd_save_summary`. Update all tool names to `hx_*`.

**Out of S03 scope (do not touch):**
- `packages/native/src/native.ts` — `gsd_engine.*.node` paths (S04 scope)
- `.plans/` directory — Archive docs (S05 scope)
- `CHANGELOG.md` — Historical reference (S05 scope)

### Build Order

1. **Update prompt files first** — `src/resources/extensions/hx/prompts/*.md` (all 29 with `gsd_*`). One `perl -pi` pass renaming all `gsd_` → `hx_` (single prefix pattern works — no ambiguity since all `gsd_*` tool names map 1:1 to `hx_*`).
2. **Add registerAlias calls to db-tools.ts** — Add 13 alias registration calls with `hx_*` alias names AFTER their canonical counterparts.
3. **Update test files in lock-step** — All test files must be updated before running tests or they'll fail asserting `gsd_*` in prompt content.
4. **Update agent/skill/non-test files** — `worker.md`, `key-rules-gotchas.md` (XML tag rename), `headless-progress.test.ts`, `partial-builder.test.ts`, `troubleshooting.md`.

### Verification Approach

```bash
# After all changes:
# 1. Zero gsd_ references in prompt and source files (outside S04 scope)
grep -rn 'gsd_' src/resources/extensions/hx/prompts/ | wc -l   # → 0
grep -rn 'gsd_' src/resources/extensions/hx/bootstrap/db-tools.ts | wc -l  # → 0
grep -rn 'gsd_' src/resources/extensions/hx/tests/ | grep -v gsd_engine | wc -l  # → 0

# 2. TypeScript typecheck still passes
npm run typecheck:extensions

# 3. Count of tools registered (need to check actual alias registration)
# db-tools.ts must register 27 tools: 13 canonical + 13 aliases + 1 gate
```

## Critical Notes

### db-tools.ts alias gap (most important finding)
The `registerAlias` helper is **defined but never called**. The alias tool names must change from `gsd_*` to `hx_*` (e.g., `hx_save_decision` not `gsd_save_decision`). The RENAME_MAP in `tool-naming.test.ts` will need updating to reflect the new alias names.

### test/prompt coupling
`prompt-contracts.test.ts` and `plan-slice-prompt.test.ts` use `assert.match(prompt, /gsd_plan_slice/)` — these must be updated to `/hx_plan_slice/` simultaneously with the prompt files. If prompts are updated first and tests not updated, the test suite will fail immediately.

### write-intercept.test.ts broken assertion
The test asserts `BLOCKED_WRITE_ERROR.includes('gsd_complete_task')` but the actual constant already uses `hx_complete_task`. This test was already broken before S03; S03 should fix it.

### <gsd_paths> XML tag
In `key-rules-gotchas.md`, `<gsd_paths>` and `</gsd_paths>` are XML section tags, not tool names. They should be renamed to `<hx_paths>` and `</hx_paths>`.

### system.md line 115
References `gsd_* tools` as a phrase (not a specific tool). Should become `hx_* tools`.

### rethink.md lines 20-21
`"No gsd_* tool API exists"` — update to `"No hx_* tool API exists"`.

## Complete gsd_ → hx_ Tool Name Mapping

| Old name | New canonical | New alias |
|----------|--------------|-----------|
| `gsd_decision_save` | `hx_decision_save` | `hx_save_decision` |
| `gsd_requirement_update` | `hx_requirement_update` | `hx_update_requirement` |
| `gsd_summary_save` | `hx_summary_save` | `hx_save_summary` |
| `gsd_milestone_generate_id` | `hx_milestone_generate_id` | `hx_generate_milestone_id` |
| `gsd_plan_milestone` | `hx_plan_milestone` | `hx_milestone_plan` |
| `gsd_plan_slice` | `hx_plan_slice` | `hx_slice_plan` |
| `gsd_plan_task` | `hx_plan_task` | `hx_task_plan` |
| `gsd_task_complete` | `hx_task_complete` | `hx_complete_task` |
| `gsd_slice_complete` | `hx_slice_complete` | `hx_complete_slice` |
| `gsd_complete_milestone` | `hx_complete_milestone` | `hx_milestone_complete` |
| `gsd_validate_milestone` | `hx_validate_milestone` | `hx_milestone_validate` |
| `gsd_replan_slice` | `hx_replan_slice` | `hx_slice_replan` |
| `gsd_reassess_roadmap` | `hx_reassess_roadmap` | `hx_roadmap_reassess` |
| `gsd_save_gate_result` | `hx_save_gate_result` | _(no alias)_ |
| `gsd_journal_query` | `hx_journal_query` _(already done)_ | _(no alias)_ |
| `gsd_scout` | `hx_scout` | _(agent ref, not tool)_ |
| `gsd_execute_parallel` | `hx_execute_parallel` | _(agent ref, not tool)_ |
| `gsd_save_decision` | _alias for hx_decision_save_ → `hx_save_decision` |
| `gsd_update_requirement` | _alias_ → `hx_update_requirement` |
| `gsd_save_summary` | _alias_ → `hx_save_summary` |
| `gsd_generate_milestone_id` | _alias_ → `hx_generate_milestone_id` |
| `gsd_complete_task` | _alias_ → `hx_complete_task` |
| `gsd_complete_slice` | _alias_ → `hx_complete_slice` |
| `gsd_milestone_plan` | _alias_ → `hx_milestone_plan` |
| `gsd_slice_plan` | _alias_ → `hx_slice_plan` |
| `gsd_task_plan` | _alias_ → `hx_task_plan` |
| `gsd_slice_replan` | _alias_ → `hx_slice_replan` |
| `gsd_roadmap_reassess` | _alias_ → `hx_roadmap_reassess` |
| `gsd_milestone_complete` | _alias_ → `hx_milestone_complete` |
| `gsd_milestone_validate` | _alias_ → `hx_milestone_validate` |
