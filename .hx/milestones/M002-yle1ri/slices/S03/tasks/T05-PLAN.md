---
estimated_steps: 24
estimated_files: 10
skills_used: []
---

# T05: Package-level fixes: retry handler, agent loop, OAuth key, stream adapter

Port commits 0c13d3b93, e6d712c07, c48a80383, a301473d9. No GSD→HX naming needed for package-level code.

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

## Inputs

- `packages/pi-coding-agent/src/core/retry-handler.ts`
- `packages/pi-agent-core/src/agent-loop.ts`
- `packages/pi-ai/src/types.ts`
- `packages/pi-ai/src/providers/anthropic-shared.ts`
- `src/resources/extensions/hx/memory-extractor.ts`
- `src/resources/extensions/hx/tests/memory-extractor.test.ts`
- `src/resources/extensions/claude-code-cli/stream-adapter.ts`
- `src/resources/extensions/claude-code-cli/tests/stream-adapter.test.ts`

## Expected Output

- `packages/pi-coding-agent/src/core/retry-handler.ts`
- `packages/pi-coding-agent/src/core/retry-handler.test.ts`
- `packages/pi-agent-core/src/agent-loop.ts`
- `packages/pi-agent-core/src/agent-loop.test.ts`
- `packages/pi-ai/src/types.ts`
- `packages/pi-ai/src/providers/anthropic-shared.ts`
- `src/resources/extensions/hx/memory-extractor.ts`
- `src/resources/extensions/hx/tests/memory-extractor.test.ts`
- `src/resources/extensions/claude-code-cli/stream-adapter.ts`
- `src/resources/extensions/claude-code-cli/tests/stream-adapter.test.ts`

## Verification

npx tsc --noEmit && node scripts/compile-tests.mjs && node --test dist-test/src/resources/extensions/hx/tests/memory-extractor.test.js dist-test/src/resources/extensions/claude-code-cli/tests/stream-adapter.test.js && grep -r 'gsd\|GSD' src/resources/extensions/hx/milestone-validation-gates.ts src/resources/extensions/hx/guided-flow.ts src/startup-model-validation.ts 2>/dev/null | grep -v 'migrate-gsd-to-hx' | wc -l | grep '^0$'

## Observability Impact

quota_exhausted classification now catches long-context 429s. pauseTurn stop reason propagates through agent loop enabling continuation. OAuth API key is now passed to memory LLM calls.
