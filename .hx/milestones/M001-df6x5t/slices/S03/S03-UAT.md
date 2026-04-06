# S03: DB Tool Names & Prompts — UAT

**Milestone:** M001-df6x5t
**Written:** 2026-04-03T21:04:30.882Z

# S03 UAT: DB Tool Names & Prompts

## UAT Type
UAT mode: artifact-driven

## Preconditions
- Working directory: `/Users/beratcan/Desktop/GithubProjects/hx-ai/.hx/worktrees/M001-df6x5t`
- Node.js available, `npm run typecheck:extensions` configured
- S01 and S02 complete

## Test Cases

### TC-01: No gsd_ tool names in prompt files
**Precondition:** 29 prompt .md files exist under src/resources/extensions/hx/prompts/
**Steps:**
1. Run: `grep -rn 'gsd_' src/resources/extensions/hx/prompts/ | wc -l`
**Expected:** Output is `0`

### TC-02: No gsd_ references in db-tools.ts
**Precondition:** db-tools.ts exists at src/resources/extensions/hx/bootstrap/db-tools.ts
**Steps:**
1. Run: `grep -rn 'gsd_' src/resources/extensions/hx/bootstrap/db-tools.ts | wc -l`
**Expected:** Output is `0`

### TC-03: 13 registerAlias calls present in db-tools.ts
**Precondition:** db-tools.ts contains the registerAlias helper definition
**Steps:**
1. Run: `grep -c 'registerAlias' src/resources/extensions/hx/bootstrap/db-tools.ts`
**Expected:** Output is `14` (1 function definition + 13 call sites)
2. Run: `grep 'registerAlias' src/resources/extensions/hx/bootstrap/db-tools.ts`
**Expected:** All 13 alias names present: hx_save_decision, hx_update_requirement, hx_save_summary, hx_generate_milestone_id, hx_milestone_plan, hx_slice_plan, hx_task_plan, hx_complete_task, hx_complete_slice, hx_milestone_complete, hx_milestone_validate, hx_slice_replan, hx_roadmap_reassess

### TC-04: No gsd_ references in worker.md
**Steps:**
1. Run: `grep -c 'gsd_' src/resources/agents/worker.md`
**Expected:** Output is `0`
2. Run: `grep 'hx_scout\|hx_execute_parallel' src/resources/agents/worker.md`
**Expected:** Both hx_scout and hx_execute_parallel appear

### TC-05: No gsd_ references in key-rules-gotchas.md
**Steps:**
1. Run: `grep -c 'gsd_' src/resources/skills/create-hx-extension/references/key-rules-gotchas.md`
**Expected:** Output is `0`
2. Run: `grep '<hx_paths>' src/resources/skills/create-hx-extension/references/key-rules-gotchas.md`
**Expected:** Tag `<hx_paths>` and `</hx_paths>` appear

### TC-06: No gsd_ tool names in hx test files
**Steps:**
1. Run: `grep -rn 'gsd_' src/resources/extensions/hx/tests/ | grep -v gsd_engine | wc -l`
**Expected:** Output is `0`

### TC-07: tool-naming.test.ts uses hx_* RENAME_MAP
**Steps:**
1. Run: `grep 'hx_decision_save\|hx_plan_milestone\|hx_complete_task' src/resources/extensions/hx/tests/tool-naming.test.ts`
**Expected:** All three canonical names appear in RENAME_MAP
2. Run: `grep 'hx_save_decision\|hx_milestone_plan\|hx_complete_milestone' src/resources/extensions/hx/tests/tool-naming.test.ts`
**Expected:** All three alias names appear in RENAME_MAP

### TC-08: No gsd_ in secondary files
**Steps:**
1. Run: `grep -rn 'gsd_' src/tests/headless-progress.test.ts src/resources/extensions/claude-code-cli/tests/partial-builder.test.ts docs/troubleshooting.md | wc -l`
**Expected:** Output is `0`

### TC-09: TypeScript compilation passes
**Steps:**
1. Run: `npm run typecheck:extensions`
**Expected:** Exit code 0, no error output

## Edge Cases

### EC-01: gsd_engine exclusion is intentional
`grep -rn 'gsd_engine' src/resources/extensions/hx/tests/` should return hits — these are references to the native binary name, which is S04 scope and must NOT be renamed in S03.

### EC-02: migrate-gsd-to-hx.ts is untouched (R009)
`grep -c 'gsd' src/resources/extensions/hx/migrate-gsd-to-hx.ts` should return a non-zero count — this file is a backward-compat constraint and must never be modified.
