---
estimated_steps: 22
estimated_files: 1
skills_used: []
---

# T01: hx-db.ts schema v15: slice_locks table + accessor functions

Add the slice_locks table as schema v15 in hx-db.ts. This table is required by S02 (slice-level parallelism) for DB-backed lock coordination. Add four accessor functions: acquireSliceLock, releaseSliceLock, getSliceLock, and cleanExpiredSliceLocks.

Steps:
1. Read hx-db.ts lines 158–168 to confirm SCHEMA_VERSION = 14 and the pattern used for prior migrations.
2. Bump SCHEMA_VERSION from 14 to 15.
3. Add a `currentVersion < 15` migration block immediately after the v14 block (after line ~755). The block creates:
   ```sql
   CREATE TABLE IF NOT EXISTS slice_locks (
     milestone_id TEXT NOT NULL,
     slice_id TEXT NOT NULL,
     worker_pid INTEGER NOT NULL,
     acquired_at TEXT NOT NULL,
     expires_at TEXT NOT NULL,
     PRIMARY KEY (milestone_id, slice_id)
   )
   ```
   Then inserts `schema_version` row for version 15.
4. Add four exported functions after the existing slice_dependencies accessors (~line 1730):
   - `acquireSliceLock(db, milestoneId, sliceId, workerPid, ttlMs)`: INSERT OR IGNORE; returns boolean (true if acquired)
   - `releaseSliceLock(db, milestoneId, sliceId, workerPid)`: DELETE WHERE pid matches
   - `getSliceLock(db, milestoneId, sliceId)`: returns lock row or null
   - `cleanExpiredSliceLocks(db)`: DELETE WHERE expires_at < now
5. Run `npx tsc --noEmit` — must exit 0.

## Inputs

- ``src/resources/extensions/hx/hx-db.ts``

## Expected Output

- ``src/resources/extensions/hx/hx-db.ts``

## Verification

npx tsc --noEmit && grep -n 'SCHEMA_VERSION = 15' src/resources/extensions/hx/hx-db.ts && grep -n 'slice_locks' src/resources/extensions/hx/hx-db.ts | wc -l | awk '{if($1>=4) print "OK"; else print "FAIL: expected >=4 slice_locks references"}'
