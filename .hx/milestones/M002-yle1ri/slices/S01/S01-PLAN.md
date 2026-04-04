# S01: State/DB Reconciliation & Data Safety

**Goal:** Port 16 upstream state/DB reconciliation and data safety bugfixes into hx-ai with GSD→HX naming adaptation. All fixes compiled, tested, and verified.
**Demo:** After this: After this: State machine DB sync, disk→DB reconciliation, VACUUM recovery, unit ownership migration, DB column coercion, and data loss prevention fixes are applied. typecheck + tests pass.

## Tasks
- [x] **T01: Rewrote unit-ownership.ts to use SQLite (unit-claims.db) instead of unit-claims.json; claimUnit now returns boolean; 17/17 tests pass** — Rewrite unit-ownership.ts to use a self-contained SQLite database instead of JSON file for unit claims. The upstream pattern uses a mini SQLite provider inline (tries node:sqlite first, falls back to better-sqlite3). DB file stored at `<basePath>/.hx/unit-claims.db`. Export `initOwnershipTable(basePath)` and `closeOwnershipDb(basePath)` for lifecycle management. Change `claimUnit` return type from `void` to `boolean` (returns false if another agent already holds the claim). Rewrite test file to use SQLite API.

Steps:
1. Read the current unit-ownership.ts (104 lines) and tests/unit-ownership.test.ts fully.
2. Rewrite unit-ownership.ts:
   - Add inline SQLite provider (try `node:sqlite` then `better-sqlite3`, same pattern as hx-db.ts lines 100-160)
   - Create `initOwnershipTable(basePath)` → opens/creates `<basePath>/.hx/unit-claims.db`, creates `unit_claims` table (unit_key TEXT PRIMARY KEY, agent TEXT, claimed_at TEXT)
   - `closeOwnershipDb(basePath)` → closes the DB connection
   - `claimUnit(basePath, unitKey, agentName)` → returns `boolean` (true if claimed successfully, false if different agent holds it). Uses INSERT OR REPLACE.
   - `releaseUnit`, `getOwner`, `checkOwnership` → query SQLite instead of JSON
   - Keep `taskUnitKey`, `sliceUnitKey` unchanged
   - Remove all JSON/fs imports except `mkdirSync` for `.hx/` dir creation
3. Rewrite tests/unit-ownership.test.ts to call `initOwnershipTable(base)` in setup and `closeOwnershipDb(base)` in cleanup. Update assertions for `claimUnit` returning boolean.
4. Verify: `npx tsc --noEmit` passes and `node --test dist-test/src/resources/extensions/hx/tests/unit-ownership.test.js` passes.

GSD→HX: No GSD references in this file. DB file is `unit-claims.db` (not `unit-claims.json`).

Callers: Only `checkOwnership` is called externally (complete-task.ts:145, complete-slice.ts:211). Neither calls `claimUnit` directly, so the return type change is safe.
  - Estimate: 45m
  - Files: src/resources/extensions/hx/unit-ownership.ts, src/resources/extensions/hx/tests/unit-ownership.test.ts
  - Verify: cd /Users/beratcan/Desktop/GithubProjects/hx-ai/.hx/worktrees/M002-yle1ri && npx tsc --noEmit && cd /Users/beratcan/Desktop/GithubProjects/hx-ai && node scripts/compile-tests.mjs && node --test dist-test/src/resources/extensions/hx/tests/unit-ownership.test.js
- [x] **T02: Applied state.ts triple fix (unconditional DB derive, slice reconciliation, ghost+worktree check) and hx-db.ts VACUUM recovery; 28/28 + 6/6 tests pass** — Port three upstream state.ts fixes and one hx-db.ts fix for DB resilience.

Steps:
1. **state.ts Fix 1 — Always run deriveStateFromDb (#2631):** In `deriveState()` (around line 228), remove the `if (dbMilestones.length > 0)` guard. After the `dbMilestones.length === 0` bootstrap block (lines 216-227), the code should ALWAYS call `deriveStateFromDb()` when `isDbAvailable()` is true, regardless of whether dbMilestones is still empty. Replace:
   ```
   if (dbMilestones.length > 0) {
     ...
   } else {
     result = await _deriveStateImpl(basePath);
     _telemetry.markdownDeriveCount++;
   }
   ```
   with unconditional deriveStateFromDb call (remove the else branch).

2. **state.ts Fix 2 — Slice disk→DB reconciliation (#2533):** In `deriveStateFromDb()` (after the milestone reconciliation loop around line 300), add a NEW loop: for each milestone in allMilestones, scan slice directories on disk, and for any slice that exists on disk but NOT in DB, call `insertSlice(...)`. This requires adding `insertSlice` to the import from `hx-db.js` (line 55). Add `import { readdirSync } from 'node:fs'` if not present. Pattern:
   ```
   for (const m of allMilestones) {
     const slicesDir = join(basePath, '.hx', 'milestones', m.id, 'slices');
     if (!existsSync(slicesDir)) continue;
     const dbSliceIds = new Set(getMilestoneSlices(m.id).map(s => s.id));
     try {
       for (const entry of readdirSync(slicesDir, { withFileTypes: true })) {
         if (entry.isDirectory() && /^S\d+$/.test(entry.name) && !dbSliceIds.has(entry.name)) {
           insertSlice({ milestone_id: m.id, id: entry.name, title: entry.name, status: 'active', risk: 'medium', depends: [], demo: '' });
         }
       }
     } catch { /* ignore read errors */ }
   }
   ```

3. **state.ts Fix 3 — isGhostMilestone DB+worktree check (#3041):** Enhance `isGhostMilestone()` (line 68) to also check: (a) whether a DB row exists for this milestone via `getMilestone(mid)` — if a DB row exists, it's NOT a ghost even if files are missing; (b) whether the milestone directory is a worktree checkout (has a `.git` file, not directory). Add `getMilestone` to the import from `hx-db.js`. Guard the DB check with `isDbAvailable()`. Add new test cases to `derive-state-db.test.ts` for ghost milestone with DB row.

4. **hx-db.ts VACUUM recovery (#2519):** In `openDatabase()` (around line 770-790), wrap the `initSchema(adapter, fileBacked)` call in a try-catch. On error for file-backed DBs, attempt recovery: close the adapter, try `VACUUM` via a fresh raw DB connection, then retry `openRawDb` + `createAdapter` + `initSchema`. If VACUUM also fails, re-throw the original error. Add new test file `tests/vacuum-recovery.test.ts`.

GSD→HX: All log prefixes use `hx-reconcile:` or `hx-db:`. No GSD references.
  - Estimate: 1h
  - Files: src/resources/extensions/hx/state.ts, src/resources/extensions/hx/hx-db.ts, src/resources/extensions/hx/tests/derive-state-db.test.ts, src/resources/extensions/hx/tests/vacuum-recovery.test.ts
  - Verify: cd /Users/beratcan/Desktop/GithubProjects/hx-ai/.hx/worktrees/M002-yle1ri && npx tsc --noEmit && cd /Users/beratcan/Desktop/GithubProjects/hx-ai && node scripts/compile-tests.mjs && node --test dist-test/src/resources/extensions/hx/tests/derive-state-db.test.js && node --test dist-test/src/resources/extensions/hx/tests/vacuum-recovery.test.js
- [x] **T03: Applied four upstream data safety fixes (toNumeric coercion, worktree migration guard, symlink layout detection, DB retry guard); 11+62 tests pass** — Port four small upstream fixes that prevent data loss and infinite loops in edge cases.

Steps:
1. **workflow-manifest.ts column coercion (#2962):** Add a `toNumeric(val: unknown): number` helper at the top of workflow-manifest.ts that safely converts SQLite TEXT columns to numbers (handles string, null, undefined → returns `Number(val) || 0`). Apply it to `sequence`, `exit_code`, `duration_ms` fields in the `snapshotState()` function's row mapping (around lines 60-170). The fields `r['sequence'] as number`, `r['exit_code'] as number`, `r['duration_ms'] as number` become `toNumeric(r['sequence'])`, etc. Add test cases to `tests/workflow-manifest.test.ts` verifying coercion of string '42' → 42, null → 0, undefined → 0.

2. **migrate-external.ts worktree guard (#2970):** At the top of `migrateToExternalState()` (after line 36, before the `existsSync(localHx)` check), add: `import { isInsideWorktree } from './repo-identity.js'` and an early return `if (isInsideWorktree(basePath)) return { migrated: false };`. This prevents migration from running inside worktrees where it would corrupt shared state.

3. **bootstrap/dynamic-tools.ts symlink layout (#2517):** In `resolveProjectRootDbPath()`, add detection for the `/.hx/projects/<hash>/worktrees/` symlink layout pattern. After the existing worktree detection (lines 21-34), add a check: if `basePath` contains `/.hx/projects/` followed by `/worktrees/`, resolve to the project root's `hx.db` under the external state dir. Also in `ensureDbOpen()`, add structured stderr diagnostics on failure: `process.stderr.write('hx-db: ensureDbOpen failed: ' + reason + '\n')` in the catch block.

4. **auto-post-unit.ts retry guard (#2517):** Around line 123 in auto-post-unit.ts, where the code checks `if (!isDbAvailable()) return [];`, verify this guard exists. If the retry loop (search for retry/backoff logic) doesn't skip when DB is unavailable, add `if (!isDbAvailable()) { process.stderr.write('hx-db: skipping post-unit retry — DB unavailable\n'); return; }` before the retry.

GSD→HX: `isInsideWorktree` import from `./repo-identity.js` (already HX-named). All stderr messages use `hx-db:` prefix.
  - Estimate: 40m
  - Files: src/resources/extensions/hx/workflow-manifest.ts, src/resources/extensions/hx/migrate-external.ts, src/resources/extensions/hx/bootstrap/dynamic-tools.ts, src/resources/extensions/hx/auto-post-unit.ts, src/resources/extensions/hx/tests/workflow-manifest.test.ts
  - Verify: cd /Users/beratcan/Desktop/GithubProjects/hx-ai/.hx/worktrees/M002-yle1ri && npx tsc --noEmit && cd /Users/beratcan/Desktop/GithubProjects/hx-ai && node scripts/compile-tests.mjs && node --test dist-test/src/resources/extensions/hx/tests/workflow-manifest.test.js
- [x] **T04: Added remote-only hash + .hx-id marker to repoIdentity() and upgrade migration to ensureHxSymlink(); 9/9 new tests pass alongside 53 regression tests** — Port the upstream project relocation fix (#3080) that changes repoIdentity() to use remote-only hash for repos with remotes, adds .hx-id marker file for stable identity across moves, and includes upgrade migration logic in ensureHxSymlink().

**WARNING: This changes the identity hash computation — existing projects with remotes will get a different hash. The upgrade migration in ensureHxSymlink MUST be ported faithfully or users lose access to existing external state directories.**

Steps:
1. Read repo-identity.ts fully (482 lines), especially `repoIdentity()` (line 283) and `ensureHxSymlink()` (line 367).

2. **Modify `repoIdentity()`**: Change the hash computation for remote repos. Current: `sha256(remoteUrl + '\n' + root)`. New: If `remoteUrl` is not empty, use `sha256(remoteUrl)` only. If `remoteUrl` is empty (no remote), keep using `sha256('' + '\n' + root)` for local-only repos. This ensures projects can be relocated without changing identity.

3. **Add `.hx-id` marker file logic**: Add a function `readHxId(basePath)` that reads `<basePath>/.hx/.hx-id` if it exists and returns the stored hash. Add `writeHxId(basePath, id)` that writes the hash. Modify `repoIdentity()` to: first check `HX_PROJECT_ID` env var (existing), then check `.hx-id` marker, then compute hash. After computing, write `.hx-id` so future calls use the cached value.

4. **Add upgrade migration in `ensureHxSymlink()`**: Before creating the external directory, check if an old-format external dir exists (using the old hash = `sha256(remoteUrl + '\n' + root)`). If old dir exists and new dir doesn't, rename old → new. This preserves state across the hash algorithm change. Use `externalProjectsRoot()` to find the projects directory, then check for `<projectsRoot>/<oldHash>`.

5. **Add test**: Create `tests/project-relocation-recovery.test.ts` that verifies: (a) repoIdentity uses remote-only hash, (b) .hx-id marker persists identity, (c) local repos without remote still get stable hash.

GSD→HX: All file paths use `.hx/` and `.hx-id`. No GSD references.
  - Estimate: 1h
  - Files: src/resources/extensions/hx/repo-identity.ts, src/resources/extensions/hx/tests/project-relocation-recovery.test.ts
  - Verify: cd /Users/beratcan/Desktop/GithubProjects/hx-ai/.hx/worktrees/M002-yle1ri && npx tsc --noEmit && cd /Users/beratcan/Desktop/GithubProjects/hx-ai && node scripts/compile-tests.mjs && node --test dist-test/src/resources/extensions/hx/tests/project-relocation-recovery.test.js
- [x] **T05: Applied 6 scatter fixes: nativeCommit error surfacing, hx_requirement_save tool (upsert behavior), ghost milestone guard, auto-dashboard disk reconciliation, turn_end bridge invalidation, authoritative milestone status in workspace index** — Port the remaining 6 small upstream fixes that individually are 2-20 lines each.

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
  - Estimate: 1h
  - Files: src/resources/extensions/hx/auto-recovery.ts, src/resources/extensions/hx/db-writer.ts, src/resources/extensions/hx/bootstrap/db-tools.ts, src/resources/extensions/hx/parallel-eligibility.ts, src/web/auto-dashboard-service.ts, src/web/bridge-service.ts, src/resources/extensions/hx/workspace-index.ts, web/lib/hx-workspace-store.tsx, web/lib/workspace-status.ts
  - Verify: cd /Users/beratcan/Desktop/GithubProjects/hx-ai/.hx/worktrees/M002-yle1ri && npx tsc --noEmit && cd /Users/beratcan/Desktop/GithubProjects/hx-ai && node scripts/compile-tests.mjs && node --test dist-test/src/resources/extensions/hx/tests/workspace-index.test.js && node --test 'dist-test/src/resources/extensions/hx/tests/*.test.js' 2>&1 | tail -20
