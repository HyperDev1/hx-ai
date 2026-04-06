# S02 Research — Ollama Native Provider + Flat-rate Routing Guard

**Slice:** S02 — Ollama Native Provider + Flat-rate Routing Guard
**Milestone:** M004-erchk5
**Depth:** Targeted — known technology but non-trivial cross-package wiring

## Summary

S02 ports two upstream changes: (1) a native Ollama `/api/chat` NDJSON streaming provider that replaces the broken OpenAI-compat shim, and (2) a flat-rate routing guard that disables cost-based dynamic routing for zero-cost subscription providers like GitHub Copilot. Both are self-contained, testable, and do not touch the safety harness from S01.

---

## Active Requirements Owned

- **R023** — Ollama native `/api/chat` provider; surfaces inference metrics; adds `remove`/`show` to ollama_manage tool; adds `"ollama-chat"` to KnownApi
- **R029** — All new code uses HX naming (no GSD references)
- **R030** — tsc clean; ≥4298 tests pass / 0 new failures

---

## Implementation Landscape

### Current State of Ollama in hx-ai

**Discovery path:** `OllamaDiscoveryAdapter` in `packages/pi-coding-agent/src/core/model-discovery.ts` fetches `/api/tags`, returns models with `input: ["text"]`. The discovery adapter stores `provider = "ollama"`.

**Model registration:** `convertDiscoveredModels()` (line ~858 in `model-registry.ts`) hard-codes `api: "openai" as Api` for ALL discovered providers. Ollama models therefore get api type `"openai"`, which routes them to `openai-completions` handler.

**The crash:** `streamSimpleOpenAICompletions` (line 297–299 in `packages/pi-ai/src/providers/openai-completions.ts`) throws `No API key for provider: ollama` when `OLLAMA_API_KEY` is not set. This is the "streamSimple crash" R023 references.

**`ollama-cloud`:** A separate provider id (`key-manager.ts` line 48) that maps to `OLLAMA_API_KEY` in `env-api-keys.ts` line 140. Not related to local Ollama discovery — it's the Ollama Cloud paid API. Both paths are currently broken in the same way.

**No `ollama-chat` type anywhere** in the codebase yet.

### New Files to Create

**1. `packages/pi-ai/src/providers/ollama-chat.ts`** — The core new provider file.

Structure:
- Export `OllamaOptions extends SimpleStreamOptions` with Ollama-specific params: `temperature`, `top_p`, `top_k`, `repeat_penalty`, `seed`, `num_gpu`, `keep_alive`, `num_predict`
- Export `streamOllamaChat` and `streamSimpleOllamaChat` as `StreamFunction<"ollama-chat", OllamaOptions>`
- Implementation: POST to `${model.baseUrl}/api/chat` with `stream: true`, read NDJSON line-by-line
- Ollama response shape: `{ message: { content, role }, done, done_reason, eval_count, prompt_eval_count, eval_duration, prompt_eval_duration }`
- Tool calls: Ollama `/api/chat` supports `tools` param with OpenAI-compatible format
- Inference metrics: `eval_count` (output tokens), `prompt_eval_count` (input tokens), `eval_duration` (ns), `prompt_eval_duration` (ns) → map to `Usage`
- No API key needed — `authMode: "none"`
- No SDK dependency — pure `fetch` + async NDJSON line reader
- No inference metrics field on `AssistantMessage` yet — store in `usage` (eval_count → output tokens, prompt_eval_count → input tokens); if upstream adds a separate `inferenceMetrics` field to types.ts, match that

Reference pattern: `packages/pi-ai/src/providers/google-gemini-cli.ts` — also fetch-based NDJSON with no SDK.

**2. Add `"ollama-chat"` to `KnownApi` in `packages/pi-ai/src/types.ts`** (line 17, after `"google-vertex"`).

**3. Register in `packages/pi-ai/src/providers/register-builtins.ts`:**
```typescript
import { streamOllamaChat, streamSimpleOllamaChat } from "./ollama-chat.js";
// inside registerBuiltInApiProviders():
registerApiProvider({ api: "ollama-chat", stream: streamOllamaChat, streamSimple: streamSimpleOllamaChat });
```

**4. Export in `packages/pi-ai/src/index.ts`:**
```typescript
export * from "./providers/ollama-chat.js";
```

### Existing Files to Modify

**5. `packages/pi-coding-agent/src/core/model-registry.ts` — `convertDiscoveredModels()`:**

Change `api: "openai" as Api` → `api: (result.provider === "ollama" ? "ollama-chat" : "openai") as Api`

Also update `baseUrl`: currently `""` — for Ollama, the base URL should come from the discovery adapter's `baseUrl` (defaulting to `http://localhost:11434`). The discovery adapter has access to the configured `baseUrl` via the provider config, but `DiscoveryResult` doesn't currently carry it. Check whether `DiscoveryResult` has a `baseUrl` field.

```typescript
grep -n "interface DiscoveryResult" packages/pi-coding-agent/src/core/model-discovery.ts
```
→ If no `baseUrl` on `DiscoveryResult`, the approach is: use `"ollama-chat"` api + let the provider's registered `baseUrl` override. Look at how `registerProvider("ollama", { baseUrl })` flows through.

**6. `src/resources/extensions/hx/bootstrap/register-extension.ts`** — Add call to register the native Ollama provider:
```typescript
pi.registerProvider("ollama", {
  authMode: "none",
  api: "ollama-chat",
  baseUrl: "http://localhost:11434",
});
```
This wires the discovered models to the native handler.

**7. Flat-rate routing guard — `src/resources/extensions/hx/model-router.ts` or `auto-model-selection.ts`:**

GitHub Copilot models have `cost: { input: 0, output: 0, ... }`. The budget-pressure routing path in `resolveModelForComplexity()` compares costs — but for flat-rate providers, downgrading from opus-4.5 to haiku-4.5 saves no money (both cost 0) and may degrade quality. The guard should skip routing when the configured model's provider is flat-rate.

Implementation: Check whether the configured primary model's cost is all-zeros. If so, skip cost-based routing. The guard goes in `resolveModelForComplexity()` before the tier comparison:
```typescript
// Flat-rate guard: skip routing for zero-cost subscription providers (#6295d2a17)
// Dynamic routing is cost-optimization; flat-rate providers gain nothing from it.
if (isFlatRateModel(configuredPrimary, availableModelIds)) {
  return { modelId: configuredPrimary, fallbacks: phaseConfig.fallbacks, tier: requestedTier, wasDowngraded: false, reason: "flat-rate provider (routing skipped)", selectionMethod: "tier-only" };
}
```

`isFlatRateModel()`: resolve the model from available models, check `model.cost.input === 0 && model.cost.output === 0`.

But `resolveModelForComplexity` currently doesn't have access to `Model` objects — only `modelId: string[]`. Need to either: (a) pass the model object in, or (b) check the provider name against a known flat-rate set `["github-copilot"]`.

Option (b) is simpler and matches the actual upstream commit scope. The guard:
```typescript
const FLAT_RATE_PROVIDERS = new Set(["github-copilot"]);
function isFlatRateProvider(modelId: string, availableModelIds: string[]): boolean {
  // modelId is "provider/id" or bare "id"
  const slashIdx = modelId.indexOf("/");
  if (slashIdx !== -1) {
    return FLAT_RATE_PROVIDERS.has(modelId.substring(0, slashIdx));
  }
  return false;
}
```

The guard location is `resolveModelForComplexity()` in `model-router.ts`, early-exit if the configured primary is flat-rate.

**8. `ollama_manage` tool** (R023 says "adds remove/show to ollama_manage tool"):

This suggests the tool already exists or needs to be created. Currently it does NOT exist in hx-ai. Need to create it in `src/resources/extensions/hx/bootstrap/dynamic-tools.ts` or a new `ollama-tools.ts`, and register it in `register-extension.ts`.

Minimal `ollama_manage` tool: calls `ollama` CLI or Ollama REST API (`/api/delete`, `/api/show`) to manage local models. R023 specifically adds `remove` and `show` subcommands — implying the tool previously had `pull`/`list`/`run`.

**Scope decision:** The upstream `ollama_manage` tool scope includes: `list`, `pull`, `remove`, `show`, `ps` subcommands. S02 adds `remove` and `show`. If the tool doesn't exist yet in hx-ai, create it with all subcommands in one go (smaller surface than incremental).

**9. `src/resources/extensions/hx/preferences-types.ts`** — No changes needed for Ollama (it uses `authMode: "none"`).

**10. Model fallback race fix:**

Location: `src/resources/extensions/hx/auto-model-selection.ts`, lines 174–195.

Current code: when `autoModeStartModel` provider+id lookup fails, tries bare `id` as fallback via `setModel`. If that succeeds, sets `appliedModel = byId`. But `appliedModel` was never set for the primary failure path — only on the fallback. This means the run-unit.ts restore sees `null` and doesn't restore, letting the session-default model be used.

Fix: after the `else` block for the byId fallback, ensure `appliedModel` is also set in the primary success path (it already is — `appliedModel = startModel` on line 190). The actual race may be: `currentUnitModel` in `phases.ts` is set from `modelResult.appliedModel`; if `appliedModel` is `null` (all setModel calls failed), `run-unit.ts` doesn't restore anything. The fix probably ensures `appliedModel` is populated even from the bare-id fallback path, which it currently IS. So the race may be elsewhere — this needs close reading of the actual upstream diff when implementing.

**Likely location:** The race is between the `byId` fallback setting `appliedModel = byId` vs the outer `if (!ok) { ... if (fallbackOk) appliedModel = byId; }` block, which already handles this. The "race" may actually be about `currentUnitModel` being stale when `newSession()` resets it. Already fixed by run-unit.ts restoring from `s.currentUnitModel`. The upstream fix likely adds `s.currentUnitModel = appliedModel ?? s.currentUnitModel` to prevent null from clearing the saved start model.

### `DiscoveryResult` baseUrl check
<br>

```
grep -n "interface DiscoveryResult" packages/pi-coding-agent/src/core/model-discovery.ts
```

Likely: `DiscoveryResult` has `{ provider: string; models: DiscoveredModel[]; error?: string }` — no `baseUrl`. The `baseUrl` for discovered Ollama models should come from the `registerProvider("ollama", { baseUrl: ... })` call. The model-registry already handles this: when a provider is registered with `baseUrl` and no `models`, it updates existing models' `baseUrl`. But discovered models come in AFTER registration — they need to pick up the baseUrl from the provider config.

Check line ~819 in `model-registry.ts`: `this.discoveredModels = applyCapabilityPatches(this.convertDiscoveredModels(results))`. Then line ~829: it merges into the model list. The provider's `baseUrl` from `registerProvider` is stored in `this.customProviderConfigs`. Need to check if there's a path to inject this baseUrl into discovered models.

If not already handled: the `convertDiscoveredModels` needs access to the configured baseUrl per provider. The simplest fix: look up the provider config in `convertDiscoveredModels`. Check `this.customProviderConfigs.get(result.provider)?.baseUrl`.

---

## Risk Assessment

**Medium risk total. Two distinct sub-tasks:**

1. **Ollama native provider** — High surface area (new file, KnownApi addition, type system, discovery wiring), but fetch-based NDJSON is simpler than SDK-based providers. Main risk: ensuring discovered models route to `"ollama-chat"` api type, not `"openai"`. Verify with: `pi.model?.api === "ollama-chat"` after model selection.

2. **Flat-rate routing guard** — Low risk. Small change to `model-router.ts`. Risk: mis-scoping the guard (skipping routing for non-flat-rate providers, or not skipping for flat-rate). Test: unit test with copilot model in `resolveModelForComplexity`.

3. **`ollama_manage` tool** — Low risk but non-trivial to test. Uses `fetch` to Ollama REST API or `spawnSync("ollama", ...)`. If using spawnSync, must pass string[] args (not template literal) per K005 pattern. Scope it conservatively: `list`, `pull`, `remove`, `show` subcommands.

4. **Model fallback race** — Low risk once the actual diff is identified. Likely a one-line fix in `auto-model-selection.ts`.

---

## File-by-file Change Plan

| File | Change type | Risk |
|---|---|---|
| `packages/pi-ai/src/types.ts` | Add `"ollama-chat"` to KnownApi | trivial |
| `packages/pi-ai/src/providers/ollama-chat.ts` | New file (~150-200 lines) | medium |
| `packages/pi-ai/src/providers/register-builtins.ts` | Add `registerApiProvider` call | trivial |
| `packages/pi-ai/src/index.ts` | Add export for ollama-chat | trivial |
| `packages/pi-coding-agent/src/core/model-registry.ts` | `convertDiscoveredModels` api type + baseUrl | low |
| `src/resources/extensions/hx/bootstrap/register-extension.ts` | `pi.registerProvider("ollama", ...)` | low |
| `src/resources/extensions/hx/model-router.ts` | Flat-rate guard in `resolveModelForComplexity` | low |
| `src/resources/extensions/hx/auto-model-selection.ts` | Model fallback race fix | low |
| `src/resources/extensions/hx/bootstrap/dynamic-tools.ts` (or new file) | `ollama_manage` tool with list/pull/remove/show | low-medium |

---

## Verification Plan

**tsc clean:** `npx tsc --noEmit` — the `KnownApi` addition and `"ollama-chat"` api type usage must be consistent.

**Tests:**
- Add unit tests for `isFlatRateModel`/flat-rate guard to `model-router.test.ts` (if it exists) or a new test file
- Add NDJSON streaming tests for `ollama-chat.ts` (can mock fetch)
- Verify `ollama_manage` tool registration via extension smoke test pattern

**GSD grep:**
```bash
grep -rn '\bgsd\b|\bGSD\b' \
  packages/pi-ai/src/providers/ollama-chat.ts \
  packages/pi-ai/src/types.ts \
  src/resources/extensions/hx/model-router.ts \
  src/resources/extensions/hx/auto-model-selection.ts \
  src/resources/extensions/hx/bootstrap/register-extension.ts \
  2>/dev/null | wc -l
```
Expected: 0

**Test count:** `npm run test:unit` — ≥4298 pass, 0 fail.

---

## Key Constraints and Patterns

- **spawnSync pattern (K005):** If `ollama_manage` shells out to the `ollama` CLI, use `spawnSync("ollama", ["remove", modelName])` not `execSync(\`ollama remove ${modelName}\`)`.
- **No circular deps:** Dynamic imports pattern if `ollama-chat.ts` imports from `workflow-logger` or `preferences` — but it shouldn't need to; pure API handler.
- **No SDK import:** `ollama-chat.ts` must use Node.js built-in `fetch` only. No new npm dependencies.
- **KnownApi is in `packages/pi-ai/src/types.ts`:** The provider registration in `register-builtins.ts` must reference `"ollama-chat"` which must be in `KnownApi` first, or the TypeScript `Api` type must be widened to include the string literal.
- **`authMode: "none"` guard in model-registry:** Lines 699–707 of `model-registry.ts` reject `apiKey` when `authMode: "none"`. Don't pass `apiKey` when registering the ollama provider.
- **`streamSimple` required for `authMode: "none"`** (line 699–702): Must pass `streamSimple` handler when authMode is `"none"` or `"externalCli"`.
- **Test baseline:** 4300 unit tests currently pass (S01 added 2 new beyond the 4298 baseline).

---

## Task Decomposition Recommendation

**T01 — Ollama native provider (packages/pi-ai)**
- Add `"ollama-chat"` to KnownApi in types.ts
- Create `packages/pi-ai/src/providers/ollama-chat.ts` (fetch-based NDJSON streaming)
- Register in register-builtins.ts + export in index.ts
- Update `convertDiscoveredModels` to use `"ollama-chat"` for provider `"ollama"`
- Wire `pi.registerProvider("ollama", { authMode: "none", api: "ollama-chat", baseUrl: "http://localhost:11434" })` in register-extension.ts
- Verify tsc clean

**T02 — Flat-rate guard + model fallback race + ollama_manage tool**
- Add flat-rate guard to `model-router.ts`
- Fix model fallback race in `auto-model-selection.ts`
- Create `ollama_manage` tool (list/pull/remove/show subcommands using fetch to Ollama REST)
- Add tests for flat-rate guard
- Full verification: tsc + test:unit

These two tasks are independent (T01 touches packages/, T02 touches src/resources/).
