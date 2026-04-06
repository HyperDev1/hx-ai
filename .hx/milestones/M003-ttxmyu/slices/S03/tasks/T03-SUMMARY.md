---
id: T03
parent: S03
milestone: M003-ttxmyu
provides: []
requires: []
affects: []
key_files: ["src/resources/extensions/hx/bootstrap/register-hooks.ts"]
key_decisions: ["Masking and truncation guarded by isAutoActive() — non-auto sessions unaffected", "Both masking and truncation in a single try/catch to ensure service-tier always runs", "Control flow restructured: payload guard at top, service-tier returns payload (not bare return) to preserve masking mutations", "Lazy dynamic imports for preferences.js and context-masker.js avoid circular import issues at module load time"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "tsc --noEmit: exit 0. grep -c createObservationMask register-hooks.ts: 2. grep for GSD tokens: no matches. HX unit test suite: 3447 passed, 0 failed, 4 skipped in 51.2s."
completed_at: 2026-04-05T16:08:38.901Z
blocker_discovered: false
---

# T03: Rewrote before_provider_request hook in register-hooks.ts to add observation masking and tool-result truncation before service-tier logic; tsc clean, 3447 tests pass

> Rewrote before_provider_request hook in register-hooks.ts to add observation masking and tool-result truncation before service-tier logic; tsc clean, 3447 tests pass

## What Happened
---
id: T03
parent: S03
milestone: M003-ttxmyu
key_files:
  - src/resources/extensions/hx/bootstrap/register-hooks.ts
key_decisions:
  - Masking and truncation guarded by isAutoActive() — non-auto sessions unaffected
  - Both masking and truncation in a single try/catch to ensure service-tier always runs
  - Control flow restructured: payload guard at top, service-tier returns payload (not bare return) to preserve masking mutations
  - Lazy dynamic imports for preferences.js and context-masker.js avoid circular import issues at module load time
duration: ""
verification_result: passed
completed_at: 2026-04-05T16:08:38.902Z
blocker_discovered: false
---

# T03: Rewrote before_provider_request hook in register-hooks.ts to add observation masking and tool-result truncation before service-tier logic; tsc clean, 3447 tests pass

**Rewrote before_provider_request hook in register-hooks.ts to add observation masking and tool-result truncation before service-tier logic; tsc clean, 3447 tests pass**

## What Happened

Replaced the existing 8-line before_provider_request handler (service-tier only) with the plan-specified 52-line handler. The new handler: (1) guards on payload type at the top, (2) when isAutoActive(), loads ContextManagementConfig preferences and applies createObservationMask to payload.messages, (3) truncates toolResult content blocks exceeding tool_result_max_chars (default 800) using immutable spread, (4) falls through to the unchanged service-tier import/apply block. All return statements after mutations carry payload (not bare return). Both masking and truncation are wrapped in a single try/catch (non-fatal).

## Verification

tsc --noEmit: exit 0. grep -c createObservationMask register-hooks.ts: 2. grep for GSD tokens: no matches. HX unit test suite: 3447 passed, 0 failed, 4 skipped in 51.2s.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx tsc --noEmit` | 0 | ✅ pass | 9800ms |
| 2 | `grep -c 'createObservationMask' src/resources/extensions/hx/bootstrap/register-hooks.ts` | 0 | ✅ pass (count=2) | 50ms |
| 3 | `grep -rn '\bGSD\b|\bgsd\b' src/resources/extensions/hx/bootstrap/register-hooks.ts` | 1 | ✅ pass (no matches) | 50ms |
| 4 | `node --import ./scripts/dist-test-resolve.mjs --test 'dist-test/src/resources/extensions/hx/tests/*.test.js'` | 0 | ✅ pass (3447 passed, 0 failed) | 51200ms |


## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `src/resources/extensions/hx/bootstrap/register-hooks.ts`


## Deviations
None.

## Known Issues
None.
