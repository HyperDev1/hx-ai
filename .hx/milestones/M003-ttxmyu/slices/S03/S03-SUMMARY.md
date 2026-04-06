---
id: S03
parent: M003-ttxmyu
milestone: M003-ttxmyu
provides:
  - context-masker.ts: createObservationMask(keepRecentTurns) — ready for use in any hook or message-processing path
  - phase-anchor.ts: writePhaseAnchor / readPhaseAnchor / formatAnchorForPrompt — ready for use in auto-mode phases
  - ContextManagementConfig: observation_masking, observation_mask_turns, compaction_threshold_percent, tool_result_max_chars in HXPreferences
  - before_provider_request hook: observation masking + tool-result truncation active in auto-mode sessions
  - execute-task.md: {{phaseAnchorSection}} placeholder — plan-slice anchor injected into task agent context
requires:
  - slice: S01
    provides: tsc clean baseline, HXPreferences type infrastructure, capability-routing hook registration pattern
affects:
  - S04 can proceed — no shared files modified that would conflict with workflow-logger or auto-mode hardening changes
  - S05/S06 can proceed — no shared files modified that block MCP reader or misc fixes work
key_files:
  - src/resources/extensions/hx/context-masker.ts
  - src/resources/extensions/hx/phase-anchor.ts
  - src/resources/extensions/hx/tests/context-masker.test.ts
  - src/resources/extensions/hx/tests/phase-anchor.test.ts
  - src/resources/extensions/hx/preferences-types.ts
  - src/resources/extensions/hx/preferences.ts
  - src/resources/extensions/hx/bootstrap/register-hooks.ts
  - src/resources/extensions/hx/auto/phases.ts
  - src/resources/extensions/hx/auto-prompts.ts
  - src/resources/extensions/hx/prompts/execute-task.md
key_decisions:
  - findTurnBoundary returns 0 (mask nothing) when fewer assistant turns than keepRecentTurns exist — correct empty-window semantics
  - isMaskableMessage checks role field only, ignores type field — role:user type:toolResult is NOT masked
  - Masking/truncation guarded by isAutoActive() — non-auto sessions unaffected
  - Lazy dynamic imports in before_provider_request for preferences.js and context-masker.js — avoids circular import at module load time
  - Phase anchor writes are non-fatal (try/catch) — anchor is advisory, auto-mode loop must not fail on disk errors
  - phaseAnchorSection passed as empty string to loadPrompt when no anchor exists — template renders cleanly
  - {{phaseAnchorSection}} placed between runtimeContext and resumeSection — handoff decisions surface before task-specific resume state
  - ContextManagementConfig re-exported from preferences.ts alongside ExperimentalPreferences for consistency
patterns_established:
  - Observation masking pattern: createObservationMask(keepRecentTurns) → pure function → replaces maskable messages older than assistant-turn boundary with [result masked] placeholder
  - Phase anchor pattern: research/plan completion → writePhaseAnchor → .hx/milestones/<mid>/anchors/<phase>.json → read in downstream prompt builder → inject via formatAnchorForPrompt
  - ContextManagementConfig shallow-merge follows the (base || override) ? spread : undefined pattern established by ExperimentalPreferences in mergePreferences
  - Non-fatal dynamic import pattern in hooks: try { const { fn } = await import('...'); ... } catch { /* advisory */ } before required logic
observability_surfaces:
  - Phase anchor files written to .hx/milestones/<mid>/anchors/<phase>.json after each research/plan phase — readable as structured JSON to audit what context was handed off
  - tool_result_max_chars truncation appends '\n…[truncated]' to indicate truncated content in context
drill_down_paths:
  - .hx/milestones/M003-ttxmyu/slices/S03/tasks/T01-SUMMARY.md
  - .hx/milestones/M003-ttxmyu/slices/S03/tasks/T02-SUMMARY.md
  - .hx/milestones/M003-ttxmyu/slices/S03/tasks/T03-SUMMARY.md
  - .hx/milestones/M003-ttxmyu/slices/S03/tasks/T04-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-04-05T16:17:10.195Z
blocker_discovered: false
---

# S03: Context Optimization (Masking + Phase Anchors)

**Ported context-masker.ts and phase-anchor.ts from upstream, wired observation masking + tool-result truncation into before_provider_request, integrated ContextManagementConfig preferences, and wired phase anchor writes/reads across the research→plan→execute boundary.**

## What Happened

S03 ported the two-module context optimization subsystem from upstream gsd-2 into hx-ai across four sequential tasks.

**T01 — Core modules:** Two purely additive source files created with HX naming. `context-masker.ts` exports `createObservationMask(keepRecentTurns=8)`, a pure function that scans messages from the end counting assistant turns and replaces older maskable messages (role:toolResult or bash-result user messages starting with 'Ran \`') with a compact placeholder. Masking is role-based — a user message with type:toolResult is NOT masked. `phase-anchor.ts` exports `PhaseAnchor` interface and three functions: `writePhaseAnchor` (writes JSON to `.hx/milestones/<mid>/anchors/<phase>.json`), `readPhaseAnchor` (returns null for missing files), `formatAnchorForPrompt` (compact markdown block). 11 unit tests across two test files cover all behavioral invariants. Full suite: 4168/0/5, tsc clean, zero GSD tokens.

**T02 — Preferences integration:** Purely additive changes to `preferences-types.ts` and `preferences.ts`. Added `ContextManagementConfig` interface (4 optional fields: observation_masking, observation_mask_turns, compaction_threshold_percent, tool_result_max_chars), registered `context_management` in `KNOWN_PREFERENCE_KEYS`, extended `HXPreferences`, and wired shallow merge in `mergePreferences` using the established `(base || override) ? spread : undefined` pattern. Re-exported `ContextManagementConfig` from `preferences.ts` for consistency with existing config type exports.

**T03 — Hook wiring:** Replaced the existing 8-line `before_provider_request` handler (service-tier only) with a 52-line handler that: (1) guards payload type at the top, (2) when `isAutoActive()`, loads `ContextManagementConfig` via dynamic import and applies `createObservationMask` to `payload.messages`, (3) truncates toolResult content blocks exceeding `tool_result_max_chars` (default 800) using immutable spread, (4) falls through to the unchanged service-tier block. All return statements after mutations carry `payload`. Masking/truncation wrapped in non-fatal try/catch. Dynamic imports used to avoid circular dependency issues at module load time.

**T04 — Phase anchor wiring:** Four files modified to write and inject phase anchors at research/plan phase boundaries. `phases.ts`: anchor write block inserted between `unitRecoveryCount.delete` and `emitJournalEvent`, guarded on `artifactVerified && mid && anchorPhases.has(unitType)`, using dynamic import with try/catch (non-fatal). `auto-prompts.ts`: phase-anchor import added; `buildPlanMilestonePrompt` reads research-milestone anchor and unshifts to front of inlined[]; `buildPlanSlicePrompt` reads research-slice anchor; `buildExecuteTaskPrompt` reads plan-slice anchor and passes `phaseAnchorSection` (empty string when absent) to `loadPrompt`. `execute-task.md`: `{{phaseAnchorSection}}` placeholder added between `{{runtimeContext}}` and `{{resumeSection}}`.

Slice-level verification: 4168/0/5 passing, tsc --noEmit exit 0, zero GSD tokens across all 8 modified/created files, wiring confirmed (createObservationMask count=2, phase-anchor functions count=7 in auto-prompts.ts, phaseAnchorSection count=1 in execute-task.md).

## Verification

Slice-level verification commands run and passed:
1. `npm run test:unit -- --grep 'context-masker|phase-anchor'` → 4168 passed, 0 failed, 5 skipped (exit 0)
2. `npx tsc --noEmit` → exit 0 (clean)
3. `grep -rn '\bGSD\b|\bgsd\b' [all 8 modified/created files]` → exit 1 (no matches)
4. `grep -c 'createObservationMask' register-hooks.ts` → 2 (import + usage)
5. `grep -c 'writePhaseAnchor|readPhaseAnchor|formatAnchorForPrompt' auto-prompts.ts` → 7
6. `grep -c 'phaseAnchorSection' execute-task.md` → 1

## Requirements Advanced

- R013 — context-masker.ts and phase-anchor.ts ported with HX naming; ContextManagementConfig preferences integrated; masking wired into before_provider_request; phase anchors written at research/plan phases and read into plan/execute prompt builders
- R014 — Zero GSD tokens in all 8 modified/created files verified by grep
- R018 — tsc --noEmit exit 0, 4168/0/5 test suite — no new failures introduced

## Requirements Validated

- R013 — context-masker.ts and phase-anchor.ts exist; 11 unit tests pass; masking wired in register-hooks.ts (createObservationMask count=2); phase-anchor wired in phases.ts + auto-prompts.ts + execute-task.md; tsc clean; 4168/0/5

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

findTurnBoundary returns 0 (mask nothing) when fewer than keepRecentTurns assistant turns exist — the condition i < 0 never becomes true when the loop completes without reaching the count. This is the correct behavior for short/fresh sessions and matches upstream intent. The execute-task.md blank line between runtimeContext and resumeSection was absorbed into the phaseAnchorSection insertion — no double blank line; renders cleanly when phaseAnchorSection is empty string.

## Known Limitations

compaction_threshold_percent field is present in ContextManagementConfig but no compaction logic is wired in S03 (upstream wires it separately). It is available as a preference key for future slices. tool_result_max_chars truncation applies per-block not per-message — a message with many short blocks is not truncated even if total exceeds threshold.

## Follow-ups

S04: workflow-logger centralization does not depend on S03 artifacts. S05/S06: no phase-anchor dependencies. compaction_threshold_percent wiring deferred to whenever compaction logic is ported.

## Files Created/Modified

- `src/resources/extensions/hx/context-masker.ts` — New: observation masking pure function — createObservationMask(keepRecentTurns=8)
- `src/resources/extensions/hx/phase-anchor.ts` — New: phase anchor read/write/format functions for research→plan→execute handoff
- `src/resources/extensions/hx/tests/context-masker.test.ts` — New: 7 unit tests covering masking invariants
- `src/resources/extensions/hx/tests/phase-anchor.test.ts` — New: 4 unit tests covering anchor write/read/null/format
- `src/resources/extensions/hx/preferences-types.ts` — Added ContextManagementConfig interface, context_management to KNOWN_PREFERENCE_KEYS, context_management?: ContextManagementConfig to HXPreferences
- `src/resources/extensions/hx/preferences.ts` — Imported and re-exported ContextManagementConfig; added shallow merge for context_management in mergePreferences
- `src/resources/extensions/hx/bootstrap/register-hooks.ts` — Rewrote before_provider_request handler to add observation masking and tool-result truncation before service-tier logic
- `src/resources/extensions/hx/auto/phases.ts` — Added phase anchor write block after research/plan unit completion
- `src/resources/extensions/hx/auto-prompts.ts` — Added phase-anchor import and three anchor-read injections in plan-milestone, plan-slice, execute-task prompt builders
- `src/resources/extensions/hx/prompts/execute-task.md` — Added {{phaseAnchorSection}} placeholder between runtimeContext and resumeSection
