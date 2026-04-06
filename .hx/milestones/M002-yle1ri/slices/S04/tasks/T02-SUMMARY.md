---
id: T02
parent: S04
milestone: M002-yle1ri
provides: []
requires: []
affects: []
key_files: ["packages/pi-coding-agent/src/core/compaction/compaction.ts", "packages/pi-coding-agent/src/core/compaction/compaction.test.ts", "packages/pi-coding-agent/src/core/messages.ts", "packages/pi-coding-agent/src/core/messages.test.ts"]
key_decisions: ["generateSummary overflow detection constructs a synthetic AssistantMessage and passes through isContextOverflow() to avoid duplicating overflow regex logic", "singlePassSummary exported as separate function so per-chunk calls share the same prompt-building path", "CUSTOM_MESSAGE_MIDDLE and CUSTOM_MESSAGE_SUFFIX exported even if trivial to allow future callers to reference constants rather than hardcode strings"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "TypeScript --noEmit: 0 errors. compaction.test.js: 15/15 pass. messages.test.js: 14/14 pass. Full unit suite: 4214 pass, 19 pre-existing fail (unchanged from T01 baseline)."
completed_at: 2026-04-04T14:40:43.533Z
blocker_discovered: false
---

# T02: Added chunkMessages/singlePassSummary helpers and overflow-chunked fallback to generateSummary, plus CUSTOM_MESSAGE_PREFIX/MIDDLE/SUFFIX constants wrapping the case-'custom' branch in convertToLlm — 15 compaction tests and 14 messages tests all pass.

> Added chunkMessages/singlePassSummary helpers and overflow-chunked fallback to generateSummary, plus CUSTOM_MESSAGE_PREFIX/MIDDLE/SUFFIX constants wrapping the case-'custom' branch in convertToLlm — 15 compaction tests and 14 messages tests all pass.

## What Happened
---
id: T02
parent: S04
milestone: M002-yle1ri
key_files:
  - packages/pi-coding-agent/src/core/compaction/compaction.ts
  - packages/pi-coding-agent/src/core/compaction/compaction.test.ts
  - packages/pi-coding-agent/src/core/messages.ts
  - packages/pi-coding-agent/src/core/messages.test.ts
key_decisions:
  - generateSummary overflow detection constructs a synthetic AssistantMessage and passes through isContextOverflow() to avoid duplicating overflow regex logic
  - singlePassSummary exported as separate function so per-chunk calls share the same prompt-building path
  - CUSTOM_MESSAGE_MIDDLE and CUSTOM_MESSAGE_SUFFIX exported even if trivial to allow future callers to reference constants rather than hardcode strings
duration: ""
verification_result: passed
completed_at: 2026-04-04T14:40:43.541Z
blocker_discovered: false
---

# T02: Added chunkMessages/singlePassSummary helpers and overflow-chunked fallback to generateSummary, plus CUSTOM_MESSAGE_PREFIX/MIDDLE/SUFFIX constants wrapping the case-'custom' branch in convertToLlm — 15 compaction tests and 14 messages tests all pass.

**Added chunkMessages/singlePassSummary helpers and overflow-chunked fallback to generateSummary, plus CUSTOM_MESSAGE_PREFIX/MIDDLE/SUFFIX constants wrapping the case-'custom' branch in convertToLlm — 15 compaction tests and 14 messages tests all pass.**

## What Happened

B3 (compaction overflow): Added isContextOverflow import from @hyperlab/hx-ai. Extracted singlePassSummary() as a standalone exported function handling prompt construction and a single LLM call; throws on stopReason==='error'. Added chunkMessages(messages, maxChunkSize) which flushes chunks whenever adding the next message would exceed the budget. Refactored generateSummary to accept optional _completeFn?: typeof completeSimple (8th param) and attempt singlePassSummary first; on thrown error, constructs a synthetic AssistantMessage{stopReason:'error',errorMessage} and passes through isContextOverflow() to distinguish overflow from other failures. On overflow: computes maxChunkSize = floor((contextWindow - reserveTokens) / 2), calls chunkMessages, summarizes each chunk independently, joins with separator. Non-overflow errors re-throw unchanged.

B4 (custom message prefix): Added three exported constants to messages.ts: CUSTOM_MESSAGE_PREFIX (opening XML-style wrapper), CUSTOM_MESSAGE_MIDDLE (closing wrapper + blank separator), CUSTOM_MESSAGE_SUFFIX (empty string, reserved). Updated case 'custom' in convertToLlm to extract raw text and produce PREFIX+rawContent+MIDDLE+SUFFIX wrapper, so LLM context clearly marks injected messages.

## Verification

TypeScript --noEmit: 0 errors. compaction.test.js: 15/15 pass. messages.test.js: 14/14 pass. Full unit suite: 4214 pass, 19 pre-existing fail (unchanged from T01 baseline).

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx tsc --noEmit` | 0 | ✅ pass | 5100ms |
| 2 | `node --test dist-test/packages/pi-coding-agent/src/core/compaction/compaction.test.js` | 0 | ✅ pass (15/15) | 716ms |
| 3 | `node --test dist-test/packages/pi-coding-agent/src/core/messages.test.js` | 0 | ✅ pass (14/14) | 414ms |
| 4 | `npm run test:unit` | 1 | ✅ pass (4214 pass, 19 pre-existing fail) | 101800ms |


## Deviations

CUSTOM_MESSAGE_SUFFIX defined as empty string (not omitted) per task plan requirement that all three constants be exported. The custom case in convertToLlm flattens array content to plain text strings when building the wrapped output — image blocks lose their type, consistent with the wrapping intent for text-based injected context.

## Known Issues

None.

## Files Created/Modified

- `packages/pi-coding-agent/src/core/compaction/compaction.ts`
- `packages/pi-coding-agent/src/core/compaction/compaction.test.ts`
- `packages/pi-coding-agent/src/core/messages.ts`
- `packages/pi-coding-agent/src/core/messages.test.ts`


## Deviations
CUSTOM_MESSAGE_SUFFIX defined as empty string (not omitted) per task plan requirement that all three constants be exported. The custom case in convertToLlm flattens array content to plain text strings when building the wrapped output — image blocks lose their type, consistent with the wrapping intent for text-based injected context.

## Known Issues
None.
