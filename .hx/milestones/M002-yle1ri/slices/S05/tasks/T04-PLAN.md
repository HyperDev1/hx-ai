---
estimated_steps: 19
estimated_files: 4
skills_used: []
---

# T04: Doctor false-positive fixes: orphaned worktree, blocker-resolved guard, parsers-legacy second-pass

Apply 3 upstream doctor accuracy fixes eliminating false positives.

**Steps:**

1. **`src/resources/extensions/hx/doctor-git-checks.ts`**:
   - Add `isDoctorArtifactOnly(dirPath: string): boolean` helper function. It reads the directory entries and returns `true` if the only file present is `doctor-history.jsonl` (i.e., no real worktree content). Use `fs.readdirSync(dirPath)` — if length is 0 or the only entry is `"doctor-history.jsonl"`, return true.
   - In the orphaned-worktree detection loop, add guard: `if (isDoctorArtifactOnly(fullPath)) continue;` before pushing the `worktree_directory_orphaned` issue.

2. **`src/resources/extensions/hx/doctor.ts`**:
   - Find the blocker check: the line that reads `if (!replanPath)` (guards `blocker_discovered_no_replan` rule push).
   - Change to `if (!replanPath && !allTasksDone)` — only fire the blocker alert if there's no replan AND tasks are not all done (implicitly resolved).
   - Check what `allTasksDone` is — it should be a pre-computed boolean in that scope. If not named exactly that, find the equivalent boolean that indicates all tasks are complete.

3. **`src/resources/extensions/hx/parsers-legacy.ts`**:
   - Read the current `parsePlan` function implementation to understand the existing task parsing logic.
   - Extract a `parseTaskLines(lines: string[]): TaskEntry[]` helper that uses a `knownIds = new Set<string>()` to deduplicate.
   - Add a second pass: after the first `extractSection("Tasks")` parse, scan the full document body for any task checkbox lines (`- [x]` or `- [ ]`) matching the task ID pattern that weren't captured in the first pass (i.e., tasks appearing after interleaved detail headings like `### T02: ...`). Use `knownIds` to avoid duplicates.
   - Ensure the refactor doesn't change existing behavior for normal plan files — only adds coverage for the edge case.

4. **Create** `src/resources/extensions/hx/tests/integration/doctor-false-positives.test.ts`:
   - Source-read assertions: (a) `isDoctorArtifactOnly` is defined in `doctor-git-checks.ts`; (b) `doctor-git-checks.ts` has the `isDoctorArtifactOnly` guard before `worktree_directory_orphaned`; (c) `doctor.ts` has `!allTasksDone` (or equivalent) in the blocker check condition; (d) `parsers-legacy.ts` has a second-pass scan (check for presence of the `knownIds` Set pattern).
   - Integration test: create a temp directory with only `doctor-history.jsonl`, call `isDoctorArtifactOnly` directly (dynamic import), assert it returns true.
   - Integration test: parse a mock plan string that has a task after a detail heading (`### T02: details\n- [x] T02: something`) and assert both T01 and T02 are extracted.

**Verify:** After `node scripts/compile-tests.mjs`: run `node --test dist-test/src/resources/extensions/hx/tests/integration/doctor-false-positives.test.js`. Also run `npx tsc --noEmit`. Confirm existing `derive-state-db.test.js` still passes (parsers-legacy change regression check).

## Inputs

- ``src/resources/extensions/hx/doctor-git-checks.ts``
- ``src/resources/extensions/hx/doctor.ts``
- ``src/resources/extensions/hx/parsers-legacy.ts``

## Expected Output

- ``src/resources/extensions/hx/doctor-git-checks.ts``
- ``src/resources/extensions/hx/doctor.ts``
- ``src/resources/extensions/hx/parsers-legacy.ts``
- ``src/resources/extensions/hx/tests/integration/doctor-false-positives.test.ts``

## Verification

cd /Users/beratcan/Desktop/GithubProjects/hx-ai/.hx/worktrees/M002-yle1ri && npx tsc --noEmit && node scripts/compile-tests.mjs && node --test dist-test/src/resources/extensions/hx/tests/integration/doctor-false-positives.test.js && node --test dist-test/src/resources/extensions/hx/tests/derive-state-db.test.js
