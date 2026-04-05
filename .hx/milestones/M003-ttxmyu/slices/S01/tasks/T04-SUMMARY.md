---
id: T04
parent: S01
milestone: M003-ttxmyu
provides: []
requires: []
affects: []
key_files: ["src/resources/extensions/hx/tests/capability-router.test.ts"]
key_decisions: ["Tested scoreModel/computeTaskRequirements indirectly via resolveModelForComplexity — internal functions not exported, all branches reachable via public API", "visionRequired tested via metadata.tags=['vision'] not metadata.visionRequired boolean — computeTaskRequirements reads tags", "Used deepseek-chat (standard, supportsVision:false) vs gpt-4o (standard, supportsVision:true) as the vision scoring foil"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "node scripts/compile-tests.mjs: clean. Direct test run: 19/19 pass. npm run test:unit: 4132 passed, 0 failed. npx tsc --noEmit: exit 0. GSD grep: 0 hits."
completed_at: 2026-04-05T14:46:39.883Z
blocker_discovered: false
---

# T04: Wrote capability-router.test.ts with 19 tests covering all capability-routing branches; full suite passes 4132 tests, tsc clean, 0 GSD hits

> Wrote capability-router.test.ts with 19 tests covering all capability-routing branches; full suite passes 4132 tests, tsc clean, 0 GSD hits

## What Happened
---
id: T04
parent: S01
milestone: M003-ttxmyu
key_files:
  - src/resources/extensions/hx/tests/capability-router.test.ts
key_decisions:
  - Tested scoreModel/computeTaskRequirements indirectly via resolveModelForComplexity — internal functions not exported, all branches reachable via public API
  - visionRequired tested via metadata.tags=['vision'] not metadata.visionRequired boolean — computeTaskRequirements reads tags
  - Used deepseek-chat (standard, supportsVision:false) vs gpt-4o (standard, supportsVision:true) as the vision scoring foil
duration: ""
verification_result: passed
completed_at: 2026-04-05T14:46:39.883Z
blocker_discovered: false
---

# T04: Wrote capability-router.test.ts with 19 tests covering all capability-routing branches; full suite passes 4132 tests, tsc clean, 0 GSD hits

**Wrote capability-router.test.ts with 19 tests covering all capability-routing branches; full suite passes 4132 tests, tsc clean, 0 GSD hits**

## What Happened

Created src/resources/extensions/hx/tests/capability-router.test.ts with 19 test cases: defaultRoutingConfig fields, selectionMethod tier-only vs capability-score discrimination, no-downgrade path returning tier-only, vision tag routing (gpt-4o over deepseek-chat), replan-slice BASE_REQUIREMENTS reasoning depth, unknown configured model early-exit, and all legacy tier downgrade/escalate behaviors. Compiled clean and all 19 tests pass. Full test suite: 4132 passed, 0 failed (up 19 from T03's 4113). tsc --noEmit exits 0. GSD grep: 0 hits.

## Verification

node scripts/compile-tests.mjs: clean. Direct test run: 19/19 pass. npm run test:unit: 4132 passed, 0 failed. npx tsc --noEmit: exit 0. GSD grep: 0 hits.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `node scripts/compile-tests.mjs 2>&1 | tail -3` | 0 | ✅ pass | 6700ms |
| 2 | `node --import ./scripts/dist-test-resolve.mjs dist-test/src/resources/extensions/hx/tests/capability-router.test.js` | 0 | ✅ pass (19/19) | 3700ms |
| 3 | `npm run test:unit 2>&1 | tail -5` | 0 | ✅ pass (4132 passed, 0 failed) | 71600ms |
| 4 | `npx tsc --noEmit` | 0 | ✅ pass | 4700ms |
| 5 | `grep -rn 'GSD' src/resources/extensions/hx/model-router.ts src/resources/extensions/hx/hx-db.ts src/resources/extensions/hx/tests/capability-router.test.ts` | 1 | ✅ pass (0 hits) | 50ms |


## Deviations

The 'unknown model scores 1.0' test pivots to testing the configured-model early-exit path (isKnownModel=false) rather than unknown candidates in scoring, since unknown models get getModelTier='heavy' and thus don't appear in non-heavy tier candidate lists. Comment in test explains the reasoning.

## Known Issues

None.

## Files Created/Modified

- `src/resources/extensions/hx/tests/capability-router.test.ts`


## Deviations
The 'unknown model scores 1.0' test pivots to testing the configured-model early-exit path (isKnownModel=false) rather than unknown candidates in scoring, since unknown models get getModelTier='heavy' and thus don't appear in non-heavy tier candidate lists. Comment in test explains the reasoning.

## Known Issues
None.
