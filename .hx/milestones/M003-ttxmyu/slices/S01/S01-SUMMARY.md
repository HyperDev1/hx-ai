---
id: S01
parent: M003-ttxmyu
milestone: M003-ttxmyu
provides:
  - acquireSliceLock/releaseSliceLock/getSliceLock/cleanExpiredSliceLocks functions in hx-db.ts for S02 parallelism
  - ModelCapabilities interface and MODEL_CAPABILITY_PROFILES (17 models) for any future routing extensions
  - BASE_REQUIREMENTS map (11 unit types) consumable by S02–S06 routing logic
  - capability_routing: false default in DynamicRoutingConfig — zero-cost opt-in
  - tsc-clean baseline at 4132/0/5 tests for S02–S06
requires:
  []
affects:
  - S02
  - S03
  - S04
  - S05
  - S06
key_files:
  - src/resources/extensions/hx/hx-db.ts
  - src/resources/extensions/hx/model-router.ts
  - src/resources/extensions/hx/complexity-classifier.ts
  - src/resources/extensions/hx/auto-model-selection.ts
  - src/resources/extensions/hx/auto/loop-deps.ts
  - src/resources/extensions/hx/auto/phases.ts
  - src/resources/extensions/hx/tests/capability-router.test.ts
  - src/resources/extensions/hx/tests/hx-db.test.ts
key_decisions:
  - selectionMethod added as required (not optional) on RoutingDecision — all 5 return paths set it explicitly
  - scoreModel returns 1.0 for unknown model profiles to preserve pass-through semantics
  - reasoningDepth uses ordered depth map (shallow < medium < deep) so deep satisfies medium requirement
  - capability_routing defaults to false — zero behavior change until explicitly enabled
  - acquireSliceLock uses INSERT OR IGNORE for DB-atomic lock acquisition without transactions
  - releaseSliceLock guards on worker_pid to prevent cross-worker stomping
  - visionRequired tested via metadata.tags=['vision'] not metadata.visionRequired boolean — computeTaskRequirements reads tags array
  - phases.ts passes undefined as 10th metadata arg — no-op, satisfies TypeScript, defers DB-wired metadata to a future task
patterns_established:
  - Capability scoring is additive over tier routing: tier filtering happens first, then scoreEligibleModels picks the best match within the tier
  - New DB schema migrations: add currentVersion < N block, CREATE TABLE IF NOT EXISTS, INSERT INTO schema_version; bump SCHEMA_VERSION constant at top
  - Internal scoring functions (scoreModel, computeTaskRequirements) tested indirectly via public resolveModelForComplexity rather than exported
  - TaskMetadata capability fields (toolUsage, visionRequired, requiresReasoning) populated via regex content scanning in extractTaskMetadata
observability_surfaces:
  - routing notify log appends '(capability-score)' suffix when selectionMethod === capability-score, visible in auto-mode session output
drill_down_paths:
  - .hx/milestones/M003-ttxmyu/slices/S01/tasks/T01-SUMMARY.md
  - .hx/milestones/M003-ttxmyu/slices/S01/tasks/T02-SUMMARY.md
  - .hx/milestones/M003-ttxmyu/slices/S01/tasks/T03-SUMMARY.md
  - .hx/milestones/M003-ttxmyu/slices/S01/tasks/T04-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-04-05T14:50:13.155Z
blocker_discovered: false
---

# S01: Capability-Aware Model Routing + DB Reconciliation

**Ported capability-aware model routing (ModelCapabilities, scoreModel, 17-model profiles, BASE_REQUIREMENTS, TaskMetadata passthrough) and added slice_locks schema v15 for S02 parallelism, establishing a tsc-clean 4132-test baseline.**

## What Happened

S01 delivered the capability-routing foundation across four tasks.

**T01 — slice_locks schema v15:** Bumped SCHEMA_VERSION from 14 to 15. Added a `currentVersion < 15` migration block that creates the `slice_locks` table (composite PK on milestone_id+slice_id, with worker_pid, acquired_at, expires_at columns). Added four exported accessor functions: `acquireSliceLock` (INSERT OR IGNORE → bool), `releaseSliceLock` (DELETE WHERE pid matches), `getSliceLock` (returns typed row or null), `cleanExpiredSliceLocks` (DELETE expired → count). Updated five test files that hardcoded schema version 14 to 15. The run() return-type is `unknown` under tsconfig.extensions.json; used the existing `(result as { changes?: number }).changes ?? 0` cast pattern for consistency.

**T02 — ModelCapabilities scoring layer:** Added `ModelCapabilities` interface (contextWindow, supportsVision, supportsCode, reasoningDepth, supportsTools) and `MODEL_CAPABILITY_PROFILES` covering all 17 models in MODEL_CAPABILITY_TIER. Added `BASE_REQUIREMENTS` map for the 11 UNIT_TYPE_TIERS unit types. Added three internal functions: `computeTaskRequirements` (merges BASE_REQUIREMENTS with TaskMetadata signals via tags), `scoreModel` (0–1 score with depth ordering — "deep" satisfies "medium" requirement), and `scoreEligibleModels` (sorts by score desc). Added `capability_routing?: boolean` to `DynamicRoutingConfig` (defaults false in `defaultRoutingConfig`). Added `selectionMethod: 'capability-score' | 'tier-only'` as a required field on `RoutingDecision` — all 5 return paths updated. Extended `resolveModelForComplexity` with optional `unitType`/`metadata` params; when `capability_routing: true`, scores tier candidates and picks highest-scoring.

**T03 — TaskMetadata passthrough:** Added three optional fields to TaskMetadata interface: `toolUsage?: string[]`, `visionRequired?: boolean`, `requiresReasoning?: boolean`. Populated them in `extractTaskMetadata` (regex-based content scanning). Added `metadata?: TaskMetadata` param to `selectAndApplyModel` in auto-model-selection.ts, imported TaskMetadata, passed metadata to `classifyUnitComplexity`, and updated the routing notify to append `(capability-score)` suffix when `selectionMethod === 'capability-score'`. Updated loop-deps.ts type signature and phases.ts call site with `undefined` as 10th arg.

**T04 — capability-router tests:** Created `capability-router.test.ts` with 19 test cases covering: `defaultRoutingConfig` fields, selectionMethod discrimination (`tier-only` vs `capability-score`), no-downgrade path, vision-tag routing (gpt-4o scores over deepseek-chat), replan-slice BASE_REQUIREMENTS reasoning depth, unknown configured model early-exit path, and all legacy tier downgrade/escalate behaviors. Internal `scoreModel`/`computeTaskRequirements` tested indirectly via `resolveModelForComplexity` public API. Full suite: 4132 passed, 0 failed (19 new tests above T02 baseline of 4113).

All slice verification criteria passed: tsc clean, 4132/0/5, GSD 0 hits across all touched files.

## Verification

1. `npx tsc --noEmit` → exit 0 (verified at start of close task)
2. `SCHEMA_VERSION = 15` at line 162 of hx-db.ts ✅
3. `slice_locks` references in hx-db.ts: 5 (migration CREATE + 4 accessor functions) ✅
4. `selectionMethod` in model-router.ts: 8 hits ✅
5. `capability_routing` in model-router.ts: 3 hits ✅
6. `toolUsage|visionRequired|requiresReasoning` in complexity-classifier.ts: 9 hits ✅
7. `selectionMethod` in auto-model-selection.ts: 1 hit ✅
8. GSD grep across all 7 touched files: 0 hits ✅
9. `npm run test:unit`: 4132 passed, 0 failed, 5 skipped ✅

## Requirements Advanced

- R011 — ModelCapabilities interface, 17-model profiles, BASE_REQUIREMENTS, scoreModel/computeTaskRequirements/scoreEligibleModels, capability_routing flag, selectionMethod, and TaskMetadata passthrough all implemented and tested with 19 capability-router tests
- R014 — GSD grep across all 7 touched files returns 0 hits
- R018 — npx tsc --noEmit exits 0; npm run test:unit 4132/0/5 — tsc-clean baseline established for S02–S06

## Requirements Validated

- R011 — 19 capability-router tests pass covering selectionMethod discrimination, vision routing, BASE_REQUIREMENTS depth, and all legacy tier behaviors; tsc clean; 0 GSD hits

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

T01: run() return type is `unknown` under tsconfig.extensions.json — not called out in the task plan. Used the existing `(result as { changes?: number }).changes ?? 0` cast pattern from line 1890 of hx-db.ts rather than changing the DbStatement interface.

T02: `computeTaskRequirements` reused existing TaskMetadata.complexityKeywords and tags fields — no new fields were needed in T02 itself (those came in T03).

T04: The 'unknown model scores 1.0' test was reframed to test the configured-model early-exit path (isKnownModel=false) rather than unknown candidates in scoring, because unknown models default to the 'heavy' tier and would not appear in non-heavy tier candidate lists.

## Known Limitations

phases.ts passes `undefined` as the 10th metadata arg to selectAndApplyModel — metadata from the DB task record is not yet wired through. The routing notify suffix works only when metadata is explicitly supplied by a caller. Real per-task capability routing requires the DB-wired path, which is deferred (no upstream milestone tracked for it).

## Follow-ups

S02 can now consume acquireSliceLock/releaseSliceLock/cleanExpiredSliceLocks from hx-db.ts without further DB changes. The `capability_routing: false` default means no behavior change until an operator explicitly enables it via DynamicRoutingConfig.

## Files Created/Modified

- `src/resources/extensions/hx/hx-db.ts` — SCHEMA_VERSION 14→15; slice_locks migration block + 4 accessor functions (acquireSliceLock, releaseSliceLock, getSliceLock, cleanExpiredSliceLocks)
- `src/resources/extensions/hx/model-router.ts` — ModelCapabilities interface, MODEL_CAPABILITY_PROFILES (17 models), BASE_REQUIREMENTS (11 unit types), scoreModel/computeTaskRequirements/scoreEligibleModels, capability_routing flag, selectionMethod required field on RoutingDecision
- `src/resources/extensions/hx/complexity-classifier.ts` — TaskMetadata gains toolUsage/visionRequired/requiresReasoning optional fields; extractTaskMetadata populates them via regex
- `src/resources/extensions/hx/auto-model-selection.ts` — selectAndApplyModel gains optional metadata param; routing notify appends (capability-score) suffix
- `src/resources/extensions/hx/auto/loop-deps.ts` — selectAndApplyModel type signature updated with metadata param
- `src/resources/extensions/hx/auto/phases.ts` — phases.ts call site passes undefined as 10th arg for metadata
- `src/resources/extensions/hx/tests/capability-router.test.ts` — New file: 19 tests covering capability routing branches
- `src/resources/extensions/hx/tests/hx-db.test.ts` — Schema version assertion updated 14→15
- `src/resources/extensions/hx/tests/complete-slice.test.ts` — Schema version assertion updated 14→15
- `src/resources/extensions/hx/tests/complete-task.test.ts` — Schema version assertion updated 14→15
- `src/resources/extensions/hx/tests/md-importer.test.ts` — Schema version assertion updated 14→15
- `src/resources/extensions/hx/tests/memory-store.test.ts` — Schema version assertion updated 14→15
