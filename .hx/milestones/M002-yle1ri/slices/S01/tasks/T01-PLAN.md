---
estimated_steps: 15
estimated_files: 2
skills_used: []
---

# T01: Migrate unit-ownership.ts from JSON to SQLite storage

Rewrite unit-ownership.ts to use a self-contained SQLite database instead of JSON file for unit claims. The upstream pattern uses a mini SQLite provider inline (tries node:sqlite first, falls back to better-sqlite3). DB file stored at `<basePath>/.hx/unit-claims.db`. Export `initOwnershipTable(basePath)` and `closeOwnershipDb(basePath)` for lifecycle management. Change `claimUnit` return type from `void` to `boolean` (returns false if another agent already holds the claim). Rewrite test file to use SQLite API.

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

## Inputs

- `src/resources/extensions/hx/unit-ownership.ts`
- `src/resources/extensions/hx/tests/unit-ownership.test.ts`
- `src/resources/extensions/hx/hx-db.ts`

## Expected Output

- `src/resources/extensions/hx/unit-ownership.ts`
- `src/resources/extensions/hx/tests/unit-ownership.test.ts`

## Verification

cd /Users/beratcan/Desktop/GithubProjects/hx-ai/.hx/worktrees/M002-yle1ri && npx tsc --noEmit && cd /Users/beratcan/Desktop/GithubProjects/hx-ai && node scripts/compile-tests.mjs && node --test dist-test/src/resources/extensions/hx/tests/unit-ownership.test.js
