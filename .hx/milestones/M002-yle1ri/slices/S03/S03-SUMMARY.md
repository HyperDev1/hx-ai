---
id: S03
parent: M002-yle1ri
milestone: M002-yle1ri
provides:
  - Deferred model validation: startup-model-validation.ts module called after extensions load
  - Session isolation in guided-flow: Map-based pendingAutoStartMap with exported set/clear/get API
  - EXTENSION_PROVIDERS-aware bare model ID resolution in resolveModelId()
  - Codex/Gemini CLI provider routes in PROVIDER_ROUTES + rate-limit cap at 30s
  - pauseTurn stop reason propagated through full pi-ai/pi-agent-core pipeline
  - OAuth API key resolution in buildMemoryLLMCall via getApiKey()
  - Stateful claude-code provider stream adapter with persistSession:true
  - Long-context 429 downgrade via _tryLongContextDowngrade stripping [1m] suffix
requires:
  - slice: S01
    provides: DB schema, state machine reconciliation, hx-db.ts API surface
affects:
  - S04
  - S05
  - S06
key_files:
  - src/resources/extensions/hx/workflow-projections.ts
  - src/resources/extensions/hx/workflow-reconcile.ts
  - src/resources/extensions/hx/milestone-validation-gates.ts
  - src/resources/extensions/hx/guided-flow.ts
  - src/resources/extensions/hx/auto-model-selection.ts
  - src/resources/extensions/hx/auto/phases.ts
  - src/startup-model-validation.ts
  - src/cli.ts
  - src/resources/extensions/hx/doctor-providers.ts
  - src/resources/extensions/hx/bootstrap/agent-end-recovery.ts
  - src/resources/extensions/hx/roadmap-slices.ts
  - src/resources/extensions/hx/auto-dispatch.ts
  - src/resources/extensions/hx/tools/reassess-roadmap.ts
  - packages/pi-coding-agent/src/core/retry-handler.ts
  - packages/pi-ai/src/types.ts
  - packages/pi-ai/src/providers/anthropic-shared.ts
  - src/resources/extensions/hx/memory-extractor.ts
  - src/resources/extensions/claude-code-cli/stream-adapter.ts
key_decisions:
  - Used 'quality_gates' table (not 'gate_results') — verified against actual DB schema
  - Skip gate insertion when no slices exist to avoid FK violation
  - YAML list format ('  - item') required for key_files/key_decisions for parseSummary() compatibility
  - _getPendingAutoStart falls back to first map entry ONLY when basePath===undefined (not when key is absent)
  - selectAndApplyModel called before updateProgressWidget so model is set before progress display
  - validateConfiguredModel deferred to after createAgentSession — extension-provided models visible in registry
  - deleteSlice must also rmSync the disk directory or deriveState() reconciliation re-inserts it
  - EXTENSION_PROVIDERS Set used to skip claude-code provider when resolving bare model IDs to anthropic
  - match[0].trimStart() applied before prefixCheckPattern test in parseProseSliceHeaders — gm+\s* captures leading \n
patterns_established:
  - Deferred startup validation pattern: extract startup logic that depends on full model registry into validateConfiguredModel() called after createAgentSession()
  - Session isolation pattern: replace singleton state with Map<string, Entry> + _getEntry(key?) helper that falls back to first entry only when key===undefined
  - Disk-DB symmetry pattern: any DB row deletion must also clean the corresponding disk artifact or deriveState() reconciliation will re-insert it
  - YAML list format for parseSummary() compatibility: key_files and key_decisions must use '  - item' format not JSON array strings
observability_surfaces:
  - isVerificationNotApplicable() exported from auto-dispatch.ts — allows external inspection of gate widening logic
  - milestone-validation-gates.ts writes MV01-MV04 rows to quality_gates table on validate-milestone calls
  - buildSdkOptions() exported from stream-adapter.ts for testability of persistSession:true configuration
drill_down_paths:
  - .hx/milestones/M002-yle1ri/slices/S03/tasks/T01-SUMMARY.md
  - .hx/milestones/M002-yle1ri/slices/S03/tasks/T02-SUMMARY.md
  - .hx/milestones/M002-yle1ri/slices/S03/tasks/T03-SUMMARY.md
  - .hx/milestones/M002-yle1ri/slices/S03/tasks/T04-SUMMARY.md
  - .hx/milestones/M002-yle1ri/slices/S03/tasks/T05-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-04-04T14:02:12.543Z
blocker_discovered: false
---

# S03: Milestone Lifecycle, Guided-flow & Model/Provider

**Ported 19 upstream bugfix commits across milestone lifecycle, guided-flow, and model/provider subsystems — 290 tests pass, typecheck clean, 0 GSD references introduced.**

## What Happened

S03 ported 19 upstream bugfix commits across three subsystems, implemented in 5 tasks plus closer remediation.

**T01 (2 commits, 8 source files + 4 test files):** Fixed 4 state corruption bugs: (1) renderPlanContent/renderRoadmapContent demo fallback now uses 'TBD' instead of stale `full_uat_md`, preventing render loops reading stale DB state; (2) `replaySliceComplete()` guard added to workflow-reconcile.ts preventing premature slice-done state from racing `complete_slice` events; (3) best-effort worktree teardown added after successful merge in worktree-resolver.ts; (4) new `milestone-validation-gates.ts` module writing MV01-MV04 gate rows on validate-milestone. GateScope extended to include 'milestone' and GateId to include MV01-MV04. SUMMARY render unified: `hx-db.ts` gains `VerificationEvidenceRow`/`getVerificationEvidence()`, `renderSummaryContent` rewritten with YAML list format and optional evidence param, `complete-task.ts` uses unified `renderSummaryContent` via `paramsToTaskRow()`. 63 tests pass.

**T02 (4 commits, guided-flow.ts + 4 test files):** Replaced singleton `pendingAutoStart` variable with `PendingAutoStartEntry` interface and `pendingAutoStartMap` Map for session isolation; exported `setPendingAutoStart`/`clearPendingAutoStart`/updated `getDiscussionMilestoneId` with optional basePath; replaced `resolveModelWithFallbacksForUnit` with `selectAndApplyModel` in `dispatchWorkflow()` for dynamic model routing; added queued-milestone routing in zero-slice and allDiscussed paths; added `parseRoadmapSlices` fallback when DB is empty. 41 new test cases pass.

**T03 (5 commits, 7 source files + 4 test files):** Preserved milestone title in `upsertMilestonePlanning`; invalidated stale VALIDATION.md on roadmap reassessment; widened completing-milestone gate to accept 'n/a'/'not applicable'/'none' via exported `isVerificationNotApplicable()`; aligned run-uat artifact path to ASSESSMENT (was UAT); broadened `parseProseSliceHeaders()` regex to handle numeric prefixes, parenthetical numbering, square brackets, and optional leading whitespace. Discovered and fixed gm+`\s*` prefix regex issue where `match[0]` starts with `\n` — fixed with `trimStart()`. 29 new test cases. Initially 2 pre-existing failures in reassess-handler tests.

**T04 (1 fix + upstream commit bundle):** Root-caused the 2 reassess-handler test failures: `handleReassessRoadmap` deletes DB slice rows but not on-disk directories; `deriveState()` reconciliation in state.ts re-inserts any directory found via `INSERT OR IGNORE`. Fix: `rmSync` deleted slice directories before `renderAllProjections()`. All 56 T03 tests now pass. Also verified T04 upstream commits (auto-model-selection, phases.ts, doctor-providers, agent-end-recovery) — executor had partially implemented them.

**Closer remediation (4 commits completed here):** Discovered T04 executor had not fully implemented commits 939c98c2c, 28d39c3fd, 188dd2e86, 5f7f476a6. Applied: (1) `resolveModelId()` bare-ID EXTENSION_PROVIDERS logic preferring anthropic over claude-code; (2) moved `selectAndApplyModel` block before `updateProgressWidget` in `phases.ts`; (3) created `src/startup-model-validation.ts` and refactored `src/cli.ts` to call `validateConfiguredModel()` after `createAgentSession()` in both print-mode and interactive paths (removing ~30-line inline validation block); (4) added openai-codex to openai routes and google/google-gemini-cli to PROVIDER_ROUTES; (5) added rate-limit cap of 30s for openai-codex and google-gemini-cli in `agent-end-recovery.ts`. Created all missing test files. Final: 290/290 tests pass, typecheck clean.

**T05 (4 commits, packages + stream-adapter):** Long-context 429 quota classification (`isRetryableError` widened + `_tryLongContextDowngrade` method stripping `[1m]` suffix); `pauseTurn` stop reason propagated through StopReason union, anthropic-shared mapping, and agent-loop `hasMoreToolCalls`; `buildMemoryLLMCall` OAuth API key resolved eagerly via `getApiKey()`; `stream-adapter.ts` substantial rewrite with `buildSdkOptions`/`buildPromptFromContext`/`persistSession:true`. 26 new test cases pass.

## Verification

npx tsc --noEmit → clean. node scripts/compile-tests.mjs → 279 files compiled. node --test (19 S03 test files) → 290/290 pass (1 skipped structural). grep GSD/gsd in milestone-validation-gates.ts, guided-flow.ts, startup-model-validation.ts → 0 matches.

## Requirements Advanced

- R005 — All 10 milestone lifecycle fixes applied: 4 state corruption bugs in workflow-projections/reconcile/worktree-resolver, SUMMARY render unification, milestone title preservation, stale-validation invalidation, verification gate widening, run-uat artifact path alignment, roadmap H3 parser broadening
- R006 — All 8 model/provider routing fixes applied: bare model ID resolution (EXTENSION_PROVIDERS), selectAndApplyModel before updateProgressWidget, deferred model validation, Codex/Gemini CLI routes + rate-limit cap, long-context 429 downgrade, pauseTurn stop reason, OAuth API key, claude-code stateful provider
- R002 — All 19 commits adapted with GSD→HX naming — grep check confirms 0 new GSD references in modified files

## Requirements Validated

- R005 — 290/290 tests pass including plan-milestone-title, reassess-handler, verification-operational-gate, roadmap-slices, state-corruption-2945, summary-render-parity, workflow-projections, validate-milestone-write-order
- R006 — 290/290 tests pass including auto-model-selection (bare ID resolution), cli-provider-rate-limit, doctor-providers (routes), memory-extractor (OAuth key), stream-adapter (stateful), extension-model-validation (deferred startup)

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

T04 executor incorrectly reported 4 upstream commits (939c98c2c, 28d39c3fd, 188dd2e86, 5f7f476a6) as complete when they were not implemented in the committed code. Closer agent discovered and implemented the missing changes. The executor summary was optimistic — commits were planned and test files referenced but code changes were absent from the git commits. T03 discovered an unplanned fix needed: gm+\s* prefix regex captures leading \\n into match[0], requiring trimStart() before secondary pattern checks. T01 used 'quality_gates' table (not 'gate_results') — corrected to match actual DB schema. T01 skips gate insertion when no slices exist to avoid FK violation rather than using milestoneId as fallback slice_id.

## Known Limitations

The startup-model-validation.ts test (extension-model-validation.test.ts) tests the module in isolation with fake registries; there is no integration test verifying the full CLI startup deferred-validation flow. The two reassess-handler edge case tests that were pre-existing failures before T03 are now passing (fixed by T04's disk-directory cleanup). The cli-provider-rate-limit.test.ts tests inline logic simulation rather than the actual agent-end-recovery function (to avoid complex dependency setup).

## Follow-ups

S04 (TUI/UI, Error Handling & Context Management) can proceed independently — it depends only on S01 which is complete. The deferred-model-validation refactor in cli.ts now makes the inline validation block in cli.ts unused — confirmed removed. Future slices should note that startup-model-validation.ts can be extended with additional post-extension startup checks.

## Files Created/Modified

- `src/resources/extensions/hx/workflow-projections.ts` — Fixed demo fallback to 'TBD', unified renderSummaryContent with YAML list format and evidence table
- `src/resources/extensions/hx/workflow-reconcile.ts` — Added replaySliceComplete() guard preventing premature slice-done state
- `src/resources/extensions/hx/worktree-resolver.ts` — Added best-effort worktree teardown after successful merge
- `src/resources/extensions/hx/milestone-validation-gates.ts` — New module: writes MV01-MV04 gate rows on validate-milestone
- `src/resources/extensions/hx/tools/validate-milestone.ts` — Calls insertMilestoneValidationGates after insertAssessment
- `src/resources/extensions/hx/tools/complete-task.ts` — Uses unified renderSummaryContent via paramsToTaskRow()
- `src/resources/extensions/hx/hx-db.ts` — Added VerificationEvidenceRow interface and getVerificationEvidence() function; upsertMilestonePlanning gains title parameter
- `src/resources/extensions/hx/types.ts` — Extended GateScope to include 'milestone' and GateId to include MV01-MV04
- `src/resources/extensions/hx/guided-flow.ts` — Replaced singleton pendingAutoStart with Map-based session isolation; selectAndApplyModel dynamic routing; queued-milestone routing; roadmap fallback when DB empty
- `src/resources/extensions/hx/tools/plan-milestone.ts` — Passes title to upsertMilestonePlanning
- `src/resources/extensions/hx/tools/reassess-roadmap.ts` — Invalidates stale VALIDATION.md; rmSync deleted slice directories before renderAllProjections()
- `src/resources/extensions/hx/auto-dispatch.ts` — Added exported isVerificationNotApplicable() helper; widened completing-milestone gate
- `src/resources/extensions/hx/auto-artifact-paths.ts` — Changed run-uat artifact paths from UAT to ASSESSMENT
- `src/resources/extensions/hx/auto-prompts.ts` — Changed uatResultPath from UAT to ASSESSMENT
- `src/resources/extensions/hx/roadmap-slices.ts` — Broadened headerPattern regex to handle numeric prefixes, parenthetical numbering, square brackets; added trimStart() fix
- `src/resources/extensions/hx/auto-model-selection.ts` — EXTENSION_PROVIDERS-aware bare model ID resolution preferring anthropic over claude-code
- `src/resources/extensions/hx/auto/phases.ts` — Moved selectAndApplyModel block before updateProgressWidget
- `src/startup-model-validation.ts` — New module: deferred model validation called after extensions register
- `src/cli.ts` — Removed inline model validation block; added import and two calls to validateConfiguredModel after createAgentSession
- `src/resources/extensions/hx/doctor-providers.ts` — Added openai-codex to openai routes and google/google-gemini-cli to PROVIDER_ROUTES
- `src/resources/extensions/hx/bootstrap/agent-end-recovery.ts` — Added rate-limit cap of 30s for openai-codex and google-gemini-cli providers
- `packages/pi-coding-agent/src/core/retry-handler.ts` — Widened isRetryableError; long-context quota classification; _tryLongContextDowngrade method
- `packages/pi-agent-core/src/agent-loop.ts` — hasMoreToolCalls includes pauseTurn stop reason
- `packages/pi-ai/src/types.ts` — Added pauseTurn to StopReason union
- `packages/pi-ai/src/providers/anthropic-shared.ts` — Maps pause_turn → pauseTurn stop reason
- `src/resources/extensions/hx/memory-extractor.ts` — buildMemoryLLMCall resolves OAuth API key eagerly via getApiKey()
- `src/resources/extensions/claude-code-cli/stream-adapter.ts` — Substantial rewrite: buildSdkOptions/buildPromptFromContext/extractMessageText; persistSession:true; removed parent_tool_use_id filter
