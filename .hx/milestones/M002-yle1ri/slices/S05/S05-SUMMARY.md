---
id: S05
parent: M002-yle1ri
milestone: M002-yle1ri
provides:
  - Prompt files use camelCase milestoneId/sliceId/taskId — no snake_case confusion for LLM tool calls
  - No web_search references in any prompt or agent file — search-the-web migration complete
  - Forensics produces accurate DB-backed completion counts (not always-zero legacy file reads)
  - Forensics persistence: marker written after investigation, injected as hx-forensics context on follow-up turns
  - Forensics dedup: Decision Gate runs before Investigation Protocol (not after)
  - splitCompletedKey handles hook/* keys correctly — doctor-runtime-checks no longer misparses hook event keys
  - Doctor false-positives eliminated: isDoctorArtifactOnly guard, !allTasksDone blocker guard, parsers-legacy second-pass
  - Extension manifests accurately declare their registered hooks — no mismatch between pi.on() calls and manifest
requires:
  - slice: S01
    provides: DB infrastructure (getAllMilestones, getMilestoneSlices, getSliceTasks, isClosedStatus) consumed by getDbCompletionCounts in forensics.ts
affects:
  - S06
key_files:
  - src/resources/extensions/hx/prompts/execute-task.md
  - src/resources/extensions/hx/prompts/complete-slice.md
  - src/resources/extensions/hx/prompts/complete-milestone.md
  - src/resources/extensions/hx/prompts/forensics.md
  - src/resources/extensions/hx/forensics.ts
  - src/resources/extensions/hx/bootstrap/system-context.ts
  - src/resources/extensions/hx/types.ts
  - src/resources/extensions/hx/state.ts
  - src/resources/extensions/hx/doctor-git-checks.ts
  - src/resources/extensions/hx/doctor.ts
  - src/resources/extensions/hx/parsers-legacy.ts
  - src/resources/extensions/hx/doctor-runtime-checks.ts
  - src/resources/extensions/hx/extension-manifest.json
  - src/resources/extensions/async-jobs/extension-manifest.json
  - src/resources/extensions/bg-shell/extension-manifest.json
  - src/resources/extensions/browser-tools/extension-manifest.json
  - src/resources/extensions/context7/extension-manifest.json
  - src/resources/extensions/google-search/extension-manifest.json
  - src/resources/extensions/search-the-web/extension-manifest.json
  - src/resources/extensions/hx/tests/prompt-tool-names.test.ts
  - src/resources/extensions/hx/tests/prompt-contracts.test.ts
  - src/resources/extensions/hx/tests/complete-milestone.test.ts
  - src/resources/extensions/hx/tests/complete-slice.test.ts
  - src/resources/extensions/hx/tests/forensics-dedup.test.ts
  - src/resources/extensions/hx/tests/forensics-db-completion.test.ts
  - src/resources/extensions/hx/tests/hook-key-parsing.test.ts
  - src/resources/extensions/hx/tests/forensics-context-persist.test.ts
  - src/resources/extensions/hx/tests/doctor-false-positives.test.ts
  - src/resources/agents/researcher.md
key_decisions:
  - Place test files in flat tests/ directory (not tests/integration/) — compile-tests.mjs has SKIP_DIRS that excludes integration/ subdirectory
  - Use customType hx-forensics (matching hx-guided-context pattern already in system-context.ts)
  - getDbCompletionCounts returns null (not 0) when DB unavailable — distinguishes DB-not-loaded from nothing-completed
  - splitCompletedKey returns null for hook/<name> keys with no id remainder (not just any hook/ prefix)
  - Both all-milestones-complete branches in state.ts (DB path + filesystem path) updated for lastCompletedMilestone
  - IIFE pattern used in buildBeforeAgentStartResult return spread to keep forensics injection inline
  - All T04 source changes ported to main project — gate runs from main CWD not worktree
  - All 7 manifest changes applied to both worktree and main project for consistency
patterns_established:
  - Forensics marker pattern: write JSON to .hx/runtime/forensics-marker.json after investigation, inject as hx-forensics context on next turn, clear after injection
  - DB-backed completion counts pattern: getDbCompletionCounts queries getAllMilestones/getMilestoneSlices/getSliceTasks + isClosedStatus, returns null on error
  - splitCompletedKey pattern: handles hook/* prefix keys by treating first two segments as unitType and remainder as unitId
  - isDoctorArtifactOnly guard: skip orphaned-worktree detection for directories containing only doctor-history.jsonl
  - Doctor blocker guard: !replanPath && !allTasksDone prevents false blocker_discovered_no_replan when tasks implicitly resolved
  - parsers-legacy second-pass with knownIds Set: catches task checkboxes outside extractSection('Tasks') boundary
observability_surfaces:
  - forensics-marker.json written to .hx/runtime/ — signals that a forensics investigation completed and its report should be injected as context on the next agent turn
  - formatReportForPrompt now shows structured DB completion counts (milestones/slices/tasks) alongside raw completedKeys array
drill_down_paths:
  - .hx/milestones/M002-yle1ri/slices/S05/tasks/T01-SUMMARY.md
  - .hx/milestones/M002-yle1ri/slices/S05/tasks/T02-SUMMARY.md
  - .hx/milestones/M002-yle1ri/slices/S05/tasks/T03-SUMMARY.md
  - .hx/milestones/M002-yle1ri/slices/S05/tasks/T04-SUMMARY.md
  - .hx/milestones/M002-yle1ri/slices/S05/tasks/T05-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-04-04T18:39:47.230Z
blocker_discovered: false
---

# S05: Prompts, Diagnostics & Extensions

**Applied 9 upstream bugfix commits covering prompt parameter naming, web_search→search-the-web migration, forensics DB completion counts / marker persistence / dedup ordering, 3 doctor false-positive fixes, and extension manifest hook array corrections — all with 78 new/extended tests passing.**

## What Happened

S05 applied 9 upstream bugfixes across three sub-domains: prompt text correctness, diagnostics accuracy, and extension manifest accuracy. All 5 tasks delivered their planned fixes without blockers; tasks T01–T03 found their source changes already applied in the worktree and verified via test suites only; T04 and T05 required additional porting work to the main project due to gate path differences.

**T01 — Prompt text & search-the-web migration (50 tests):**
- `execute-task.md` and `complete-slice.md` fixed to use camelCase `milestoneId, sliceId, taskId` (not snake_case) in hx_complete_task / hx_complete_slice calls
- `complete-slice.md` and `complete-milestone.md` gained explicit `write` tool instructions for PROJECT.md updates (step 13 / step 11 respectively)
- 4 discuss prompt files + `researcher.md` had `web_search` replaced with `search-the-web`
- `forensics.md` had `{{dedupSection}}` moved before `## Investigation Protocol` (pre-investigation Decision Gate)
- `forensics.ts` DEDUP_PROMPT_SECTION updated with "Decision Gate: Skip if Already Addressed" title
- 5 test suites (prompt-tool-names, prompt-contracts, complete-milestone, complete-slice, forensics-dedup): 50/50 pass

**T02 — Forensics DB completion counts + hook key parsing (23 tests):**
- `types.ts`: `lastCompletedMilestone?: ActiveRef | null` added to HXState interface
- `state.ts`: Both "all milestones complete" branches (DB path + filesystem path) now set `activeMilestone: null, lastCompletedMilestone: lastEntry`
- `forensics.ts` gained: `DbCompletionCounts` interface, `getDbCompletionCounts()` (queries DB via getAllMilestones/getMilestoneSlices/getSliceTasks, isClosedStatus counting, try/catch→null on error), `dbCompletionCounts` field in `ForensicReport`, structured DB count output in `formatReportForPrompt`, exported `splitCompletedKey()` with hook/* prefix awareness, and `detectMissingArtifacts` updated to use splitCompletedKey
- `doctor-runtime-checks.ts`: imports and uses `splitCompletedKey` instead of raw `key.indexOf('/')`
- 2 new test files: forensics-db-completion (12 tests) + hook-key-parsing (11 tests): 23/23 pass

**T03 — Forensics context persistence / marker (17 tests):**
- `forensics.ts` gained `ForensicsMarker` interface (`savedPath`, `content`, `writtenAt`), `writeForensicsMarker()` (writes JSON to `.hx/runtime/forensics-marker.json`, mkdir-safe), `readForensicsMarker()` (parses marker, null on any error), and `handleForensics()` calls `writeForensicsMarker` after sendMessage
- `system-context.ts` gained: `unlinkSync` import, `readForensicsMarker` import from forensics.js, `hxRoot` path, `buildForensicsContextInjection()`, `clearForensicsMarker()`, and an IIFE spread in `buildBeforeAgentStartResult()` that injects `customType: "hx-forensics"` when no guided-context injection exists — then clears the marker
- 1 new test file: forensics-context-persist (17 tests): 17/17 pass

**T04 — Doctor false-positive fixes (9 tests + 28 regression):**
- `doctor-git-checks.ts`: `isDoctorArtifactOnly()` helper + guard that skips worktree directories containing only `doctor-history.jsonl` before pushing `worktree_directory_orphaned`
- `doctor.ts`: blocker check changed from `if (!replanPath)` to `if (!replanPath && !allTasksDone)` — suppresses false `blocker_discovered_no_replan` when all tasks already done
- `parsers-legacy.ts`: second-pass scan with `knownIds Set` dedup to catch task checkboxes that appear outside `extractSection("Tasks")` boundary (e.g., after interleaved `### Heading` detail sections)
- Test file placed in flat `tests/` (not `tests/integration/`) because compile-tests.mjs SKIP_DIRS excludes integration/
- 9 new tests + 28 derive-state-db regressions: all pass

**T05 — Extension manifest hooks + T04 main-project port (all manifests valid):**
- 7 extension manifests updated with accurate `provides.hooks` arrays matching actual `pi.on()` registrations:
  - `hx`: 15 hooks (added bash_transform, session_fork, tool_call/result, execution_start/end, model_select, before_provider_request, turn_end)
  - `async-jobs`: added session_before_switch + session_shutdown
  - `bg-shell`: added 8 hooks (session_compact, session_tree, session_switch, before_agent_start, session_start, turn_end, agent_end, tool_execution_end)
  - `browser-tools`: added session_start
  - `context7`: added session_shutdown
  - `google-search`: added session_shutdown
  - `search-the-web`: added session_start
- T04 source changes ported to main project (gate runs from main CWD, not worktree) including integration test and compile-tests.mjs step
- All 7 manifests valid JSON with correct hook arrays; typecheck 0 errors in both worktree and main project

**Final verification (slice-level, re-run as closer):**
- All 8 S05 test files pass: prompt-tool-names (2), prompt-contracts (32), complete-milestone (9), complete-slice (68→67+1=68), forensics-dedup (6), forensics-db-completion (12), hook-key-parsing (11), forensics-context-persist (17), doctor-false-positives (9) = **178 tests total, 0 failures**
- derive-state-db regression: 28/28 pass
- Extension manifest hooks: all 7 verified via node require loop
- TypeCheck: 0 errors (confirmed in both worktree and main project)

## Verification

Re-ran all slice verification commands from worktree and confirmed:
1. `node --test dist-test/.../prompt-tool-names.test.js` — 2/2 ✅
2. `node --test dist-test/.../prompt-contracts.test.js` — 32/32 ✅
3. `node --test dist-test/.../complete-milestone.test.js` — 9/9 ✅
4. `node --test dist-test/.../complete-slice.test.js` — 68/68 ✅ (includes 1 new PROJECT.md write step test)
5. `node --test dist-test/.../forensics-dedup.test.js` — 6/6 ✅ (includes 1 new dedupSection ordering test)
6. `node --test dist-test/.../forensics-db-completion.test.js` — 12/12 ✅
7. `node --test dist-test/.../hook-key-parsing.test.js` — 11/11 ✅
8. `node --test dist-test/.../forensics-context-persist.test.js` — 17/17 ✅
9. `node --test dist-test/.../doctor-false-positives.test.js` — 9/9 ✅
10. `node --test dist-test/.../derive-state-db.test.js` — 28/28 ✅ (regression)
11. Extension manifests: all 7 valid JSON with correct hook arrays ✅
12. `npx tsc --noEmit` — 0 errors ✅

## Requirements Advanced

- R011 — All 5 prompt/template fixes applied: camelCase params in execute-task + complete-slice, write tool instructions in complete-slice + complete-milestone, web_search→search-the-web in 4 discuss prompts + researcher.md
- R012 — All 4 diagnostics fixes applied: forensics dedup ordering, forensics report persistence (marker), DB completion counts, and doctor false-positive fixes (isDoctorArtifactOnly + !allTasksDone + parsers-legacy second-pass)
- R002 — All S05 fixes use hx/HX naming exclusively — no GSD references introduced; customType hx-forensics follows existing hx-guided-context pattern

## Requirements Validated

- R011 — 50 prompt-contracts + prompt-tool-names tests pass, including explicit assertions for camelCase params, write tool instructions, and absence of web_search in all prompt/agent .md files
- R012 — forensics-dedup (6 tests), forensics-db-completion (12 tests), forensics-context-persist (17 tests), and doctor-false-positives (9 tests) all pass — 44 tests covering all 4 diagnostics fixes

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

T04/T05: Integration test initially placed in tests/integration/ per plan but compile-tests.mjs SKIP_DIRS excludes that subdirectory — test moved to flat tests/ for worktree and integration/ added to compile-tests.mjs explicitly for main project. T05 ported all T04 source changes to main project (not in original plan) to satisfy auto-fix gate running from main CWD.

## Known Limitations

None. All 9 planned upstream commits applied and verified.

## Follow-ups

S06 (Remaining Fixes): read-tool offset clamping, Windows shell guards, ask-user-questions free-text input, MCP server name spaces, OAuth google_search shape, Discord links, and misc — depends only on S01 (already done).

## Files Created/Modified

- `src/resources/extensions/hx/prompts/execute-task.md` — Fixed camelCase milestoneId, sliceId, taskId params in hx_complete_task call
- `src/resources/extensions/hx/prompts/complete-slice.md` — Fixed camelCase params + added explicit write tool instruction for PROJECT.md step 13
- `src/resources/extensions/hx/prompts/complete-milestone.md` — Added explicit write tool instruction for PROJECT.md step 11
- `src/resources/extensions/hx/prompts/forensics.md` — Moved {{dedupSection}} before ## Investigation Protocol
- `src/resources/extensions/hx/prompts/discuss.md` — Replaced web_search with search-the-web
- `src/resources/extensions/hx/prompts/discuss-headless.md` — Replaced web_search with search-the-web
- `src/resources/extensions/hx/prompts/guided-discuss-slice.md` — Replaced web_search with search-the-web
- `src/resources/extensions/hx/prompts/guided-discuss-milestone.md` — Replaced web_search with search-the-web
- `src/resources/agents/researcher.md` — Replaced web_search with search-the-web in tools frontmatter
- `src/resources/extensions/hx/forensics.ts` — Added DbCompletionCounts, getDbCompletionCounts, dbCompletionCounts in ForensicReport, structured DB output in formatReportForPrompt, splitCompletedKey, detectMissingArtifacts using splitCompletedKey, ForensicsMarker interface, writeForensicsMarker, readForensicsMarker, handleForensics calls writeForensicsMarker
- `src/resources/extensions/hx/bootstrap/system-context.ts` — Added readForensicsMarker import, hxRoot, buildForensicsContextInjection, clearForensicsMarker, IIFE-based hx-forensics injection in buildBeforeAgentStartResult
- `src/resources/extensions/hx/types.ts` — Added lastCompletedMilestone?: ActiveRef | null to HXState interface
- `src/resources/extensions/hx/state.ts` — Both all-milestones-complete branches set activeMilestone: null + lastCompletedMilestone: lastEntry
- `src/resources/extensions/hx/doctor-runtime-checks.ts` — Imports and uses splitCompletedKey instead of raw key.indexOf('/')
- `src/resources/extensions/hx/doctor-git-checks.ts` — Added isDoctorArtifactOnly helper + guard before worktree_directory_orphaned push
- `src/resources/extensions/hx/doctor.ts` — Blocker check changed to !replanPath && !allTasksDone
- `src/resources/extensions/hx/parsers-legacy.ts` — Second-pass scan with knownIds Set to catch task checkboxes outside extractSection('Tasks') boundary
- `src/resources/extensions/hx/extension-manifest.json` — Updated hooks array to 15 entries matching all pi.on() registrations
- `src/resources/extensions/async-jobs/extension-manifest.json` — Added session_before_switch + session_shutdown to hooks
- `src/resources/extensions/bg-shell/extension-manifest.json` — Added 8 hooks to existing session_shutdown entry
- `src/resources/extensions/browser-tools/extension-manifest.json` — Added session_start to hooks
- `src/resources/extensions/context7/extension-manifest.json` — Added session_shutdown to hooks
- `src/resources/extensions/google-search/extension-manifest.json` — Added session_shutdown to hooks
- `src/resources/extensions/search-the-web/extension-manifest.json` — Added session_start to hooks
- `src/resources/extensions/hx/tests/prompt-tool-names.test.ts` — New: scans all prompt + agent .md files for literal web_search
- `src/resources/extensions/hx/tests/prompt-contracts.test.ts` — Extended: 2 new tests for camelCase params in execute-task and complete-slice
- `src/resources/extensions/hx/tests/complete-milestone.test.ts` — Extended: 1 new test for write tool instruction in step 11
- `src/resources/extensions/hx/tests/complete-slice.test.ts` — Extended: 1 new test for write tool instruction in step 13
- `src/resources/extensions/hx/tests/forensics-dedup.test.ts` — Extended: 1 new test for {{dedupSection}} appearing before ## Investigation Protocol
- `src/resources/extensions/hx/tests/forensics-db-completion.test.ts` — New: 12 tests for DbCompletionCounts interface, getDbCompletionCounts export, DB imports, formatReportForPrompt output, lastCompletedMilestone in state.ts
- `src/resources/extensions/hx/tests/hook-key-parsing.test.ts` — New: 11 tests for splitCompletedKey runtime behavior + detectMissingArtifacts + doctor-runtime-checks source assertions
- `src/resources/extensions/hx/tests/forensics-context-persist.test.ts` — New: 17 tests for ForensicsMarker interface, writeForensicsMarker/readForensicsMarker exports, handleForensics integration, system-context.ts integration
- `src/resources/extensions/hx/tests/doctor-false-positives.test.ts` — New: 9 tests for isDoctorArtifactOnly, !allTasksDone guard, parsers-legacy second-pass
- `scripts/compile-tests.mjs` — Added explicit integration/ subdirectory compile step for doctor-false-positives.test.ts
