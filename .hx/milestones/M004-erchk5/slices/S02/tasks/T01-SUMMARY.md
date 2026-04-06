---
id: T01
parent: S02
milestone: M004-erchk5
provides: []
requires: []
affects: []
key_files: ["packages/pi-ai/src/providers/ollama-chat.ts", "packages/pi-ai/src/types.ts", "packages/pi-ai/src/providers/register-builtins.ts", "packages/pi-ai/src/index.ts", "packages/pi-coding-agent/src/core/model-registry.ts", "src/resources/extensions/hx/tests/ollama-chat.test.ts"]
key_decisions: ["streamSimpleOllamaChat strips apiKey before forwarding since Ollama is a keyless local service", "Tool calls arrive in done=true chunk from Ollama (handled separately from streaming text deltas)", "baseUrl defaults to http://localhost:11434 with trailing-slash normalization", "packages/pi-ai must be rebuilt after adding new provider files before compiled tests can import them"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "tsc --noEmit: clean. packages/pi-ai built cleanly. compile-tests.mjs compiled 1220 files. 9/9 ollama-chat tests pass. Full test suite: 4309 pass, 3 fail (3 pre-existing failures confirmed by running against base branch with git stash)."
completed_at: 2026-04-06T07:48:11.494Z
blocker_discovered: false
---

# T01: Added Ollama native /api/chat NDJSON streaming provider (ollama-chat) to pi-ai and fixed model-registry to assign it to discovered Ollama models

> Added Ollama native /api/chat NDJSON streaming provider (ollama-chat) to pi-ai and fixed model-registry to assign it to discovered Ollama models

## What Happened
---
id: T01
parent: S02
milestone: M004-erchk5
key_files:
  - packages/pi-ai/src/providers/ollama-chat.ts
  - packages/pi-ai/src/types.ts
  - packages/pi-ai/src/providers/register-builtins.ts
  - packages/pi-ai/src/index.ts
  - packages/pi-coding-agent/src/core/model-registry.ts
  - src/resources/extensions/hx/tests/ollama-chat.test.ts
key_decisions:
  - streamSimpleOllamaChat strips apiKey before forwarding since Ollama is a keyless local service
  - Tool calls arrive in done=true chunk from Ollama (handled separately from streaming text deltas)
  - baseUrl defaults to http://localhost:11434 with trailing-slash normalization
  - packages/pi-ai must be rebuilt after adding new provider files before compiled tests can import them
duration: ""
verification_result: passed
completed_at: 2026-04-06T07:48:11.497Z
blocker_discovered: false
---

# T01: Added Ollama native /api/chat NDJSON streaming provider (ollama-chat) to pi-ai and fixed model-registry to assign it to discovered Ollama models

**Added Ollama native /api/chat NDJSON streaming provider (ollama-chat) to pi-ai and fixed model-registry to assign it to discovered Ollama models**

## What Happened

Created packages/pi-ai/src/providers/ollama-chat.ts implementing full NDJSON streaming against Ollama's /api/chat endpoint. Converts pi-ai Context to Ollama message format (including image support), streams response line by line, emits all AssistantMessageEventStream events (start/text_start/text_delta/text_end/toolcall_start/toolcall_end/done/error), and records token usage from the done chunk. Added 'ollama-chat' to KnownApi in types.ts, registered it in register-builtins.ts, exported from index.ts. Fixed convertDiscoveredModels in model-registry.ts to assign api:'ollama-chat' and baseUrl:'http://localhost:11434' for Ollama providers instead of the broken api:'openai' assignment. Wrote 9 unit tests with mock fetch covering text streaming, token usage, error paths, tool calls, custom baseUrl, apiKey stripping, and abort handling.

## Verification

tsc --noEmit: clean. packages/pi-ai built cleanly. compile-tests.mjs compiled 1220 files. 9/9 ollama-chat tests pass. Full test suite: 4309 pass, 3 fail (3 pre-existing failures confirmed by running against base branch with git stash).

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx tsc --noEmit` | 0 | ✅ pass | 9500ms |
| 2 | `cd packages/pi-ai && npm run build` | 0 | ✅ pass | 10800ms |
| 3 | `node scripts/compile-tests.mjs` | 0 | ✅ pass | 12400ms |
| 4 | `node --test dist-test/src/resources/extensions/hx/tests/ollama-chat.test.js` | 0 | ✅ pass (9/9) | 2500ms |
| 5 | `npm run test:unit` | 1 | ✅ pass (4309/4312, 3 pre-existing) | 124900ms |


## Deviations

None. All 5 planned changes implemented as specified.

## Known Issues

None.

## Files Created/Modified

- `packages/pi-ai/src/providers/ollama-chat.ts`
- `packages/pi-ai/src/types.ts`
- `packages/pi-ai/src/providers/register-builtins.ts`
- `packages/pi-ai/src/index.ts`
- `packages/pi-coding-agent/src/core/model-registry.ts`
- `src/resources/extensions/hx/tests/ollama-chat.test.ts`


## Deviations
None. All 5 planned changes implemented as specified.

## Known Issues
None.
