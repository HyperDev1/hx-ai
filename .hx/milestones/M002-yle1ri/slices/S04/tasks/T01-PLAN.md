---
estimated_steps: 7
estimated_files: 8
skills_used: []
---

# T01: Error Classifier: broaden STREAM_RE + YAML tool-JSON repair

Apply upstream bugfix ports for Band B1 (broaden STREAM_RE in error-classifier.ts) and Band B2 (create repair-tool-json.ts utility, integrate into json-parse.ts + anthropic-shared.ts + partial-builder.ts, export from pi-ai/index.ts, add tests).

B1 (#3243): In `src/resources/extensions/hx/error-classifier.ts` line 51, replace the narrow `Expected double-quoted property name` literal with catch-all V8 patterns `Expected.*in JSON` and add `Unterminated.*in JSON`. Move the STREAM_RE check BEFORE the server/connection checks (currently it is checked after).

B2 (#3090): Create `packages/pi-ai/src/utils/repair-tool-json.ts` — a new utility that detects YAML bullet-list-style tool arguments (lines starting with `- key: value`) and converts them to a JSON array. Signature: `export function repairToolJson(raw: string): string | null` — returns the repaired JSON string on success, null if not a YAML list pattern. Integrate into `packages/pi-ai/src/utils/json-parse.ts` by adding a `repairAndParseToolJson(raw: string): unknown` export that calls repairToolJson first, then JSON.parse. Export repairToolJson from `packages/pi-ai/src/index.ts`. Integrate into `packages/pi-ai/src/providers/anthropic-shared.ts` at line 245 (before `block.arguments = JSON.parse(jsonStr)`) — call repairAndParseToolJson instead of bare JSON.parse. Integrate into `src/resources/extensions/claude-code-cli/partial-builder.ts` at the `block.arguments = JSON.parse(jsonStr)` call in the toolCall finalization block.

Name adaptation: use `@hyperlab/hx-agent-core`, `@hyperlab/hx-ai` etc. — no GSD references.

Test files to create:
1. `packages/pi-ai/src/utils/tests/repair-tool-json.test.ts` — ~100 lines testing: null return for plain JSON, YAML list detection, conversion correctness, edge cases (empty list, nested values)
2. New tests in `src/resources/extensions/hx/tests/provider-errors.test.ts` — 4 new test cases: `classifyError` returns `stream_error` for V8 messages `Expected double-quoted property name in JSON`, `Expected string in JSON at position 5`, `Unterminated string in JSON at position`, `Unexpected token } in JSON` — verify each hits stream_error not a different kind

## Inputs

- ``src/resources/extensions/hx/error-classifier.ts` — STREAM_RE at line 51, check ordering`
- ``packages/pi-ai/src/utils/json-parse.ts` — existing parseStreamingJson export`
- ``packages/pi-ai/src/providers/anthropic-shared.ts` — JSON.parse at line 245`
- ``src/resources/extensions/claude-code-cli/partial-builder.ts` — JSON.parse in toolCall finalization`
- ``packages/pi-ai/src/index.ts` — existing re-exports`
- ``src/resources/extensions/hx/tests/provider-errors.test.ts` — existing classifyError tests to extend`

## Expected Output

- ``src/resources/extensions/hx/error-classifier.ts` — STREAM_RE broadened; check moved before server/connection checks`
- ``packages/pi-ai/src/utils/repair-tool-json.ts` — NEW: YAML bullet-list → JSON array utility`
- ``packages/pi-ai/src/utils/json-parse.ts` — added repairAndParseToolJson export`
- ``packages/pi-ai/src/utils/tests/repair-tool-json.test.ts` — NEW: ~100 lines of repair tests`
- ``packages/pi-ai/src/providers/anthropic-shared.ts` — repairAndParseToolJson at JSON.parse site`
- ``packages/pi-ai/src/index.ts` — repairToolJson exported`
- ``src/resources/extensions/claude-code-cli/partial-builder.ts` — repairAndParseToolJson integrated`
- ``src/resources/extensions/hx/tests/provider-errors.test.ts` — 4 new V8 JSON parse variant tests`

## Verification

npx tsc --noEmit && node --test dist-test/src/resources/extensions/hx/tests/provider-errors.test.js && node --test dist-test/packages/pi-ai/src/utils/tests/repair-tool-json.test.js
