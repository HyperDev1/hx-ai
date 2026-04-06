# S02: Ollama Native Provider + Flat-rate Routing Guard

**Goal:** Port Ollama native /api/chat provider and flat-rate routing guard from upstream v2.63.0→v2.64.0. Replace the broken OpenAI-compat Ollama shim with a real NDJSON streaming provider; register it so discovered Ollama models route correctly; guard cost-based dynamic routing from triggering on zero-cost flat-rate providers like GitHub Copilot; add the ollama_manage tool (list/pull/remove/show); fix the model fallback race in auto-model-selection.
**Demo:** After this: After this: Ollama native provider registered; flat-rate guard active; model fallback race fixed; tsc clean

## Tasks
- [x] **T01: Added Ollama native /api/chat NDJSON streaming provider (ollama-chat) to pi-ai and fixed model-registry to assign it to discovered Ollama models** — Create the native Ollama /api/chat NDJSON streaming provider, register it in the pi-ai package, and update model-registry to assign api:"ollama-chat" and the configured baseUrl to discovered Ollama models.

Context: Currently all discovered models get api:"openai" in convertDiscoveredModels, which routes Ollama models to openai-completions which throws "No API key for provider: ollama". We need (1) a real provider file, (2) KnownApi type update, (3) register-builtins wiring, (4) index.ts export, and (5) convertDiscoveredModels fix.
  - Estimate: 1h
  - Files: packages/pi-ai/src/types.ts, packages/pi-ai/src/providers/ollama-chat.ts, packages/pi-ai/src/providers/register-builtins.ts, packages/pi-ai/src/index.ts, packages/pi-coding-agent/src/core/model-registry.ts, src/resources/extensions/hx/tests/ollama-chat.test.ts
  - Verify: npx tsc --noEmit && node scripts/compile-tests.mjs && node --test dist-test/src/resources/extensions/hx/tests/ollama-chat.test.js
- [x] **T02: Registered Ollama native provider, added flat-rate routing guard, ollama_manage REST tool, and fixed model fallback race** — Wire the ollama-chat provider registration in register-extension.ts; add the flat-rate routing guard to model-router.ts; create the ollama_manage tool (list/pull/remove/show subcommands via Ollama REST API); fix the model fallback race in auto-model-selection.ts; add tests for the flat-rate guard.

Context (flat-rate guard): resolveModelForComplexity does cost-based routing that saves zero cost for GitHub Copilot (all-zero cost). The guard skips routing for providers prefixed "github-copilot/".

Context (ollama_manage tool): Does not exist in hx-ai. Create as a new tool in dynamic-tools.ts or a new file. Use fetch() to Ollama REST API (not spawnSync/execSync) since Ollama has a full REST API: GET /api/tags (list), POST /api/pull (pull), DELETE /api/delete (remove), POST /api/show (show). Register via pi.registerTool() in register-extension.ts.

Context (model fallback race): When autoModeStartModel is set and startModel is found but setModel fails, the byId fallback sets appliedModel=byId only if fallbackOk. If byId is not found at all, appliedModel stays null. Upstream fix ensures appliedModel is set to startModel even if setModel(startModel) returned false (so currentUnitModel isn't null when the session-start model was at least identified). Check if this fix is needed and apply it.

Constraints:
- Use fetch() for ollama_manage REST calls (no spawnSync/execSync, no new npm deps)
- FLAT_RATE_PROVIDERS Set check: modelId.startsWith('github-copilot/') or indexOf('/')!==-1 && modelId.substring(0,slashIdx)==='github-copilot'
- ollama_manage must handle cases where Ollama is not running gracefully (return error object, don't throw)
- Default Ollama baseUrl: http://localhost:11434
  - Estimate: 1.5h
  - Files: src/resources/extensions/hx/bootstrap/register-extension.ts, src/resources/extensions/hx/model-router.ts, src/resources/extensions/hx/auto-model-selection.ts, src/resources/extensions/hx/bootstrap/dynamic-tools.ts, src/resources/extensions/hx/tests/model-router.test.ts
  - Verify: npx tsc --noEmit && node scripts/compile-tests.mjs && node --test dist-test/src/resources/extensions/hx/tests/model-router.test.js && node --test dist-test/src/resources/extensions/hx/tests/ollama-chat.test.js && npm run test:unit 2>&1 | tail -5
