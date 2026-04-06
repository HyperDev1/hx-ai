---
estimated_steps: 9
estimated_files: 5
skills_used: []
---

# T02: Register Ollama provider, add flat-rate guard, ollama_manage tool, and fallback race fix

Wire the ollama-chat provider registration in register-extension.ts; add the flat-rate routing guard to model-router.ts; create the ollama_manage tool (list/pull/remove/show subcommands via Ollama REST API); fix the model fallback race in auto-model-selection.ts; add tests for the flat-rate guard.

Context (flat-rate guard): resolveModelForComplexity does cost-based routing that saves zero cost for GitHub Copilot (all-zero cost). The guard skips routing for providers prefixed "github-copilot/".

Context (ollama_manage tool): Does not exist in hx-ai. Create as a new tool in dynamic-tools.ts or a new file. Use fetch() to Ollama REST API (not spawnSync/execSync) since Ollama has a full REST API: GET /api/tags (list), POST /api/pull (pull), DELETE /api/delete (remove), POST /api/show (show). Register via pi.registerTool() in register-extension.ts.

Context (model fallback race): When autoModeStartModel is set and startModel is found but setModel fails, the byId fallback sets appliedModel=byId only if fallbackOk. If byId is not found at all, appliedModel stays null. Upstream fix ensures appliedModel is set to startModel even if setModel(startModel) returned false (so currentUnitModel isn't null when the session-start model was at least identified). Check if this fix is needed and apply it.

Constraints:
- Use fetch() for ollama_manage REST calls (no spawnSync/execSync, no new npm deps)
- FLAT_RATE_PROVIDERS Set check: modelId.startsWith('github-copilot/') or indexOf('/')!==-1 && modelId.substring(0,slashIdx)==='github-copilot'
- ollama_manage must handle cases where Ollama is not running gracefully (return error object, don't throw)
- Default Ollama baseUrl: http://localhost:11434

## Inputs

- `src/resources/extensions/hx/bootstrap/register-extension.ts`
- `src/resources/extensions/hx/model-router.ts`
- `src/resources/extensions/hx/auto-model-selection.ts`
- `src/resources/extensions/hx/bootstrap/dynamic-tools.ts`
- `src/resources/extensions/hx/tests/model-router.test.ts`
- `packages/pi-ai/src/providers/ollama-chat.ts`

## Expected Output

- `src/resources/extensions/hx/bootstrap/register-extension.ts`
- `src/resources/extensions/hx/model-router.ts`
- `src/resources/extensions/hx/auto-model-selection.ts`
- `src/resources/extensions/hx/bootstrap/dynamic-tools.ts`
- `src/resources/extensions/hx/tests/model-router.test.ts`

## Verification

npx tsc --noEmit && node scripts/compile-tests.mjs && node --test dist-test/src/resources/extensions/hx/tests/model-router.test.js && node --test dist-test/src/resources/extensions/hx/tests/ollama-chat.test.js && npm run test:unit 2>&1 | tail -5
