---
id: T03
parent: S06
milestone: M003-ttxmyu
provides: []
requires: []
affects: []
key_files: ["src/resources/extensions/hx/auto-worktree.ts", "src/resources/extensions/hx/status-guards.ts", "src/resources/extensions/hx/db-writer.ts", "src/resources/extensions/hx/hx-db.ts", "src/resources/extensions/hx/tools/plan-milestone.ts", "src/resources/extensions/hx/tests/worktree-db-respawn-truncation.test.ts", "src/resources/extensions/hx/tests/deferred-slice-dispatch.test.ts", "src/resources/extensions/hx/tests/plan-milestone-title.test.ts", "src/resources/extensions/hx/tests/insert-slice-no-wipe.test.ts"]
key_decisions: ["COALESCE(NULLIF(:val,''),col) pattern for title/status in upsertMilestonePlanning — empty string treated as 'no update', preserving original value", "Transaction wraps MAX(id) query + upsertDecision atomically — id var let-assigned outside transaction to remain accessible for rollback", "extractDeferredSliceRef supports two text patterns: M/S slash and verb 'defer Sxx from Mxx'", "Completed-slice drop guard in handlePlanMilestone: getMilestoneSlices inside transaction, isClosedStatus filter, error returned before insertSlice loop", "Seed loop uses getRequirementById guard before upsertRequirement — INSERT OR IGNORE semantics without DB schema change"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "tsc --noEmit exits 0. 32 new tests pass across 4 test files. npm run test:unit passes 4266 tests with 0 failures."
completed_at: 2026-04-05T19:17:15.654Z
blocker_discovered: false
---

# T03: Ported five DB-layer fixes: WAL/SHM orphan cleanup, atomic decision ID transaction, deferred-slice status predicates + dispatch hook, milestone title/status preservation on re-plan, and seed-requirements-from-markdown fallback

> Ported five DB-layer fixes: WAL/SHM orphan cleanup, atomic decision ID transaction, deferred-slice status predicates + dispatch hook, milestone title/status preservation on re-plan, and seed-requirements-from-markdown fallback

## What Happened
---
id: T03
parent: S06
milestone: M003-ttxmyu
key_files:
  - src/resources/extensions/hx/auto-worktree.ts
  - src/resources/extensions/hx/status-guards.ts
  - src/resources/extensions/hx/db-writer.ts
  - src/resources/extensions/hx/hx-db.ts
  - src/resources/extensions/hx/tools/plan-milestone.ts
  - src/resources/extensions/hx/tests/worktree-db-respawn-truncation.test.ts
  - src/resources/extensions/hx/tests/deferred-slice-dispatch.test.ts
  - src/resources/extensions/hx/tests/plan-milestone-title.test.ts
  - src/resources/extensions/hx/tests/insert-slice-no-wipe.test.ts
key_decisions:
  - COALESCE(NULLIF(:val,''),col) pattern for title/status in upsertMilestonePlanning — empty string treated as 'no update', preserving original value
  - Transaction wraps MAX(id) query + upsertDecision atomically — id var let-assigned outside transaction to remain accessible for rollback
  - extractDeferredSliceRef supports two text patterns: M/S slash and verb 'defer Sxx from Mxx'
  - Completed-slice drop guard in handlePlanMilestone: getMilestoneSlices inside transaction, isClosedStatus filter, error returned before insertSlice loop
  - Seed loop uses getRequirementById guard before upsertRequirement — INSERT OR IGNORE semantics without DB schema change
duration: ""
verification_result: passed
completed_at: 2026-04-05T19:17:15.654Z
blocker_discovered: false
---

# T03: Ported five DB-layer fixes: WAL/SHM orphan cleanup, atomic decision ID transaction, deferred-slice status predicates + dispatch hook, milestone title/status preservation on re-plan, and seed-requirements-from-markdown fallback

**Ported five DB-layer fixes: WAL/SHM orphan cleanup, atomic decision ID transaction, deferred-slice status predicates + dispatch hook, milestone title/status preservation on re-plan, and seed-requirements-from-markdown fallback**

## What Happened

Ported five upstream DB-layer fixes across 5 source files and 4 new test files. Cluster 3 (1c9032a70): extended syncProjectRootToWorktree to delete hx.db-wal and hx.db-shm alongside hx.db via a suffix loop, preventing orphaned WAL state. Cluster 8 (18cc75138): wrapped the decision ID assignment + upsertDecision in a db.transaction() in saveDecisionToDb, eliminating the TOCTOU race where two concurrent calls could claim the same ID. Cluster 9 (93295f7b5): added isDeferredStatus/isInactiveStatus to status-guards.ts, added extractDeferredSliceRef to db-writer.ts matching M/S slash and verb patterns, wired non-fatal deferred-slice status update into saveDecisionToDb. Cluster 11 (fea1b7431, 8b43b56f8): added COALESCE(NULLIF(:title,''),title) and equivalent for status to upsertMilestonePlanning's UPDATE SET clause; added getMilestoneSlices import + completed-slice drop guard in handlePlanMilestone; passes title/status to upsertMilestonePlanning. Cluster 20 (a4e43ca41): added parseRequirementsSections import to db-writer.ts; when updateRequirementInDb finds a missing requirement, parses REQUIREMENTS.md and seeds all requirements using INSERT-OR-IGNORE semantics before retrying. All 32 new tests pass; full suite 4266/0.

## Verification

tsc --noEmit exits 0. 32 new tests pass across 4 test files. npm run test:unit passes 4266 tests with 0 failures.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx tsc --noEmit` | 0 | ✅ pass | 4400ms |
| 2 | `node --test dist-test/.../worktree-db-respawn-truncation.test.js dist-test/.../deferred-slice-dispatch.test.js dist-test/.../plan-milestone-title.test.js dist-test/.../insert-slice-no-wipe.test.js` | 0 | ✅ pass (32/32) | 2100ms |
| 3 | `npm run test:unit -- --reporter=dot` | 0 | ✅ pass (4266/4266) | 74900ms |


## Deviations

Cluster 8: nextDecisionId() MAX query inlined inside transaction rather than calling the exported function (which would start its own separate implicit transaction). The exported nextDecisionId() function is preserved for standalone callers. Cluster 9: decision text check reads all three of fields.decision/rationale/choice for 'defer' pattern rather than just fields.decision.

## Known Issues

None.

## Files Created/Modified

- `src/resources/extensions/hx/auto-worktree.ts`
- `src/resources/extensions/hx/status-guards.ts`
- `src/resources/extensions/hx/db-writer.ts`
- `src/resources/extensions/hx/hx-db.ts`
- `src/resources/extensions/hx/tools/plan-milestone.ts`
- `src/resources/extensions/hx/tests/worktree-db-respawn-truncation.test.ts`
- `src/resources/extensions/hx/tests/deferred-slice-dispatch.test.ts`
- `src/resources/extensions/hx/tests/plan-milestone-title.test.ts`
- `src/resources/extensions/hx/tests/insert-slice-no-wipe.test.ts`


## Deviations
Cluster 8: nextDecisionId() MAX query inlined inside transaction rather than calling the exported function (which would start its own separate implicit transaction). The exported nextDecisionId() function is preserved for standalone callers. Cluster 9: decision text check reads all three of fields.decision/rationale/choice for 'defer' pattern rather than just fields.decision.

## Known Issues
None.
