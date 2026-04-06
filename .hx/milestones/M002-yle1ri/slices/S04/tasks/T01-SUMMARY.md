---
id: T01
parent: S04
milestone: M002-yle1ri
provides: []
requires: []
affects: []
key_files: ["src/resources/extensions/hx/error-classifier.ts", "packages/pi-ai/src/utils/repair-tool-json.ts", "packages/pi-ai/src/utils/json-parse.ts", "packages/pi-ai/src/utils/tests/repair-tool-json.test.ts", "packages/pi-ai/src/providers/anthropic-shared.ts", "packages/pi-ai/src/index.ts", "src/resources/extensions/claude-code-cli/partial-builder.ts", "src/resources/extensions/hx/tests/provider-errors.test.ts"]
key_decisions: ["YAML bullet-list repair uses array of {key,value} objects to avoid key collision ambiguity", "repairAndParseToolJson falls back to parseStreamingJson in anthropic-shared.ts to preserve graceful degradation", "YAML_BULLET_RE allows \s* before colon to handle padded keys"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "TypeScript --noEmit: 0 errors. provider-errors.test.js: 49/49 pass. repair-tool-json.test.js: 21/21 pass. Full unit suite: 4214 pass, 19 pre-existing fail (all RTK/worktree-related, unaffected by T01)."
completed_at: 2026-04-04T14:33:22.373Z
blocker_discovered: false
---

# T01: Broadened STREAM_RE to catch all V8 JSON parse error variants with check moved before server/connection checks, and added repairToolJson YAML-to-JSON repair utility integrated across anthropic-shared.ts and partial-builder.ts with full test coverage.

> Broadened STREAM_RE to catch all V8 JSON parse error variants with check moved before server/connection checks, and added repairToolJson YAML-to-JSON repair utility integrated across anthropic-shared.ts and partial-builder.ts with full test coverage.

## What Happened
---
id: T01
parent: S04
milestone: M002-yle1ri
key_files:
  - src/resources/extensions/hx/error-classifier.ts
  - packages/pi-ai/src/utils/repair-tool-json.ts
  - packages/pi-ai/src/utils/json-parse.ts
  - packages/pi-ai/src/utils/tests/repair-tool-json.test.ts
  - packages/pi-ai/src/providers/anthropic-shared.ts
  - packages/pi-ai/src/index.ts
  - src/resources/extensions/claude-code-cli/partial-builder.ts
  - src/resources/extensions/hx/tests/provider-errors.test.ts
key_decisions:
  - YAML bullet-list repair uses array of {key,value} objects to avoid key collision ambiguity
  - repairAndParseToolJson falls back to parseStreamingJson in anthropic-shared.ts to preserve graceful degradation
  - YAML_BULLET_RE allows \s* before colon to handle padded keys
duration: ""
verification_result: passed
completed_at: 2026-04-04T14:33:22.375Z
blocker_discovered: false
---

# T01: Broadened STREAM_RE to catch all V8 JSON parse error variants with check moved before server/connection checks, and added repairToolJson YAML-to-JSON repair utility integrated across anthropic-shared.ts and partial-builder.ts with full test coverage.

**Broadened STREAM_RE to catch all V8 JSON parse error variants with check moved before server/connection checks, and added repairToolJson YAML-to-JSON repair utility integrated across anthropic-shared.ts and partial-builder.ts with full test coverage.**

## What Happened

B1: Replaced narrow 'Expected double-quoted property name' literal in STREAM_RE with catch-all patterns 'Expected.*in JSON' and 'Unterminated.*in JSON', and moved the STREAM_RE check from position 6 to position 3 (before network/server/connection) so V8 JSON parse errors are classified as stream before other heuristics misclassify them. B2: Created packages/pi-ai/src/utils/repair-tool-json.ts with repairToolJson(raw): string|null that detects YAML bullet-list tool arguments and converts them to a JSON array of {key,value} objects. Added repairAndParseToolJson to json-parse.ts. Exported repairToolJson from pi-ai/index.ts. Integrated into anthropic-shared.ts toolCall finalization with try/catch fallback to parseStreamingJson, and into partial-builder.ts replacing bare JSON.parse within the existing try/catch block. Created 21-test suite for repair-tool-json and 4 new V8 JSON parse variant tests in provider-errors.test.ts. Fixed a regex edge case (padded keys) discovered during test run by adding \\s* before the colon in YAML_BULLET_RE.

## Verification

TypeScript --noEmit: 0 errors. provider-errors.test.js: 49/49 pass. repair-tool-json.test.js: 21/21 pass. Full unit suite: 4214 pass, 19 pre-existing fail (all RTK/worktree-related, unaffected by T01).

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx tsc --noEmit` | 0 | ✅ pass | 6000ms |
| 2 | `node --test dist-test/src/resources/extensions/hx/tests/provider-errors.test.js` | 0 | ✅ pass (49/49) | 2229ms |
| 3 | `node --test dist-test/packages/pi-ai/src/utils/tests/repair-tool-json.test.js` | 0 | ✅ pass (21/21) | 214ms |
| 4 | `full unit suite (test:unit pattern)` | 1 | ✅ pass (4214 pass, 19 pre-existing fail) | 86100ms |


## Deviations

anthropic-shared.ts wraps repairAndParseToolJson in try/catch with fallback to parseStreamingJson to maintain existing graceful degradation; task plan was silent on this detail.

## Known Issues

None.

## Files Created/Modified

- `src/resources/extensions/hx/error-classifier.ts`
- `packages/pi-ai/src/utils/repair-tool-json.ts`
- `packages/pi-ai/src/utils/json-parse.ts`
- `packages/pi-ai/src/utils/tests/repair-tool-json.test.ts`
- `packages/pi-ai/src/providers/anthropic-shared.ts`
- `packages/pi-ai/src/index.ts`
- `src/resources/extensions/claude-code-cli/partial-builder.ts`
- `src/resources/extensions/hx/tests/provider-errors.test.ts`


## Deviations
anthropic-shared.ts wraps repairAndParseToolJson in try/catch with fallback to parseStreamingJson to maintain existing graceful degradation; task plan was silent on this detail.

## Known Issues
None.
