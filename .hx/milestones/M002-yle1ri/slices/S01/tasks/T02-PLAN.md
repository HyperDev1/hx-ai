---
estimated_steps: 30
estimated_files: 4
skills_used: []
---

# T02: Apply state.ts triple fix and hx-db.ts VACUUM recovery

Port three upstream state.ts fixes and one hx-db.ts fix for DB resilience.

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

## Inputs

- `src/resources/extensions/hx/state.ts`
- `src/resources/extensions/hx/hx-db.ts`
- `src/resources/extensions/hx/tests/derive-state-db.test.ts`

## Expected Output

- `src/resources/extensions/hx/state.ts`
- `src/resources/extensions/hx/hx-db.ts`
- `src/resources/extensions/hx/tests/derive-state-db.test.ts`
- `src/resources/extensions/hx/tests/vacuum-recovery.test.ts`

## Verification

cd /Users/beratcan/Desktop/GithubProjects/hx-ai/.hx/worktrees/M002-yle1ri && npx tsc --noEmit && cd /Users/beratcan/Desktop/GithubProjects/hx-ai && node scripts/compile-tests.mjs && node --test dist-test/src/resources/extensions/hx/tests/derive-state-db.test.js && node --test dist-test/src/resources/extensions/hx/tests/vacuum-recovery.test.js
