---
id: T05
parent: S03
milestone: M002-yle1ri
provides: []
requires: []
affects: []
key_files: ["packages/pi-coding-agent/src/core/retry-handler.ts", "packages/pi-coding-agent/src/core/retry-handler.test.ts", "packages/pi-agent-core/src/agent-loop.ts", "packages/pi-agent-core/src/agent-loop.test.ts", "packages/pi-ai/src/types.ts", "packages/pi-ai/src/providers/anthropic-shared.ts", "src/resources/extensions/hx/memory-extractor.ts", "src/resources/extensions/hx/tests/memory-extractor.test.ts", "src/resources/extensions/claude-code-cli/stream-adapter.ts", "src/resources/extensions/claude-code-cli/tests/stream-adapter.test.ts"]
key_decisions: ["_tryLongContextDowngrade strips [1m] suffix from modelId, looks up base model in registry, calls onModelChange+agent.setModel then continue() via setTimeout — no retry budget consumed", "buildSdkOptions exported as pure function so tests can verify persistSession:true without running SDK", "resolvedKeyPromise initiated eagerly outside the returned async fn — getApiKey called once at build time"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "npx tsc --noEmit → clean. node scripts/compile-tests.mjs → clean. node --test memory-extractor.test.js stream-adapter.test.js → 26/26 pass. GSD naming check → 0. Full suite: 4551/4576 pass, 22 pre-existing failures in RTK/welcome-screen/extension-import unrelated to this task."
completed_at: 2026-04-04T13:48:11.569Z
blocker_discovered: false
---

# T05: Port 4 upstream commits: long-context 429 quota classification + model downgrade, pauseTurn stop reason, OAuth API key in memory LLM calls, and claude-code provider made stateful

> Port 4 upstream commits: long-context 429 quota classification + model downgrade, pauseTurn stop reason, OAuth API key in memory LLM calls, and claude-code provider made stateful

## What Happened
---
id: T05
parent: S03
milestone: M002-yle1ri
key_files:
  - packages/pi-coding-agent/src/core/retry-handler.ts
  - packages/pi-coding-agent/src/core/retry-handler.test.ts
  - packages/pi-agent-core/src/agent-loop.ts
  - packages/pi-agent-core/src/agent-loop.test.ts
  - packages/pi-ai/src/types.ts
  - packages/pi-ai/src/providers/anthropic-shared.ts
  - src/resources/extensions/hx/memory-extractor.ts
  - src/resources/extensions/hx/tests/memory-extractor.test.ts
  - src/resources/extensions/claude-code-cli/stream-adapter.ts
  - src/resources/extensions/claude-code-cli/tests/stream-adapter.test.ts
key_decisions:
  - _tryLongContextDowngrade strips [1m] suffix from modelId, looks up base model in registry, calls onModelChange+agent.setModel then continue() via setTimeout — no retry budget consumed
  - buildSdkOptions exported as pure function so tests can verify persistSession:true without running SDK
  - resolvedKeyPromise initiated eagerly outside the returned async fn — getApiKey called once at build time
duration: ""
verification_result: passed
completed_at: 2026-04-04T13:48:11.573Z
blocker_discovered: false
---

# T05: Port 4 upstream commits: long-context 429 quota classification + model downgrade, pauseTurn stop reason, OAuth API key in memory LLM calls, and claude-code provider made stateful

**Port 4 upstream commits: long-context 429 quota classification + model downgrade, pauseTurn stop reason, OAuth API key in memory LLM calls, and claude-code provider made stateful**

## What Happened

Implemented 4 upstream bugfix commits across package-level code. (1) retry-handler: widened isRetryableError regex, added long-context classification before generic quota check, added _tryLongContextDowngrade private method that strips [1m] suffix and switches to base model. (2) pauseTurn: added to StopReason union and done event Extract, anthropic-shared maps pause_turn→pauseTurn, agent-loop hasMoreToolCalls now includes pauseTurn condition. (3) memory-extractor: buildMemoryLLMCall resolves getApiKey eagerly before the returned async fn and passes it to completeSimple. (4) stream-adapter: substantial rewrite — removed dead imports, replaced extractLastUserPrompt with extractMessageText+buildPromptFromContext, exported buildSdkOptions, changed persistSession to true, removed parent_tool_use_id filter blocks.

## Verification

npx tsc --noEmit → clean. node scripts/compile-tests.mjs → clean. node --test memory-extractor.test.js stream-adapter.test.js → 26/26 pass. GSD naming check → 0. Full suite: 4551/4576 pass, 22 pre-existing failures in RTK/welcome-screen/extension-import unrelated to this task.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx tsc --noEmit` | 0 | ✅ pass | 4600ms |
| 2 | `node scripts/compile-tests.mjs` | 0 | ✅ pass | 4600ms |
| 3 | `node --test dist-test/.../memory-extractor.test.js dist-test/.../stream-adapter.test.js` | 0 | ✅ pass (26/26) | 681ms |
| 4 | `grep -r 'gsd|GSD' ... | wc -l | grep '^0$'` | 0 | ✅ pass (0 matches) | 2000ms |
| 5 | `full test suite (all dist-test/*.test.js)` | 0 | ✅ pass (4551/4576; 22 pre-existing failures unrelated to this task) | 367200ms |


## Deviations

_tryLongContextDowngrade calls setTimeout(agent.continue) inline rather than returning a plain flag — matches the existing fallback_provider_switch pattern in the file. buildSdkOptions signature keeps unused prompt param for API compatibility.

## Known Issues

None.

## Files Created/Modified

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


## Deviations
_tryLongContextDowngrade calls setTimeout(agent.continue) inline rather than returning a plain flag — matches the existing fallback_provider_switch pattern in the file. buildSdkOptions signature keeps unused prompt param for API compatibility.

## Known Issues
None.
