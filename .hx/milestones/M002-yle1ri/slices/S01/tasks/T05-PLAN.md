---
estimated_steps: 15
estimated_files: 9
skills_used: []
---

# T05: Apply scatter fixes: auto-recovery errors, hx_requirement_save tool, parallel-eligibility ghost guard, web dashboard/bridge/workspace fixes

Port the remaining 6 small upstream fixes that individually are 2-20 lines each.

Steps:
1. **auto-recovery.ts — surface nativeCommit errors (#3052):** In `reconcileMergeState()` (line 465), find the two `try { nativeCommit(...) } catch { }` blocks (around lines 479 and 501). Change the catch blocks from swallowing silently to surfacing via `ctx.ui.notify()`: `catch (err) { ctx.ui.notify('nativeCommit failed: ' + (err as Error).message, 'warning'); }`. Keep the function's return behavior unchanged.

2. **db-writer.ts + bootstrap/db-tools.ts — hx_requirement_save tool (#3249):**
   - In db-writer.ts, add `saveRequirementToDb(fields, basePath)` function that inserts a new requirement with auto-generated ID. Add `nextRequirementId()` that queries `SELECT id FROM requirements ORDER BY id DESC LIMIT 1` and increments. Add `SaveRequirementFields` interface.
   - Modify `updateRequirementInDb()` to upsert: when requirement not found, instead of throwing `HX_STALE_STATE`, create a skeleton requirement with the given ID and apply updates.
   - In bootstrap/db-tools.ts, register the `hx_requirement_save` tool with appropriate schema (class, description, why, source, primary_owner, etc.).

3. **parallel-eligibility.ts — ghost milestone ineligibility (#2501):** In `analyzeParallelEligibility()` (around line 120), after getting `entry` from `registryMap`, add: if `entry` is undefined (milestone has no registry data = ghost), push to ineligible with reason 'No planning data (ghost milestone).' and continue.

4. **auto-dashboard-service.ts — reconcile-with-disk (#2705):** After the subprocess result in `collectAuthoritativeAutoDashboardData()`, add a `reconcileWithDiskState(result, packageRoot, checkExists)` function that checks: if `result.active` is true but `<packageRoot>/.hx/auto.lock` doesn't exist, set `result.active = false`. Also check `<packageRoot>/.hx/runtime/paused-session.json` for stale pause state. Add `isPidAlive(pid)` helper using `process.kill(pid, 0)`. Note: all paths use `.hx/` not `.gsd/`.

5. **bridge-service.ts — turn_end invalidation (#2706):** Add `'turn_end'` to the `BridgeLiveStateInvalidationReason` union type (line 660). In the event handler that emits `live_state_invalidation` events, add a case for `turn_end` that invalidates the `workspace` domain.

6. **workspace-index.ts + web/lib/ — authoritative milestone status (#2807):**
   - In `workspace-index.ts`, add `status?: string` and `validationVerdict?: string` to the `WorkspaceMilestoneTarget` interface. In `indexWorkspace()`, populate these from the state registry (`entry.status`) and from VALIDATION files.
   - In `web/lib/hx-workspace-store.tsx`, add `status?: string` and `validationVerdict?: string` to the `WorkspaceMilestoneTarget` interface.
   - In `web/lib/workspace-status.ts`, update `getMilestoneStatus()` to prefer `milestone.status` if present (authoritative from DB) before falling back to the heuristic slice-counting logic.

GSD→HX: All paths `.hx/`. auto-dashboard uses `.hx/auto.lock` and `.hx/runtime/paused-session.json`.

## Inputs

- `src/resources/extensions/hx/auto-recovery.ts`
- `src/resources/extensions/hx/db-writer.ts`
- `src/resources/extensions/hx/bootstrap/db-tools.ts`
- `src/resources/extensions/hx/parallel-eligibility.ts`
- `src/web/auto-dashboard-service.ts`
- `src/web/bridge-service.ts`
- `src/resources/extensions/hx/workspace-index.ts`
- `web/lib/hx-workspace-store.tsx`
- `web/lib/workspace-status.ts`
- `src/resources/extensions/hx/unit-ownership.ts`
- `src/resources/extensions/hx/state.ts`
- `src/resources/extensions/hx/hx-db.ts`

## Expected Output

- `src/resources/extensions/hx/auto-recovery.ts`
- `src/resources/extensions/hx/db-writer.ts`
- `src/resources/extensions/hx/bootstrap/db-tools.ts`
- `src/resources/extensions/hx/parallel-eligibility.ts`
- `src/web/auto-dashboard-service.ts`
- `src/web/bridge-service.ts`
- `src/resources/extensions/hx/workspace-index.ts`
- `web/lib/hx-workspace-store.tsx`
- `web/lib/workspace-status.ts`

## Verification

cd /Users/beratcan/Desktop/GithubProjects/hx-ai/.hx/worktrees/M002-yle1ri && npx tsc --noEmit && cd /Users/beratcan/Desktop/GithubProjects/hx-ai && node scripts/compile-tests.mjs && node --test dist-test/src/resources/extensions/hx/tests/workspace-index.test.js && node --test 'dist-test/src/resources/extensions/hx/tests/*.test.js' 2>&1 | tail -20
