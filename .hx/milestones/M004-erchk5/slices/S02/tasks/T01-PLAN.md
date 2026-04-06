---
estimated_steps: 2
estimated_files: 6
skills_used: []
---

# T01: Add ollama-chat provider to packages/pi-ai and wire discovery in model-registry

Create the native Ollama /api/chat NDJSON streaming provider, register it in the pi-ai package, and update model-registry to assign api:"ollama-chat" and the configured baseUrl to discovered Ollama models.

Context: Currently all discovered models get api:"openai" in convertDiscoveredModels, which routes Ollama models to openai-completions which throws "No API key for provider: ollama". We need (1) a real provider file, (2) KnownApi type update, (3) register-builtins wiring, (4) index.ts export, and (5) convertDiscoveredModels fix.

## Inputs

- `packages/pi-ai/src/types.ts`
- `packages/pi-ai/src/providers/register-builtins.ts`
- `packages/pi-ai/src/index.ts`
- `packages/pi-coding-agent/src/core/model-registry.ts`
- `packages/pi-ai/src/providers/google-gemini-cli.ts`

## Expected Output

- `packages/pi-ai/src/providers/ollama-chat.ts`
- `packages/pi-ai/src/types.ts`
- `packages/pi-ai/src/providers/register-builtins.ts`
- `packages/pi-ai/src/index.ts`
- `packages/pi-coding-agent/src/core/model-registry.ts`
- `src/resources/extensions/hx/tests/ollama-chat.test.ts`

## Verification

npx tsc --noEmit && node scripts/compile-tests.mjs && node --test dist-test/src/resources/extensions/hx/tests/ollama-chat.test.js

## Observability Impact

None — NDJSON parse errors are surfaced as thrown errors via the existing stream error path.
