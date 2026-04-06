# S05: Prompts, Diagnostics & Extensions

**Goal:** Apply 9 upstream bugfix commits covering prompt text corrections, forensics accuracy improvements (DB completion status, dedup ordering, context persistence, key parsing), doctor false-positive fixes, and extension manifest hook updates — all with GSD→HX naming adaptation.
**Demo:** After this: After this: Prompt template corrections, doctor/forensics accuracy improvements, extension manifest updates, and web_search→search-the-web migration are applied. typecheck + tests pass.

## Tasks
- [x] **T01: All 5 test suites pass (50 tests) confirming prompt camelCase params, write-tool instructions, search-the-web migration, and forensics dedup ordering are correctly applied in the worktree** — Apply 4 upstream prompt/agent text fixes and add/extend 5 test files.

**Steps:**

1. In `src/resources/extensions/hx/prompts/execute-task.md`: find the `hx_complete_task` call line (~line 73) that says `milestone_id, slice_id, task_id` and change to `milestoneId, sliceId, taskId`.

2. In `src/resources/extensions/hx/prompts/complete-slice.md`: (a) find the `hx_slice_complete`/`hx_complete_slice` call line (~line 42) that says `milestone_id, slice_id` and change to `milestoneId, sliceId`; (b) find step 13 (update PROJECT.md) and add explicit `write` tool instruction: "use the `write` tool with `path: ".hx/PROJECT.md"` and `content` containing the full updated document".

3. In `src/resources/extensions/hx/prompts/complete-milestone.md`: find step 11 (update PROJECT.md, ~line 59) and add explicit `write` tool instruction matching the pattern above.

4. In 4 discuss prompt files (`discuss-headless.md`, `discuss.md`, `guided-discuss-slice.md`, `guided-discuss-milestone.md`): replace every `web_search` with `search-the-web`.

5. In `src/resources/agents/researcher.md`: replace `web_search` with `search-the-web` in the frontmatter `tools:` line.

6. In `src/resources/extensions/hx/prompts/forensics.md`: move the `{{dedupSection}}` placeholder (currently after Investigation Protocol) to appear BEFORE `## Investigation Protocol`. The section should appear right after any preamble/intro but before the investigation steps.

7. In `src/resources/extensions/hx/forensics.ts`: find the `DEDUP_PROMPT_SECTION` constant and update its title/instructions to be a pre-investigation Decision Gate ("if already-fixed or open-issue match found, skip full investigation").

8. **Create** `src/resources/extensions/hx/tests/prompt-tool-names.test.ts`: scan all `.md` files in `prompts/` dir and all `.md` files in `agents/` dir for literal `web_search` string; assert none are found. Use `fs.readdirSync` + `fs.readFileSync` pattern. Paths: `promptsDir = join(__dirname, "..", "prompts")`, `agentsDir = join(__dirname, "..", "..", "..", "agents")`.

9. **Extend** `src/resources/extensions/hx/tests/prompt-contracts.test.ts`: add 2 tests — (a) execute-task.md uses `milestoneId, sliceId, taskId` (not snake_case); (b) complete-slice.md uses `milestoneId, sliceId` (not snake_case).

10. **Extend** `src/resources/extensions/hx/tests/complete-milestone.test.ts`: add 1 test asserting step 11 mentions the `write` tool and `PROJECT.md`.

11. **Extend** `src/resources/extensions/hx/tests/complete-slice.test.ts`: add 1 test asserting the PROJECT.md update step mentions the `write` tool.

12. **Extend** `src/resources/extensions/hx/tests/forensics-dedup.test.ts`: add 1 test asserting `{{dedupSection}}` appears at an index BEFORE `## Investigation Protocol` in forensics.md content.

**Verify:** Run `node --test dist-test/src/resources/extensions/hx/tests/prompt-tool-names.test.js` and the 4 extended test files after `node scripts/compile-tests.mjs`.
  - Estimate: 45min
  - Files: src/resources/extensions/hx/prompts/execute-task.md, src/resources/extensions/hx/prompts/complete-slice.md, src/resources/extensions/hx/prompts/complete-milestone.md, src/resources/extensions/hx/prompts/discuss-headless.md, src/resources/extensions/hx/prompts/discuss.md, src/resources/extensions/hx/prompts/guided-discuss-slice.md, src/resources/extensions/hx/prompts/guided-discuss-milestone.md, src/resources/extensions/hx/prompts/forensics.md, src/resources/agents/researcher.md, src/resources/extensions/hx/forensics.ts, src/resources/extensions/hx/tests/prompt-tool-names.test.ts, src/resources/extensions/hx/tests/prompt-contracts.test.ts, src/resources/extensions/hx/tests/complete-milestone.test.ts, src/resources/extensions/hx/tests/complete-slice.test.ts, src/resources/extensions/hx/tests/forensics-dedup.test.ts
  - Verify: cd /Users/beratcan/Desktop/GithubProjects/hx-ai/.hx/worktrees/M002-yle1ri && node scripts/compile-tests.mjs && node --test dist-test/src/resources/extensions/hx/tests/prompt-tool-names.test.js && node --test dist-test/src/resources/extensions/hx/tests/prompt-contracts.test.js && node --test dist-test/src/resources/extensions/hx/tests/complete-milestone.test.js && node --test dist-test/src/resources/extensions/hx/tests/complete-slice.test.js && node --test dist-test/src/resources/extensions/hx/tests/forensics-dedup.test.js
- [x] **T02: Added getDbCompletionCounts (DB-backed completion counts), splitCompletedKey (hook/* key parsing), and lastCompletedMilestone field — all with 23 passing tests** — Apply 2 upstream forensics accuracy fixes: (1) read completion counts from DB instead of always-0 file read, (2) add `splitCompletedKey()` to handle hook/* prefix keys correctly.

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
  - Estimate: 60min
  - Files: src/resources/extensions/hx/types.ts, src/resources/extensions/hx/state.ts, src/resources/extensions/hx/forensics.ts, src/resources/extensions/hx/doctor-runtime-checks.ts, src/resources/extensions/hx/tests/forensics-db-completion.test.ts, src/resources/extensions/hx/tests/hook-key-parsing.test.ts
  - Verify: cd /Users/beratcan/Desktop/GithubProjects/hx-ai/.hx/worktrees/M002-yle1ri && npx tsc --noEmit && node scripts/compile-tests.mjs && node --test dist-test/src/resources/extensions/hx/tests/forensics-db-completion.test.js && node --test dist-test/src/resources/extensions/hx/tests/hook-key-parsing.test.js
- [x] **T03: Added ForensicsMarker + writeForensicsMarker/readForensicsMarker to forensics.ts, integrated hx-forensics context injection into system-context.ts, and created 17-test suite — all passing** — Apply upstream fix #2e90c244f: write a marker file after forensics completes so follow-up turns can inject the saved report as context.

**Steps:**

1. First, read `src/resources/extensions/hx/bootstrap/system-context.ts` to understand current `buildBeforeAgentStartResult` shape and existing customType strings (check if `hx-guided-context` or `gsd-guided-context` is used).

2. **`src/resources/extensions/hx/forensics.ts`** — marker support:
   - Add `ForensicsMarker` interface: `{ savedPath: string; content: string; writtenAt: string }`
   - Add `writeForensicsMarker(basePath: string, savedPath: string, content: string): void` — writes marker JSON to `.hx/runtime/forensics-marker.json` (using `hxRoot` → `.hx/runtime/` path)
   - Add `readForensicsMarker(basePath: string): ForensicsMarker | null` — reads and parses the marker file, returns null on any error
   - In `handleForensics()`: at the end (after `sendMessage`), call `writeForensicsMarker(basePath, savedPath, promptContent)` where `savedPath` is the path where the forensics report was saved.

3. **`src/resources/extensions/hx/bootstrap/system-context.ts`** — context injection:
   - Add `unlinkSync` to the `fs` imports (or use `fs.unlinkSync`).
   - Import `readForensicsMarker` from `../forensics.js`.
   - Add `buildForensicsContextInjection(basePath: string): string | null` — calls `readForensicsMarker`, returns formatted context string if marker exists, null otherwise.
   - Add `clearForensicsMarker(basePath: string): void` — calls `unlinkSync` on the marker path, ignores ENOENT.
   - In `buildBeforeAgentStartResult()`: when there is no existing `injection` (i.e., no guided-context injection), check for forensics marker. If found, build a `forensicsInjection` with `customType: "hx-forensics"` and the content from the marker, then clear the marker. Add this injection to the result.
   - Use `hxRoot` (not `gsdRoot`) for the basePath.

4. **Create** `src/resources/extensions/hx/tests/forensics-context-persist.test.ts`: Source-read style test (~129 lines). Assert: (a) `ForensicsMarker` interface exported from forensics.ts; (b) `writeForensicsMarker` and `readForensicsMarker` exported; (c) `handleForensics` source calls `writeForensicsMarker`; (d) system-context.ts imports `readForensicsMarker`; (e) system-context.ts has `hx-forensics` customType string; (f) system-context.ts has `clearForensicsMarker` or equivalent `unlinkSync` call; (g) marker path uses `.hx/runtime/` directory.

**Important naming note:** Check what customType is currently used for guided context in system-context.ts. If it's already `hx-guided-context` (not `gsd-guided-context`), use `hx-forensics` for consistency. If guided context still says `gsd-guided-context`, adapt forensics to `hx-forensics` regardless (forensics is new, guided is legacy).

**Verify:** After `node scripts/compile-tests.mjs`: run `node --test dist-test/src/resources/extensions/hx/tests/forensics-context-persist.test.js`. Also run `npx tsc --noEmit` to confirm no type errors from the new imports.
  - Estimate: 50min
  - Files: src/resources/extensions/hx/forensics.ts, src/resources/extensions/hx/bootstrap/system-context.ts, src/resources/extensions/hx/tests/forensics-context-persist.test.ts
  - Verify: cd /Users/beratcan/Desktop/GithubProjects/hx-ai/.hx/worktrees/M002-yle1ri && npx tsc --noEmit && node scripts/compile-tests.mjs && node --test dist-test/src/resources/extensions/hx/tests/forensics-context-persist.test.js
- [x] **T04: Applied 3 doctor accuracy fixes (isDoctorArtifactOnly guard, !allTasksDone blocker guard, parsers-legacy second-pass) with 9/9 new tests + 28/28 derive-state-db regression tests all passing.** — Apply 3 upstream doctor accuracy fixes eliminating false positives.

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
  - Estimate: 55min
  - Files: src/resources/extensions/hx/doctor-git-checks.ts, src/resources/extensions/hx/doctor.ts, src/resources/extensions/hx/parsers-legacy.ts, src/resources/extensions/hx/tests/integration/doctor-false-positives.test.ts
  - Verify: cd /Users/beratcan/Desktop/GithubProjects/hx-ai/.hx/worktrees/M002-yle1ri && npx tsc --noEmit && node scripts/compile-tests.mjs && node --test dist-test/src/resources/extensions/hx/tests/integration/doctor-false-positives.test.js && node --test dist-test/src/resources/extensions/hx/tests/derive-state-db.test.js
- [x] **T05: Updated hooks arrays in 7 extension manifests and ported T04 doctor fixes to main project to resolve auto-fix gate failure** — Update `provides.hooks` arrays in 7 bundled extension manifests to match their actual `pi.on()` registrations.

**Steps:**

For each manifest, open the file and replace the `"hooks"` array with the correct list:

1. **`src/resources/extensions/hx/extension-manifest.json`**: Set `"hooks"` to `["session_start", "session_switch", "bash_transform", "session_fork", "before_agent_start", "agent_end", "session_before_compact", "session_shutdown", "tool_call", "tool_result", "tool_execution_start", "tool_execution_end", "model_select", "before_provider_request", "turn_end"]`

2. **`src/resources/extensions/async-jobs/extension-manifest.json`**: Add `"session_before_switch"` and `"session_shutdown"` to the existing `"hooks"` array (currently `["session_start"]`).

3. **`src/resources/extensions/bg-shell/extension-manifest.json`**: Add `"session_compact"`, `"session_tree"`, `"session_switch"`, `"before_agent_start"`, `"session_start"`, `"turn_end"`, `"agent_end"`, `"tool_execution_end"` to the existing array (currently `["session_shutdown"]`).

4. **`src/resources/extensions/browser-tools/extension-manifest.json`**: Add `"session_start"` to the existing array (currently `["session_shutdown"]`).

5. **`src/resources/extensions/context7/extension-manifest.json`**: Add `"session_shutdown"` to the existing array (currently `["session_start"]`).

6. **`src/resources/extensions/google-search/extension-manifest.json`**: Add `"session_shutdown"` to the existing array (currently `["session_start"]`).

7. **`src/resources/extensions/search-the-web/extension-manifest.json`**: Add `"session_start"` to the existing array (currently `["model_select", "before_provider_request"]`).

Before editing each file, read it to confirm the current `"hooks"` value matches what the research doc says — if it already has the correct hooks, skip that file.

**Verify:** `npx tsc --noEmit` (JSON changes don't affect types but confirms no regressions). Confirm JSON validity: `node -e "require('./src/resources/extensions/hx/extension-manifest.json')"` etc. for each file.
  - Estimate: 20min
  - Files: src/resources/extensions/hx/extension-manifest.json, src/resources/extensions/async-jobs/extension-manifest.json, src/resources/extensions/bg-shell/extension-manifest.json, src/resources/extensions/browser-tools/extension-manifest.json, src/resources/extensions/context7/extension-manifest.json, src/resources/extensions/google-search/extension-manifest.json, src/resources/extensions/search-the-web/extension-manifest.json
  - Verify: cd /Users/beratcan/Desktop/GithubProjects/hx-ai/.hx/worktrees/M002-yle1ri && node -e "['hx','async-jobs','bg-shell','browser-tools','context7','google-search','search-the-web'].forEach(e => { const m = require('./src/resources/extensions/' + e + '/extension-manifest.json'); console.log(e, JSON.stringify(m.provides?.hooks)); })"
