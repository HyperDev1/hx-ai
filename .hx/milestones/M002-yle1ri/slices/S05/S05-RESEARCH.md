# S05 Research: Prompts, Diagnostics & Extensions

**Gathered:** 2026-04-04  
**Calibration:** Targeted research — well-understood work using established patterns already in the codebase. Code is familiar; changes are small surgical edits plus new test files.

---

## Summary

S05 ports 9 upstream bugfix commits into hx-ai with GSD→HX naming adaptation. All changes are in four categories:

1. **Prompt text fixes** — 4 prompt/agent .md files + 2 new test files
2. **Forensics improvements** — 3 fixes to `forensics.ts` + new/extended test files
3. **Doctor false-positive fixes** — 3 fixes across `doctor-git-checks.ts`, `doctor.ts`, `parsers-legacy.ts`
4. **Extension manifest updates** — `extension-manifest.json` for 7 bundled extensions

All upstream changes target `src/resources/extensions/gsd/` → adapted to `src/resources/extensions/hx/` in hx-ai.

---

## Upstream Commits Assigned to S05

| Commit | PR | What |
|--------|----|------|
| `b30ce12da` | #3236 | camelCase params in execute-task and complete-slice prompts |
| `c50c9a5e3` | #3238 | Specify `write` tool for PROJECT.md in milestone/slice prompts |
| `812555b3c` | #3245 | Replace `web_search` with `search-the-web` in prompts and agents |
| `8006f776f` | #3260 | Run forensics dedup before investigation (move `{{dedupSection}}`) |
| `e97a3b378` | #3234 | Read completion status from DB instead of legacy file in forensics |
| `6d388d36b` | #3252 | Parse hook/* completed-unit keys correctly (`splitCompletedKey`) |
| `2e90c244f` | #3261 | Persist forensics report context across follow-up turns |
| `8df364fb4` | #3264 | Eliminate 3 recurring doctor audit false positives |
| `af56efb48` | #3157 | Update `provides.hooks` in 7 extension manifests |

**Also confirmed already applied in earlier slices:**
- `e8630cfd6` (#3059) — rethink.md `{{commitInstruction}}` fix — **already applied in hx-ai** (`commitInstruction` is in rethink.ts and rethink.md uses `{{commitInstruction}}`)
- `47ce449c5` (#3232) — prompt explosion prevention — **applied in S04/T04** (Decision D009)

---

## Fix-by-Fix Analysis

### Fix 1: `b30ce12da` — camelCase params in prompts

**Problem:** `execute-task.md` step 20 says "Call `hx_complete_task` with `milestone_id, slice_id, task_id`" (snake_case). `complete-slice.md` step 11 says "with `milestone_id, slice_id`". TypeBox schemas expect camelCase.

**Current hx-ai state:**
- `src/resources/extensions/hx/prompts/execute-task.md` line 73: `milestone_id, slice_id, task_id` ← **needs fix**
- `src/resources/extensions/hx/prompts/complete-slice.md` line 42: `milestone_id, slice_id` ← **needs fix**

**Fix:** Change `milestone_id, slice_id, task_id` → `milestoneId, sliceId, taskId` in execute-task.md; `milestone_id, slice_id` → `milestoneId, sliceId` in complete-slice.md.

**New test needed:** Add 2 tests to `src/resources/extensions/hx/tests/prompt-contracts.test.ts` (existing file) asserting the tool call line uses camelCase names.

### Fix 2: `c50c9a5e3` — Write tool for PROJECT.md

**Problem:** `complete-milestone.md` step 11 says "Update `.hx/PROJECT.md` to reflect milestone completion and current project state." — no tool specified, causing LLMs to use `edit` with wrong params.

**Current hx-ai state:**
- `src/resources/extensions/hx/prompts/complete-milestone.md` line 59: bare "Update `.hx/PROJECT.md`..." ← **needs fix**
- `src/resources/extensions/hx/prompts/complete-slice.md` step 13: currently reads "refresh current state if needed" but missing explicit write tool. ← **needs fix**

**Fix:** 
- complete-milestone.md step 11: add `use the \`write\` tool with \`path: ".hx/PROJECT.md"\` and \`content\` containing the full updated document...`
- complete-slice.md step 13: add explicit write tool instruction

**New tests needed:**
- `src/resources/extensions/hx/tests/complete-milestone.test.ts` — add 1 test for step 11 write tool
- `src/resources/extensions/hx/tests/complete-slice.test.ts` — add 1 test for step 13 write tool

**Existing test structure:** `complete-milestone.test.ts` uses `loadPromptFromWorktree`. `complete-slice.test.ts` uses direct `fs.readFileSync` on prompt path and manual `assertTrue` helper.

### Fix 3: `812555b3c` — Replace `web_search` with `search-the-web`

**Problem:** 4 prompt .md files and 1 agent .md file reference `web_search` (Anthropic API detail) instead of registered tool name `search-the-web`.

**Current hx-ai state (confirmed by grep):**
- `src/resources/extensions/hx/prompts/discuss-headless.md` — has `web_search` ← **needs fix**
- `src/resources/extensions/hx/prompts/discuss.md` — has `web_search` ← **needs fix**
- `src/resources/extensions/hx/prompts/guided-discuss-slice.md` — has `web_search` ← **needs fix**
- `src/resources/extensions/hx/prompts/guided-discuss-milestone.md` — has `web_search` ← **needs fix**
- `src/resources/agents/researcher.md` — frontmatter `tools: web_search, bash` ← **needs fix** → `search-the-web`

**New test needed:** Create `src/resources/extensions/hx/tests/prompt-tool-names.test.ts` (adapted from upstream). Checks all prompt `.md` files for `web_search`. Checks all agent `.md` frontmatter. HX-adapted path: `promptsDir = join(__dirname, "..", "prompts")`, `agentsDir = join(__dirname, "..", "..", "..", "agents")`.

### Fix 4: `8006f776f` — Forensics dedup before investigation

**Problem:** `{{dedupSection}}` placeholder appears after the Investigation Protocol in `forensics.md`, wasting tokens on deep source analysis before checking if the bug is already fixed.

**Current hx-ai state:** `src/resources/extensions/hx/prompts/forensics.md` line 136 has `{{dedupSection}}` AFTER "## Investigation Protocol" (line 105). ← **needs fix**

**Fix:** Move `{{dedupSection}}` to appear BEFORE `## Investigation Protocol`. Also update `DEDUP_PROMPT_SECTION` constant in `forensics.ts` — change title and instructions to be a pre-investigation gate with Decision Gate (skip full investigation if already-fixed/open-issue match).

**The forensics-dedup test already passes** (tests the `{{dedupSection}}` placeholder presence and DEDUP_PROMPT_SECTION content). The test for dedup ordering needs checking — the upstream added `forensics-dedup.test.ts` but hx-ai already has that file.

**Check existing test:** `src/resources/extensions/hx/tests/forensics-dedup.test.ts` — verifies dedup exists. The upstream test for *ordering* was in `forensics-dedup.test.ts` with 31 new lines. But the existing hx-ai version tests presence only. Need to add test asserting `{{dedupSection}}` appears before `Investigation Protocol`.

### Fix 5: `e97a3b378` — Forensics DB completion status

**Problem:** Forensics showed "Completed Keys: 0" because it read from `completed-units.json` (never populated in auto-mode). Should query DB.

**Current hx-ai state:**
- `src/resources/extensions/hx/forensics.ts` — has `completedKeys` field in `ForensicReport`, line 1012 shows `### Completed Keys: ${report.completedKeys.length}` ← **needs fix**
- `src/resources/extensions/hx/state.ts` line 563: returns `activeMilestone: lastEntry ? ... : null` when phase=complete ← **needs fix** → should be `activeMilestone: null, lastCompletedMilestone: lastEntry ...`
- `src/resources/extensions/hx/types.ts` — `HXState` has no `lastCompletedMilestone` field ← **needs new field**

**Imports available in hx-ai:** `getAllMilestones`, `getMilestoneSlices`, `getSliceTasks` all exported from `hx-db.ts`; `isClosedStatus` already imported in `state.ts` from `status-guards.js`.

**Fix:** 
1. Add `lastCompletedMilestone?: ActiveRef | null` to `HXState` in `types.ts`
2. Add `dbCompletionCounts: DbCompletionCounts | null` to `ForensicReport` interface in `forensics.ts`
3. Add `getDbCompletionCounts()` function importing from `hx-db.js` and `status-guards.js`
4. Call it in `buildForensicReport` and update `formatReportForPrompt` to show structured counts
5. Fix `state.ts` "all milestones complete" branch to set `activeMilestone: null, lastCompletedMilestone: lastEntry`

**New test needed:** Create `src/resources/extensions/hx/tests/forensics-db-completion.test.ts` (source-read style, 96 lines adapted from upstream).

### Fix 6: `6d388d36b` — `splitCompletedKey` helper

**Problem:** `key.indexOf("/")` splits `"hook/telegram-progress/M007/S01"` as `unitType="hook"` instead of `"hook/telegram-progress"`, causing false-positive missing-artifact errors.

**Current hx-ai state:**
- `src/resources/extensions/hx/forensics.ts` — `detectMissingArtifacts` uses `key.indexOf("/")` ← **needs fix**
- `src/resources/extensions/hx/doctor-runtime-checks.ts` line 122 — uses `key.indexOf("/")` ← **needs fix**

**Fix:**
1. Add exported `splitCompletedKey()` function to `forensics.ts` (handles `hook/` prefix with two-segment type)
2. Update `detectMissingArtifacts` to use it
3. Update `doctor-runtime-checks.ts` to import and use it (dynamic import pattern from upstream)

**New test needed:** Create `src/resources/extensions/hx/tests/hook-key-parsing.test.ts` — tests `splitCompletedKey` export, simple key splitting, hook key splitting (two-segment), null for malformed, and source-level assertions for `detectMissingArtifacts` and `doctor-runtime-checks`.

**Note:** The upstream used `await import("../forensics.ts")` for runtime tests. In hx-ai compiled tests this should work the same way via `esbuild` compilation.

### Fix 7: `2e90c244f` — Persist forensics context

**Problem:** Forensics prompt sent as one-shot `sendMessage(triggerTurn: true)`, causing context loss on follow-up turns.

**Current hx-ai state:**
- `src/resources/extensions/hx/forensics.ts` — `handleForensics` calls `sendMessage` but doesn't write marker ← **needs fix**
- `src/resources/extensions/hx/bootstrap/system-context.ts` — `buildBeforeAgentStartResult` doesn't check for forensics marker ← **needs fix**

**Fix:**
1. Add `ForensicsMarker` interface, `writeForensicsMarker()`, `readForensicsMarker()` to `forensics.ts`
2. Call `writeForensicsMarker(basePath, savedPath, content)` at end of `handleForensics()`
3. In `system-context.ts`: add `unlinkSync` to imports; import `readForensicsMarker`; add `buildForensicsContextInjection()` and `clearForensicsMarker()`; in `buildBeforeAgentStartResult`, build `forensicsInjection` when no `injection`, inject as `gsd-forensics` customType

**HX adaptation:** Import uses `hxRoot` (not `gsdRoot`). Context type stays `"gsd-forensics"` (it's a customType string, not a GSD reference — keep as-is per prior pattern). Actually: check if `gsd-guided-context` in system-context.ts was adapted or kept. Looking at upstream, the type is `"gsd-forensics"` — since these are internal customType strings, they should be adapted to `"hx-forensics"` and `"hx-guided-context"` for consistency.

**New test needed:** Create `src/resources/extensions/hx/tests/forensics-context-persist.test.ts` (source-read style, 129 lines adapted from upstream).

### Fix 8: `8df364fb4` — Doctor false positives (3 bugs)

**Problem:**
- Bug 1: Orphaned worktree check flags dirs that only contain `doctor-history.jsonl` (circular false positive)
- Bug 2: `blocker_discovered_no_replan` fires even when all tasks are done (implicitly resolved)
- Bug 3: `parsePlan` misses T02+ task checkboxes that appear after interleaved detail headings

**Current hx-ai state:**
- `src/resources/extensions/hx/doctor-git-checks.ts` — no `isDoctorArtifactOnly` guard before push ← **needs fix**
- `src/resources/extensions/hx/doctor.ts` line 762: `if (!replanPath)` — doesn't check `allTasksDone` ← **needs fix** → `if (!replanPath && !allTasksDone)`
- `src/resources/extensions/hx/parsers-legacy.ts` — single-pass `extractSection("Tasks")` only; misses T02+ after detail headings ← **needs fix**

**Fix:**
1. `doctor-git-checks.ts`: Add `isDoctorArtifactOnly(dirPath)` helper function; add guard `if (isDoctorArtifactOnly(fullPath)) continue;` before `issues.push(worktree_directory_orphaned)`
2. `doctor.ts`: Change `if (!replanPath)` → `if (!replanPath && !allTasksDone)` for blocker check
3. `parsers-legacy.ts`: Refactor task parsing to extract `parseTaskLines()` helper with `knownIds` Set; add second pass scanning full body for missed tasks

**New test needed:** Create `src/resources/extensions/hx/tests/integration/doctor-false-positives.test.ts` (adapted from upstream's 100+ line test).

### Fix 9: `af56efb48` — Extension manifest hook arrays

**Problem:** 7 bundled extension manifests have incomplete `provides.hooks` arrays.

**Current hx-ai state (confirmed by grep):**

| Extension | Current hooks | Missing |
|-----------|--------------|---------|
| `hx` (core) | `["session_start", "session_switch"]` | `bash_transform, session_fork, before_agent_start, agent_end, session_before_compact, session_shutdown, tool_call, tool_result, tool_execution_start, tool_execution_end, model_select, before_provider_request` (plus `turn_end` which hx also registers) |
| `async-jobs` | `["session_start"]` | `session_before_switch, session_shutdown` |
| `bg-shell` | `["session_shutdown"]` | `session_compact, session_tree, session_switch, before_agent_start, session_start, turn_end, agent_end, tool_execution_end` |
| `browser-tools` | `["session_shutdown"]` | `session_start` |
| `context7` | `["session_start"]` | `session_shutdown` |
| `google-search` | `["session_start"]` | `session_shutdown` |
| `search-the-web` | `["model_select", "before_provider_request"]` | `session_start` |

**Fix:** Update all 7 `extension-manifest.json` files to list all actual `pi.on()` registrations. For `hx` specifically, the full list based on `register-hooks.ts` actual calls: `session_start, session_switch, bash_transform, session_fork, before_agent_start, agent_end, session_before_compact, session_shutdown, tool_call, tool_result, tool_execution_start, tool_execution_end, model_select, before_provider_request, turn_end`.

**No new tests** (manifest audit test isn't in S05 scope — upstream test for this was not in the manifests fix commit).

---

## Files to Touch

### Source code changes:
| File | Change |
|------|--------|
| `src/resources/extensions/hx/prompts/execute-task.md` | `milestone_id, slice_id, task_id` → `milestoneId, sliceId, taskId` |
| `src/resources/extensions/hx/prompts/complete-slice.md` | snake_case → camelCase; add write tool instruction for step 13 |
| `src/resources/extensions/hx/prompts/complete-milestone.md` | Step 11: add explicit write tool instruction |
| `src/resources/extensions/hx/prompts/discuss-headless.md` | `web_search` → `search-the-web` |
| `src/resources/extensions/hx/prompts/discuss.md` | `web_search` → `search-the-web` |
| `src/resources/extensions/hx/prompts/guided-discuss-slice.md` | `web_search` → `search-the-web` |
| `src/resources/extensions/hx/prompts/guided-discuss-milestone.md` | `web_search` → `search-the-web` |
| `src/resources/extensions/hx/prompts/forensics.md` | Move `{{dedupSection}}` before Investigation Protocol |
| `src/resources/agents/researcher.md` | `tools: web_search, bash` → `tools: search-the-web, bash` |
| `src/resources/extensions/hx/forensics.ts` | (1) Update DEDUP_PROMPT_SECTION to pre-investigation gate; (2) Add `dbCompletionCounts` to ForensicReport + `getDbCompletionCounts()`; (3) Add `splitCompletedKey()` export; (4) Update `detectMissingArtifacts` to use it; (5) Add `ForensicsMarker`, `writeForensicsMarker`, `readForensicsMarker`; (6) Call `writeForensicsMarker` in `handleForensics()` |
| `src/resources/extensions/hx/types.ts` | Add `lastCompletedMilestone?: ActiveRef \| null` to `HXState` |
| `src/resources/extensions/hx/state.ts` | Fix "all complete" branch: `activeMilestone: null, lastCompletedMilestone: lastEntry...` |
| `src/resources/extensions/hx/doctor-runtime-checks.ts` | Use `splitCompletedKey` from forensics instead of `key.indexOf("/")` |
| `src/resources/extensions/hx/doctor-git-checks.ts` | Add `isDoctorArtifactOnly()` helper; skip in orphaned-worktree check |
| `src/resources/extensions/hx/doctor.ts` | `if (!replanPath)` → `if (!replanPath && !allTasksDone)` for blocker check |
| `src/resources/extensions/hx/parsers-legacy.ts` | Refactor task parsing: `parseTaskLines()` helper + second body pass |
| `src/resources/extensions/hx/bootstrap/system-context.ts` | Add `unlinkSync`; import `readForensicsMarker`; add forensics context injection |
| `src/resources/extensions/hx/extension-manifest.json` | Full hook list (15 hooks) |
| `src/resources/extensions/async-jobs/extension-manifest.json` | Add `session_before_switch, session_shutdown` |
| `src/resources/extensions/bg-shell/extension-manifest.json` | Add 8 hooks |
| `src/resources/extensions/browser-tools/extension-manifest.json` | Add `session_start` |
| `src/resources/extensions/context7/extension-manifest.json` | Add `session_shutdown` |
| `src/resources/extensions/google-search/extension-manifest.json` | Add `session_shutdown` |
| `src/resources/extensions/search-the-web/extension-manifest.json` | Add `session_start` |

### New test files:
| File | Source |
|------|--------|
| `src/resources/extensions/hx/tests/prompt-tool-names.test.ts` | New (adapted from upstream, checks prompts + agents for `web_search`) |
| `src/resources/extensions/hx/tests/forensics-db-completion.test.ts` | New (source-read style, 96 lines) |
| `src/resources/extensions/hx/tests/hook-key-parsing.test.ts` | New (adapted, tests `splitCompletedKey`) |
| `src/resources/extensions/hx/tests/forensics-context-persist.test.ts` | New (adapted, 129 lines) |
| `src/resources/extensions/hx/tests/integration/doctor-false-positives.test.ts` | New (adapted) |

### Extend existing test files:
| File | Change |
|------|--------|
| `src/resources/extensions/hx/tests/prompt-contracts.test.ts` | Add 2 tests for camelCase params |
| `src/resources/extensions/hx/tests/forensics-dedup.test.ts` | Add ordering assertion |
| `src/resources/extensions/hx/tests/complete-milestone.test.ts` | Add write-tool test for step 11 |
| `src/resources/extensions/hx/tests/complete-slice.test.ts` | Add write-tool test for step 13 |

---

## Implementation Landscape

### Confirmed pre-existing (do NOT re-apply):
- `e8630cfd6` (#3059) rethink.md fix: **already applied** — `commitInstruction` in rethink.ts and rethink.md uses `{{commitInstruction}}`
- `47ce449c5` (#3232) prompt explosion fix: **already applied in S04/T04**

### Naming adaptations required:
- `gsdRoot` → `hxRoot` in forensics marker paths  
- `gsd-forensics` customType → `hx-forensics` (check system-context.ts for existing customType usage)
- `gsd-guided-context` → `hx-guided-context` in system-context.ts (check current state)
- `.gsd/runtime/` → `.hx/runtime/` in marker path
- `doctor-history.jsonl` stays the same (internal filename, not GSD-named)

### System-context.ts customType check needed:
Before adapting, check what customTypes are already used in `system-context.ts` for guided context injection — they may already be adapted as `hx-guided-context`.

### Verification commands (after implementation):
```bash
npx tsc --noEmit
node scripts/compile-tests.mjs
node --test dist-test/src/resources/extensions/hx/tests/prompt-tool-names.test.js
node --test dist-test/src/resources/extensions/hx/tests/forensics-db-completion.test.js
node --test dist-test/src/resources/extensions/hx/tests/hook-key-parsing.test.js
node --test dist-test/src/resources/extensions/hx/tests/forensics-context-persist.test.js
node --test dist-test/src/resources/extensions/hx/tests/integration/doctor-false-positives.test.js
node --test dist-test/src/resources/extensions/hx/tests/prompt-contracts.test.js
node --test dist-test/src/resources/extensions/hx/tests/complete-milestone.test.js
node --test dist-test/src/resources/extensions/hx/tests/complete-slice.test.js
node --test dist-test/src/resources/extensions/hx/tests/forensics-dedup.test.js
```

---

## Task Decomposition Recommendation

**T01 — Prompt text fixes** (low risk, self-contained):
- Fix camelCase params in execute-task.md + complete-slice.md
- Fix write tool instruction in complete-milestone.md + complete-slice.md
- Fix `web_search` → `search-the-web` in 4 prompt files + researcher.md
- Move `{{dedupSection}}` before Investigation Protocol in forensics.md + update DEDUP_PROMPT_SECTION text in forensics.ts
- Add/extend tests: prompt-tool-names.test.ts (new), prompt-contracts.test.ts (extend), complete-milestone.test.ts (extend), complete-slice.test.ts (extend), forensics-dedup.test.ts (extend)

**T02 — Forensics DB + splitCompletedKey** (medium, touches forensics.ts substantially):
- Add `dbCompletionCounts` to ForensicReport; `getDbCompletionCounts()` with DB imports
- Fix `state.ts` all-complete branch (`lastCompletedMilestone`)
- Add `lastCompletedMilestone` to HXState in types.ts
- Add `splitCompletedKey()` export to forensics.ts; update `detectMissingArtifacts`
- Update `doctor-runtime-checks.ts` to use `splitCompletedKey`
- New tests: forensics-db-completion.test.ts, hook-key-parsing.test.ts

**T03 — Forensics context persistence** (medium, touches system-context.ts):
- Add `ForensicsMarker`, `writeForensicsMarker`, `readForensicsMarker` to forensics.ts
- Call `writeForensicsMarker` in `handleForensics()`
- Update `system-context.ts` with forensics injection
- New test: forensics-context-persist.test.ts

**T04 — Doctor false-positive fixes** (medium, isolated):
- `isDoctorArtifactOnly()` in doctor-git-checks.ts
- Fix blocker check in doctor.ts
- Refactor parsers-legacy.ts task parsing (second-pass)
- New test: integration/doctor-false-positives.test.ts

**T05 — Extension manifest updates** (trivial, pure JSON edits):
- Update 7 extension-manifest.json files to match actual hook registrations

This is 5 tasks; T01 and T05 can be combined as they're both low-risk if desired (total ~4 tasks).

---

## Key Risks

- **Forensics.ts is a large file** (~1200 lines) — multiple fixes touch it. Apply carefully in order to avoid merge conflicts with the file's own diffs.
- **System-context.ts customType adaptation** — need to check what `customType` strings are currently used in hx-ai before adapting `gsd-forensics` → `hx-forensics` (or keeping as-is for backward compat).
- **parsers-legacy.ts refactor** — the `parseTaskLines` extraction is a significant restructure; must verify no regression in existing plan-parse tests.
- **Hook-key-parsing test uses dynamic import** — `await import("../forensics.ts")` works in esbuild-compiled tests; the test file location (hx/tests/) must import from the correct relative path.
