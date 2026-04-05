# S03: Context Optimization (Masking + Phase Anchors) — UAT

**Milestone:** M003-ttxmyu
**Written:** 2026-04-05T16:17:10.195Z

## UAT Type
UAT mode: runtime-executable

## Preconditions
- Working directory: `/Users/beratcan/Desktop/GithubProjects/hx-ai`
- Node.js + TypeScript build available (`npx tsc`, `node --test`)
- Test suite: `npm run test:unit` (compiles via `scripts/compile-tests.mjs`, runs `dist-test/`)

---

## TC-01: context-masker unit tests pass
**What it proves:** Core masking logic correct — boundary calculation, role-based predicate, bash-result detection, non-mutation of assistant messages.

**Steps:**
1. `cd /Users/beratcan/Desktop/GithubProjects/hx-ai`
2. `node scripts/compile-tests.mjs 2>&1 | tail -3`
3. `node --import ./scripts/dist-test-resolve.mjs --test dist-test/src/resources/extensions/hx/tests/context-masker.test.js 2>&1`

**Expected:** 7 tests pass, 0 fail. Output includes lines for:
- "masks nothing when all messages within keepRecentTurns"
- "masks tool results older than keepRecentTurns"
- "never masks assistant messages"
- "never masks plain user messages"
- "masks bash result user messages"
- "returns same array length after masking"
- "masks toolResult by role not type"

---

## TC-02: phase-anchor unit tests pass
**What it proves:** File path construction, JSON roundtrip, null-return for missing anchors, formatAnchorForPrompt output quality.

**Steps:**
1. `node --import ./scripts/dist-test-resolve.mjs --test dist-test/src/resources/extensions/hx/tests/phase-anchor.test.js 2>&1`

**Expected:** 4 tests pass, 0 fail. Output includes lines for:
- "writePhaseAnchor creates anchor file at correct path"
- "readPhaseAnchor returns the written anchor"
- "readPhaseAnchor returns null when no anchor exists"
- "formatAnchorForPrompt produces non-empty string"

---

## TC-03: ContextManagementConfig present in preferences types
**What it proves:** Preferences integration — all four fields present, KNOWN_PREFERENCE_KEYS includes context_management, HXPreferences has the field.

**Steps:**
1. `grep -n 'ContextManagementConfig\|context_management\|observation_masking\|observation_mask_turns\|compaction_threshold_percent\|tool_result_max_chars' src/resources/extensions/hx/preferences-types.ts`
2. `grep -n 'context_management' src/resources/extensions/hx/preferences.ts`

**Expected:**
- Step 1: At least 7 lines — interface declaration, 4 field lines, KNOWN_PREFERENCE_KEYS entry, HXPreferences field
- Step 2: At least 3 lines — import, re-export, mergePreferences entry

---

## TC-04: Observation masking wired in before_provider_request
**What it proves:** Hook integration — createObservationMask called when auto-mode active, tool-result truncation applied, service tier still runs.

**Steps:**
1. `grep -n 'createObservationMask\|observation_masking\|tool_result_max_chars\|isAutoActive\|service_tier' src/resources/extensions/hx/bootstrap/register-hooks.ts`

**Expected:** Lines show: `createObservationMask` imported and called (2 occurrences), `observation_masking` config check, `tool_result_max_chars` truncation logic, `isAutoActive()` guard, `service_tier` assignment — confirming both context optimization and service tier are present.

---

## TC-05: Phase anchor write triggered in phases.ts
**What it proves:** Auto-mode loop writes phase anchors at research/plan phase boundaries.

**Steps:**
1. `grep -n 'writePhaseAnchor\|anchorPhases\|research-milestone\|research-slice\|plan-milestone\|plan-slice' src/resources/extensions/hx/auto/phases.ts`

**Expected:** Lines show anchor write block guarded by `anchorPhases.has(unitType)` with the four phase types listed, `writePhaseAnchor` called with basePath + mid + anchor object.

---

## TC-06: Phase anchor read injected in all three prompt builders
**What it proves:** Downstream prompt builders receive phase anchor content when available.

**Steps:**
1. `grep -n 'readPhaseAnchor\|formatAnchorForPrompt\|phaseAnchorSection\|researchAnchor\|researchSliceAnchor\|planSliceAnchor' src/resources/extensions/hx/auto-prompts.ts`
2. `grep -n 'phaseAnchorSection' src/resources/extensions/hx/prompts/execute-task.md`

**Expected:**
- Step 1: At least 6 lines — readPhaseAnchor called 3 times (research-milestone, research-slice, plan-slice), formatAnchorForPrompt called 3 times, phaseAnchorSection defined
- Step 2: 1 line showing `{{phaseAnchorSection}}` in the template

---

## TC-07: TypeScript clean across all modified files
**What it proves:** No type errors introduced.

**Steps:**
1. `npx tsc --noEmit 2>&1; echo "exit: $?"`

**Expected:** No output lines before "exit: 0". Any error output is a failure.

---

## TC-08: No GSD tokens in modified/created files
**What it proves:** Naming integrity maintained (R014).

**Steps:**
1. `grep -rn '\bGSD\b\|\bgsd\b' src/resources/extensions/hx/context-masker.ts src/resources/extensions/hx/phase-anchor.ts src/resources/extensions/hx/bootstrap/register-hooks.ts src/resources/extensions/hx/auto/phases.ts src/resources/extensions/hx/auto-prompts.ts src/resources/extensions/hx/prompts/execute-task.md src/resources/extensions/hx/preferences-types.ts src/resources/extensions/hx/preferences.ts; echo "exit: $?"`

**Expected:** No output lines before "exit: 1" (grep returns 1 = no matches found).

---

## TC-09: Full unit test suite — no regressions
**What it proves:** S03 changes do not break any existing tests.

**Steps:**
1. `npm run test:unit 2>&1 | tail -5`

**Expected:** Final line shows `✔ 4168 passed, 0 failed, 5 skipped` (or higher pass count if tests added). Zero failures required.

---

## Edge Cases

**EC-01: createObservationMask with keepRecentTurns=0**
- `createObservationMask(0)` — boundary = 0, all messages masked (i < 0 never, but boundary=0 means everything is older than boundary). Verify mask returns placeholder for all maskable messages.

**EC-02: readPhaseAnchor for non-existent milestone**
- Call `readPhaseAnchor('/tmp/nonexistent', 'M999', 'plan-slice')` — must return null without throwing.

**EC-03: Tool result truncation at exactly maxChars boundary**
- A toolResult block with text length exactly equal to maxChars should NOT be truncated (only `> maxChars` triggers truncation).

**EC-04: Masking does not modify original array**
- `createObservationMask()(messages)` returns a new array — original messages array is unchanged (pure function invariant).
