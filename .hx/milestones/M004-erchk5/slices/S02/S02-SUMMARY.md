---
id: S02
parent: M004-erchk5
milestone: M004-erchk5
provides:
  - Ollama native /api/chat NDJSON streaming provider (ollama-chat) registered and available
  - Flat-rate routing guard active for github-copilot/ prefix models
  - ollama_manage tool: list/pull/remove/show via Ollama REST API
  - model fallback race fixed — appliedModel never null when startModel identified
  - 9 ollama-chat tests + 5 flat-rate guard tests as regression coverage
requires:
  []
affects:
  - S03
  - S04
  - S05
key_files:
  - packages/pi-ai/src/providers/ollama-chat.ts
  - packages/pi-ai/src/types.ts
  - packages/pi-ai/src/providers/register-builtins.ts
  - packages/pi-ai/src/index.ts
  - packages/pi-coding-agent/src/core/model-registry.ts
  - src/resources/extensions/hx/tests/ollama-chat.test.ts
  - src/resources/extensions/hx/bootstrap/register-extension.ts
  - src/resources/extensions/hx/bootstrap/ollama-manage-tool.ts
  - src/resources/extensions/hx/model-router.ts
  - src/resources/extensions/hx/auto-model-selection.ts
  - src/resources/extensions/hx/tests/model-router.test.ts
key_decisions:
  - streamSimpleOllamaChat strips apiKey before forwarding — Ollama is keyless local service
  - pi.registerProvider('ollama',{authMode:'none'}) is required for isProviderRequestReady to pass for Ollama models
  - FLAT_RATE_PREFIXES array pattern (not hardcoded if/else) makes adding future flat-rate providers trivial
  - ollama_manage pull uses stream:false to get single JSON response instead of NDJSON
  - appliedModel race fix: set appliedModel=startModel before byId attempt so currentUnitModel is never null when startModel identified
  - ollama_manage extracted to dedicated ollama-manage-tool.ts for separation of concerns
patterns_established:
  - Keyless local provider registration: pi.registerProvider(name, {authMode:'none', api:'...', baseUrl:'...'}) in register-extension.ts
  - Flat-rate guard pattern: FLAT_RATE_PREFIXES string[] + exported isFlatRateModel() + early return before resolveModelForComplexity
  - NDJSON streaming pattern in pi-ai providers: line-by-line parse of fetch() response body with done-chunk for tool calls and token usage
observability_surfaces:
  - ollama_manage tool returns {error: string} when Ollama is not running — visible in tool output
  - Ollama provider emits InferenceMetrics (token counts) from done chunk — surfaced in session stats
  - isFlatRateModel() exported for direct observability in tests and future diagnostics
drill_down_paths:
  - .hx/milestones/M004-erchk5/slices/S02/tasks/T01-SUMMARY.md
  - .hx/milestones/M004-erchk5/slices/S02/tasks/T02-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-04-06T08:07:31.119Z
blocker_discovered: false
---

# S02: Ollama Native Provider + Flat-rate Routing Guard

**Replaced broken OpenAI-compat Ollama shim with native /api/chat NDJSON streaming provider; added flat-rate routing guard for zero-cost providers; created ollama_manage REST tool; fixed model fallback race.**

## What Happened

S02 ported four upstream changes from v2.63.0→v2.64.0 across two tasks.

**T01 — Ollama native provider (packages/pi-ai + model-registry)**

Created `packages/pi-ai/src/providers/ollama-chat.ts` (438 lines) implementing full NDJSON streaming against Ollama's `/api/chat` endpoint. The provider converts the pi-ai Context format to Ollama messages (including image base64 support), streams response line-by-line, emits all AssistantMessageEventStream events (start/text_start/text_delta/text_end/toolcall_start/toolcall_end/done/error), records token usage from the done-chunk, and strips `apiKey` before forwarding since Ollama is keyless. Tool calls arrive in the `done=true` chunk (not in streaming deltas) — handled as a separate code path. Added `'ollama-chat'` to `KnownApi` in `types.ts`, registered it in `register-builtins.ts`, exported from `index.ts`. Fixed `convertDiscoveredModels` in `model-registry.ts` to assign `api:'ollama-chat'` and `baseUrl:'http://localhost:11434'` to discovered Ollama models instead of the broken `api:'openai'` shim. Wrote 9 unit tests with mock fetch covering text streaming, token usage, error paths, tool calls, custom baseUrl, apiKey stripping, and abort handling.

**T02 — Registration, flat-rate guard, ollama_manage tool, fallback race fix**

Wired `pi.registerProvider("ollama", {authMode:"none", api:"ollama-chat", baseUrl:"http://localhost:11434"})` in `register-extension.ts` so discovered Ollama models pass the `isProviderRequestReady` check without an API key — this was the critical missing piece. Created `ollama-manage-tool.ts` (194 lines) with `list/pull/remove/show` subcommands using `fetch()` against the Ollama REST API; gracefully returns `{error:...}` when Ollama is not running; `pull` uses `stream:false` to get a single JSON response rather than NDJSON. Added `FLAT_RATE_PREFIXES` array and `isFlatRateModel()` export to `model-router.ts`; early return in `resolveModelForComplexity` skips cost-based routing for `github-copilot/` models (zero savings from dynamic routing on zero-cost providers). Fixed the `appliedModel` race in `auto-model-selection.ts`: `appliedModel = startModel` is now set before the byId fallback attempt, ensuring `currentUnitModel` is never null when the session-start model was at least identified. Added 5 flat-rate guard tests to `model-router.test.ts` (20 total, up from 15).

**Verification outcome:** tsc --noEmit clean; 1221 files compiled; 9/9 ollama-chat tests pass; 20/20 model-router tests pass; full suite 4312 pass / 3 pre-existing fail / 5 skip. Zero GSD references introduced.

## Verification

All slice-plan verification checks passed:
1. `npx tsc --noEmit` → exit 0, no type errors
2. `node scripts/compile-tests.mjs` → 1221 files compiled, exit 0
3. `node --test dist-test/.../ollama-chat.test.js` → 9/9 pass, exit 0
4. `node --test dist-test/.../model-router.test.js` → 20/20 pass, exit 0
5. `npm run test:unit` → 4312 pass / 3 pre-existing fail / 5 skip
6. GSD naming grep across all 11 modified files → 0 hits

## Requirements Advanced

- R023 — Replaced broken OpenAI-compat Ollama shim with native /api/chat NDJSON streaming provider; added ollama_manage tool; wired provider registration with authMode:none
- R029 — Zero GSD references introduced across all 11 modified files
- R030 — tsc clean, 4312/3/5 test results, 3 failures are pre-existing

## Requirements Validated

- R023 — 9/9 ollama-chat.test.js tests pass covering streaming, tool calls, token usage, custom baseUrl, apiKey stripping, error handling. 20/20 model-router tests pass including 5 flat-rate guard cases. tsc clean.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

None. All planned components implemented as specified. T02 extracted ollama_manage into a dedicated file (ollama-manage-tool.ts) rather than adding to dynamic-tools.ts — this improves separation of concerns without affecting interface or behavior.

## Known Limitations

The derive-state-db performance assertion is a pre-existing flaky test (timing-sensitive, 25ms threshold); it fails under full-suite load but passes in isolation. Not introduced by S02.

## Follow-ups

None. Ollama provider is functional end-to-end. Future: add more providers to FLAT_RATE_PREFIXES as needed (append to array, no code changes).

## Files Created/Modified

- `packages/pi-ai/src/providers/ollama-chat.ts` — New: native /api/chat NDJSON streaming provider (438 lines)
- `packages/pi-ai/src/types.ts` — Added 'ollama-chat' to KnownApi union type
- `packages/pi-ai/src/providers/register-builtins.ts` — Registered ollama-chat provider in builtins map
- `packages/pi-ai/src/index.ts` — Exported streamOllamaChat and streamSimpleOllamaChat
- `packages/pi-coding-agent/src/core/model-registry.ts` — convertDiscoveredModels assigns api:ollama-chat and baseUrl for Ollama providers
- `src/resources/extensions/hx/tests/ollama-chat.test.ts` — New: 9 unit tests for ollama-chat provider with mock fetch
- `src/resources/extensions/hx/bootstrap/register-extension.ts` — Wired pi.registerProvider('ollama', {authMode:'none', api:'ollama-chat', baseUrl:'http://localhost:11434'})
- `src/resources/extensions/hx/bootstrap/ollama-manage-tool.ts` — New: ollama_manage tool with list/pull/remove/show subcommands via Ollama REST API (194 lines)
- `src/resources/extensions/hx/model-router.ts` — Added FLAT_RATE_PREFIXES, isFlatRateModel(), early return guard in resolveModelForComplexity
- `src/resources/extensions/hx/auto-model-selection.ts` — Fixed appliedModel race: set appliedModel=startModel before byId fallback attempt
- `src/resources/extensions/hx/tests/model-router.test.ts` — Added 5 flat-rate guard tests (20 total, up from 15)
