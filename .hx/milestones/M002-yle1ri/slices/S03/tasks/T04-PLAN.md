---
estimated_steps: 34
estimated_files: 11
skills_used: []
---

# T04: Model/provider routing fixes (4 commits)

Port commits 939c98c2c, 28d39c3fd, 188dd2e86, 5f7f476a6.

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

## Inputs

- `src/resources/extensions/hx/auto-model-selection.ts`
- `src/resources/extensions/hx/auto/phases.ts`
- `src/cli.ts`
- `src/resources/extensions/hx/doctor-providers.ts`
- `src/resources/extensions/hx/bootstrap/agent-end-recovery.ts`
- `src/resources/extensions/hx/tests/auto-model-selection.test.ts`
- `src/resources/extensions/hx/tests/auto-loop.test.ts`
- `src/resources/extensions/hx/tests/doctor-providers.test.ts`

## Expected Output

- `src/startup-model-validation.ts`
- `src/resources/extensions/hx/auto-model-selection.ts`
- `src/resources/extensions/hx/auto/phases.ts`
- `src/cli.ts`
- `src/resources/extensions/hx/doctor-providers.ts`
- `src/resources/extensions/hx/bootstrap/agent-end-recovery.ts`
- `src/tests/extension-model-validation.test.ts`
- `src/resources/extensions/hx/tests/cli-provider-rate-limit.test.ts`

## Verification

npx tsc --noEmit && node --test dist-test/src/resources/extensions/hx/tests/auto-model-selection.test.js dist-test/src/resources/extensions/hx/tests/cli-provider-rate-limit.test.js dist-test/src/resources/extensions/hx/tests/doctor-providers.test.js
