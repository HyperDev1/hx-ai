---
estimated_steps: 39
estimated_files: 3
skills_used: []
---

# T02: hx_milestone_status tool + tests + wiring

Create bootstrap/query-tools.ts with the hx_milestone_status read-only tool, wire it into register-extension.ts, and create tests/milestone-status.test.ts with 11 tests.

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

## Inputs

- ``src/resources/extensions/hx/bootstrap/journal-tools.ts` — pattern to follow for tool registration`
- ``src/resources/extensions/hx/bootstrap/dynamic-tools.ts` — ensureDbOpen export`
- ``src/resources/extensions/hx/bootstrap/register-extension.ts` — wiring target`
- ``src/resources/extensions/hx/hx-db.ts` — DB functions: getActiveMilestoneIdFromDb, getMilestone, getMilestoneSlices, getSliceTasks, getSliceStatusSummary, getSliceTaskCounts`
- ``src/resources/extensions/hx/tests/db-writer.test.ts` — test file pattern to follow`

## Expected Output

- ``src/resources/extensions/hx/bootstrap/query-tools.ts` — new hx_milestone_status tool`
- ``src/resources/extensions/hx/bootstrap/register-extension.ts` — registerQueryTools wired`
- ``src/resources/extensions/hx/tests/milestone-status.test.ts` — 11 new DB function tests`

## Verification

npx tsc --noEmit && node scripts/compile-tests.mjs && node --test dist-test/src/resources/extensions/hx/tests/milestone-status.test.js 2>&1 | grep -E 'passed|failed' && grep -rn 'gsd\|GSD' src/resources/extensions/hx/bootstrap/query-tools.ts | wc -l | grep -q '^0$' && npm run test:unit 2>&1 | tail -5

## Observability Impact

hx_milestone_status provides structured JSON inspection of milestone/slice/task status — agents can query project state without bash access to hx.db.
