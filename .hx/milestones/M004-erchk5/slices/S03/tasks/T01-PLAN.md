---
estimated_steps: 14
estimated_files: 7
skills_used: []
---

# T01: Seed regression tests + DB guard prompt blocks

Add 3 seed regression tests to db-writer.test.ts that exercise the 'Cluster 20' auto-seed path already present in db-writer.ts. Then add DB bash-access guard blocks to system.md and 5 high-risk prompt files.

Steps:
1. Open src/resources/extensions/hx/tests/db-writer.test.ts — find the updateRequirementInDb test group (~L362). Add 3 new tests after the existing 'not found' test:
   - 'updateRequirementInDb — seeds from REQUIREMENTS.md when DB is empty': create tmpDir, write .hx/REQUIREMENTS.md with R001 (active status) using generateRequirementsMd([...]), call updateRequirementInDb('R001', {status:'validated'}, tmpDir), assert no throw and getRequirementById('R001').status === 'validated'
   - 'updateRequirementInDb — seeds all requirements from REQUIREMENTS.md, not just the target': after the seed, also assert getRequirementById('R002') is non-null (if REQUIREMENTS.md had R002)
   - 'updateRequirementInDb — not found throws when ID absent from both DB and REQUIREMENTS.md': write REQUIREMENTS.md with only R001, call updateRequirementInDb('R999', ...), assert throws with 'R999' in message
   IMPORTANT: these tests need to call openDatabase(dbPath) before updateRequirementInDb and closeDatabase() in finally. The tmpDir already has .hx/ from makeTmpDir(). Write REQUIREMENTS.md to path.join(tmpDir, '.hx', 'REQUIREMENTS.md').

2. Add a ## Database Access Safety section to src/resources/extensions/hx/prompts/system.md (after the Hard Rules section, before Execution Heuristics). Content:
   '## Database Access Safety
   Never query `hx.db` directly via bash (`sqlite3 .hx/hx.db ...`). The database uses WAL single-writer discipline — direct bash reads can return stale snapshots and direct writes corrupt state. Use `hx_milestone_status` to inspect milestone/slice/task state instead.'

3. Prepend a DB safety callout to src/resources/extensions/hx/prompts/complete-slice.md (after the UNIT header line, before the working directory section). Same pattern for complete-milestone.md, validate-milestone.md, plan-milestone.md, plan-slice.md.
   Content to add (identical across all 5):
   '> ⚠️ **Database access**: Never run `sqlite3 .hx/hx.db` or query `hx.db` via bash. Use `hx_milestone_status` to inspect milestone/slice/task status. WAL single-writer discipline — direct bash access corrupts state.'
   Place it immediately before '## Working Directory' in each prompt.

## Inputs

- ``src/resources/extensions/hx/tests/db-writer.test.ts` — existing test file to extend`
- ``src/resources/extensions/hx/db-writer.ts` — seed implementation at L370-395 (Cluster 20)`
- ``src/resources/extensions/hx/prompts/system.md` — global HX system prompt`
- ``src/resources/extensions/hx/prompts/complete-slice.md` — prompt file to guard`
- ``src/resources/extensions/hx/prompts/complete-milestone.md` — prompt file to guard`
- ``src/resources/extensions/hx/prompts/validate-milestone.md` — prompt file to guard`
- ``src/resources/extensions/hx/prompts/plan-milestone.md` — prompt file to guard`
- ``src/resources/extensions/hx/prompts/plan-slice.md` — prompt file to guard`

## Expected Output

- ``src/resources/extensions/hx/tests/db-writer.test.ts` — 3 new seed tests added`
- ``src/resources/extensions/hx/prompts/system.md` — Database Access Safety section added`
- ``src/resources/extensions/hx/prompts/complete-slice.md` — DB guard callout added`
- ``src/resources/extensions/hx/prompts/complete-milestone.md` — DB guard callout added`
- ``src/resources/extensions/hx/prompts/validate-milestone.md` — DB guard callout added`
- ``src/resources/extensions/hx/prompts/plan-milestone.md` — DB guard callout added`
- ``src/resources/extensions/hx/prompts/plan-slice.md` — DB guard callout added`

## Verification

node scripts/compile-tests.mjs && node --test dist-test/src/resources/extensions/hx/tests/db-writer.test.js 2>&1 | grep -E 'passed|failed' && grep -q 'Database Access Safety' src/resources/extensions/hx/prompts/system.md && grep -q 'hx_milestone_status' src/resources/extensions/hx/prompts/complete-slice.md
