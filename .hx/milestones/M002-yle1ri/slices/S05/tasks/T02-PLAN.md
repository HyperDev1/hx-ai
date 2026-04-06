---
estimated_steps: 18
estimated_files: 6
skills_used: []
---

# T02: Forensics DB completion status + splitCompletedKey helper

Apply 2 upstream forensics accuracy fixes: (1) read completion counts from DB instead of always-0 file read, (2) add `splitCompletedKey()` to handle hook/* prefix keys correctly.

**Steps:**

1. **`src/resources/extensions/hx/types.ts`**: Add `lastCompletedMilestone?: ActiveRef | null` field to the `HXState` interface (same type as `activeMilestone`).

2. **`src/resources/extensions/hx/state.ts`**: In the "all milestones complete" branch (where `isClosedStatus` is true for the last entry), change the return to `activeMilestone: null, lastCompletedMilestone: lastEntry` (or similar shape) instead of setting `activeMilestone: lastEntry`. Also verify imports include `isClosedStatus`.

3. **`src/resources/extensions/hx/forensics.ts`** — DB completion counts:
   - Add `DbCompletionCounts` interface: `{ milestones: number; slices: number; tasks: number }`
   - Add `dbCompletionCounts: DbCompletionCounts | null` field to `ForensicReport` interface
   - Add `getDbCompletionCounts(basePath: string): DbCompletionCounts | null` function that imports `getAllMilestones`, `getMilestoneSlices`, `getSliceTasks` from `hx-db.js` and counts closed-status items using `isClosedStatus` from `status-guards.js`. Wrap in try/catch, return null on error.
   - In `buildForensicReport()`: call `getDbCompletionCounts(basePath)` and set `report.dbCompletionCounts`
   - In `formatReportForPrompt()`: replace the `### Completed Keys: ${report.completedKeys.length}` output with structured DB counts output (show milestones/slices/tasks completed from DB, and still show the raw `completedKeys` array if present)

4. **`src/resources/extensions/hx/forensics.ts`** — splitCompletedKey:
   - Add exported `splitCompletedKey(key: string): { unitType: string; unitId: string } | null` function.
   - Logic: if key starts with `hook/`, the type is the first two segments (`hook/<name>`), id is remainder. Otherwise split at first `/`. Return null for malformed keys with no `/`.
   - Update `detectMissingArtifacts` to use `splitCompletedKey()` instead of `key.indexOf("/")` direct split.

5. **`src/resources/extensions/hx/doctor-runtime-checks.ts`**: Import `splitCompletedKey` from `../forensics.js` and use it instead of `key.indexOf("/")` at line ~122.

6. **Create** `src/resources/extensions/hx/tests/forensics-db-completion.test.ts`: Source-read style test (~96 lines). Assert: (a) `ForensicReport` type has `dbCompletionCounts` field; (b) `getDbCompletionCounts` is exported from forensics.ts source; (c) forensics.ts calls `getAllMilestones` or similar DB import; (d) `formatReportForPrompt` source references DB count fields; (e) state.ts has `lastCompletedMilestone` assignment.

7. **Create** `src/resources/extensions/hx/tests/hook-key-parsing.test.ts`: Runtime test for `splitCompletedKey`. Import the function via dynamic import of compiled forensics. Test: (a) simple `"milestone/M001"` → `{unitType:"milestone", unitId:"M001"}`; (b) hook key `"hook/telegram-progress/M007/S01"` → `{unitType:"hook/telegram-progress", unitId:"M007/S01"}`; (c) malformed `"noSlash"` → null. Also source assertions that `detectMissingArtifacts` uses `splitCompletedKey` and `doctor-runtime-checks.ts` imports from forensics.

**Verify:** After `node scripts/compile-tests.mjs`: run `node --test dist-test/src/resources/extensions/hx/tests/forensics-db-completion.test.js` and `node --test dist-test/src/resources/extensions/hx/tests/hook-key-parsing.test.js`.

## Inputs

- ``src/resources/extensions/hx/types.ts``
- ``src/resources/extensions/hx/state.ts``
- ``src/resources/extensions/hx/forensics.ts``
- ``src/resources/extensions/hx/doctor-runtime-checks.ts``
- ``src/resources/extensions/hx/hx-db.ts``
- ``src/resources/extensions/hx/status-guards.ts``

## Expected Output

- ``src/resources/extensions/hx/types.ts``
- ``src/resources/extensions/hx/state.ts``
- ``src/resources/extensions/hx/forensics.ts``
- ``src/resources/extensions/hx/doctor-runtime-checks.ts``
- ``src/resources/extensions/hx/tests/forensics-db-completion.test.ts``
- ``src/resources/extensions/hx/tests/hook-key-parsing.test.ts``

## Verification

cd /Users/beratcan/Desktop/GithubProjects/hx-ai/.hx/worktrees/M002-yle1ri && npx tsc --noEmit && node scripts/compile-tests.mjs && node --test dist-test/src/resources/extensions/hx/tests/forensics-db-completion.test.js && node --test dist-test/src/resources/extensions/hx/tests/hook-key-parsing.test.js
