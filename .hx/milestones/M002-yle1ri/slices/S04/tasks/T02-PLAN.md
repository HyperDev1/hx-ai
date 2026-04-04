---
estimated_steps: 15
estimated_files: 4
skills_used: []
---

# T02: Compaction overflow chunking + custom message prefix constants

Apply upstream bugfix ports for Band B3 (compaction.ts chunked fallback) and Band B4 (messages.ts custom prefix constants).

B3 (#3038): In `packages/pi-coding-agent/src/core/compaction/compaction.ts`, add:
1. `chunkMessages(messages, maxChunkSize)` — splits a message array into chunks fitting within a token budget
2. `singlePassSummary(messages, completeFn)` — attempts a single summary pass on a message chunk
3. Refactor `generateSummary()` to accept an optional `_completeFn` injection parameter (for testing), and add a chunked fallback path: if the first summary attempt fails due to context overflow, split messages into chunks, summarize each chunk, then combine
4. The `_completeFn` parameter makes the function testable without hitting a real LLM

B4 (#3069): In `packages/pi-coding-agent/src/core/messages.ts`, add three new exported constants:
- `CUSTOM_MESSAGE_PREFIX` — a string that wraps custom user messages for LLM context (e.g. a system notification prefix string)
- `CUSTOM_MESSAGE_MIDDLE` — separator between prefix metadata and message content  
- `CUSTOM_MESSAGE_SUFFIX` — closing wrapper
Update the `case "custom"` block (currently at line ~162) to wrap custom message content with these prefix/suffix constants when constructing the `{ role: 'user', content: [...] }` object for LLM context.

Test files to create:
1. `packages/pi-coding-agent/src/core/compaction/compaction.test.ts` — NEW ~236 lines: test chunkMessages splits correctly, test singlePassSummary with mock completeFn, test generateSummary chunked fallback path (inject completeFn that simulates context-too-large on first attempt)
2. `packages/pi-coding-agent/src/core/messages.test.ts` — NEW ~114 lines: test that custom messages are wrapped with PREFIX/SUFFIX in LLM context output, test PREFIX/MIDDLE/SUFFIX are non-empty strings, test that other message types (branchSummary, compactionSummary) are unaffected

Import naming: use `@hyperlab/hx-agent-core`, `@hyperlab/hx-ai` (NOT gsd variants).

## Inputs

- ``packages/pi-coding-agent/src/core/compaction/compaction.ts` — existing generateSummary at line 496`
- ``packages/pi-coding-agent/src/core/messages.ts` — case 'custom' at line ~162`

## Expected Output

- ``packages/pi-coding-agent/src/core/compaction/compaction.ts` — added chunkMessages, singlePassSummary, _completeFn param, chunked fallback in generateSummary`
- ``packages/pi-coding-agent/src/core/compaction/compaction.test.ts` — NEW: ~236 lines`
- ``packages/pi-coding-agent/src/core/messages.ts` — CUSTOM_MESSAGE_PREFIX/MIDDLE/SUFFIX constants; case 'custom' wraps content`
- ``packages/pi-coding-agent/src/core/messages.test.ts` — NEW: ~114 lines`

## Verification

npx tsc --noEmit && node --test dist-test/packages/pi-coding-agent/src/core/compaction/compaction.test.js && node --test dist-test/packages/pi-coding-agent/src/core/messages.test.js
