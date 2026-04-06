---
id: T02
parent: S01
milestone: M003-ttxmyu
provides: []
requires: []
affects: []
key_files: ["src/resources/extensions/hx/model-router.ts"]
key_decisions: ["selectionMethod added as required (not optional) field on RoutingDecision — all return paths set it so no caller breaks", "scoreModel returns 1.0 for unknown models (no profile) to preserve pass-through semantics", "reasoningDepth comparison uses ordered depth map so deep satisfies medium requirement", "computeTaskRequirements uses existing TaskMetadata.complexityKeywords and tags fields — no new fields needed in T02"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "npx tsc --noEmit exits 0. grep for selectionMethod returns 8 hits, capability_routing returns 3 hits. npm run test:unit passes 4113 tests with 0 failures."
completed_at: 2026-04-05T14:38:07.431Z
blocker_discovered: false
---

# T02: Added ModelCapabilities scoring layer to model-router.ts: profiles for 17 models, BASE_REQUIREMENTS, scoreModel/scoreEligibleModels, capability_routing flag, and selectionMethod on RoutingDecision

> Added ModelCapabilities scoring layer to model-router.ts: profiles for 17 models, BASE_REQUIREMENTS, scoreModel/scoreEligibleModels, capability_routing flag, and selectionMethod on RoutingDecision

## What Happened
---
id: T02
parent: S01
milestone: M003-ttxmyu
key_files:
  - src/resources/extensions/hx/model-router.ts
key_decisions:
  - selectionMethod added as required (not optional) field on RoutingDecision — all return paths set it so no caller breaks
  - scoreModel returns 1.0 for unknown models (no profile) to preserve pass-through semantics
  - reasoningDepth comparison uses ordered depth map so deep satisfies medium requirement
  - computeTaskRequirements uses existing TaskMetadata.complexityKeywords and tags fields — no new fields needed in T02
duration: ""
verification_result: passed
completed_at: 2026-04-05T14:38:07.431Z
blocker_discovered: false
---

# T02: Added ModelCapabilities scoring layer to model-router.ts: profiles for 17 models, BASE_REQUIREMENTS, scoreModel/scoreEligibleModels, capability_routing flag, and selectionMethod on RoutingDecision

**Added ModelCapabilities scoring layer to model-router.ts: profiles for 17 models, BASE_REQUIREMENTS, scoreModel/scoreEligibleModels, capability_routing flag, and selectionMethod on RoutingDecision**

## What Happened

Read model-router.ts (261 lines) and complexity-classifier.ts. Added ModelCapabilities interface and MODEL_CAPABILITY_PROFILES covering all 17 models in MODEL_CAPABILITY_TIER. Added BASE_REQUIREMENTS map for the 11 UNIT_TYPE_TIERS unit types. Added three internal functions: computeTaskRequirements (merges BASE_REQUIREMENTS with TaskMetadata signals), scoreModel (0-1 score with depth ordering for reasoningDepth), and scoreEligibleModels (sort by score desc). Added capability_routing?: boolean to DynamicRoutingConfig and defaultRoutingConfig returns capability_routing: false. Added selectionMethod: 'capability-score' | 'tier-only' as a required field on RoutingDecision — all 5 return paths updated. Extended resolveModelForComplexity with optional unitType/metadata params; when capability_routing is true, scores tier candidates and picks highest. Existing test suite passes unchanged (selectionMethod not asserted in existing tests).

## Verification

npx tsc --noEmit exits 0. grep for selectionMethod returns 8 hits, capability_routing returns 3 hits. npm run test:unit passes 4113 tests with 0 failures.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx tsc --noEmit` | 0 | ✅ pass | 4200ms |
| 2 | `grep -n 'selectionMethod' src/resources/extensions/hx/model-router.ts` | 0 | ✅ pass (8 hits) | 50ms |
| 3 | `grep -n 'capability_routing' src/resources/extensions/hx/model-router.ts` | 0 | ✅ pass (3 hits) | 50ms |
| 4 | `npm run test:unit 2>&1 | tail -10` | 0 | ✅ pass (4113 passed, 0 failed) | 71700ms |


## Deviations

None. TaskMetadata was already available with complexityKeywords and tags fields — no new fields needed for T02 (those are added in T03).

## Known Issues

None.

## Files Created/Modified

- `src/resources/extensions/hx/model-router.ts`


## Deviations
None. TaskMetadata was already available with complexityKeywords and tags fields — no new fields needed for T02 (those are added in T03).

## Known Issues
None.
