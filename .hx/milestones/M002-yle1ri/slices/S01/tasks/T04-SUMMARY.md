---
id: T04
parent: S01
milestone: M002-yle1ri
provides: []
requires: []
affects: []
key_files: ["src/resources/extensions/hx/repo-identity.ts", "src/resources/extensions/hx/tests/project-relocation-recovery.test.ts"]
key_decisions: ["repoIdentity() priority: HX_PROJECT_ID → .hx-id → computed hash; after computing, always write .hx-id", "Remote hash uses sha256(remoteUrl) only; local-only uses sha256('\n'+root) distinct from empty-string sha256", "Upgrade migration placed between cleanNumberedHxVariants() and mkdirSync(externalPath): rename old→new if old exists and new doesn't", "renameSync wrapped in try/catch (non-fatal); fresh external dir created on failure"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "tsc --noEmit (worktree): exit 0. compile-tests.mjs (main project): exit 0. project-relocation-recovery.test.js: 9/9 pass. Regression (derive-state-db 28, unit-ownership 14, workflow-manifest 11): 53/53 pass."
completed_at: 2026-04-04T10:17:40.247Z
blocker_discovered: false
---

# T04: Added remote-only hash + .hx-id marker to repoIdentity() and upgrade migration to ensureHxSymlink(); 9/9 new tests pass alongside 53 regression tests

> Added remote-only hash + .hx-id marker to repoIdentity() and upgrade migration to ensureHxSymlink(); 9/9 new tests pass alongside 53 regression tests

## What Happened
---
id: T04
parent: S01
milestone: M002-yle1ri
key_files:
  - src/resources/extensions/hx/repo-identity.ts
  - src/resources/extensions/hx/tests/project-relocation-recovery.test.ts
key_decisions:
  - repoIdentity() priority: HX_PROJECT_ID → .hx-id → computed hash; after computing, always write .hx-id
  - Remote hash uses sha256(remoteUrl) only; local-only uses sha256('\n'+root) distinct from empty-string sha256
  - Upgrade migration placed between cleanNumberedHxVariants() and mkdirSync(externalPath): rename old→new if old exists and new doesn't
  - renameSync wrapped in try/catch (non-fatal); fresh external dir created on failure
duration: ""
verification_result: passed
completed_at: 2026-04-04T10:17:40.248Z
blocker_discovered: false
---

# T04: Added remote-only hash + .hx-id marker to repoIdentity() and upgrade migration to ensureHxSymlink(); 9/9 new tests pass alongside 53 regression tests

**Added remote-only hash + .hx-id marker to repoIdentity() and upgrade migration to ensureHxSymlink(); 9/9 new tests pass alongside 53 regression tests**

## What Happened

Modified repo-identity.ts to implement the upstream #3080 project relocation fix. Added readHxId/writeHxId helpers for the .hx/.hx-id marker file. Changed repoIdentity() to use sha256(remoteUrl) for repos with remotes (relocation-resilient), sha256('\n'+root) for local-only repos, with .hx-id caching as an intermediate priority layer. Added upgrade migration in ensureHxSymlink() that detects and renames old-format external dirs (old hash = sha256(remoteUrl+'\n'+root)) to the new hash location. Created project-relocation-recovery.test.ts with 9 tests. The initial AUTO-FIX failures were from T03's verification context (compile-tests.mjs from worktree, no esbuild). T04 ran fresh with compile-tests.mjs from main project root and esbuild-recompile of worktree files after the main compile.

## Verification

tsc --noEmit (worktree): exit 0. compile-tests.mjs (main project): exit 0. project-relocation-recovery.test.js: 9/9 pass. Regression (derive-state-db 28, unit-ownership 14, workflow-manifest 11): 53/53 pass.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx tsc --noEmit (worktree)` | 0 | ✅ pass | 5000ms |
| 2 | `node scripts/compile-tests.mjs (main project)` | 0 | ✅ pass | 6700ms |
| 3 | `node --test project-relocation-recovery.test.js` | 0 | ✅ pass (9/9) | 1551ms |
| 4 | `node --test derive-state-db.test.js` | 0 | ✅ pass (28/28) | 337ms |
| 5 | `node --test unit-ownership.test.js` | 0 | ✅ pass (14/14) | 195ms |
| 6 | `node --test workflow-manifest.test.js` | 0 | ✅ pass (11/11) | 321ms |


## Deviations

The verification gate failures shown at task start were from T03's verification run (compile-tests.mjs from worktree, workflow-manifest.test.js not found). T04 was implemented from scratch. The worktree test file (project-relocation-recovery.test.ts) does not exist in the main project src/, so after compile-tests.mjs runs the stale-cleanup removes any previously compiled version; re-compilation with esbuild is required after each compile-tests.mjs invocation.

## Known Issues

vacuum-recovery.test.js (T02) has a pre-existing issue: its compiled JS imports hx-db.ts via a relative path; after compile-tests.mjs copies .ts assets to dist-test, Node.js refuses to load .ts extensions. Not introduced by T04.

## Files Created/Modified

- `src/resources/extensions/hx/repo-identity.ts`
- `src/resources/extensions/hx/tests/project-relocation-recovery.test.ts`


## Deviations
The verification gate failures shown at task start were from T03's verification run (compile-tests.mjs from worktree, workflow-manifest.test.js not found). T04 was implemented from scratch. The worktree test file (project-relocation-recovery.test.ts) does not exist in the main project src/, so after compile-tests.mjs runs the stale-cleanup removes any previously compiled version; re-compilation with esbuild is required after each compile-tests.mjs invocation.

## Known Issues
vacuum-recovery.test.js (T02) has a pre-existing issue: its compiled JS imports hx-db.ts via a relative path; after compile-tests.mjs copies .ts assets to dist-test, Node.js refuses to load .ts extensions. Not introduced by T04.
