# S03: Requirements Seed + Slice Context Injection + DB Guard

**Goal:** Add missing regression tests for R024 (requirements seed already in source), add DB bash-access guard blocks to 6 prompt files (R026 layers 1+2), create the hx_milestone_status read-only query tool wired into bootstrap (R026 layer 3), and add 11 milestone-status tests (R026 layer 4). R024 and R025 are already implemented in source — this slice proves them with tests and completes the remaining R026 work.
**Demo:** After this: After this: requirements seed active; context injection in 5 builders; hx_milestone_status callable; 14 new tests pass

## Tasks
- [x] **T01: Added 3 seed regression tests for updateRequirementInDb Cluster-20 path and DB bash-access guard blocks to system.md and 5 high-risk prompt files** — Add 3 seed regression tests to db-writer.test.ts that exercise the 'Cluster 20' auto-seed path already present in db-writer.ts. Then add DB bash-access guard blocks to system.md and 5 high-risk prompt files.

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
  - Estimate: 45m
  - Files: src/resources/extensions/hx/tests/db-writer.test.ts, src/resources/extensions/hx/prompts/system.md, src/resources/extensions/hx/prompts/complete-slice.md, src/resources/extensions/hx/prompts/complete-milestone.md, src/resources/extensions/hx/prompts/validate-milestone.md, src/resources/extensions/hx/prompts/plan-milestone.md, src/resources/extensions/hx/prompts/plan-slice.md
  - Verify: node scripts/compile-tests.mjs && node --test dist-test/src/resources/extensions/hx/tests/db-writer.test.js 2>&1 | grep -E 'passed|failed' && grep -q 'Database Access Safety' src/resources/extensions/hx/prompts/system.md && grep -q 'hx_milestone_status' src/resources/extensions/hx/prompts/complete-slice.md
- [x] **T02: Created hx_milestone_status read-only query tool, wired it into bootstrap, and added 11 passing DB function tests** — Create bootstrap/query-tools.ts with the hx_milestone_status read-only tool, wire it into register-extension.ts, and create tests/milestone-status.test.ts with 11 tests.

Steps:
1. Create src/resources/extensions/hx/bootstrap/query-tools.ts following the journal-tools.ts pattern:
   - Import: Type from @sinclair/typebox, ExtensionAPI from @hyperlab/hx-coding-agent, ensureDbOpen from ./dynamic-tools.js
   - Import DB functions from ../hx-db.js: getActiveMilestoneIdFromDb, getMilestone, getMilestoneSlices, getSliceTasks, getSliceStatusSummary, getSliceTaskCounts
   - Export registerQueryTools(pi: ExtensionAPI): void
   - Register hx_milestone_status with parameters: milestoneId: string (required), sliceId?: string (optional)
   - When milestoneId === 'active': call getActiveMilestoneIdFromDb() to resolve the real ID; if null return 'No active milestone'
   - When milestoneId only: call getMilestoneSlices(milestoneId) → return JSON array of {id, status, title} per slice, plus total/complete/pending counts
   - When milestoneId + sliceId: call getSliceTasks(milestoneId, sliceId) → return JSON array of {id, status, title} per task, plus getSliceTaskCounts counts
   - Always call ensureDbOpen() at the top of execute() — if it returns false, return an error message 'DB not open — run hx command first'
   - Return JSON text (JSON.stringify with null, 2)
   - Wrap in try/catch returning error text on failure
   - NO GSD references anywhere

2. Modify src/resources/extensions/hx/bootstrap/register-extension.ts:
   - Add: import { registerQueryTools } from './query-tools.js'; after registerJournalTools import
   - Add: registerQueryTools(pi); after registerJournalTools(pi) call

3. Create src/resources/extensions/hx/tests/milestone-status.test.ts with 11 tests:
   Import: describe/test from node:test, assert from node:assert/strict, path/os/fs from node:
   Import from ../hx-db.ts: openDatabase, closeDatabase, upsertMilestonePlanning (or use planMilestone), insertSlice-like functions — check what's available for seeding test data. Use direct upsert calls to seed milestone/slice/task rows.
   
   IMPORTANT: The tool execute() function is hard to call directly in tests since it's registered via pi.registerTool. Instead, test the DB functions that back it:
   - Test getActiveMilestoneIdFromDb() returns null when no DB open
   - Test getActiveMilestoneIdFromDb() returns active milestone after inserting one
   - Test getMilestoneSlices() returns slices for a milestone
   - Test getSliceTasks() returns tasks for a milestone+slice
   - Test getSliceStatusSummary() returns id+status array
   - Test getSliceTaskCounts() returns total/done/pending
   - Test getMilestone() returns null for unknown ID
   - Test getActiveMilestoneIdFromDb() returns null when milestone is complete
   - Test getSliceStatusSummary() with mixed statuses
   - Test getSliceTaskCounts() with all-complete tasks
   - Test getSliceTasks() with empty slice returns empty array
   
   Use openDatabase(':memory:') + closeDatabase() pattern. Seed rows using functions available in hx-db.ts: upsertMilestonePlanning, upsertSlicePlanning (check the actual exported function names first before writing tests). Each test uses makeTmpDir-equivalent inline setup with in-memory DB.

4. Run: node scripts/compile-tests.mjs
5. Run: node --test dist-test/src/resources/extensions/hx/tests/milestone-status.test.js
6. Run: npx tsc --noEmit
7. Run: npm run test:unit
  - Estimate: 90m
  - Files: src/resources/extensions/hx/bootstrap/query-tools.ts, src/resources/extensions/hx/bootstrap/register-extension.ts, src/resources/extensions/hx/tests/milestone-status.test.ts
  - Verify: npx tsc --noEmit && node scripts/compile-tests.mjs && node --test dist-test/src/resources/extensions/hx/tests/milestone-status.test.js 2>&1 | grep -E 'passed|failed' && grep -rn 'gsd\|GSD' src/resources/extensions/hx/bootstrap/query-tools.ts | wc -l | grep -q '^0$' && npm run test:unit 2>&1 | tail -5
