# S05: Prompts, Diagnostics & Extensions — UAT

**Milestone:** M002-yle1ri
**Written:** 2026-04-04T18:39:47.231Z

## UAT Type

UAT mode: artifact-driven

All S05 deliverables are source file and test suite artifacts. Verification is done by reading source files and running compiled test suites — no browser or live service required.

---

## Preconditions

- Working directory: `/Users/beratcan/Desktop/GithubProjects/hx-ai/.hx/worktrees/M002-yle1ri`
- Tests compiled: `node scripts/compile-tests.mjs` exits 0
- TypeScript: `npx tsc --noEmit` exits 0

---

## Test Cases

### TC-01: Prompt camelCase parameter naming

**What:** execute-task.md and complete-slice.md use camelCase milestoneId, sliceId, taskId (not snake_case)

**Steps:**
1. `grep -n "milestoneId, sliceId, taskId" src/resources/extensions/hx/prompts/execute-task.md`
2. `grep -n "milestoneId, sliceId" src/resources/extensions/hx/prompts/complete-slice.md`
3. Confirm no `milestone_id` or `slice_id` (snake_case) in these files: `grep -c "milestone_id\|slice_id" src/resources/extensions/hx/prompts/execute-task.md src/resources/extensions/hx/prompts/complete-slice.md`

**Expected:** Steps 1–2 return matches; step 3 returns `0` for each file.

---

### TC-02: Write tool instruction for PROJECT.md updates

**What:** complete-slice.md step 13 and complete-milestone.md step 11 explicitly instruct using the `write` tool

**Steps:**
1. `grep -A3 "PROJECT.md" src/resources/extensions/hx/prompts/complete-slice.md | grep -i "write"`
2. `grep -A3 "PROJECT.md" src/resources/extensions/hx/prompts/complete-milestone.md | grep -i "write"`

**Expected:** Both greps return at least one line containing "write".

---

### TC-03: No web_search in any prompt or agent file

**What:** All prompt .md files and agent .md files use search-the-web, not web_search

**Steps:**
1. `grep -rl "web_search" src/resources/extensions/hx/prompts/` — should return nothing
2. `grep -rl "web_search" src/resources/agents/` — should return nothing
3. Run: `node --test dist-test/src/resources/extensions/hx/tests/prompt-tool-names.test.js`

**Expected:** Steps 1–2 return empty; step 3 exits 0 with 2/2 pass.

---

### TC-04: Forensics dedup section ordering

**What:** {{dedupSection}} appears before ## Investigation Protocol in forensics.md

**Steps:**
1. `grep -n "dedupSection\|## Investigation Protocol" src/resources/extensions/hx/prompts/forensics.md`
2. Confirm dedupSection line number < Investigation Protocol line number
3. Run: `node --test dist-test/src/resources/extensions/hx/tests/forensics-dedup.test.js`

**Expected:** dedupSection appears at a lower line number; test exits 0 with 6/6 pass.

---

### TC-05: HXState.lastCompletedMilestone field

**What:** types.ts exports lastCompletedMilestone field on HXState; state.ts sets it in both completion branches

**Steps:**
1. `grep "lastCompletedMilestone" src/resources/extensions/hx/types.ts`
2. `grep -c "lastCompletedMilestone" src/resources/extensions/hx/state.ts` — should be ≥ 2
3. `grep "activeMilestone: null" src/resources/extensions/hx/state.ts` — should appear in completion branches
4. Run: `node --test dist-test/src/resources/extensions/hx/tests/forensics-db-completion.test.js`

**Expected:** All greps return matches; tests exit 0 with 12/12 pass.

---

### TC-06: getDbCompletionCounts and DB imports

**What:** forensics.ts exports getDbCompletionCounts that queries getAllMilestones/getMilestoneSlices/getSliceTasks

**Steps:**
1. `grep "export.*getDbCompletionCounts\|export function getDbCompletionCounts" src/resources/extensions/hx/forensics.ts`
2. `grep "getAllMilestones\|getMilestoneSlices\|getSliceTasks" src/resources/extensions/hx/forensics.ts`
3. `grep "try.*{" src/resources/extensions/hx/forensics.ts | head -5` — confirm try/catch pattern present

**Expected:** All three greps return matches.

---

### TC-07: splitCompletedKey runtime behavior

**What:** splitCompletedKey correctly handles simple keys, hook/* keys, and malformed keys

**Steps:**
1. `grep "export.*splitCompletedKey\|export function splitCompletedKey" src/resources/extensions/hx/forensics.ts`
2. Run: `node --test dist-test/src/resources/extensions/hx/tests/hook-key-parsing.test.js`
3. Confirm: `grep "splitCompletedKey" src/resources/extensions/hx/doctor-runtime-checks.ts`

**Expected:** grep returns export; tests exit 0 with 11/11 pass; doctor-runtime-checks imports and uses splitCompletedKey.

---

### TC-08: Forensics marker persistence

**What:** writeForensicsMarker/readForensicsMarker exported; handleForensics calls writeForensicsMarker; system-context.ts injects hx-forensics

**Steps:**
1. `grep "export.*writeForensicsMarker\|export.*readForensicsMarker" src/resources/extensions/hx/forensics.ts`
2. `grep "ForensicsMarker" src/resources/extensions/hx/forensics.ts | head -5`
3. `grep "hx-forensics" src/resources/extensions/hx/bootstrap/system-context.ts`
4. `grep "readForensicsMarker" src/resources/extensions/hx/bootstrap/system-context.ts`
5. Run: `node --test dist-test/src/resources/extensions/hx/tests/forensics-context-persist.test.js`

**Expected:** All greps return matches; tests exit 0 with 17/17 pass.

---

### TC-09: Doctor false-positive fixes

**What:** isDoctorArtifactOnly guard, !allTasksDone blocker condition, parsers-legacy second-pass

**Steps:**
1. `grep "isDoctorArtifactOnly" src/resources/extensions/hx/doctor-git-checks.ts`
2. `grep "allTasksDone" src/resources/extensions/hx/doctor.ts`
3. `grep "knownIds" src/resources/extensions/hx/parsers-legacy.ts`
4. Run: `node --test dist-test/src/resources/extensions/hx/tests/doctor-false-positives.test.js`
5. Run: `node --test dist-test/src/resources/extensions/hx/tests/derive-state-db.test.js` (regression)

**Expected:** All greps return matches; doctor-false-positives exits 0 with 9/9 pass; derive-state-db exits 0 with 28/28 pass.

---

### TC-10: Extension manifest hooks accuracy

**What:** All 7 extension manifests declare hooks matching their actual pi.on() registrations

**Steps:**
1. Run: `node -e "['hx','async-jobs','bg-shell','browser-tools','context7','google-search','search-the-web'].forEach(e => { const m = require('./src/resources/extensions/' + e + '/extension-manifest.json'); console.log(e, JSON.stringify(m.provides?.hooks)); })"`
2. Verify hx manifest includes: session_start, before_agent_start, tool_call, tool_result, turn_end (among others)
3. Verify async-jobs includes: session_start, session_before_switch, session_shutdown
4. Verify bg-shell includes: session_shutdown, session_start, agent_end, turn_end

**Expected:** All 7 extensions print non-empty hook arrays matching the expected values.

---

### TC-11: Full typecheck

**What:** No TypeScript errors introduced by S05 changes

**Steps:**
1. `npx tsc --noEmit`

**Expected:** Exits 0 with no output (0 errors).

---

## Edge Cases

### EC-01: splitCompletedKey with hook key and no id

Input: `"hook/telegram-progress"` (no slash after hook name)
Expected: returns `null` (not a valid key — hook keys require an id segment)

### EC-02: readForensicsMarker when file missing

Calling `readForensicsMarker("/nonexistent")` must return `null`, not throw.
Verified by hook-key-parsing.test.js TC-03 and forensics-context-persist test suite.

### EC-03: isDoctorArtifactOnly on empty directory

An empty directory (zero files) should return `true` — no real worktree content means it's doctor-artifact-only.
Verified by doctor-false-positives.test.js.

### EC-04: parsers-legacy second-pass deduplication

A plan where T02 appears both in the Tasks section AND after a heading detail section should only produce one T02 entry.
Verified by doctor-false-positives.test.js "does not create duplicates for normal plan" test.
