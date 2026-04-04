# S03: Milestone Lifecycle, Guided-flow & Model/Provider

**Goal:** Port 19 upstream bugfix commits across milestone lifecycle (R005, 7 commits), guided-flow (R010, 4 commits), and model/provider (R006, 8 commits) subsystems. Every fix uses GSD→HX naming adaptation. typecheck + tests pass with ≥3100/3103 baseline maintained.
**Demo:** After this: After this: Milestone/slice completion, guided-flow routing, model routing, provider resolution, rate-limit classification, and OAuth fixes are applied. typecheck + tests pass.

## Tasks
- [x] **T01: Port commits c1a80e20d and 82779b24d: fix 4 state corruption bugs and unify SUMMARY render with YAML list format and evidence table** — Port commits c1a80e20d (4 state corruption bugs) and 82779b24d (SUMMARY render unification) across 8 source files and 4 test files.

Commit c1a80e20d — 4 state corruption bugs:
1. workflow-projections.ts: Change `|| sliceRow.full_uat_md` to `|| "TBD"` at L32-33 and L116 in renderPlanContent/renderRoadmapContent. At L192: remove `taskRow.full_summary_md ||` from the What Happened fallback (becomes just `taskRow.narrative`).
2. workflow-reconcile.ts: Extract `replaySliceComplete()` function that calls `getSliceTasks(milestoneId, sliceId)`, checks all tasks have `status === "done"`, then calls `updateSliceStatus("done")`. Replace the raw `updateSliceStatus("done")` call in the `case "complete_slice"` block with the new function.
3. worktree-resolver.ts: After the `mergeMilestoneToMain` success block in `_mergeWorktreeMode()`, add a secondary `teardownAutoWorktree(originalBase, milestoneId)` in a try/catch best-effort block.
4. Create `src/resources/extensions/hx/milestone-validation-gates.ts` (new 56-line module): import `_getAdapter()` from `./hx-db.js`, define `insertMilestoneValidationGates(milestoneId, sliceId, verdict, validatedAt)` inserting gate IDs `MV01`, `MV02`, `MV03`, `MV04`. In `tools/validate-milestone.ts`: add `import { getMilestoneSlices } from "../hx-db.js"` and `import { insertMilestoneValidationGates } from "../milestone-validation-gates.js"`; after `insertAssessment` in transaction, call `insertMilestoneValidationGates(...)`.
5. types.ts: Extend `GateScope` to `"slice" | "task" | "milestone"` and extend `GateId` to also include `"MV01" | "MV02" | "MV03" | "MV04"`.

Commit 82779b24d — SUMMARY render unification:
1. hx-db.ts: Add `VerificationEvidenceRow` interface export and `getVerificationEvidence(milestoneId, sliceId, taskId): VerificationEvidenceRow[]` function querying the `verification_evidence` table.
2. workflow-projections.ts: Change `renderSummaryContent` signature to accept optional 4th param `evidence?: Array<{command: string; exit_code: number; verdict: string; duration_ms: number}>`. Rewrite body to use YAML list format for key_files/key_decisions (with `  - ` prefix lines), compute `verificationResult` from evidence, add verification/evidence/deviations/known_issues/files sections. In `renderSummaryProjection`, call `getVerificationEvidence(milestoneId, sliceId, taskId)` and pass to `renderSummaryContent`.
3. tools/complete-task.ts: Replace the local `renderSummaryMarkdown(params)` function. Import `renderSummaryContent` from `../workflow-projections.js` and `TaskRow` from `../hx-db.js`. Build a `TaskRow`-shaped object (`paramsToTaskRow(params, completedAt)`) then call `renderSummaryContent(taskRow, params.sliceId, params.milestoneId, params.verificationEvidence)`.

IMPORTANT: The YAML list format in renderSummaryContent MUST use `key_files:\n  - item` format (not `key_files: ["item"]`) — this is what parseSummary() expects.

Tests to write/update:
- NEW: `src/resources/extensions/hx/tests/state-corruption-2945.test.ts` (405-line test, replace `.gsd` → `.hx`, `gsd-db` → `hx-db`, `GSD_STALE_STATE` → `HX_STALE_STATE`)
- UPDATE: `src/resources/extensions/hx/tests/validate-milestone-write-order.test.ts` (insert slice rows before validation for FK constraint)
- UPDATE: `src/resources/extensions/hx/tests/workflow-projections.test.ts` (expect "TBD" not full_summary_md, update YAML format expectations)
- NEW: `src/resources/extensions/hx/tests/summary-render-parity.test.ts` (221-line test, adapt `.gsd`→`.hx` paths)
  - Estimate: 2h
  - Files: src/resources/extensions/hx/workflow-projections.ts, src/resources/extensions/hx/workflow-reconcile.ts, src/resources/extensions/hx/worktree-resolver.ts, src/resources/extensions/hx/tools/validate-milestone.ts, src/resources/extensions/hx/types.ts, src/resources/extensions/hx/hx-db.ts, src/resources/extensions/hx/tools/complete-task.ts, src/resources/extensions/hx/milestone-validation-gates.ts, src/resources/extensions/hx/tests/state-corruption-2945.test.ts, src/resources/extensions/hx/tests/validate-milestone-write-order.test.ts, src/resources/extensions/hx/tests/workflow-projections.test.ts, src/resources/extensions/hx/tests/summary-render-parity.test.ts
  - Verify: npx tsc --noEmit && node --test dist-test/src/resources/extensions/hx/tests/state-corruption-2945.test.js dist-test/src/resources/extensions/hx/tests/summary-render-parity.test.js dist-test/src/resources/extensions/hx/tests/workflow-projections.test.js dist-test/src/resources/extensions/hx/tests/validate-milestone-write-order.test.js
- [x] **T02: Port 4 guided-flow commits: Map-based session isolation, selectAndApplyModel dynamic routing, queued-milestone routing, and roadmap-fallback when DB is empty** — Port all 4 guided-flow commits into `src/resources/extensions/hx/guided-flow.ts` (1643-line file).

Commit cf6f7d4ef — session isolation (pervasive):
1. Replace `let pendingAutoStart: { ctx, pi, basePath, milestoneId, step? } | null = null` with `interface PendingAutoStartEntry { ctx, pi, basePath, milestoneId, step?: boolean }` and `const pendingAutoStartMap = new Map<string, PendingAutoStartEntry>()`.
2. Add internal `_getPendingAutoStart(basePath?: string)` that returns `pendingAutoStartMap.get(basePath ?? "")` or first entry.
3. Export `setPendingAutoStart(basePath: string, entry: PendingAutoStartEntry)` and `clearPendingAutoStart(basePath?: string)`.
4. Change `getDiscussionMilestoneId()` to `getDiscussionMilestoneId(basePath?: string)` with keyed lookup via `_getPendingAutoStart(basePath)`.
5. Replace every `pendingAutoStart = { ... }` with `pendingAutoStartMap.set(basePath, { ... })`.
6. Replace every `pendingAutoStart = null` with `pendingAutoStartMap.delete(basePath ?? "")`.
7. Replace `if (pendingAutoStart)` guards with `if (pendingAutoStartMap.has(basePath ?? ""))`.

Commit 71c5fc933 — dynamic routing in dispatchWorkflow():
1. In `dispatchWorkflow()`: remove import of `resolveModelWithFallbacksForUnit` from `./preferences-models.js`. Add/confirm import of `selectAndApplyModel` from `./auto-model-selection.js`.
2. Replace the `const modelConfig = resolveModelWithFallbacksForUnit(unitType)` + manual model loop with `await selectAndApplyModel(ctx, pi, unitType, "", process.cwd(), prefs, false, null)`.

Commit bc04b9517 — route allDiscussed and zero-slices to queued milestone discussion:
1. In `showDiscuss()`, at the `if (pendingSlices.length === 0)` block (~L631): instead of just notifying and returning, check for pending milestones and route to `showDiscussQueuedMilestone`.
2. At the `if (allDiscussed)` block (~L650): similarly add pending milestone check before returning.

Commit 9c943f4a3 — roadmap fallback when DB open but empty:
1. In `showDiscuss()`, after `normSlices = getMilestoneSlices(mid).map(...)`, add: `if (normSlices.length === 0 && roadmapContent) { normSlices = parseRoadmapSlices(roadmapContent).map(s => ({ id: s.id, done: s.done, title: s.title })); }`
2. If `parseRoadmapSlices` is not already imported, add `import { parseRoadmapSlices } from "./roadmap-slices.js"`.

Tests:
- NEW: `src/resources/extensions/hx/tests/guided-flow-session-isolation.test.ts` (97 lines): imports `setPendingAutoStart`, `clearPendingAutoStart`, `getDiscussionMilestoneId` from `../guided-flow.ts`. Tests that separate basePaths get isolated state.
- NEW: `src/resources/extensions/hx/tests/guided-flow-dynamic-routing.test.ts` (135 lines): structural assertion that `dispatchWorkflow` source uses `selectAndApplyModel`.
- APPEND: `src/resources/extensions/hx/tests/discuss-queued-milestones.test.ts` — append tests 12 and 13 (44 lines from upstream diff, adapt `.gsd`→`.hx`).
- NEW: `src/resources/extensions/hx/tests/discuss-empty-db-fallback.test.ts` (127 lines): pure unit test of `parseRoadmapSlices` fallback logic, adapt `.gsd`→`.hx` paths.
  - Estimate: 2h
  - Files: src/resources/extensions/hx/guided-flow.ts, src/resources/extensions/hx/tests/guided-flow-session-isolation.test.ts, src/resources/extensions/hx/tests/guided-flow-dynamic-routing.test.ts, src/resources/extensions/hx/tests/discuss-queued-milestones.test.ts, src/resources/extensions/hx/tests/discuss-empty-db-fallback.test.ts
  - Verify: npx tsc --noEmit && node --test dist-test/src/resources/extensions/hx/tests/guided-flow-session-isolation.test.js dist-test/src/resources/extensions/hx/tests/guided-flow-dynamic-routing.test.js dist-test/src/resources/extensions/hx/tests/discuss-queued-milestones.test.js dist-test/src/resources/extensions/hx/tests/discuss-empty-db-fallback.test.js
- [x] **T03: Port 5 DB/dispatch micro-fixes: milestone title preservation, stale-validation invalidation, verification gate widening, run-uat artifact path alignment, and roadmap H3 parser broadening** — Port 5 small independent commits: 0a6d1e52d, 4c12ba34a, b7236743c, ca6071ad3, a26f187e0.

Commit 0a6d1e52d — preserve milestone title in upsertMilestonePlanning:
1. `hx-db.ts` line ~1168: Change signature to `upsertMilestonePlanning(milestoneId: string, planning: Partial<MilestonePlanningRecord>, title?: string): void`. In the SQL UPDATE, add `title = COALESCE(:title, title),` after `SET`. In `.run()`, add `":title": title ?? null,`.
2. `tools/plan-milestone.ts`: Change `upsertMilestonePlanning(params.milestoneId, {...})` to `upsertMilestonePlanning(params.milestoneId, {...}, params.title)`.

Commit 4c12ba34a — invalidate stale milestone validation on roadmap reassessment:
1. `tools/reassess-roadmap.ts`: Add `import { existsSync, unlinkSync } from "node:fs"` if not present. After the `for (const removedId of params.sliceChanges.removed)` loop in the DB transaction, add a `hasStructuralChanges` block calling `deleteAssessmentByScope(params.milestoneId, "milestone-validation")` (already in hx-db.ts at L2011 — just import it). After the render block, add VALIDATION.md file deletion: `join(basePath, ".hx", "milestones", params.milestoneId, "VALIDATION.md")`.

Commit b7236743c — widen completing-milestone gate:
1. `auto-dispatch.ts`: Add exported `isVerificationNotApplicable(value: string): boolean` helper that returns true for empty string, "none", "n/a", "not applicable" (case-insensitive). Replace the gate condition at ~L675 from `milestone.verification_operational.toLowerCase() !== "none"` to `!isVerificationNotApplicable(milestone.verification_operational)`.

Commit ca6071ad3 — align run-uat artifact path to ASSESSMENT:
1. `auto-artifact-paths.ts` in `resolveExpectedArtifactPath`, case `"run-uat"`: change `buildSliceFileName(sid!, "UAT")` to `buildSliceFileName(sid!, "ASSESSMENT")`.
2. `auto-artifact-paths.ts` in `diagnoseExpectedArtifact`, case `"run-uat"`: change `relSliceFile(base, mid, sid!, "UAT")` to `relSliceFile(base, mid, sid!, "ASSESSMENT")`.
3. `auto-prompts.ts`: Change `relSliceFile(base, mid, sliceId, "UAT")` in the `uatResultPath` assignment to `relSliceFile(base, mid, sliceId, "ASSESSMENT")`.

Commit a26f187e0 — roadmap H3 header parser:
1. `roadmap-slices.ts` in `parseProseSliceHeaders()` at L224: Broaden `headerPattern` regex to also accept optional leading whitespace, numeric prefixes like `1.`, parenthetical numbering like `(3)`, and square brackets like `[S01]`. New regex should be something like: `/^\s*(?:\d+\.\s+|\(\d+\)\s+)?#{1,4}\s+\*{0,2}(?:✓\s+)?(?:Slice\s+)?(S\d+)\*{0,2}[:\s.—–-]*\s*(.+)/gm` or adapt to match the upstream diff exactly.

Tests:
- NEW: `src/resources/extensions/hx/tests/plan-milestone-title.test.ts` (70 lines, adapt `.gsd`→`.hx`, `gsd-db`→`hx-db`, `GSD_STALE_STATE`→`HX_STALE_STATE`)
- APPEND: `src/resources/extensions/hx/tests/reassess-handler.test.ts` — append the `#2957` test block (117 lines, adapt hx paths, `HX_STALE_STATE`)
- NEW: `src/resources/extensions/hx/tests/verification-operational-gate.test.ts` (82 lines, import `isVerificationNotApplicable` from `../auto-dispatch.ts`)
- APPEND: `src/resources/extensions/hx/tests/roadmap-slices.test.ts` — append 97-line test block for new format variants
  - Estimate: 1.5h
  - Files: src/resources/extensions/hx/hx-db.ts, src/resources/extensions/hx/tools/plan-milestone.ts, src/resources/extensions/hx/tools/reassess-roadmap.ts, src/resources/extensions/hx/auto-dispatch.ts, src/resources/extensions/hx/auto-artifact-paths.ts, src/resources/extensions/hx/auto-prompts.ts, src/resources/extensions/hx/roadmap-slices.ts, src/resources/extensions/hx/tests/plan-milestone-title.test.ts, src/resources/extensions/hx/tests/reassess-handler.test.ts, src/resources/extensions/hx/tests/verification-operational-gate.test.ts, src/resources/extensions/hx/tests/roadmap-slices.test.ts
  - Verify: npx tsc --noEmit && node --test dist-test/src/resources/extensions/hx/tests/plan-milestone-title.test.js dist-test/src/resources/extensions/hx/tests/reassess-handler.test.js dist-test/src/resources/extensions/hx/tests/verification-operational-gate.test.js dist-test/src/resources/extensions/hx/tests/roadmap-slices.test.js
- [x] **T04: Fixed reassess-roadmap disk→DB reconciliation re-inserting deleted slices by removing slice directories before renderAllProjections(); all 56 T03 tests now pass** — Port commits 939c98c2c, 28d39c3fd, 188dd2e86, 5f7f476a6.

Commit 939c98c2c — resolve bare model IDs to anthropic over claude-code provider:
In `auto-model-selection.ts` in `resolveModelId()`, replace the bare-ID resolution block (~L228-231):
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

Commit 28d39c3fd — move selectAndApplyModel before updateProgressWidget:
In `auto/phases.ts` in `runUnitPhase()`: move the `selectAndApplyModel(...)` block (currently at ~L1005) to BEFORE the `updateProgressWidget(...)` call at ~L936. Keep the block structure identical.

Commit 188dd2e86 — defer model validation until after extensions register:
1. Create new file `src/startup-model-validation.ts` (78 lines). This file exports `validateConfiguredModel(modelRegistry, settingsManager)` default function. References `getPiDefaultModelAndProvider` from `./pi-migration.js` (same in hx, no rename). No GSD naming needed.
2. `src/cli.ts`: Remove the inline model validation block (~30 lines). Add `import validateConfiguredModel from './startup-model-validation.js'`. Add two calls to `validateConfiguredModel(modelRegistry, settingsManager)` — one in the print-mode path and one in the interactive-mode path — both AFTER `createAgentSession()` (look for `markStartup('createAgentSession')` at L492/L499 and L626/L633 as anchor points).

Commit 5f7f476a6 — Codex/Gemini CLI provider routes + rate-limit cap:
1. `doctor-providers.ts`: In `PROVIDER_ROUTES`, add `"openai-codex"` to the openai alternatives array and add `google: ["google-gemini-cli"]` entry.
2. `bootstrap/agent-end-recovery.ts`: After the `cls` classification block, add: `if (cls.kind === "rate-limit") { const currentProvider = ctx.model?.provider; if (currentProvider === "openai-codex" || currentProvider === "google-gemini-cli") { cls.retryAfterMs = Math.min(cls.retryAfterMs, 30_000); } }`

Tests:
- APPEND: `src/resources/extensions/hx/tests/auto-model-selection.test.ts` — append 72-line test block for bare model ID resolution
- APPEND: `src/resources/extensions/hx/tests/auto-loop.test.ts` — append 29-line structural test asserting `selectAndApplyModel` appears before `updateProgressWidget`
- NEW: `src/tests/extension-model-validation.test.ts` (169 lines, no GSD naming)
- NEW: `src/resources/extensions/hx/tests/cli-provider-rate-limit.test.ts` (47 lines, tests rate-limit cap logic)
- APPEND: `src/resources/extensions/hx/tests/doctor-providers.test.ts` — append 117-line test block for new provider routes
  - Estimate: 2h
  - Files: src/resources/extensions/hx/auto-model-selection.ts, src/resources/extensions/hx/auto/phases.ts, src/startup-model-validation.ts, src/cli.ts, src/resources/extensions/hx/doctor-providers.ts, src/resources/extensions/hx/bootstrap/agent-end-recovery.ts, src/resources/extensions/hx/tests/auto-model-selection.test.ts, src/resources/extensions/hx/tests/auto-loop.test.ts, src/tests/extension-model-validation.test.ts, src/resources/extensions/hx/tests/cli-provider-rate-limit.test.ts, src/resources/extensions/hx/tests/doctor-providers.test.ts
  - Verify: npx tsc --noEmit && node --test dist-test/src/resources/extensions/hx/tests/auto-model-selection.test.js dist-test/src/resources/extensions/hx/tests/cli-provider-rate-limit.test.js dist-test/src/resources/extensions/hx/tests/doctor-providers.test.js
- [x] **T05: Port 4 upstream commits: long-context 429 quota classification + model downgrade, pauseTurn stop reason, OAuth API key in memory LLM calls, and claude-code provider made stateful** — Port commits 0c13d3b93, e6d712c07, c48a80383, a301473d9. No GSD→HX naming needed for package-level code.

Commit 0c13d3b93 — classify long-context 429 as quota_exhausted:
1. `packages/pi-coding-agent/src/core/retry-handler.ts`:
   a. Widen `isRetryableError()` regex to include `|extra usage is required` at the end.
   b. In `_classifyErrorType()`, add BEFORE the generic `quota|billing` regex: `if (/extra usage is required|long context required/i.test(err)) return "quota_exhausted"`.
   c. In the `quota_exhausted` branch of the retry handler, add `const downgraded = this._tryLongContextDowngrade(message); if (downgraded) return true;`
   d. Add new private method `_tryLongContextDowngrade(message: AssistantMessage): boolean` that strips `[1m]` suffix from modelId, finds base model in registry, switches model via `ctx.onModelChange`, emits a fallback event, returns true if switch succeeded.
2. NEW: `packages/pi-coding-agent/src/core/retry-handler.test.ts` (255 lines): tests the new classification. No GSD naming.

Commit e6d712c07 — handle pause_turn stop reason:
1. `packages/pi-ai/src/types.ts`: Add `"pauseTurn"` to `StopReason` union (currently `"stop" | "length" | "toolUse" | "error" | "aborted"`). Update the `done` event type to include `"pauseTurn"` in the `Extract<StopReason, ...>` discriminant.
2. `packages/pi-ai/src/providers/anthropic-shared.ts`: Change `case "pause_turn": return "stop"` (at line ~504) to `return "pauseTurn"`.
3. `packages/pi-agent-core/src/agent-loop.ts`: In the `hasMoreToolCalls` assignment at L236, change `toolCalls.length > 0` to `toolCalls.length > 0 || message.stopReason === "pauseTurn"`.
4. NEW: `packages/pi-agent-core/src/agent-loop.test.ts` (45 lines): structural test for `pauseTurn` handling.

Commit c48a80383 — OAuth API key in buildMemoryLLMCall:
1. `src/resources/extensions/hx/memory-extractor.ts` in `buildMemoryLLMCall()`: Add `const resolvedKeyPromise = ctx.modelRegistry.getApiKey(selectedModel).catch(() => undefined)` before the returned async function. Inside the returned function, add `const resolvedApiKey = await resolvedKeyPromise` and spread `...(resolvedApiKey ? { apiKey: resolvedApiKey } : {})` into the `completeSimple` options.
2. APPEND: `src/resources/extensions/hx/tests/memory-extractor.test.ts` — append 87-line test block for OAuth key resolution.

Commit a301473d9 — claude-code provider stateful:
1. `src/resources/extensions/claude-code-cli/stream-adapter.ts`: Substantial rewrite:
   a. Remove imports for `SDKSystemMessage`, `SDKStatusMessage`, `SDKUserMessage`.
   b. Replace `extractLastUserPrompt()` with two functions: `extractMessageText(msg)` and `buildPromptFromContext(context)`.
   c. Add exported `buildSdkOptions(modelId, prompt)` function.
   d. In the main stream function: replace `extractLastUserPrompt(context)` with `buildPromptFromContext(context)`. Replace inline options object with `...sdkOpts` spread from `buildSdkOptions()`. Change `persistSession: false` to `persistSession: true`. Remove `parent_tool_use_id !== null` filter blocks.
2. `src/resources/extensions/claude-code-cli/tests/stream-adapter.test.ts`: Substantial expansion (currently 21 lines → ~130 lines).

After all changes: run full test suite from worktree with node_modules symlink and verify ≥3100/3103 pass and zero new GSD naming in modified files.
  - Estimate: 2h
  - Files: packages/pi-coding-agent/src/core/retry-handler.ts, packages/pi-coding-agent/src/core/retry-handler.test.ts, packages/pi-agent-core/src/agent-loop.ts, packages/pi-agent-core/src/agent-loop.test.ts, packages/pi-ai/src/types.ts, packages/pi-ai/src/providers/anthropic-shared.ts, src/resources/extensions/hx/memory-extractor.ts, src/resources/extensions/hx/tests/memory-extractor.test.ts, src/resources/extensions/claude-code-cli/stream-adapter.ts, src/resources/extensions/claude-code-cli/tests/stream-adapter.test.ts
  - Verify: npx tsc --noEmit && node scripts/compile-tests.mjs && node --test dist-test/src/resources/extensions/hx/tests/memory-extractor.test.js dist-test/src/resources/extensions/claude-code-cli/tests/stream-adapter.test.js && grep -r 'gsd\|GSD' src/resources/extensions/hx/milestone-validation-gates.ts src/resources/extensions/hx/guided-flow.ts src/startup-model-validation.ts 2>/dev/null | grep -v 'migrate-gsd-to-hx' | wc -l | grep '^0$'
