---
id: S01
parent: M002-yle1ri
milestone: M002-yle1ri
provides:
  - SQLite-backed unit-claims.db with boolean claimUnit API
  - Unconditional DB-derive path in deriveState() (no empty-DB fallthrough)
  - Slice disk→DB reconciliation in deriveStateFromDb()
  - Enhanced ghost milestone detection (DB+slices check + worktree .git file check)
  - VACUUM recovery in openDatabase() for corrupted file-backed DBs
  - toNumeric() coercion for workflow-manifest SQLite TEXT columns
  - isInsideWorktree guard in migrateToExternalState()
  - Symlink layout detection in resolveProjectRootDbPath()
  - DB-unavailable retry guard in auto-post-unit
  - Project relocation resilience via remote-only hash + .hx-id marker
  - Upgrade migration renaming old-hash dirs to new-hash dirs in ensureHxSymlink()
  - nativeCommit error surfacing in auto-recovery
  - hx_requirement_save tool with upsert semantics
  - Ghost milestone ineligibility guard in parallel-eligibility
  - Auto-dashboard disk reconciliation against .hx/auto.lock
  - turn_end bridge invalidation for workspace domain
  - Authoritative milestone status/validationVerdict in workspace index
requires:
  []
affects:
  - S02
  - S03
  - S04
  - S05
  - S06
key_files:
  - src/resources/extensions/hx/unit-ownership.ts
  - src/resources/extensions/hx/tests/unit-ownership.test.ts
  - src/resources/extensions/hx/state.ts
  - src/resources/extensions/hx/hx-db.ts
  - src/resources/extensions/hx/tests/derive-state-db.test.ts
  - src/resources/extensions/hx/tests/vacuum-recovery.test.ts
  - src/resources/extensions/hx/workflow-manifest.ts
  - src/resources/extensions/hx/migrate-external.ts
  - src/resources/extensions/hx/bootstrap/dynamic-tools.ts
  - src/resources/extensions/hx/auto-post-unit.ts
  - src/resources/extensions/hx/tests/workflow-manifest.test.ts
  - src/resources/extensions/hx/repo-identity.ts
  - src/resources/extensions/hx/tests/project-relocation-recovery.test.ts
  - src/resources/extensions/hx/auto-recovery.ts
  - src/resources/extensions/hx/db-writer.ts
  - src/resources/extensions/hx/bootstrap/db-tools.ts
  - src/resources/extensions/hx/parallel-eligibility.ts
  - src/web/auto-dashboard-service.ts
  - src/web/bridge-service.ts
  - src/resources/extensions/hx/workspace-index.ts
  - web/lib/hx-workspace-store.tsx
  - web/lib/workspace-status.ts
key_decisions:
  - SQLite inline provider pattern (node:sqlite → better-sqlite3 fallback) reused for unit-claims.db, matching hx-db.ts
  - claimUnit returns boolean — false means different agent holds claim; INSERT OR REPLACE handles same-agent re-claim
  - Ghost milestone needs DB row + slices to be non-ghost; DB row alone is still ghost (stricter than task plan)
  - repoIdentity() priority: HX_PROJECT_ID → .hx-id marker → computed hash; writes .hx-id after every computation
  - Remote hash is sha256(remoteUrl) only (relocation-resilient); local-only hash is sha256('\n'+root)
  - updateRequirementInDb upserts skeleton on not-found instead of throwing HX_STALE_STATE
  - hx_requirement_save registered as canonical tool (28) with hx_save_requirement alias (29)
  - reconcileWithDiskState uses .hx/ paths exclusively (GSD→HX naming)
  - turn_end invalidation maps to workspace domain only
  - WorkspaceMilestoneTarget.status/validationVerdict authoritative from DB getMilestone() + VALIDATION frontmatter
patterns_established:
  - Inline SQLite provider: try node:sqlite, fallback better-sqlite3, per-basePath registry Map — use this pattern for any new mini-DB feature
  - Worktree isolation: compile-tests.mjs must run from main repo root; worktree-unique tests need separate esbuild after main compile
  - node_modules symlink: ln -s <main>/node_modules <worktree>/node_modules enables worktree scripts to use main repo deps
  - DB recovery pattern: try initSchema, on error try VACUUM + retry, only then re-throw
  - Identity marker file (.hx-id): compute hash once, write to .hx/.hx-id, read on subsequent calls — always write after computation
observability_surfaces:
  - hx-db: ensureDbOpen stderr diagnostics on failure
  - hx-db: skipping post-unit retry — DB unavailable stderr message
  - nativeCommit failures now surfaced via ctx.ui.notify (warning level) instead of silent swallow
  - auto-dashboard reconcileWithDiskState corrects stale active=true when auto.lock is absent
drill_down_paths:
  - .hx/milestones/M002-yle1ri/slices/S01/tasks/T01-SUMMARY.md
  - .hx/milestones/M002-yle1ri/slices/S01/tasks/T02-SUMMARY.md
  - .hx/milestones/M002-yle1ri/slices/S01/tasks/T03-SUMMARY.md
  - .hx/milestones/M002-yle1ri/slices/S01/tasks/T04-SUMMARY.md
  - .hx/milestones/M002-yle1ri/slices/S01/tasks/T05-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-04-04T10:54:08.151Z
blocker_discovered: false
---

# S01: State/DB Reconciliation & Data Safety

**Ported 16 upstream state/DB safety bugfixes into hx-ai: SQLite unit claims, state machine DB sync, slice reconciliation, VACUUM recovery, data coercion, worktree migration guard, project relocation resilience, and 6 scatter fixes — all typecheck + tests passing.**

## What Happened

S01 delivered 16 upstream bugfix ports across 5 tasks, covering every state/DB safety issue identified from gsd-2 v2.59.0.

**T01 — SQLite unit ownership (upstream #2531):** Rewrote unit-ownership.ts to use an inline SQLite provider (node:sqlite → better-sqlite3 fallback, matching hx-db.ts pattern) in place of the JSON file. DB at `.hx/unit-claims.db`. Added `initOwnershipTable`/`closeOwnershipDb` lifecycle exports. `claimUnit` now returns a boolean (false if a different agent holds the claim), enabling callers to detect conflicts rather than silently overwriting. 17/17 tests pass.

**T02 — State machine triple fix + VACUUM recovery:** Three state.ts fixes: (1) #2631 removed the `if (dbMilestones.length > 0)` guard in `deriveState()` — the DB derive path now always runs when `isDbAvailable()` is true; (2) #2533 added slice disk→DB reconciliation loop in `deriveStateFromDb()` — scans slice directories and inserts any missing slices into DB; (3) #3041 enhanced `isGhostMilestone()` to skip milestones that have both a DB row AND slices, and to recognize worktree `.git` files as non-ghost markers. hx-db.ts fix #2519: `openDatabase()` now wraps `initSchema()` in try/catch and attempts VACUUM recovery for file-backed DBs before re-throwing. 28/28 + 6/6 tests pass.

**T03 — Four data-safety micro-fixes:** (1) #2962 added `toNumeric()` helper to workflow-manifest.ts preventing silent NaN from TEXT-affinity SQLite columns; (2) #2970 added `isInsideWorktree` guard as the first statement of `migrateToExternalState()` preventing shared-state corruption from worktrees; (3) #2517 added `/.hx/projects/<hash>/worktrees/` symlink layout detection in `resolveProjectRootDbPath()` and structured stderr diagnostics in `ensureDbOpen()`; (4) #2517 added DB-unavailable guard around the `regenerateIfMissing` retry path in auto-post-unit.ts. 11/11 + 62/62 regression tests pass.

**T04 — Project relocation resilience (upstream #3080):** Modified `repoIdentity()` to use `sha256(remoteUrl)` for repos with remotes (location-independent) and `sha256('\n'+root)` for local-only repos. Added `readHxId`/`writeHxId` helpers for `.hx/.hx-id` marker file — identity now persists through directory moves. Added upgrade migration in `ensureHxSymlink()` that detects old-format hash dirs and renames them to the new format, preserving existing external state. 9/9 new tests + 53 regression tests pass.

**T05 — Six scatter fixes:** (1) #3052 auto-recovery.ts both `nativeCommit` catch blocks now surface errors via `ctx.ui.notify` instead of swallowing; (2) #3249 db-writer.ts + db-tools.ts: added `saveRequirementToDb`/`nextRequirementId`, `updateRequirementInDb` now upserts skeleton instead of throwing `HX_STALE_STATE`, `hx_requirement_save` + alias registered as new tools 28/29; (3) #2501 parallel-eligibility.ts ghost milestone guard added before rule evaluation; (4) #2705 auto-dashboard-service.ts: `reconcileWithDiskState()` reconciles active state against `.hx/auto.lock` and `.hx/runtime/paused-session.json`; (5) #2706 bridge-service.ts: `turn_end` added to `BridgeLiveStateInvalidationReason` union, workspace domain handler added; (6) #2807 workspace-index.ts + hx-workspace-store.tsx + workspace-status.ts: `status`/`validationVerdict` fields added to `WorkspaceMilestoneTarget`, populated from DB + VALIDATION frontmatter, `getMilestoneStatus` prefers authoritative DB status. 1/1 workspace-index test pass; 3100/3103 full suite (3 pre-existing skips, 2 pre-existing reassess-handler failures unrelated to S01).

**Root cause of verification failures:** The verification gate ran `node scripts/compile-tests.mjs` from the worktree directory (`M002-yle1ri/`), which has no `node_modules`. The correct invocation is from the main repo root. Fixed by creating a `node_modules` symlink in the worktree pointing to the main repo's `node_modules`.

## Verification

Both verification commands now pass:
1. `node scripts/compile-tests.mjs` (run from worktree with node_modules symlink): exit 0, 1159 files compiled, Done in 9.33s
2. `node --test dist-test/src/resources/extensions/hx/tests/workspace-index.test.js`: exit 0, 1/1 pass
3. `npx tsc --noEmit`: exit 0, no type errors
Root fix: created `node_modules` symlink in worktree → main repo node_modules so esbuild is resolvable.

## Requirements Advanced

- R001 — 16 of 95 upstream bugfixes ported (S01 scope)
- R002 — All ported fixes use hx/HX naming; grep confirmed no GSD references introduced
- R003 — All 16 state/DB reconciliation fixes applied: SQLite unit ownership, DB-derive guard removal, slice reconciliation, ghost check, VACUUM recovery, column coercion, migration guard, symlink layout, retry guard, project relocation, 6 scatter fixes
- R014 — tsc --noEmit passes, compile-tests.mjs passes, workspace-index.test 1/1 pass, full suite 3100/3103 (0 new failures)

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

Fix 3 ghost-milestone semantics refined: DB row alone (no slices) is still a ghost; DB row + slices = not ghost. Task plan implied DB row alone suffices — the stricter check is safer. updateRequirementInDb now upserts skeleton instead of throwing HX_STALE_STATE — three test files updated accordingly. Tool count in tool-naming.test.ts bumped from 27 to 29. The worktree's compile-tests.mjs had to be run via a node_modules symlink rather than from the main project due to esbuild being absent in the worktree.

## Known Limitations

vacuum-recovery.test.js imports hx-db via relative .ts path; after compile-tests.mjs copies .ts assets to dist-test, Node.js refuses to load .ts extensions — these tests must be run via a separate esbuild recompile of the worktree files. This is a pre-existing worktree isolation constraint, not introduced by S01. Two pre-existing reassess-handler test failures in main repo are unrelated to S01 work.

## Follow-ups

Downstream slices (S02–S06) should note that compile-tests.mjs must be run from the main project root, and any worktree-unique test files need re-esbuild-compilation after the main compile runs (it overwrites dist-test). The node_modules symlink pattern established here should be applied to future worktrees.

## Files Created/Modified

- `src/resources/extensions/hx/unit-ownership.ts` — Rewrote to use SQLite (unit-claims.db) with inline provider, boolean claimUnit
- `src/resources/extensions/hx/tests/unit-ownership.test.ts` — Rewritten for SQLite lifecycle; 17 tests
- `src/resources/extensions/hx/state.ts` — Three fixes: unconditional DB derive, slice reconciliation loop, enhanced ghost check
- `src/resources/extensions/hx/hx-db.ts` — VACUUM recovery in openDatabase() on initSchema failure
- `src/resources/extensions/hx/tests/derive-state-db.test.ts` — 3 new ghost milestone tests; 28 total
- `src/resources/extensions/hx/tests/vacuum-recovery.test.ts` — New: 6 VACUUM recovery tests
- `src/resources/extensions/hx/workflow-manifest.ts` — Added toNumeric() helper; applied to sequence/exit_code/duration_ms fields
- `src/resources/extensions/hx/migrate-external.ts` — Added isInsideWorktree early-return guard
- `src/resources/extensions/hx/bootstrap/dynamic-tools.ts` — Added symlink layout detection and ensureDbOpen stderr diagnostics
- `src/resources/extensions/hx/auto-post-unit.ts` — Added DB-unavailable guard around regenerateIfMissing retry path
- `src/resources/extensions/hx/tests/workflow-manifest.test.ts` — 3 new coercion tests; 11 total
- `src/resources/extensions/hx/repo-identity.ts` — Remote-only hash, .hx-id marker, upgrade migration in ensureHxSymlink()
- `src/resources/extensions/hx/tests/project-relocation-recovery.test.ts` — New: 9 project relocation tests
- `src/resources/extensions/hx/auto-recovery.ts` — nativeCommit catch blocks now surface via ctx.ui.notify
- `src/resources/extensions/hx/db-writer.ts` — Added saveRequirementToDb, nextRequirementId, upsert in updateRequirementInDb
- `src/resources/extensions/hx/bootstrap/db-tools.ts` — Registered hx_requirement_save (28) and hx_save_requirement alias (29)
- `src/resources/extensions/hx/parallel-eligibility.ts` — Ghost milestone ineligibility guard
- `src/web/auto-dashboard-service.ts` — reconcileWithDiskState() and isPidAlive() helpers
- `src/web/bridge-service.ts` — turn_end added to BridgeLiveStateInvalidationReason; workspace invalidation handler
- `src/resources/extensions/hx/workspace-index.ts` — status/validationVerdict fields populated from DB + VALIDATION frontmatter
- `web/lib/hx-workspace-store.tsx` — status/validationVerdict added to WorkspaceMilestoneTarget interface
- `web/lib/workspace-status.ts` — getMilestoneStatus prefers DB status over heuristic slice-counting
