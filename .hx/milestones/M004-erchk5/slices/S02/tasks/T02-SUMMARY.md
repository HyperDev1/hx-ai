---
id: T02
parent: S02
milestone: M004-erchk5
provides: []
requires: []
affects: []
key_files: ["src/resources/extensions/hx/bootstrap/register-extension.ts", "src/resources/extensions/hx/bootstrap/ollama-manage-tool.ts", "src/resources/extensions/hx/model-router.ts", "src/resources/extensions/hx/auto-model-selection.ts", "src/resources/extensions/hx/tests/model-router.test.ts"]
key_decisions: ["pi.registerProvider('ollama',{authMode:'none',...}) is required so isProviderRequestReady returns true for keyless Ollama", "Flat-rate guard uses a FLAT_RATE_PREFIXES array (not hardcoded if/else) to ease future extension", "ollama_manage pull uses stream:false to get a single JSON response rather than NDJSON", "isFlatRateModel exported from model-router.ts for direct test coverage", "Model fallback race fix: set appliedModel=startModel before byId attempt so it is never null when startModel is identified"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "tsc --noEmit: clean. compile-tests.mjs: 1221 files. model-router.test.js: 20/20 pass (15 existing + 5 new). ollama-chat.test.js: 9/9 pass. npm run test:unit: 4314 pass, 3 fail (same 3 pre-existing as T01 baseline)."
completed_at: 2026-04-06T08:00:38.794Z
blocker_discovered: false
---

# T02: Registered Ollama native provider, added flat-rate routing guard, ollama_manage REST tool, and fixed model fallback race

> Registered Ollama native provider, added flat-rate routing guard, ollama_manage REST tool, and fixed model fallback race

## What Happened
---
id: T02
parent: S02
milestone: M004-erchk5
key_files:
  - src/resources/extensions/hx/bootstrap/register-extension.ts
  - src/resources/extensions/hx/bootstrap/ollama-manage-tool.ts
  - src/resources/extensions/hx/model-router.ts
  - src/resources/extensions/hx/auto-model-selection.ts
  - src/resources/extensions/hx/tests/model-router.test.ts
key_decisions:
  - pi.registerProvider('ollama',{authMode:'none',...}) is required so isProviderRequestReady returns true for keyless Ollama
  - Flat-rate guard uses a FLAT_RATE_PREFIXES array (not hardcoded if/else) to ease future extension
  - ollama_manage pull uses stream:false to get a single JSON response rather than NDJSON
  - isFlatRateModel exported from model-router.ts for direct test coverage
  - Model fallback race fix: set appliedModel=startModel before byId attempt so it is never null when startModel is identified
duration: ""
verification_result: passed
completed_at: 2026-04-06T08:00:38.796Z
blocker_discovered: false
---

# T02: Registered Ollama native provider, added flat-rate routing guard, ollama_manage REST tool, and fixed model fallback race

**Registered Ollama native provider, added flat-rate routing guard, ollama_manage REST tool, and fixed model fallback race**

## What Happened

Wired pi.registerProvider("ollama", {authMode:"none", api:"ollama-chat", baseUrl:"http://localhost:11434"}) in register-extension.ts so discovered Ollama models pass the isProviderRequestReady check without an API key. Created ollama-manage-tool.ts with list/pull/remove/show subcommands using fetch() against the Ollama REST API; gracefully returns {error:...} when Ollama is not running. Added FLAT_RATE_PREFIXES guard in model-router.ts (isFlatRateModel export + early return in resolveModelForComplexity) to skip cost-based routing for github-copilot/ models. Fixed the appliedModel race in auto-model-selection.ts: set appliedModel=startModel before the byId fallback attempt so currentUnitModel is never null when the session-start model was identified. Added 5 flat-rate guard tests to model-router.test.ts.

## Verification

tsc --noEmit: clean. compile-tests.mjs: 1221 files. model-router.test.js: 20/20 pass (15 existing + 5 new). ollama-chat.test.js: 9/9 pass. npm run test:unit: 4314 pass, 3 fail (same 3 pre-existing as T01 baseline).

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx tsc --noEmit` | 0 | ✅ pass | 7800ms |
| 2 | `node scripts/compile-tests.mjs` | 0 | ✅ pass | 14700ms |
| 3 | `node --test dist-test/src/resources/extensions/hx/tests/model-router.test.js` | 0 | ✅ pass (20/20) | 1800ms |
| 4 | `node --test dist-test/src/resources/extensions/hx/tests/ollama-chat.test.js` | 0 | ✅ pass (9/9) | 1700ms |
| 5 | `npm run test:unit 2>&1 | tail -5` | 1 | ✅ pass (4314/4317, 3 pre-existing) | 162800ms |


## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `src/resources/extensions/hx/bootstrap/register-extension.ts`
- `src/resources/extensions/hx/bootstrap/ollama-manage-tool.ts`
- `src/resources/extensions/hx/model-router.ts`
- `src/resources/extensions/hx/auto-model-selection.ts`
- `src/resources/extensions/hx/tests/model-router.test.ts`


## Deviations
None.

## Known Issues
None.
