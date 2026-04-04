---
id: T02
parent: S03
milestone: M002-yle1ri
provides: []
requires: []
affects: []
key_files: ["src/resources/extensions/hx/guided-flow.ts", "src/resources/extensions/hx/tests/guided-flow-session-isolation.test.ts", "src/resources/extensions/hx/tests/guided-flow-dynamic-routing.test.ts", "src/resources/extensions/hx/tests/discuss-queued-milestones.test.ts", "src/resources/extensions/hx/tests/discuss-empty-db-fallback.test.ts"]
key_decisions: ["_getPendingAutoStart(basePath?) returns map entry for exact key, or first entry only when basePath is undefined (not when key is absent)", "selectAndApplyModel called with process.cwd() and undefined prefs — callers don't thread basePath through dispatchWorkflow", "resolveAvailableModel function retained (no longer called) to avoid a larger diff; tsc does not warn on unused functions"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "npx tsc --noEmit → clean. node scripts/compile-tests.mjs → 1165 files compiled. node --test on 4 T02 test files → 41/41 pass. T01 regression tests → 63/63 still pass."
completed_at: 2026-04-04T13:03:32.136Z
blocker_discovered: false
---

# T02: Port 4 guided-flow commits: Map-based session isolation, selectAndApplyModel dynamic routing, queued-milestone routing, and roadmap-fallback when DB is empty

> Port 4 guided-flow commits: Map-based session isolation, selectAndApplyModel dynamic routing, queued-milestone routing, and roadmap-fallback when DB is empty

## What Happened
---
id: T02
parent: S03
milestone: M002-yle1ri
key_files:
  - src/resources/extensions/hx/guided-flow.ts
  - src/resources/extensions/hx/tests/guided-flow-session-isolation.test.ts
  - src/resources/extensions/hx/tests/guided-flow-dynamic-routing.test.ts
  - src/resources/extensions/hx/tests/discuss-queued-milestones.test.ts
  - src/resources/extensions/hx/tests/discuss-empty-db-fallback.test.ts
key_decisions:
  - _getPendingAutoStart(basePath?) returns map entry for exact key, or first entry only when basePath is undefined (not when key is absent)
  - selectAndApplyModel called with process.cwd() and undefined prefs — callers don't thread basePath through dispatchWorkflow
  - resolveAvailableModel function retained (no longer called) to avoid a larger diff; tsc does not warn on unused functions
duration: ""
verification_result: passed
completed_at: 2026-04-04T13:03:32.140Z
blocker_discovered: false
---

# T02: Port 4 guided-flow commits: Map-based session isolation, selectAndApplyModel dynamic routing, queued-milestone routing, and roadmap-fallback when DB is empty

**Port 4 guided-flow commits: Map-based session isolation, selectAndApplyModel dynamic routing, queued-milestone routing, and roadmap-fallback when DB is empty**

## What Happened

Ported all 4 upstream guided-flow commits into guided-flow.ts. (1) cf6f7d4ef: Replaced singleton pendingAutoStart variable with PendingAutoStartEntry interface and pendingAutoStartMap Map; added _getPendingAutoStart(basePath?), exported setPendingAutoStart/clearPendingAutoStart/updated getDiscussionMilestoneId with optional basePath; updated checkAutoStartAfterDiscuss to use resolvedBasePath throughout; replaced all 13 set-assignments and 1 null-clear. (2) 71c5fc933: Swapped resolveModelWithFallbacksForUnit import for selectAndApplyModel from auto-model-selection; replaced manual model-try loop in dispatchWorkflow with single selectAndApplyModel call. (3) bc04b9517: pendingSlices.length===0 and allDiscussed blocks now check for queued milestones and route to showDiscussQueuedMilestone before notifying. (4) 9c943f4a3: Added parseRoadmapSlices import; added normSlices fallback after getMilestoneSlices. Created 3 new test files (41 test cases), appended 2 tests to discuss-queued-milestones.test.ts. Fixed one initial test failure where _getPendingAutoStart was falling back on absent-but-known keys.

## Verification

npx tsc --noEmit → clean. node scripts/compile-tests.mjs → 1165 files compiled. node --test on 4 T02 test files → 41/41 pass. T01 regression tests → 63/63 still pass.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx tsc --noEmit` | 0 | ✅ pass | 4800ms |
| 2 | `node scripts/compile-tests.mjs` | 0 | ✅ pass | 4200ms |
| 3 | `node --test dist-test/.../guided-flow-session-isolation.test.js dist-test/.../guided-flow-dynamic-routing.test.js dist-test/.../discuss-queued-milestones.test.js dist-test/.../discuss-empty-db-fallback.test.js` | 0 | ✅ pass (41/41) | 1663ms |
| 4 | `node --test dist-test/.../state-corruption-2945.test.js ...validate-milestone-write-order.test.js (T01 regression)` | 0 | ✅ pass (63/63) | 367ms |


## Deviations

_getPendingAutoStart initially used basePath ?? '' with first-entry fallback — corrected to only fall back when basePath is undefined (not when key is absent). resolveAvailableModel helper left in place (no longer called) rather than deleted — avoids a larger diff; tsc doesn't warn on unused functions without noUnusedLocals.

## Known Issues

None.

## Files Created/Modified

- `src/resources/extensions/hx/guided-flow.ts`
- `src/resources/extensions/hx/tests/guided-flow-session-isolation.test.ts`
- `src/resources/extensions/hx/tests/guided-flow-dynamic-routing.test.ts`
- `src/resources/extensions/hx/tests/discuss-queued-milestones.test.ts`
- `src/resources/extensions/hx/tests/discuss-empty-db-fallback.test.ts`


## Deviations
_getPendingAutoStart initially used basePath ?? '' with first-entry fallback — corrected to only fall back when basePath is undefined (not when key is absent). resolveAvailableModel helper left in place (no longer called) rather than deleted — avoids a larger diff; tsc doesn't warn on unused functions without noUnusedLocals.

## Known Issues
None.
