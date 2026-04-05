---
estimated_steps: 15
estimated_files: 3
skills_used: []
---

# T02: Add stop/backtrack capture classifications + triage-resolution handling

Extend captures.ts with 'stop' and 'backtrack' Classification values, wire them into VALID_CLASSIFICATIONS and loadActionableCaptures, add case handlers in triage-resolution.ts, and update the triage-captures.md prompt.

## Steps

1. Read `src/resources/extensions/hx/captures.ts` lines 18 and 43–47 (Classification type + VALID_CLASSIFICATIONS array).
2. Update Classification type union: add `| 'stop' | 'backtrack'` to the existing 5 values.
3. Add `'stop'` and `'backtrack'` to the `VALID_CLASSIFICATIONS` readonly array.
4. Update `loadActionableCaptures()` filter (lines 259–268): add `c.classification === 'stop'` and `c.classification === 'backtrack'` to the OR chain.
5. Read `src/resources/extensions/hx/triage-resolution.ts` lines 345–360 (TriageExecutionResult interface) and lines 420–455 (the switch statement).
6. Add `stopped: number; backtracks: number;` to TriageExecutionResult interface. Initialize both to 0 in the result object.
7. Add `case 'stop':` and `case 'backtrack':` to the switch in executeTriageResolutions:
   - `stop`: write `{ trigger: 'stop', captureId: capture.id, captureText: capture.text, ts: new Date().toISOString() }` as JSON to `.hx/runtime/stop-trigger.json` using `join(hxRoot(basePath), 'runtime', 'stop-trigger.json')`. Use `mkdirSync({ recursive: true })` on the dir first. Then `markCaptureExecuted` and increment `result.stopped`.
   - `backtrack`: parse a slice ID from `capture.resolution` using `/\b(S\d{2})\b/` regex. If found, write `{ trigger: 'backtrack', targetSlice: sliceId, captureId: capture.id, ts: new Date().toISOString() }` to `.hx/runtime/backtrack-trigger.json`. If not found, call `logWarning('engine', 'backtrack capture has no parseable slice ID', { captureId: capture.id })` — but still `markCaptureExecuted` to avoid retry loops. Import `logWarning` from `'../workflow-logger.js'` if not already imported. Increment `result.backtracks`.
8. Update `src/resources/extensions/hx/prompts/triage-captures.md`: add `stop` and `backtrack` to the Classification Criteria section (after `note`):
   - **stop**: Halt auto-mode execution immediately. Use when continuing would cause harm or the session is fundamentally off-track and no replan can fix it.
   - **backtrack**: Rewind to a specific previous slice. Include the target slice ID (e.g. S02) in the Resolution field.
9. Run `npx tsc --noEmit` and `npm run test:unit` — expect 0 new failures (no new test file needed; captures.test.ts covers parse behavior, triage integration is runtime).

## Inputs

- ``src/resources/extensions/hx/captures.ts` — Classification type and VALID_CLASSIFICATIONS array`
- ``src/resources/extensions/hx/triage-resolution.ts` — TriageExecutionResult interface and executeTriageResolutions switch`
- ``src/resources/extensions/hx/prompts/triage-captures.md` — classification criteria section`

## Expected Output

- ``src/resources/extensions/hx/captures.ts` — Classification type includes 'stop'/'backtrack'; VALID_CLASSIFICATIONS updated; loadActionableCaptures includes both`
- ``src/resources/extensions/hx/triage-resolution.ts` — TriageExecutionResult has stopped/backtracks fields; switch handles both new cases`
- ``src/resources/extensions/hx/prompts/triage-captures.md` — stop and backtrack documented in Classification Criteria`

## Verification

npx tsc --noEmit && npm run test:unit 2>&1 | tail -5 && grep -c 'stop\|backtrack' src/resources/extensions/hx/captures.ts
