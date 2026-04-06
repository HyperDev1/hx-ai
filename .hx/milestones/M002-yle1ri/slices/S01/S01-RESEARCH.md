# S01 — State/DB Reconciliation & Data Safety: Research

**Date:** 2026-04-04
**Slice:** S01 — State/DB Reconciliation & Data Safety
**Milestone:** M002-yle1ri (Upstream v2.59.0 Bugfix Port)
**Requirements:** R003 (primary), R001, R002, R014

---

## Summary

S01 covers 16 upstream bugfix commits targeting state/DB correctness, data loss prevention, and reconciliation logic. The upstream code lives in `src/resources/extensions/gsd/` — all ports map to `src/resources/extensions/hx/` with GSD→HX adaptation.

After auditing all 16 commits against the current hx-ai codebase, the picture is clear: **most of the target source files (state.ts, hx-db.ts, auto-post-unit.ts, workflow-manifest.ts, repo-identity.ts, migrate-external.ts, bootstrap/dynamic-tools.ts, auto-dashboard-service.ts, workspace-index.ts, bridge-service.ts, web workspace files) have already been partially or fully adapted from upstream fixes in prior hx-ai development**. The critical gap is in **unit-ownership.ts** (still JSON-based, needs SQLite migration) and the **hx_requirement_save tool + upsert behavior** (missing), and a handful of new test files and minor additions scattered across the codebase.

The codebase compiles cleanly (`tsc --noEmit` passes with zero errors). Existing tests for the JSON-based unit-ownership pass. The test runner requires running from the main repo root (`/Users/beratcan/Desktop/GithubProjects/hx-ai`), not the worktree.

## Recommendation

**Port the missing pieces in four focused batches:**

1. **unit-ownership.ts** — full SQLite migration (highest value: eliminates real concurrency bug)
2. **state.ts** — three fixes not yet applied: (a) always-run-deriveStateFromDb when DB available (#2631), (b) slice disk→DB reconciliation in deriveStateFromDb (#2533), (c) isGhostMilestone DB+worktree check (#3041)
3. **hx-db.ts** — VACUUM recovery in openDatabase (#2519)
4. **Small fixes** — `hx_requirement_save` tool + upsert in db-writer.ts (#3249), `migrate-external.ts` worktree guard (#2970), `bootstrap/dynamic-tools.ts` symlink layout + diagnostics (#2517), coerce non-numeric DB columns in workflow-manifest.ts (#2962), auto-dashboard reconcile-with-disk (#2705), workspace invalidation on turn_end (#2706), authoritative milestone status in workspace-index.ts (#2807)

Each fix is independently applicable. Start with unit-ownership (T01) because it's the most complex structural change. Then state.ts fixes (T02) because they have associated new test files to port. Then hx-db.ts VACUUM (T03). Then the small scatter fixes (T04+).

---

## Implementation Landscape

### Commit-by-Commit Status

| Commit | Fix | Files Upstream | Status in hx-ai |
|--------|-----|----------------|-----------------|
| `3c57eac` | Always run disk→DB reconciliation when DB available (#2631) | `state.ts` | **MISSING** — hx-ai still has the old `dbMilestones.length > 0` guard |
| `faff5e9` | Disk→DB slice reconciliation in deriveStateFromDb (#2533) | `state.ts` + new test | **MISSING** — no `insertSlice` call in `deriveStateFromDb` |
| `8b1daaeb` | isGhostMilestone DB+worktree check (#3041) | `state.ts` + tests | **MISSING** — current `isGhostMilestone` is pure file-based |
| `12652d1e` | VACUUM recovery in openDatabase (#2519) | `hx-db.ts` + new test | **MISSING** — `openDatabase` still re-throws without VACUUM attempt |
| `bfbc88b1` | Unit ownership JSON→SQLite (#3061) | `unit-ownership.ts` + tests | **MISSING** — still JSON-based; `claimUnit` is void, no SQLite store |
| `ceea1720` | Coerce non-numeric DB columns in snapshotState (#2962) | `workflow-manifest.ts` + test | **MISSING** — still uses bare type assertions; no `toNumeric()` helper |
| `e599560b` | Skip external migration inside worktrees (#2970) | `migrate-external.ts` + test | **MISSING** — no `isInsideWorktree()` guard at top of `migrateToExternalState()` |
| `d5b92fb6` | db_unavailable loop: symlink layout + diagnostics + retry skip (#2517) | `bootstrap/dynamic-tools.ts`, `auto-post-unit.ts` + test | **PARTIAL** — `resolveProjectRootDbPath` handles `/.hx/worktrees/` but NOT `/.hx/projects/<hash>/worktrees/` symlink layout; `ensureDbOpen` missing diagnostics; `auto-post-unit.ts` still retries when DB unavailable |
| `1e91ba3b` | Project relocation recovery (#3080) | `repo-identity.ts` + test | **MISSING** — `repoIdentity()` still hashes `${remoteUrl}\n${root}` instead of `remoteUrl` only; no `.hx-id` marker file |
| `78399097` | Surface nativeCommit errors in reconcileMergeState (#3052) | `auto-recovery.ts` + test | **MISSING** — `reconcileMergeState` still silently swallows nativeCommit errors |
| `af9be8a4` | Invalidate workspace state on turn_end (#2706) | `bridge-service.ts`, `web/lib/*-workspace-store.tsx` | **MISSING** — `turn_end` not in `BridgeLiveStateInvalidationReason` type; not wired in event handler |
| `d3a71ed2` | Reconcile auto-mode state with on-disk lock in dashboard (#2705) | `src/web/auto-dashboard-service.ts` + test | **MISSING** — `collectAuthoritativeAutoDashboardData` has no reconcile-with-disk logic |
| `3594626f` | Authoritative milestone status in web roadmap (#2807) | `workspace-index.ts`, `web/lib/*.ts` | **MISSING** — `WorkspaceMilestoneTarget` lacks `status`/`validationVerdict` fields; `workspace-index.ts` doesn't populate them |
| `967a9275` | hx_requirement_save + upsert in updateRequirementInDb (#3249) | `db-writer.ts`, `bootstrap/db-tools.ts` + tests | **MISSING** — no `saveRequirementToDb`/`nextRequirementId`, no `hx_requirement_save` tool; `updateRequirementInDb` throws on not-found instead of upserting |
| `3c57eac` (bisect) | Always use deriveStateFromDb when isDbAvailable (#2631) | Same as above | see row 1 |
| `365887df` | Ghost milestones ineligible for parallel (#2501) | `parallel-eligibility.ts` + test | Check needed (see note below) |

**Note on `365887df`:** This fix touches `parallel-eligibility.ts`. Let me confirm its status:

```
grep "no planning data\|isGhostMilestone\|ghost" src/resources/extensions/hx/parallel-eligibility.ts
```

### Key Files

**Source files to modify (hx-ai paths):**

- `src/resources/extensions/hx/state.ts` — Three missing fixes: (1) remove `dbMilestones.length > 0` guard (lines ~228-238), (2) add slice reconciliation loop in `deriveStateFromDb` (after ~line 299), (3) enhance `isGhostMilestone` with DB row + worktree checks (lines ~68-76)
- `src/resources/extensions/hx/hx-db.ts` — Add VACUUM recovery in `openDatabase()` catch block (lines ~779-790)
- `src/resources/extensions/hx/unit-ownership.ts` — Full rewrite: JSON → SQLite provider (using `better-sqlite3` or `node:sqlite`), add `initOwnershipTable`/`closeOwnershipDb` exports, change `claimUnit` to return `boolean`
- `src/resources/extensions/hx/workflow-manifest.ts` — Add `toNumeric()` helper, apply to `sequence`, `seq`, `exit_code`, `duration_ms` columns (lines ~99-170)
- `src/resources/extensions/hx/migrate-external.ts` — Add `isInsideWorktree` import from `./repo-identity.js` and early-return guard at top of `migrateToExternalState()`
- `src/resources/extensions/hx/bootstrap/dynamic-tools.ts` — Add symlink-resolved layout detection (`/.hx/projects/<hash>/worktrees/`), structured diagnostics in `ensureDbOpen`
- `src/resources/extensions/hx/auto-post-unit.ts` — Add `isDbAvailable()` check before retry decision (~line 468)
- `src/resources/extensions/hx/repo-identity.ts` — Update `repoIdentity()` to use remote-only hash, add `.hx-id` marker file logic; add `ensureHxSymlink` recovery
- `src/resources/extensions/hx/auto-recovery.ts` — Surface nativeCommit errors in `reconcileMergeState` catch block
- `src/resources/extensions/hx/db-writer.ts` — Add `saveRequirementToDb`, `nextRequirementId`, `SaveRequirementFields` interface; update `updateRequirementInDb` to upsert skeleton when not found
- `src/resources/extensions/hx/bootstrap/db-tools.ts` — Add `hx_requirement_save` tool definition
- `src/resources/extensions/hx/parallel-eligibility.ts` — Verify/add ghost milestone ineligibility before status/dep checks
- `src/web/auto-dashboard-service.ts` — Add `reconcileWithDiskState()` + `isPidAlive()`, call after subprocess result; adapt `.gsd/` → `.hx/` paths
- `src/web/bridge-service.ts` — Add `turn_end` to `BridgeLiveStateInvalidationReason` type and event handler
- `web/lib/hx-workspace-store.tsx` — Add `status?` and `validationVerdict?` to `WorkspaceMilestoneTarget`
- `web/lib/workspace-status.ts` — Update `getMilestoneStatus()` to prefer authoritative status with heuristic fallback
- `src/resources/extensions/hx/workspace-index.ts` — Populate `status` and `validationVerdict` from state registry and VALIDATION files

**New test files to create (adapting from upstream):**

- `src/resources/extensions/hx/tests/slice-disk-reconcile.test.ts` (from `faff5e9`)
- `src/resources/extensions/hx/tests/vacuum-recovery.test.ts` (from `12652d1e`)
- `src/resources/extensions/hx/tests/derive-state-db.test.ts` — extend existing with ghost milestone DB+worktree tests (from `8b1daaeb`)
- `src/resources/extensions/hx/tests/migrate-external-worktree.test.ts` (from `e599560b`)
- `src/resources/extensions/hx/tests/db-path-worktree-symlink.test.ts` (from `d5b92fb6`)
- `src/resources/extensions/hx/tests/project-relocation-recovery.test.ts` (from `1e91ba3b`)
- `src/resources/extensions/hx/tests/auto-recovery.test.ts` (integration, from `78399097`)
- `src/resources/extensions/hx/tests/web-auto-dashboard-lock-reconciliation.test.ts` (from `d3a71ed2`)
- `src/resources/extensions/hx/tests/milestone-status-authoritative.test.ts` (from `3594626f`)
- `src/resources/extensions/hx/tests/parallel-eligibility-ghost.test.ts` (from `365887df`)
- `src/resources/extensions/hx/tests/state-corruption-2945.test.ts` — already likely partially exists, check
- Extend `src/resources/extensions/hx/tests/unit-ownership.test.ts` (substantial rewrite to use SQLite API)
- Extend `src/resources/extensions/hx/tests/workflow-manifest.test.ts` (add `toNumeric()` coercion tests)

### GSD→HX Naming Adaptations Required

All new code must use HX naming:
- `gsd-db.ts` → `hx-db.ts`; `GsdPreferences` → `HxPreferences`; `gsdRoot()` → `hxRoot()`
- `.gsd/` → `.hx/`; `gsd.db` → `hx.db`; `GSD_` env prefix → `HX_`
- Function names: `externalGsdRoot` → `externalHxRoot`; `hasGitTrackedGsdFiles` → `hasGitTrackedHxFiles`
- `gsd-reconcile:` log prefix → `hx-reconcile:`; stderr messages using `gsd-db:` → `hx-db:`
- `GSDError`/`GSD_STALE_STATE` → `HXError`/`HX_STALE_STATE`
- Test files: all `.gsd/` fixture paths → `.hx/`; `unit-claims.json` stays the same name (for JSON) but SQLite file is `unit-claims.db`

### Build Order

1. **T01 — unit-ownership.ts SQLite migration** (independent, self-contained, highest complexity)
   - Rewrite `src/resources/extensions/hx/unit-ownership.ts` from JSON to SQLite
   - Update `src/resources/extensions/hx/tests/unit-ownership.test.ts` to use `initOwnershipTable`/`closeOwnershipDb`
   - Verify: `node --test dist-test/src/resources/extensions/hx/tests/unit-ownership.test.js`

2. **T02 — state.ts triple fix** (three upstream commits, all target same file)
   - Fix 1: remove `dbMilestones.length > 0` guard in `deriveState()` (commit `3c57eac`)
   - Fix 2: add slice reconciliation loop in `deriveStateFromDb()` — needs `insertSlice` import (commit `faff5e9`)
   - Fix 3: add DB row + worktree checks to `isGhostMilestone()` — needs `getMilestone` import (commit `8b1daaeb`)
   - Add new test: `slice-disk-reconcile.test.ts`
   - Extend `derive-state-db.test.ts` with ghost milestone tests
   - Verify: compile + run targeted tests

3. **T03 — hx-db.ts VACUUM recovery** (isolated, single file)
   - Add VACUUM recovery in `openDatabase()` catch block
   - Add new test: `vacuum-recovery.test.ts`
   - Verify: test passes

4. **T04 — workflow-manifest.ts column coercion** (isolated)
   - Add `toNumeric()` helper
   - Apply to `sequence`, `seq`, `exit_code`, `duration_ms` columns
   - Add test cases to `workflow-manifest.test.ts`

5. **T05 — migrate-external.ts + dynamic-tools.ts + auto-post-unit.ts** (db_unavailable group)
   - `migrate-external.ts`: add `isInsideWorktree` guard
   - `bootstrap/dynamic-tools.ts`: add symlink layout detection, structured diagnostics
   - `auto-post-unit.ts`: add `isDbAvailable()` check before retry
   - New tests: `migrate-external-worktree.test.ts`, `db-path-worktree-symlink.test.ts`

6. **T06 — repo-identity.ts project relocation** (complex, touches identity hash)
   - Update `repoIdentity()` remote-only hash
   - Add `.hx-id` marker file logic
   - Add recovery in `ensureHxSymlink`
   - New test: `project-relocation-recovery.test.ts`
   - **WARNING**: This changes the identity hash computation — existing projects with remotes will get a new hash. The upstream commit handles upgrade migration; ensure that logic is ported faithfully.

7. **T07 — auto-recovery.ts + hx_requirement_save + parallel-eligibility + web fixes** (scatter fixes)
   - `auto-recovery.ts`: surface nativeCommit errors
   - `db-writer.ts` + `bootstrap/db-tools.ts`: `hx_requirement_save` tool
   - `parallel-eligibility.ts`: ghost milestone ineligibility
   - `auto-dashboard-service.ts`: reconcile-with-disk (adapt `.gsd/` → `.hx/` paths)
   - `bridge-service.ts`: `turn_end` invalidation
   - `web/lib/hx-workspace-store.tsx` + `workspace-status.ts` + `workspace-index.ts`: authoritative milestone status

### Verification Approach

After each task:
```bash
# Typecheck (run from worktree root)
cd /Users/beratcan/Desktop/GithubProjects/hx-ai/.hx/worktrees/M002-yle1ri
npx tsc --noEmit

# Run targeted test (from main repo because node_modules live there)
cd /Users/beratcan/Desktop/GithubProjects/hx-ai
node scripts/compile-tests.mjs
node --test dist-test/src/resources/extensions/hx/tests/<test-file>.js
```

After all tasks (slice completion):
```bash
cd /Users/beratcan/Desktop/GithubProjects/hx-ai
node scripts/compile-tests.mjs && node --test 'dist-test/src/resources/extensions/hx/tests/*.js' 2>&1 | tail -30

# Grep check — no GSD residue introduced
grep -rn '\bgsd\b\|\.gsd\b\|gsdRoot\|GsdPreferences\|gsd-db\|gsd\.db\|GSD_' \
  src/resources/extensions/hx/ web/lib/ src/web/ \
  --include='*.ts' --include='*.tsx' \
  | grep -v 'migrate-gsd-to-hx' \
  | grep -v 'node_modules'
```

---

## Common Pitfalls

- **State.ts `deriveState()` dual-path logic is complex**: The current code has TWO reconciliation sections — one at the top of `deriveState()` (lines 212-226 as bootstrap) and one inside `deriveStateFromDb()` (lines ~288-300). The `3c57eac` fix changes `deriveState()`'s outer guard. The `faff5e9` fix adds a new loop INSIDE `deriveStateFromDb()`. These must not be confused.

- **`insertSlice` is not imported in state.ts**: `faff5e9` requires importing `insertSlice` from `hx-db.ts` (already exported at line 1159 of `hx-db.ts`). The current `state.ts` import block does NOT include it. The import must be added.

- **`getMilestone` is not imported in state.ts**: `8b1daaeb` requires `getMilestone` from `hx-db.ts`. Again not currently imported. Must be added alongside `getMilestoneSlices`.

- **unit-ownership.ts SQLite provider pattern**: The upstream uses a mini SQLite provider inline in unit-ownership.ts (not via hx-db.ts). It tries `node:sqlite` first, falls back to `better-sqlite3`. The DB file is stored at `<basePath>/.hx/unit-claims.db`. The test file needs `initOwnershipTable(base)` calls and `closeOwnershipDb(base)` cleanup. The existing test file tests JSON-based behavior — it will need the tests substantially rewritten.

- **repo-identity.ts hash change risk**: Changing `repoIdentity()` from `sha256(remoteUrl + root)` to `sha256(remoteUrl)` for remote repos is a breaking identity change. The upstream commit includes upgrade migration logic in `ensureGsdSymlink`. This must be faithfully ported — skip it or port it partially and the upgrade migration fails, breaking users with existing external state directories.

- **auto-dashboard-service.ts paths**: The upstream fix uses `.gsd/auto.lock` and `.gsd/runtime/paused-session.json`. In hx-ai these are `.hx/auto.lock` and `.hx/runtime/paused-session.json`. The reconcile function takes `checkExists` as a parameter for testability — keep that injection point.

- **web/lib file naming**: The upstream modifies `web/lib/gsd-workspace-store.tsx`. In hx-ai this is `web/lib/hx-workspace-store.tsx`. The upstream also creates `web/lib/workspace-types.ts` (to avoid JSX resolution issues). Check if `web/lib/workspace-types.ts` already exists in hx-ai.

- **Test compilation requires main repo**: The worktree does NOT have `node_modules` installed. All `node --test` commands must run from `/Users/beratcan/Desktop/GithubProjects/hx-ai` after running `node scripts/compile-tests.mjs`. The EEXIST symlink error on compile is non-fatal (symlink already exists from previous run) — the compilation completes successfully.

---

## Open Risks

- **`repo-identity.ts` upgrade migration**: If the identity hash changes and the migration code is not ported, all existing hx-ai users with external state will get a new orphaned state directory on upgrade. This is high-risk if partially ported.

- **unit-ownership.ts `claimUnit` API change**: The return type changes from `void` to `boolean`. Any callers of `claimUnit` that currently ignore the return value will silently continue working; but callers that SHOULD check the boolean (like the complete-task/complete-slice ownership enforcement) need to be updated. Search for all callers before porting.

- **`parallel-eligibility.ts` status**: Need to verify whether `365887df` (ghost milestone ineligibility) has already been applied. The commit description says milestones with no registry entry fell through to eligible status — this maps to `parallel-eligibility.ts` in hx-ai.
