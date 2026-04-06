# S01: State/DB Reconciliation & Data Safety — UAT

**Milestone:** M002-yle1ri
**Written:** 2026-04-04T10:54:08.152Z

## UAT Type
UAT mode: runtime-executable

## Preconditions
- Working directory: `/Users/beratcan/Desktop/GithubProjects/hx-ai/.hx/worktrees/M002-yle1ri`
- `node_modules` symlink exists in worktree pointing to main repo node_modules
- TypeScript compiles cleanly (`npx tsc --noEmit` exits 0)
- `dist-test/` populated by `node scripts/compile-tests.mjs`

## Test Cases

### TC01 — Compile pipeline succeeds (prerequisite)
**Steps:**
1. Run `node scripts/compile-tests.mjs` from worktree
2. Verify exit code 0 and "Done in Xs" output
**Expected:** Exit 0, 1159+ files compiled, no esbuild errors

### TC02 — Unit ownership: SQLite boolean API
**Steps:**
1. Run `node --test dist-test/src/resources/extensions/hx/tests/unit-ownership.test.js`
**Expected:** 17/17 pass including:
- `claimUnit` returns `true` for first claim
- `claimUnit` returns `false` when different agent holds claim
- `claimUnit` returns `true` for same-agent re-claim (idempotent)
- `releaseUnit` clears claim correctly
- `initOwnershipTable`/`closeOwnershipDb` lifecycle works

### TC03 — State DB reconciliation fixes
**Steps:**
1. Run `node --test dist-test/src/resources/extensions/hx/tests/derive-state-db.test.js`
**Expected:** 28/28 pass including:
- Ghost milestone with DB row + slices is NOT a ghost
- Ghost milestone with only DB row (no slices) IS still a ghost
- Milestone with worktree `.git` file is NOT a ghost
- Slice disk→DB reconciliation inserts missing slices

### TC04 — VACUUM recovery
**Steps:**
1. Run `node --test dist-test/src/resources/extensions/hx/tests/vacuum-recovery.test.js` (after worktree esbuild recompile)
**Expected:** 6/6 pass:
- Healthy DB opens without recovery
- Corrupted DB triggers VACUUM and recovers
- Double-corrupt DB re-throws original error

### TC05 — Workflow manifest column coercion
**Steps:**
1. Run `node --test dist-test/src/resources/extensions/hx/tests/workflow-manifest.test.js`
**Expected:** 11/11 pass including:
- String '42' coerces to number 42
- `null` coerces to 0
- `undefined` coerces to 0

### TC06 — Project relocation resilience
**Steps:**
1. Run `node --test dist-test/src/resources/extensions/hx/tests/project-relocation-recovery.test.js`
**Expected:** 9/9 pass including:
- repos with remotes use `sha256(remoteUrl)` hash (not including root path)
- `.hx-id` marker persists identity across invocations
- local-only repos use `sha256('\n'+root)` hash
- upgrade migration renames old-hash dir to new-hash dir

### TC07 — Workspace index authoritative status
**Steps:**
1. Run `node --test dist-test/src/resources/extensions/hx/tests/workspace-index.test.js`
**Expected:** 1/1 pass — workspace indexes active milestone/slice/task and suggests commands

### TC08 — Tool registration (hx_requirement_save)
**Steps:**
1. Run `node --test dist-test/src/resources/extensions/hx/tests/tool-naming.test.js`
**Expected:** 1/1 pass — tool count reflects 29 tools (hx_requirement_save + alias registered)

### TC09 — DB writer upsert semantics
**Steps:**
1. Run `node --test dist-test/src/resources/extensions/hx/tests/db-writer.test.js`
**Expected:** 17/17 pass — updateRequirementInDb upserts skeleton on not-found instead of throwing

### TC10 — Full regression suite
**Steps:**
1. Run `node --test 'dist-test/src/resources/extensions/hx/tests/*.test.js'`
**Expected:** ≥3100/3103 pass, 0 new failures (2 pre-existing reassess-handler failures, 3 perf skips are acceptable)

## Edge Cases
- Running `compile-tests.mjs` from the worktree without node_modules symlink → `MODULE_NOT_FOUND: esbuild` error (fixed by symlink)
- compile-tests.mjs stale-cleanup removes worktree-unique test JS files (e.g. vacuum-recovery.test.js) from dist-test if source isn't in main src/ — must re-esbuild after main compile
- `claimUnit` with same agent + same key is idempotent (re-claim returns true, not false)
- Ghost milestone with DB row but zero slices: still ghost (stricter than task plan specified)

