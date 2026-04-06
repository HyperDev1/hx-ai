# S03 Research: Milestone Lifecycle, Guided-flow & Model/Provider

**Researched:** 2026-04-04
**Status:** Ready for planning

## Summary

S03 ports **19 upstream commits** across three requirement areas: R005 (milestone lifecycle, 7 fixes), R010 (guided-flow routing, 4 fixes), R006 (model/provider, 8 fixes). All 19 are straightforward adaptations using established S01/S02 patterns — GSD→HX rename, no new architecture. Highest complexity: the 4-bug milestone completion fix (c1a80e20d) and the guided-flow session isolation refactor (cf6f7d4ef, pervasive change to one large file).

**Verification baseline:** 3100/3103 tests pass (3 pre-existing skips). Target: zero new failures.

---

## Requirements Owned

- **R005** — Milestone lifecycle fixes (10 fixes): 7 commits in this slice scope  
- **R006** — Model/provider routing fixes (8 fixes): 8 commits in this slice scope
- **R010** — Guided-flow wizard fixes (4 fixes): 4 commits in this slice scope  
- **R014** — Typecheck + tests pass after each slice

---

## Implementation Landscape

### Files That Exist and Need Modification

| File | Size | Commits Touching It |
|------|------|---------------------|
| `src/resources/extensions/hx/guided-flow.ts` | 1643 lines | cf6f7d4ef, 71c5fc933, bc04b9517, 9c943f4a3 |
| `src/resources/extensions/hx/workflow-projections.ts` | 425 lines | 82779b24d, c1a80e20d |
| `src/resources/extensions/hx/hx-db.ts` | 2210 lines | 82779b24d, 0a6d1e52d |
| `src/resources/extensions/hx/workflow-reconcile.ts` | 503 lines | c1a80e20d |
| `src/resources/extensions/hx/worktree-resolver.ts` | 626 lines | c1a80e20d |
| `src/resources/extensions/hx/tools/validate-milestone.ts` | ? | c1a80e20d |
| `src/resources/extensions/hx/tools/complete-task.ts` | 295 lines | 82779b24d |
| `src/resources/extensions/hx/tools/plan-milestone.ts` | ? | 0a6d1e52d |
| `src/resources/extensions/hx/tools/reassess-roadmap.ts` | 252 lines | 4c12ba34a |
| `src/resources/extensions/hx/types.ts` | 591 lines | c1a80e20d |
| `src/resources/extensions/hx/auto-dispatch.ts` | 765 lines | b7236743c |
| `src/resources/extensions/hx/auto-artifact-paths.ts` | 135 lines | ca6071ad3 |
| `src/resources/extensions/hx/auto-prompts.ts` | 1922 lines | ca6071ad3 |
| `src/resources/extensions/hx/roadmap-slices.ts` | 272 lines | a26f187e0 |
| `src/resources/extensions/hx/auto-model-selection.ts` | 230 lines | 939c98c2c |
| `src/resources/extensions/hx/auto/phases.ts` | 1320 lines | 28d39c3fd |
| `src/resources/extensions/hx/memory-extractor.ts` | 352 lines | c48a80383 |
| `src/resources/extensions/hx/doctor-providers.ts` | 414 lines | 5f7f476a6 |
| `src/resources/extensions/hx/bootstrap/agent-end-recovery.ts` | ? | 5f7f476a6 |
| `src/resources/extensions/hx/auto-start.ts` | ? | cf6f7d4ef (minor) |
| `src/cli.ts` | ? | 188dd2e86 |
| `packages/pi-coding-agent/src/core/retry-handler.ts` | 359 lines | 0c13d3b93 |
| `packages/pi-agent-core/src/agent-loop.ts` | 735 lines | e6d712c07 |
| `packages/pi-ai/src/providers/anthropic-shared.ts` | ? | e6d712c07 |
| `packages/pi-ai/src/types.ts` | ? | e6d712c07 |
| `src/resources/extensions/claude-code-cli/stream-adapter.ts` | 369 lines | a301473d9 |

### New Files to Create

| File | From Commit | Notes |
|------|-------------|-------|
| `src/resources/extensions/hx/milestone-validation-gates.ts` | c1a80e20d | 56-line new module, GSD→HX naming |
| `src/startup-model-validation.ts` | 188dd2e86 | 78-line new module |
| `src/resources/extensions/hx/tests/state-corruption-2945.test.ts` | c1a80e20d | 405-line test, gsd→hx paths |
| `src/resources/extensions/hx/tests/guided-flow-session-isolation.test.ts` | cf6f7d4ef | 97-line test |
| `src/resources/extensions/hx/tests/guided-flow-dynamic-routing.test.ts` | 71c5fc933 | 135-line test |
| `src/resources/extensions/hx/tests/discuss-empty-db-fallback.test.ts` | 9c943f4a3 | 127-line test |
| `src/resources/extensions/hx/tests/verification-operational-gate.test.ts` | b7236743c | 82-line test |
| `src/resources/extensions/hx/tests/plan-milestone-title.test.ts` | 0a6d1e52d | 70-line test |
| `src/resources/extensions/hx/tests/summary-render-parity.test.ts` | 82779b24d | 221-line test |
| `src/resources/extensions/hx/tests/cli-provider-rate-limit.test.ts` | 5f7f476a6 | 47-line test |
| `packages/pi-coding-agent/src/core/retry-handler.test.ts` | 0c13d3b93 | 255-line test |
| `packages/pi-agent-core/src/agent-loop.test.ts` | e6d712c07 | 45-line test |
| `src/tests/extension-model-validation.test.ts` | 188dd2e86 | 169-line test |
| `src/resources/extensions/claude-code-cli/tests/stream-adapter.test.ts` | a301473d9 | Substantial expansion |

### Tests to Append To

| File | Current Lines | Commit |
|------|--------------|--------|
| `src/resources/extensions/hx/tests/reassess-handler.test.ts` | 325 | 4c12ba34a (117-line test block) |
| `src/resources/extensions/hx/tests/discuss-queued-milestones.test.ts` | 241 | bc04b9517 (44-line addition) |
| `src/resources/extensions/hx/tests/auto-model-selection.test.ts` | 139 | 939c98c2c (72-line addition) |
| `src/resources/extensions/hx/tests/auto-loop.test.ts` | 2278 | 28d39c3fd (29-line structural test) |
| `src/resources/extensions/hx/tests/doctor-providers.test.ts` | 486 | 5f7f476a6 (117-line addition) |
| `src/resources/extensions/hx/tests/memory-extractor.test.ts` | 171 | c48a80383 (87-line addition) |
| `src/resources/extensions/hx/tests/roadmap-slices.test.ts` | ? | a26f187e0 (97-line addition) |
| `src/resources/extensions/hx/tests/validate-milestone-write-order.test.ts` | ? | c1a80e20d (minor update) |
| `src/resources/extensions/hx/tests/workflow-projections.test.ts` | ? | c1a80e20d (test update for TBD fallback) + 82779b24d |

---

## Per-Commit Analysis (all 19)

### MILESTONE LIFECYCLE (R005)

**c1a80e20d — 4 state corruption bugs in milestone/slice completion (#3093)**
- **Bug 1** `workflow-projections.ts` L32-33, L116: Change `|| sliceRow.full_uat_md` and `|| slice.full_uat_md` to `|| "TBD"` in both `renderPlanContent` and `renderRoadmapContent`. Also L192: remove `taskRow.full_summary_md ||` from What Happened fallback (becomes just `taskRow.narrative`).
- **Bug 2** `workflow-reconcile.ts`: Extract `replaySliceComplete()` function that calls `getSliceTasks(milestoneId, sliceId)` and checks all tasks are `status === "done"` before calling `updateSliceStatus("done")`. Replace raw `updateSliceStatus("done")` call in `case "complete_slice"` block with the new function.
- **Bug 3** `worktree-resolver.ts` in `_mergeWorktreeMode()` after `mergeMilestoneToMain` success: add secondary `teardownAutoWorktree(originalBase, milestoneId)` in a try/catch best-effort block.
- **Bug 4** New file `milestone-validation-gates.ts` (GSD→HX: `_getAdapter()` from `./hx-db.js`, gate IDs `MV01-MV04`, `insertMilestoneValidationGates()` function). In `validate-milestone.ts`: import `getMilestoneSlices` from `../hx-db.js` and `insertMilestoneValidationGates` from `../milestone-validation-gates.js`; after `insertAssessment` in transaction, call `insertMilestoneValidationGates(params.milestoneId, sliceId, params.verdict, validatedAt)`.
- **types.ts**: Extend `GateScope` from `"slice" | "task"` to `"slice" | "task" | "milestone"` and extend `GateId` from `"Q3" | "Q4" | ... | "Q8"` to also include `"MV01" | "MV02" | "MV03" | "MV04"`.
- **Tests**: New `state-corruption-2945.test.ts` (adapt from upstream — replace all `.gsd` with `.hx`, `gsd-db` with `hx-db`, `GSD_STALE_STATE` with `HX_STALE_STATE`). Update `validate-milestone-write-order.test.ts` (insert slice rows before validation for FK constraint). Update `workflow-projections.test.ts` (expects "TBD" not full_summary_md). Update `worktree-resolver.test.ts` (teardownAutoWorktree assertion changes from 0 to 1 call after merge).

**0a6d1e52d — preserve milestone title in upsertMilestonePlanning (#3247)**
- `hx-db.ts` line 1168: Change signature to `upsertMilestonePlanning(milestoneId: string, planning: Partial<MilestonePlanningRecord>, title?: string): void`. In the SQL UPDATE, add `title = COALESCE(:title, title),` after `SET`. In `.run()`, add `":title": title ?? null,`.
- `tools/plan-milestone.ts`: Change `upsertMilestonePlanning(params.milestoneId, {...})` to `upsertMilestonePlanning(params.milestoneId, {...}, params.title)`.
- **Tests**: New `plan-milestone-title.test.ts` (adapt: `.gsd` → `.hx`, `gsd-db` → `hx-db`, `GSD_STALE_STATE` → `HX_STALE_STATE`).

**4c12ba34a — invalidate stale milestone validation on roadmap reassessment (#3242)**
- `tools/reassess-roadmap.ts`: Add `import { existsSync, unlinkSync } from "node:fs"` (may already exist). After the `for (const removedId of params.sliceChanges.removed)` loop in the DB transaction, add the `hasStructuralChanges` block calling `deleteAssessmentByScope(params.milestoneId, "milestone-validation")` (function already in `hx-db.ts`). After the render block, add the VALIDATION.md file deletion (`.hx` path: `join(basePath, ".hx", "milestones", params.milestoneId, ...)`).
- `tests/reassess-handler.test.ts`: Append the `#2957` test block (117 lines). Adapt: `insertAssessment` is already imported; use `hx-db` imports, `.hx` paths, `HX_STALE_STATE`.

**b7236743c — widen completing-milestone gate (#3239)**
- `auto-dispatch.ts`: Add exported `isVerificationNotApplicable(value: string): boolean` helper. Replace the gate condition at ~L675 from `milestone.verification_operational.toLowerCase() !== "none"` to `!isVerificationNotApplicable(milestone.verification_operational)`.
- **Tests**: New `verification-operational-gate.test.ts` (adapt: import from `../auto-dispatch.ts`, no GSD naming in this file).

**82779b24d — unify SUMMARY.md render paths (#3091)**
- **Substantial change spanning 3 files:**
- `hx-db.ts`: Add `VerificationEvidenceRow` interface export and `getVerificationEvidence(milestoneId, sliceId, taskId): VerificationEvidenceRow[]` function querying `verification_evidence` table.
- `workflow-projections.ts`: Change `renderSummaryContent` signature to accept optional 4th param `evidence?: Array<{...}>`. Rewrite the function body to use the YAML list format for key_files/key_decisions (matching the old `renderSummaryMarkdown` format), compute `verificationResult` from evidence, add verification/evidence/deviations/known_issues/files sections. In `renderSummaryProjection`, query evidence via `getVerificationEvidence` and pass to `renderSummaryContent`.
- `tools/complete-task.ts`: Replace the `renderSummaryMarkdown(params)` local function and call with `paramsToTaskRow(params, completedAt)` helper that builds a `TaskRow`-shaped object, then `renderSummaryContent(taskRow, params.sliceId, params.milestoneId, params.verificationEvidence)`. Import `renderSummaryContent` from `../workflow-projections.js` and `TaskRow` type from `../hx-db.js`.
- **Key concern**: The unified format must match what `parseSummary()` expects. The YAML frontmatter switches from block list to inline. The parity test (`summary-render-parity.test.ts`) will verify this. Must be adapted with `hx-db` → `hx-db` (no rename needed here), but `.gsd` paths in test fixtures → `.hx`.

**ca6071ad3 — align run-uat artifact path to ASSESSMENT (#3053)**
- `auto-artifact-paths.ts`: In `resolveExpectedArtifactPath`, case `"run-uat"`: change `buildSliceFileName(sid!, "UAT")` to `buildSliceFileName(sid!, "ASSESSMENT")`. In `diagnoseExpectedArtifact`, case `"run-uat"`: change `relSliceFile(base, mid, sid!, "UAT")` to `relSliceFile(base, mid, sid!, "ASSESSMENT")`.
- `auto-prompts.ts`: Change `relSliceFile(base, mid, sliceId, "UAT")` in `uatResultPath` assignment to `relSliceFile(base, mid, sliceId, "ASSESSMENT")`.

**a26f187e0 — roadmap H3 header parser (#3063)**
- `roadmap-slices.ts`: In `parseProseSliceHeaders()` at L227, broaden the `headerPattern` regex. Currently: `/^#{1,4}\s+\*{0,2}(?:\u2713\s+)?(?:Slice\s+)?(S\d+)\*{0,2}[:\s.\u2014\u2013-]*\s*(.+)/gm`. New: accept optional leading whitespace, numeric prefixes (`\d+\.`), parenthetical numbering (`\(\d+\)`), and square brackets (`\[S\d+\]`). Test file `roadmap-slices.test.ts` gets 97-line addition for the new format variants.

### GUIDED-FLOW (R010)

**cf6f7d4ef — guided-flow session isolation (#3094)**
- `guided-flow.ts`: Pervasive change (every `pendingAutoStart` write becomes a Map set). 
  - Replace `let pendingAutoStart: { ... } | null = null` with `const pendingAutoStartMap = new Map<string, PendingAutoStartEntry>()` plus an `interface PendingAutoStartEntry`.
  - Add `_getPendingAutoStart(basePath?)` internal function.
  - Export `setPendingAutoStart(basePath, entry)` and `clearPendingAutoStart(basePath?)`.
  - Change `getDiscussionMilestoneId()` to `getDiscussionMilestoneId(basePath?: string)` with keyed lookup.
  - Replace every `pendingAutoStart = { ... }` with `pendingAutoStartMap.set(basePath, { ... })`.
  - Replace every `pendingAutoStart = null` with `pendingAutoStartMap.delete(basePath)`.
  - Replace `if (pendingAutoStart)` guard with `if (pendingAutoStartMap.has(basePath))`.
  - The `openProjectDbIfPresent` helper already exists in `auto-start.ts` (as checked). Minor change: `auto-start.ts` catches errors silently instead of logging. **Verify** if the hx version matches upstream's updated behavior.
- **Tests**: New `guided-flow-session-isolation.test.ts` — imports `setPendingAutoStart`, `clearPendingAutoStart`, `getDiscussionMilestoneId` from `../guided-flow.ts`. No GSD naming in these imports.

**71c5fc933 — dispatchWorkflow through dynamic routing pipeline (#3153)**
- `guided-flow.ts` in `dispatchWorkflow()`: Replace the `resolveModelWithFallbacksForUnit` + manual model loop with a call to `selectAndApplyModel(ctx, pi, unitType, "", process.cwd(), prefs, false, null)`. Import `selectAndApplyModel` from `./auto-model-selection.js` (already in file?). Remove import of `resolveModelWithFallbacksForUnit`.
- `tests/guided-flow-dynamic-routing.test.ts` (NEW, 135 lines): Tests that `dispatchWorkflow` uses `selectAndApplyModel` via structural assertion on source.

**bc04b9517 — route allDiscussed and zero-slices to queued milestone discussion (#3230)**
- `guided-flow.ts` in `showDiscuss()`:
  1. At `if (pendingSlices.length === 0)` block (~L631): Instead of just notifying and returning, check for pending milestones and route to `showDiscussQueuedMilestone`. 
  2. At `if (allDiscussed)` block (~L650): Similarly add pending milestone check before returning.
- `tests/discuss-queued-milestones.test.ts`: Append tests 12 and 13 (44 lines from the diff).

**9c943f4a3 — discuss roadmap fallback when DB is open but empty (#3244)**
- `guided-flow.ts` in `showDiscuss()`: After `normSlices = getMilestoneSlices(mid).map(...)`, add the fallback check: `if (normSlices.length === 0 && roadmapContent) { normSlices = parseRoadmapSlices(roadmapContent).map(s => ({ id: s.id, done: s.done, title: s.title })); }`. Import `parseRoadmapSlices` from `./roadmap-slices.js` if not already imported.
- **Tests**: New `discuss-empty-db-fallback.test.ts` (127 lines): Tests that `parseRoadmapSlices` returns correct slice list — no direct guided-flow call (pure unit test of the fallback logic). Replace `.gsd` → `.hx` in paths.

### MODEL / PROVIDER (R006)

**939c98c2c — resolve bare model IDs to anthropic over claude-code provider (#3076)**
- `auto-model-selection.ts` in `resolveModelId()`: Replace the bare-ID resolution block (~L228-231):
  ```
  // Old:
  const exactProviderMatch = availableModels.find(m => m.id === modelId && m.provider === currentProvider);
  return exactProviderMatch ?? availableModels.find(m => m.id === modelId);
  
  // New:
  const candidates = availableModels.filter(m => m.id === modelId);
  if (candidates.length === 0) return undefined;
  if (candidates.length === 1) return candidates[0];
  const EXTENSION_PROVIDERS = new Set(["claude-code"]);
  if (currentProvider && !EXTENSION_PROVIDERS.has(currentProvider)) {
    const providerMatch = candidates.find(m => m.provider === currentProvider);
    if (providerMatch) return providerMatch;
  }
  const anthropicMatch = candidates.find(m => m.provider === "anthropic");
  if (anthropicMatch) return anthropicMatch;
  return candidates.find(m => !EXTENSION_PROVIDERS.has(m.provider)) ?? candidates[0];
  ```
- `tests/auto-model-selection.test.ts`: Append 72-line test block for bare model ID resolution.

**28d39c3fd — move selectAndApplyModel before updateProgressWidget (#3079)**
- `auto/phases.ts`: In `runUnitPhase()`, move the `selectAndApplyModel(...)` block (currently at ~L1005) to BEFORE the `updateProgressWidget(...)` call at ~L936. Keep the block structure identical, just reorder.
- `tests/auto-loop.test.ts`: Append 29-line structural test asserting `selectAndApplyModel` appears exactly once and before `updateProgressWidget`.

**188dd2e86 — defer model validation until after extensions register (#3089)**
- New file `src/startup-model-validation.ts` (78 lines). No GSD naming — it references `getPiDefaultModelAndProvider` from `./pi-migration.js` (same in hx).
- `src/cli.ts`: Remove the inline model validation block (~30 lines). Add import `validateConfiguredModel from './startup-model-validation.js'`. Add two calls to `validateConfiguredModel(modelRegistry, settingsManager)` — one in print-mode path and one in interactive-mode path, both AFTER `createAgentSession()`.
- `src/tests/extension-model-validation.test.ts` (NEW, 169 lines): No GSD naming.

**5f7f476a6 — Codex/Gemini CLI provider routes + rate-limit cap (#3246)**
- `doctor-providers.ts`: In `PROVIDER_ROUTES`, add `"openai-codex"` to the openai alternatives array and add `google: ["google-gemini-cli"]` entry.
- `bootstrap/agent-end-recovery.ts`: After `cls` classification, add a block: `if (cls.kind === "rate-limit") { const currentProvider = ctx.model?.provider; if (currentProvider === "openai-codex" || currentProvider === "google-gemini-cli") { cls.retryAfterMs = Math.min(cls.retryAfterMs, 30_000); } }`.
- `tests/cli-provider-rate-limit.test.ts` (NEW, 47 lines): Tests rate-limit cap logic.
- `tests/doctor-providers.test.ts`: Append 117-line test block for new provider routes.

**0c13d3b93 — classify long-context 429 as quota_exhausted (#3257)**
- `packages/pi-coding-agent/src/core/retry-handler.ts`:
  1. Widen `isRetryable()` regex to include `|extra usage is required` at the end.
  2. In `classifyError()`, add BEFORE the generic regex: `if (/extra usage is required|long context required/i.test(err)) return "quota_exhausted"`.
  3. In the `quota_exhausted` branch of the retry handler, add `const downgraded = this._tryLongContextDowngrade(message); if (downgraded) return true;`.
  4. Add new private method `_tryLongContextDowngrade(message)` that strips `[1m]` suffix, finds base model, switches model, emits fallback event.
- `packages/pi-coding-agent/src/core/retry-handler.test.ts` (NEW, 255 lines): Tests the new classification. No GSD naming (package-level code).

**c48a80383 — OAuth API key in buildMemoryLLMCall (#3233)**
- `memory-extractor.ts` in `buildMemoryLLMCall()`: Add `const resolvedKeyPromise = ctx.modelRegistry.getApiKey(selectedModel).catch(() => undefined)` before the returned async function. Inside the returned function, add `const resolvedApiKey = await resolvedKeyPromise` and spread `...(resolvedApiKey ? { apiKey: resolvedApiKey } : {})` into the `completeSimple` options.
- `tests/memory-extractor.test.ts`: Append 87-line test block for OAuth key resolution.

**a301473d9 — claude-code provider stateful (#3254)**
- `src/resources/extensions/claude-code-cli/stream-adapter.ts`: Substantial rewrite:
  1. Remove imports for `SDKSystemMessage`, `SDKStatusMessage`, `SDKUserMessage`.
  2. Replace `extractLastUserPrompt()` with `extractMessageText()` + `buildPromptFromContext()` functions.
  3. Add `buildSdkOptions(modelId, prompt)` exported function.
  4. In the main stream function: replace `extractLastUserPrompt(context)` with `buildPromptFromContext(context)`. Replace inline options object with `...sdkOpts` spread from `buildSdkOptions()`. Change `persistSession: false` to `persistSession: true`. Remove `parent_tool_use_id !== null` filter blocks.
- `tests/stream-adapter.test.ts`: Substantial expansion (currently 21 lines → ~130 lines).

**e6d712c07 — handle pause_turn stop reason (#3248)**
- `packages/pi-ai/src/types.ts`: Add `"pauseTurn"` to `StopReason` union. Update the `done` event type to include `"pauseTurn"` in the `Extract<...>`.
- `packages/pi-ai/src/providers/anthropic-shared.ts`: Change `case "pause_turn": return "stop"` to `return "pauseTurn"`.
- `packages/pi-agent-core/src/agent-loop.ts`: In `hasMoreToolCalls` assignment, change `toolCalls.length > 0` to `toolCalls.length > 0 || message.stopReason === "pauseTurn"`.
- `packages/pi-agent-core/src/agent-loop.test.ts` (NEW, 45 lines): Structural test for `pauseTurn` handling.

---

## Naming Adaptations Required

All files follow the established pattern from S01/S02:
- `gsd-db` → `hx-db` (imports, references)
- `gsd.db` → `hx.db` (strings)
- `.gsd/` → `.hx/` (paths in test fixtures)
- `GSD_STALE_STATE` → `HX_STALE_STATE`
- `GsdPreferences` → `HxPreferences` (if referenced)
- `gsd_` tool names → `hx_` in tests

Package-level code (`packages/pi-*`, `src/cli.ts`, `src/startup-model-validation.ts`, `packages/claude-code-cli/`) has no GSD naming to adapt — these are provider-agnostic.

---

## Task Decomposition Recommendation

**5 tasks, grouped by file affinity and risk:**

### T01 — Milestone completion bugs + SUMMARY unification (highest complexity)
Files: `workflow-projections.ts`, `workflow-reconcile.ts`, `worktree-resolver.ts`, `tools/validate-milestone.ts`, `types.ts`, `milestone-validation-gates.ts` (NEW), `hx-db.ts` (VerificationEvidenceRow), `tools/complete-task.ts`
Commits: c1a80e20d (4 bugs), 82779b24d (SUMMARY unification)
Tests: `state-corruption-2945.test.ts` (new), `validate-milestone-write-order.test.ts` (update), `workflow-projections.test.ts` (update), `summary-render-parity.test.ts` (new)
Risk: Medium-high. The SUMMARY unification changes the output format — tests must verify parity.

### T02 — Guided-flow refactor (all 4 guided-flow commits)
Files: `guided-flow.ts` (1643 lines, pervasive)
Commits: cf6f7d4ef (session isolation), 71c5fc933 (dynamic routing), bc04b9517 (allDiscussed routing), 9c943f4a3 (roadmap fallback)
Tests: `guided-flow-session-isolation.test.ts` (new), `guided-flow-dynamic-routing.test.ts` (new), `discuss-queued-milestones.test.ts` (append), `discuss-empty-db-fallback.test.ts` (new)
Risk: Medium. All changes are in one file but it's large and the session isolation is pervasive.

### T03 — DB/dispatch micro-fixes (6 small focused fixes)
Files: `hx-db.ts` (upsertMilestonePlanning title), `tools/plan-milestone.ts`, `tools/reassess-roadmap.ts`, `auto-dispatch.ts`, `auto-artifact-paths.ts`, `auto-prompts.ts`, `roadmap-slices.ts`
Commits: 0a6d1e52d, 4c12ba34a, b7236743c, ca6071ad3, a26f187e0
Tests: `plan-milestone-title.test.ts` (new), `reassess-handler.test.ts` (append), `verification-operational-gate.test.ts` (new), `roadmap-slices.test.ts` (append)
Risk: Low. All changes are small (2-20 lines each) and independent.

### T04 — Model/provider routing (4 commits, different subsystems)
Files: `auto-model-selection.ts`, `auto/phases.ts`, `src/cli.ts`, `src/startup-model-validation.ts` (NEW), `doctor-providers.ts`, `bootstrap/agent-end-recovery.ts`
Commits: 939c98c2c, 28d39c3fd, 188dd2e86, 5f7f476a6
Tests: `auto-model-selection.test.ts` (append), `auto-loop.test.ts` (append), `extension-model-validation.test.ts` (new), `cli-provider-rate-limit.test.ts` (new), `doctor-providers.test.ts` (append)
Risk: Medium. `src/cli.ts` is a high-impact file. The model validation deferral must be placed correctly after `createAgentSession()`.

### T05 — Package-level fixes (4 commits across packages)
Files: `packages/pi-coding-agent/src/core/retry-handler.ts`, `packages/pi-agent-core/src/agent-loop.ts`, `packages/pi-ai/src/types.ts`, `packages/pi-ai/src/providers/anthropic-shared.ts`, `memory-extractor.ts`, `src/resources/extensions/claude-code-cli/stream-adapter.ts`
Commits: 0c13d3b93, e6d712c07, c48a80383, a301473d9
Tests: `retry-handler.test.ts` (new), `agent-loop.test.ts` (new), `memory-extractor.test.ts` (append), `stream-adapter.test.ts` (substantial expansion)
Risk: Low-medium. Package-level code has no naming adaptation. `stream-adapter.ts` rewrite is substantial but the pattern is clear.

---

## Verification Strategy

After each task:
1. `npx tsc --noEmit` — zero type errors
2. Run modified test files individually via esbuild recompile + node --test
3. After T05 (final): full suite via `node scripts/compile-tests.mjs` from main project root, then `node --test dist-test/src/...` for a sampling of new tests

After all tasks:
- `npx tsc --noEmit` — zero type errors
- `grep -r "gsd\|GSD" src/resources/extensions/hx/ src/startup-model-validation.ts` to verify no GSD regressions in new/modified files (excluding migrate-gsd-to-hx.ts)
- Full test suite baseline: ≥3100/3103

---

## Key Constraints

1. **`migrate-gsd-to-hx.ts` is protected** — do not modify it (per M001 K001)
2. **`deleteAssessmentByScope`** already exists in `hx-db.ts` (L2011) — `tools/reassess-roadmap.ts` just needs to import and call it
3. **`openProjectDbIfPresent`** already exists in `auto-start.ts` — the cf6f7d4ef change to auto-start.ts is minor (error handling behavior)
4. **`discuss-queued-milestones.test.ts`** already exists (241 lines) — the bc04b9517 change is an append of 44 lines
5. **YAML list format** in `renderSummaryContent` output: after #82779b24d, frontmatter uses `key_files:\n  - item` format (list), NOT the old inline `key_files: ["item"]` format — this is what `parseSummary()` expects
6. **VerificationEvidenceRow**: the `verification_evidence` table already exists in the schema (inserted by S01 work); `getVerificationEvidence()` just needs to be added to `hx-db.ts`
7. **compile-tests.mjs** must run from main repo root; worktree has `node_modules` symlink from S01

---

## Forward Intelligence for Downstream Slices

- S04/S05/S06 executors: the `renderSummaryContent()` function signature changes in T01 to accept a 4th `evidence` parameter — any caller of this function in those slices must pass evidence or omit (it's optional).
- `auto-artifact-paths.ts` change (ca6071ad3): run-uat unit type now expects ASSESSMENT artifact not UAT — S04 tests that check run-uat artifact paths must align.
- `types.ts` GateScope/GateId extension: downstream slices using quality gate types should be aware of the new `"milestone"` scope and `MV0*` IDs.
- `StopReason` union: downstream code that pattern-matches on stop reasons must include `"pauseTurn"` after T05.
