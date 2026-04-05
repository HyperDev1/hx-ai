---
estimated_steps: 27
estimated_files: 9
skills_used: []
---

# T03: DB-Level Fixes: WAL/SHM orphan, transaction race, deferred slice, milestone status promotion, seed requirements (Clusters 3, 8, 9, 11, 20)

Five targeted DB-layer fixes. All surgical changes to existing files.

**Cluster 3 — WAL/SHM orphan cleanup (commit 1c9032a70):**
In `src/resources/extensions/hx/auto-worktree.ts`, the `syncProjectRootToWorktree` function deletes an empty `hx.db` but leaves orphan `hx.db-wal` and `hx.db-shm` files. Fix: after deleting (or discovering the main DB is already missing), also delete the companion WAL/SHM if they exist. `unlinkSync` is already imported. Pattern: `for (const suffix of ['-wal', '-shm']) { const companion = wtDb + suffix; if (existsSync(companion)) unlinkSync(companion); }`

**Cluster 8 — Decision/requirement transaction race (commit 18cc75138):**
In `src/resources/extensions/hx/db-writer.ts`, wrap the requirement ID assignment + insert in `db.transaction()`. Find the `saveDecisionToDb` or equivalent section. Look for requirement ID auto-assignment (the sequential ID logic like R001, R002...). Wrap it in a transaction: `db._getAdapter()?.transaction(() => { /* id assignment + insert */ })()`.

**Cluster 9 — Deferred slice dispatch prevention (commit 93295f7b5):**
In `src/resources/extensions/hx/status-guards.ts`:
- Add `export function isDeferredStatus(status: string): boolean { return status === 'deferred'; }`
- Add `export function isInactiveStatus(status: string): boolean { return isClosedStatus(status) || isDeferredStatus(status); }`
In `src/resources/extensions/hx/db-writer.ts`:
- Add `extractDeferredSliceRef(decisionText: string): { milestoneId: string; sliceId: string } | null` helper — extract milestone+slice IDs from decision text that mentions deferring a slice
- In `saveDecisionToDb` (or the decision save path): when a decision defers a slice, call `db.updateSliceStatus(milestoneId, sliceId, 'deferred')` wrapped in try/catch (non-fatal)

**Cluster 11 — Milestone status promotion on re-plan (commits fea1b7431, 8b43b56f8):**
In `src/resources/extensions/hx/hx-db.ts`, in `upsertMilestonePlanning()`, add `title` and `status` to the UPDATE SET clause:
```sql
title = COALESCE(NULLIF(:title,''),title),
status = COALESCE(NULLIF(:status,''),status)
```
Accept optional `title`/`status` in the params binding.
In `src/resources/extensions/hx/tools/plan-milestone.ts`: add a guard that refuses to re-plan if any completed slices would be dropped. Before applying the new plan, load existing slices from DB; if any have status 'complete'/'done' and are absent from the new slice list, return an error or preserve them.

**Cluster 20 — Seed requirements from REQUIREMENTS.md (commit a4e43ca41):**
In `src/resources/extensions/hx/db-writer.ts`, in `updateRequirementInDb`: when `db.getRequirementById(id)` returns null (requirement not in DB), parse REQUIREMENTS.md via `parseRequirementsSections()` and seed all requirements into the DB before retrying the lookup. Pattern: load file → parse → for each requirement, call `db.upsertRequirement(r)` with INSERT OR IGNORE semantics (skip if already exists). This addresses the K-note: 'Requirements DB vs REQUIREMENTS.md: always seed the DB before using hx_requirement_update'.

**Test files:**
- `src/resources/extensions/hx/tests/worktree-db-respawn-truncation.test.ts` — new: verifies WAL/SHM files are cleaned when main DB is deleted or missing
- `src/resources/extensions/hx/tests/deferred-slice-dispatch.test.ts` — new: verifies isDeferredStatus, isInactiveStatus, extractDeferredSliceRef
- `src/resources/extensions/hx/tests/plan-milestone-title.test.ts` — new: verifies title/status survive re-plan via upsertMilestonePlanning
- `src/resources/extensions/hx/tests/insert-slice-no-wipe.test.ts` — new: verifies completed slices are preserved on milestone re-plan

## Inputs

- `src/resources/extensions/hx/auto-worktree.ts`
- `src/resources/extensions/hx/db-writer.ts`
- `src/resources/extensions/hx/status-guards.ts`
- `src/resources/extensions/hx/hx-db.ts`
- `src/resources/extensions/hx/tools/plan-milestone.ts`

## Expected Output

- `src/resources/extensions/hx/auto-worktree.ts`
- `src/resources/extensions/hx/db-writer.ts`
- `src/resources/extensions/hx/status-guards.ts`
- `src/resources/extensions/hx/hx-db.ts`
- `src/resources/extensions/hx/tools/plan-milestone.ts`
- `src/resources/extensions/hx/tests/worktree-db-respawn-truncation.test.ts`
- `src/resources/extensions/hx/tests/deferred-slice-dispatch.test.ts`
- `src/resources/extensions/hx/tests/plan-milestone-title.test.ts`
- `src/resources/extensions/hx/tests/insert-slice-no-wipe.test.ts`

## Verification

npx tsc --noEmit && npm run test:unit -- --reporter=dot 2>&1 | tail -3
