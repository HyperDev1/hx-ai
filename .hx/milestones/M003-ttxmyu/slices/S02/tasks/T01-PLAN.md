---
estimated_steps: 1
estimated_files: 4
skills_used: []
---

# T01: Add HX_SLICE_LOCK isolation to state.ts and dispatch-guard.ts

Add HX_SLICE_LOCK env var isolation to both state derivation paths (deriveStateFromDb and _deriveStateImpl in state.ts) and to the positional-ordering check in dispatch-guard.ts. Mirrors the existing HX_MILESTONE_LOCK pattern exactly. Add tests for the new isolation behavior.

## Inputs

- ``src/resources/extensions/hx/state.ts` — existing HX_MILESTONE_LOCK isolation at lines 328-335 (deriveStateFromDb) and 838-845 (_deriveStateImpl) to use as templates`
- ``src/resources/extensions/hx/dispatch-guard.ts` — existing HX_MILESTONE_LOCK isolation at lines 29-44 to use as template`
- ``src/resources/extensions/hx/unit-id.ts` — parseUnitId for parsing HX_SLICE_LOCK value`
- ``src/resources/extensions/hx/tests/dispatch-guard.test.ts` — existing HX_MILESTONE_LOCK test at lines 220-268 as exact pattern for new HX_SLICE_LOCK test`
- ``src/resources/extensions/hx/tests/derive-state-db.test.ts` — existing test file to add HX_SLICE_LOCK isolation test`

## Expected Output

- ``src/resources/extensions/hx/state.ts` — HX_SLICE_LOCK isolation added to both deriveStateFromDb (~line 619 loop) and _deriveStateImpl (~line 1268 loop)`
- ``src/resources/extensions/hx/dispatch-guard.ts` — HX_SLICE_LOCK skips positional-ordering fallback for non-locked slices when worker is locked`
- ``src/resources/extensions/hx/tests/derive-state-db.test.ts` — new test: HX_SLICE_LOCK filters activeSlice to only the locked slice`
- ``src/resources/extensions/hx/tests/dispatch-guard.test.ts` — new test: HX_SLICE_LOCK skips cross-slice positional check; intra-slice deps still enforced`

## Verification

grep -n 'HX_SLICE_LOCK' src/resources/extensions/hx/state.ts src/resources/extensions/hx/dispatch-guard.ts | wc -l | xargs -I{} test {} -ge 4 && npx tsc --noEmit && npm run test:unit 2>&1 | grep -E 'pass|fail'

## Observability Impact

None — HX_SLICE_LOCK isolation is silent by design; env var presence is the observable signal.
