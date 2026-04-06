---
id: S02
parent: M002-yle1ri
milestone: M002-yle1ri
provides:
  - DB truncation guard preventing worktree DB destruction on sync
  - mcp.json propagation to new worktrees
  - MERGE_HEAD stale artifact cleanup before and after squash merge
  - nativeMergeAbort on all error paths in worktree merge
  - Milestone shelter isolating non-active milestones during stash
  - isInsideHxWorktree() guard in probeHxRoot() preventing path escape
  - HX_MILESTONE_LOCK parallel milestone scoping in smartStage()
  - findNestedGitDirs() nested .git cleanup in removeWorktree()
  - isolation-none worktree safety in worktree-resolver.ts
  - DB-complete milestone detection in parallel-merge.ts
  - hx auto subcommand alias for headless dispatch
  - empty-content abort fast-path in agent-end-recovery.ts
  - stopAuto null-unit guard in phases.ts
  - shouldBlockQueueExecution gate in write-gate.ts
  - turn_end quick-branch cleanup in register-hooks.ts
  - worktree-merge unit type in preferences routing
  - Autonomous execution guards in plan-slice/execute-task/complete-slice prompts
  - captures milestone staleness filtering and stamping
requires:
  - slice: S01
    provides: State/DB reconciliation baseline — typecheck + tests passing at 3100/3103
affects:
  - S03
  - S04
  - S05
  - S06
key_files:
  - src/resources/extensions/hx/auto-worktree.ts
  - src/resources/extensions/hx/paths.ts
  - src/resources/extensions/hx/git-service.ts
  - src/resources/extensions/hx/worktree-manager.ts
  - src/resources/extensions/hx/worktree-resolver.ts
  - src/resources/extensions/hx/parallel-merge.ts
  - src/cli.ts
  - src/help-text.ts
  - src/resources/extensions/hx/bootstrap/agent-end-recovery.ts
  - src/resources/extensions/hx/auto/phases.ts
  - src/resources/extensions/hx/bootstrap/write-gate.ts
  - src/resources/extensions/hx/bootstrap/register-hooks.ts
  - src/resources/extensions/hx/preferences-models.ts
  - src/resources/extensions/hx/preferences-types.ts
  - src/resources/extensions/hx/captures.ts
  - src/resources/extensions/hx/triage-resolution.ts
  - src/resources/extensions/hx/prompts/plan-slice.md
  - src/resources/extensions/hx/prompts/execute-task.md
  - src/resources/extensions/hx/prompts/complete-slice.md
key_decisions:
  - restoreShelter implemented as local closure to DRY 3 exit paths in auto-worktree.ts
  - shouldBlockQueueExecution co-located with shouldBlockContextWrite in write-gate.ts — all tool-call gate logic in one file
  - HX_MILESTONE_LOCK env var used in smartStage() for parallel worker milestone scoping
  - determineMergeOrder basePath param made optional to preserve backward compatibility
  - isInsideHxWorktree placed before hxRootCache to avoid forward reference in probeHxRoot()
  - hx auto subcommand shifts 'auto' off messages then calls parseHeadlessArgs(['headless', ...rest, ...--flags])
patterns_established:
  - Tool-call gate functions: export from write-gate.ts, return { block: boolean; reason?: string }, wire in register-hooks.ts tool_call handler
  - Multi-exit-path cleanup: implement as local closure capturing relevant locals rather than repeated inline code
  - Parallel milestone scoping: workers read HX_MILESTONE_LOCK and exclude other milestone paths in git staging via :(exclude) pathspecs
  - Autonomous execution guard: prompt files that run without human interaction include a paragraph instructing the agent to call the HX persistence tool (hx_plan_slice, hx_complete_task, etc.) and avoid ask_user_questions
observability_surfaces:
  - shouldBlockQueueExecution returns reason string for logging when a tool is blocked during queue phase
  - discoverDbCompletedMilestones scans worktree DBs via sqlite3 CLI — DB-complete milestones surface in merge order determination
drill_down_paths:
  - .hx/milestones/M002-yle1ri/slices/S02/tasks/T01-SUMMARY.md
  - .hx/milestones/M002-yle1ri/slices/S02/tasks/T02-SUMMARY.md
  - .hx/milestones/M002-yle1ri/slices/S02/tasks/T03-SUMMARY.md
  - .hx/milestones/M002-yle1ri/slices/S02/tasks/T04-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-04-04T12:14:00.904Z
blocker_discovered: false
---

# S02: Worktree/Git & Auto-mode Fixes

**Ported 21 upstream worktree/git and auto-mode fixes across 15 source files; typecheck clean, 3100+ tests pass with 0 new failures, no GSD naming regressions.**

## What Happened

S02 ported 21 upstream fixes from gsd-2 v2.59.0 into hx-ai across 4 tasks and 15 source files.

**T01 — auto-worktree.ts (5 fixes):** The largest single file (1726 lines). (1) DB truncation guard: changed unconditional `unlinkSync(wtDb)` to check `statSync(wtDb).size === 0` first, preventing destruction of valid worktree DBs. (2) mcp.json sync: added to ROOT_STATE_FILES and copyPlanningArtifacts loop so new worktrees inherit MCP config. (3) MERGE_HEAD pre-merge cleanup: added a 3-file cleanup loop (SQUASH_MSG/MERGE_MSG/MERGE_HEAD) before nativeMergeSquash to clear stale artifacts from prior interrupted merges. (4) nativeMergeAbort on error paths: imported nativeMergeAbort, called it before both dirty-tree and conflict error throws, replaced single-file SQUASH_MSG cleanup on success with the same 3-file loop. (5) Milestone shelter before stash: scan and move non-active milestones to `.hx/.milestone-shelter/` before stash push, extend stash args with `:(exclude).hx/milestones` pathspec, restore shelter on all 3 exit paths via a local `restoreShelter()` closure.

**T02 — Git subsystem (6 fixes across 5 files):** (1) paths.ts: added exported `isInsideHxWorktree()` function and two guards in `probeHxRoot()` to prevent escaping to project-root `.hx/` when already inside a worktree. (2) git-service.ts JSDoc: corrected isolation field documentation. (3) git-service.ts smartStage: added `HX_MILESTONE_LOCK` env-var check that appends exclusion pathspecs for non-locked milestone dirs, ensuring parallel workers only stage their own milestone. (4) worktree-manager.ts: added `findNestedGitDirs()` recursive scanner and `NESTED_GIT_SKIP_DIRS` set; called before `removeWorktree()` to clean up nested `.git` entries that could orphan submodule-like artifacts. (5) worktree-resolver.ts: changed `mode=none` early-return to only skip when NOT inside an auto-worktree — preserves merge execution when isolation is none but worktree context exists. (6) parallel-merge.ts: added `isMilestoneCompleteInWorktreeDb()` (sqlite3 CLI check) and `discoverDbCompletedMilestones()` scanner; `determineMergeOrder()` now accepts optional `basePath` param and includes DB-complete milestones alongside worker-reported ones.

**T03 — Auto-mode dispatch (5 fixes across 6 files):** (1) cli.ts + help-text.ts: added `hx auto` as an alias for `hx headless`, surfaced in error hints and help text. (2) agent-end-recovery.ts: empty-content abort fast-path — when provider returns empty content array with no errorMessage, route to `resolveAgentEnd` instead of `pauseAuto`, preventing stuck-pause loops. (3) phases.ts: wrapped `closeoutUnit` in `if (s.currentUnit)` guard, changed bare `.startedAt` accesses to optional chaining — prevents null dereference when stopAuto races with unit completion. (4) write-gate.ts: added `HX_DIR_RE`, `QUEUE_SAFE_TOOLS`, `BASH_READ_ONLY_RE` constants and exported `shouldBlockQueueExecution()` — blocks all dangerous tool calls during queue execution phase while allowing read-only tools, safe bash commands, and non-.hx writes. (5) register-hooks.ts: wired `shouldBlockQueueExecution` into tool_call handler and added `turn_end` handler that calls `cleanupQuickBranch(process.cwd())` guarded by `isAutoActive()`.

**T04 — Metadata + verification (5 fixes across 7 files):** (1) preferences-types.ts: added `worktree-merge`, `validate-milestone`, `rewrite-docs`, `discuss-milestone`, `discuss-slice` to `KNOWN_UNIT_TYPES`. (2) preferences-models.ts: added `worktree-merge` case to completion group in `resolveModelWithFallbacksForUnit()`. (3) Prompt files: inserted Autonomous execution guard paragraphs into plan-slice.md, execute-task.md, complete-slice.md instructing agents to call the persistence tools and avoid `ask_user_questions` in autonomous mode. (4) captures.ts: added `resolvedInMilestone` field to `CaptureEntry`, new `stampCaptureMilestone()` function, updated `loadActionableCaptures()` to accept and apply `currentMilestoneId` staleness filter. (5) triage-resolution.ts: wired milestone staleness — passes `mid` to `loadActionableCaptures`, stamps each processed capture via `stampCaptureMilestone`.

All 4 tasks completed with typecheck exit 0 and zero new test failures against the S01 baseline (3100 pass / 0 fail / 3 skip). Zero GSD naming regressions across all 15 modified files.

## Verification

Final slice-level verification: `npx tsc --noEmit` exit 0 (13.5s). All 11 slice-level grep checks passed (mcp.json=2, MERGE_HEAD=6, milestone-shelter=1, statSync=4, isInsideHxWorktree=3, HX_MILESTONE_LOCK=2, findNestedGitDirs=2, isMilestoneCompleteInWorktreeDb=2, hasEmptyContent=2, shouldBlockQueueExecution=1, cleanupQuickBranch=2, worktree-merge=1, Autonomous execution=1, resolvedInMilestone=4, stampCaptureMilestone=4). GSD/gsd naming regression grep across all 15 modified files: 0 hits. Full test suite: 3100 pass / 0 fail / 3 skip (3 skips are pre-existing, confirmed against S01 baseline).

## Requirements Advanced

- R004 — 14 worktree/git merge fixes applied: DB truncation guard, mcp.json sync, MERGE_HEAD cleanup, nativeMergeAbort on error paths, milestone shelter, isInsideHxWorktree guard, HX_MILESTONE_LOCK scoping, findNestedGitDirs cleanup, isolation-none safety, DB-complete milestone detection
- R007 — 7 auto-mode dispatch fixes applied: hx auto subcommand, empty-content abort fast-path, stopAuto null-unit guard, shouldBlockQueueExecution gate, turn_end quick-branch cleanup, autonomous execution prompt guards, captures staleness
- R002 — Zero GSD naming regressions across all 15 modified files verified by grep
- R014 — npx tsc --noEmit exit 0, full test suite 3100 pass / 0 fail across all S02 changes

## Requirements Validated

- R014 — npx tsc --noEmit exit 0 (13.5s), node --test dist-test: 3100 pass / 0 fail / 3 skip (3 skips pre-existing)
- R002 — grep -rn '\bgsd\b|\bGSD\b' across all 15 modified S02 files: 0 hits

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

T01: restoreShelter implemented as a local closure rather than repeated inline code — functionally equivalent. T02: determineMergeOrder basePath param typed as optional (?) to preserve backward compatibility with existing 2-arg callers. T04: validate-milestone, rewrite-docs, discuss-milestone, discuss-slice were already present in preferences-models.ts switch cases — only KNOWN_UNIT_TYPES array needed updating.

## Known Limitations

The 3 pre-existing test failures (worktree-sync-milestones and reassess-handler sub-tests) were present before S02 and are not introduced by this slice. isMilestoneCompleteInWorktreeDb() uses sqlite3 CLI — will silently return false if sqlite3 binary is not on PATH.

## Follow-ups

None required. S03 can proceed with milestone lifecycle, guided-flow, and model/provider fixes.

## Files Created/Modified

- `src/resources/extensions/hx/auto-worktree.ts` — 5 fixes: DB truncation guard, mcp.json sync, MERGE_HEAD cleanup, nativeMergeAbort error paths, milestone shelter before stash
- `src/resources/extensions/hx/paths.ts` — Added isInsideHxWorktree() exported function and two guards in probeHxRoot()
- `src/resources/extensions/hx/git-service.ts` — JSDoc isolation fix, HX_MILESTONE_LOCK parallel milestone exclusion in smartStage()
- `src/resources/extensions/hx/worktree-manager.ts` — NESTED_GIT_SKIP_DIRS constant, findNestedGitDirs() scanner, nested .git cleanup in removeWorktree()
- `src/resources/extensions/hx/worktree-resolver.ts` — isolation-none early-return now only skips when NOT inside auto-worktree
- `src/resources/extensions/hx/parallel-merge.ts` — isMilestoneCompleteInWorktreeDb(), discoverDbCompletedMilestones(), determineMergeOrder() DB-complete milestone inclusion
- `src/cli.ts` — Added hx auto subcommand block that forwards to headless dispatch
- `src/help-text.ts` — Added hx auto alias to CLI help text
- `src/resources/extensions/hx/bootstrap/agent-end-recovery.ts` — Empty-content abort fast-path routes to resolveAgentEnd instead of pauseAuto
- `src/resources/extensions/hx/auto/phases.ts` — Wrapped closeoutUnit in if (s.currentUnit) guard, changed bare .startedAt to optional chaining
- `src/resources/extensions/hx/bootstrap/write-gate.ts` — Added HX_DIR_RE, QUEUE_SAFE_TOOLS, BASH_READ_ONLY_RE constants and shouldBlockQueueExecution() gate function
- `src/resources/extensions/hx/bootstrap/register-hooks.ts` — Wired shouldBlockQueueExecution in tool_call handler, added turn_end handler for cleanupQuickBranch
- `src/resources/extensions/hx/preferences-models.ts` — Added worktree-merge case to completion group in resolveModelWithFallbacksForUnit()
- `src/resources/extensions/hx/preferences-types.ts` — Added 5 new unit types to KNOWN_UNIT_TYPES array
- `src/resources/extensions/hx/captures.ts` — Added resolvedInMilestone field, stampCaptureMilestone(), staleness filter in loadActionableCaptures()
- `src/resources/extensions/hx/triage-resolution.ts` — Passed mid to loadActionableCaptures, stamps each capture via stampCaptureMilestone
- `src/resources/extensions/hx/prompts/plan-slice.md` — Added Autonomous execution guard paragraph
- `src/resources/extensions/hx/prompts/execute-task.md` — Added Autonomous execution guard paragraph
- `src/resources/extensions/hx/prompts/complete-slice.md` — Added Autonomous execution guard paragraph
