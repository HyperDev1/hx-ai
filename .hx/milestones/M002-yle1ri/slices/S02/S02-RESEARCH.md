# S02: Worktree/Git & Auto-mode Fixes — Research

**Date:** 2026-04-04
**Scope:** 21 upstream commits from gsd-2 v2.59.0 covering worktree/git merge operations and auto-mode dispatch

## Summary

S02 ports 21 upstream fixes across two overlapping categories: (1) worktree/git integrity (MERGE_HEAD cleanup, DB truncation prevention, nested .git safety, isolation mode robustness, parallel scope scoping), and (2) auto-mode dispatch reliability (`hx auto` subcommand routing, empty-content abort handling, stopAuto race guard, queue execution blocking, ask_user_questions poisoning prevention). Together they address the most severe class of data-loss bugs and stuck-loop scenarios.

All target files exist in `src/resources/extensions/hx/` with full GSD→HX naming already applied from M001. The work is mechanical adaptation: apply the upstream diff logic to the hx-ai file, rename every `gsd`/`.gsd`/`GSD_` reference to `hx`/`.hx`/`HX_`. The largest single file is `auto-worktree.ts` (1,650 lines) which receives 5 separate fixes. No new dependencies are required.

The `isInsideHxWorktree` guard fix (#3083) is particularly important: without it, `hxRoot()` escapes from worktree-local `.hx/` to the project root, causing `ensurePreconditions()` and `deriveState()` to read/write state in the wrong location — a silent corruption bug.

## Recommendation

Group fixes into 5 tasks by file affinity:
1. **T01** — `auto-worktree.ts` (5 fixes: DB truncation, MERGE_HEAD × 3, mcp.json, CONTEXT stash shelter)
2. **T02** — git subsystem (worktree-manager.ts nested .git, worktree-resolver.ts isolation safety, git-service.ts × 2, paths.ts worktree guard, parallel-merge.ts DB check)
3. **T03** — auto-mode dispatch (cli.ts headless routing, agent-end-recovery.ts empty abort, auto/phases.ts race guard)
4. **T04** — queue execution guard + turn_end hooks (write-gate.ts, register-hooks.ts × 2, index.ts, preferences-models.ts + preferences-types.ts, prompts × 3, captures.ts + triage-resolution.ts)
5. **T05** — verification: tsc + tests

## Implementation Landscape

### Key Files

**auto-worktree.ts** (`src/resources/extensions/hx/auto-worktree.ts`, 1,650 lines)
- **Fix #3255** (commit `677ae4f07`): `syncProjectRootToWorktree()` at line 224 unconditionally deletes `hx.db`. Change to check `statSync(wtDb).size === 0` and only delete if empty. Add `statSync` to fs imports.
- **Fix #2912 pre-merge cleanup** (commits `a91dafff6`, `50ef301c5`): Around line 1415 (before the `nativeMergeSquash` call), add step 7b: loop over `["SQUASH_MSG", "MERGE_MSG", "MERGE_HEAD"]` and unlink each if present. Replace existing step 7c.
- **Fix #2912 error-path cleanup** (commit `99ae786ab`): At the dirty-tree error path (~line 1436) and code-conflict error path (~line 1492), add MERGE_HEAD cleanup (call `nativeMergeAbort` + loop unlink). Import `nativeMergeAbort` from `./native-git-bridge.js`. At the success path (~line 1518), replace single `squashMsgPath` unlink with loop over all three files.
- **Fix #3251** (commit `00793f584`): Add `"mcp.json"` to `ROOT_STATE_FILES` constant (line 78) and to the `copyPlanningArtifacts` for-loop (~line 1000).
- **Fix #3273** (commit `91019466b`): Before the stash push (~line 1410), change `stash push --include-untracked` to add `-- :(exclude).hx/milestones`. Add step 7a: shelter queued milestone dirs (scan `.hx/milestones/`, move non-current milestone dirs to `.hx/.milestone-shelter/`, restore on all paths). Need `cpSync`, `mkdirSync`, `readdirSync`, `rmSync` (may already be imported).

**git-service.ts** (`src/resources/extensions/hx/git-service.ts`, 732 lines)
- **Fix #3047** (commit `938885b6f`): In `smartStage()` (~line 490), after `const allExclusions = [...]`, add parallel worker milestone scope block using `process.env.HX_MILESTONE_LOCK` (already adapted name). Import `readdirSync` from `node:fs`. Use `.hx/milestones/${entry.name}/` path (hx naming).
- **Fix #3043 JSDoc** (commit `a5bf81f8a`): In `GitPreferences.isolation` JSDoc (~line 50), fix comment: `"worktree"` is not the default; `"none"` is the default runtime. Remove "(default)" from worktree, add "(default)" to none.
- **Fix snapshot absorption** (commit `0402e46c1`): Find `absorbSnapshotCommits()` or similar — change `HEAD~1` ancestry check for remote push guard, and add `this.smartStage()` call after `nativeResetSoft`. (Verify if this method exists in hx-ai's git-service.ts first.)

**paths.ts** (`src/resources/extensions/hx/paths.ts`)
- **Fix #3083** (commit `927255606`): Add `isInsideHxWorktree(p: string): boolean` helper function that detects `.hx/worktrees/<name>/` pattern. In `probeHxRoot()` (~line 312), after the fast-path `if (existsSync(local))` check, add step 1b: `if (isInsideHxWorktree(rawBasePath)) return local;`. Also check `basePath !== rawBasePath && isInsideHxWorktree(basePath)`. Note naming: the function must search for `.hx/worktrees/` (not `.gsd/worktrees/`).

**worktree-manager.ts** (`src/resources/extensions/hx/worktree-manager.ts`)
- **Fix #3044** (commit `38fa7d48d`): Add `findNestedGitDirs(rootPath: string): string[]` export function that recursively scans for nested `.git` directories. Add `NESTED_GIT_SKIP_DIRS` set. Call `findNestedGitDirs` in `removeWorktree()` before cleanup to strip nested repos. Import `lstatSync`, `readdirSync` from `node:fs`.

**worktree-resolver.ts** (`src/resources/extensions/hx/worktree-resolver.ts`)
- **Fix #3043** (commit `a5bf81f8a`): At ~line 353, `if (mode === "none")`, change to `const inWorktree = this.deps.isInAutoWorktree(this.s.basePath) && this.s.originalBasePath; if (mode === "none" && !inWorktree) {...}`. Replace the compound condition in `if (mode === "worktree" || ...)` with `mode === "worktree" || inWorktree`.

**parallel-merge.ts** (`src/resources/extensions/hx/parallel-merge.ts`)
- **Fix #3256** (commit `82a59bcec`): Add `isMilestoneCompleteInWorktreeDb(basePath: string, mid: string): boolean` export function using `spawnSync("sqlite3", ...)` to query `.hx/worktrees/<MID>/.hx/hx.db`. Add `discoverDbCompletedMilestones(basePath)`. Wire into `determineMergeOrder()` to also consider DB-complete milestones. Import `existsSync`, `readdirSync`, `join`, `spawnSync`. Use `.hx/worktrees/<MID>/.hx/hx.db` (hx naming).

**src/cli.ts** (`src/cli.ts`)
- **Fix #3057** (commit `b1bca3789`): Add `hx auto` subcommand handler after the existing `headless` block. Rewrite argv to `['headless', ...cliFlags.messages]` and call `runHeadless(parseHeadlessArgs(...))`. Add `hx auto` to TTY error hint messages in two places. Also update `src/help-text.ts` if `gsd auto` appears there.

**bootstrap/agent-end-recovery.ts** (`src/resources/extensions/hx/bootstrap/agent-end-recovery.ts`)
- **Fix #3045** (commit `92c5f8bb9`): At ~line 70, inside the `stopReason === "aborted"` block, add empty-content check: `const content = "content" in lastMsg ? lastMsg.content : undefined; const hasEmptyContent = Array.isArray(content) && content.length === 0; const hasErrorMessage = "errorMessage" in lastMsg && !!lastMsg.errorMessage; if (hasEmptyContent && !hasErrorMessage) { /* route to resolveAgentEnd instead of pauseAuto */ }`.

**auto/phases.ts** (`src/resources/extensions/hx/auto/phases.ts`)
- **Fix #3241** (commit `9e8cb097a`): At the `closeoutUnit` call in `runUnitPhase` (~line 1142), wrap in `if (s.currentUnit) { ... }` guard. Change `s.currentUnit!.startedAt` to `s.currentUnit?.startedAt` in the zero-tool-call ledger check below.

**bootstrap/write-gate.ts** (`src/resources/extensions/hx/bootstrap/write-gate.ts`)
- **Fix #3082** (commit `d1b38c335`): Add `GSD_DIR_RE` → `HX_DIR_RE = /(^|[/\\])\.hx([/\\]|$)/`, `QUEUE_SAFE_TOOLS` Set, `BASH_READ_ONLY_RE` regex, and `shouldBlockQueueExecution(toolName, input, queuePhaseActive)` export function.

**bootstrap/register-hooks.ts** (`src/resources/extensions/hx/bootstrap/register-hooks.ts`)
- **Fix #3082**: Import `shouldBlockQueueExecution` from `write-gate.js`. In the tool-call hook, add `isQueuePhaseActive()` → `shouldBlockQueueExecution()` call path.
- **Fix #3054** (commit `b58edce0e`): Register `turn_end` hook that calls `cleanupQuickBranch(s.basePath)`. Import `cleanupQuickBranch` from `../quick.js`.

**prompts** (`src/resources/extensions/hx/prompts/`)
- **Fix #3240** (commit `e8f34cf80`): Add "**Autonomous execution:**" paragraph to `plan-slice.md`, `execute-task.md`, and `complete-slice.md`. Uses `hx_plan_slice`/`hx_complete_task`/`hx_complete_slice` (already adapted naming).

**preferences-models.ts** + **preferences-types.ts**
- **Fix #3066** (commit `13271e0db`): Add `"worktree-merge"` case to `resolveModelWithFallbacksForUnit` switch (maps to `m.completion`). Add `"worktree-merge"` to `KNOWN_UNIT_TYPES` array in preferences-types.ts. Also add missing entries: `"validate-milestone"`, `"rewrite-docs"`, `"discuss-milestone"`, `"discuss-slice"`.

**captures.ts** (`src/resources/extensions/hx/captures.ts`)
- **Fix #3084** (commit `88d1a3450`): Update `CaptureEntry` interface to add optional `resolvedInMilestone?: string`. Update `loadActionableCaptures()` to accept `currentMilestoneId?: string` and filter stale captures. Add `stampCaptureMilestone()` export function.

**triage-resolution.ts** (`src/resources/extensions/hx/triage-resolution.ts`)
- **Fix #3084**: Wire `currentMilestoneId` into `executeTriageResolutions()` call to `loadActionableCaptures()`. Add retroactive milestone stamp call.

### New Test Files to Create

| New file (hx path) | From upstream | Covers |
|---|---|---|
| `tests/integration/auto-worktree-milestone-merge.test.ts` update | `99ae786ab` + `9b68046f5` | MERGE_HEAD error paths, SQUASH_MSG+MERGE_MSG pre-merge |
| `tests/worktree-nested-git-safety.test.ts` | `38fa7d48d` | findNestedGitDirs detection |
| `tests/worktree-resolver.test.ts` update | `a5bf81f8a` | isolation-mode-none data loss |
| `tests/parallel-commit-scope.test.ts` | `938885b6f` | HX_MILESTONE_LOCK staging |
| `tests/integration/parallel-merge.test.ts` | `82a59bcec` | isMilestoneCompleteInWorktreeDb |
| `tests/hxroot-worktree-detection.test.ts` | `927255606` | isInsideHxWorktree guard |
| `src/tests/auto-mode-piped.test.ts` | `b1bca3789` | cli.ts auto subcommand |
| `tests/empty-content-abort-loop.test.ts` | `92c5f8bb9` | empty-content abort skip |
| `tests/auto-mode-interactive-guard.test.ts` | `e8f34cf80` | prompt autonomous guard |
| `tests/stop-auto-race-null-unit.test.ts` | `9e8cb097a` | stopAuto null guard |
| `tests/queue-execution-guard.test.ts` | `d1b38c335` | shouldBlockQueueExecution |
| `tests/quick-turn-end-cleanup.test.ts` | `b58edce0e` | cleanupQuickBranch turn_end |
| `tests/captures.test.ts` update | `88d1a3450` | loadActionableCaptures milestone staleness |
| `tests/triage-resolution.test.ts` update | `88d1a3450` | stampCaptureMilestone |
| `tests/stash-queued-context-files.test.ts` | `91019466b` | stash :(exclude).hx/milestones |
| `tests/worktree-db-respawn-truncation.test.ts` | `677ae4f07` | non-empty DB preservation |
| `tests/worktree-sync-milestones.test.ts` update | `677ae4f07` | DB sync milestone tests |
| `tests/model-unittype-mapping.test.ts` update | `13271e0db` | worktree-merge mapping |

### Naming Adaptation Map (S02-specific)

| Upstream | hx-ai adaptation |
|---|---|
| `.gsd/worktrees/<MID>/.gsd/gsd.db` | `.hx/worktrees/<MID>/.hx/hx.db` |
| `GSD_MILESTONE_LOCK` | `HX_MILESTONE_LOCK` (already adapted in state.ts) |
| `.gsd/milestones/` (exclusion paths) | `.hx/milestones/` |
| `isInsideGsdWorktree()` | `isInsideHxWorktree()` |
| `gsdRoot(basePath)` | `hxRoot(basePath)` |
| `gsd auto` CLI subcommand | `hx auto` |
| `[hx]` error prefix | `[hx]` (already correct) |
| `gsd_plan_slice` / `gsd_complete_task` | `hx_plan_slice` / `hx_complete_task` (in prompts) |
| `\.gsd([/\\]|$)` regex | `\.hx([/\\]|$)` |
| `gsd: pre-merge stash` | `hx: pre-merge stash` |
| `.gsd/.milestone-shelter` | `.hx/.milestone-shelter` |

### Build Order

**Build order rationale:** T01 (auto-worktree.ts) and T02 (git subsystem) are independent — neither depends on the other. T03 (auto-mode dispatch) depends only on existing infrastructure. T04 (queue + hooks) similarly independent. T05 (verification) runs last.

**T01 first** because auto-worktree.ts has the most complex diffs (5 separate fixes with careful position tracking), and integration tests for merge behavior are the longest-running.

**T02 second** because git-service.ts and parallel-merge.ts changes are risky (they touch staging and DB query logic) and need unit tests.

**T03 + T04 in parallel** — they touch disjoint files.

**T05 last** — tsc + full test suite.

### Integration Closure

After S02 all 37 fixes (S01's 16 + S02's 21) will be applied. S02 has no downstream dependencies within the milestone — S03, S04, S05, S06 each own disjoint fix categories.

### Key Risks

1. **auto-worktree.ts position sensitivity** — 5 separate hunks in a 1,650-line file. Each fix targets a specific code region; a missed hunk produces silent bugs (MERGE_HEAD left on disk). Use `grep -n` to locate exact lines before each edit.

2. **stash exclusion syntax** — `:(exclude).hx/milestones` is a pathspec magic. The upstream test confirms this works with `git stash push`. The hx-ai version uses `hx: pre-merge stash` as the stash label.

3. **parallel-merge.ts DB path** — must use `.hx/worktrees/<MID>/.hx/hx.db` (two nested `.hx/`). Upstream uses `.gsd/worktrees/<MID>/.gsd/gsd.db`. One adaptation error silently returns false for all milestones.

4. **isInsideHxWorktree() substring pattern** — must search for `.hx/worktrees/` (not `.gsd/worktrees/`). The function looks for this exact substring in both the raw and resolved paths.

5. **shouldBlockQueueExecution paths** — `GSD_DIR_RE` must become `HX_DIR_RE` matching `\.hx([/\\]|$)`. Any residual `.gsd` in the BASH_READ_ONLY_RE (unlikely but possible) must be adapted.

6. **Snapshot absorption fix scope** — `0402e46c1` modifies `git-service.ts` snapshot absorption. Verify whether `absorbSnapshotCommits()` or equivalent exists in hx-ai's git-service.ts. If not, the fix may not apply (the method may have been added/removed). Check before implementing.

### Verification Commands

```bash
# After each task: typecheck
npx tsc --noEmit

# After T01: merge integration test
node --test dist-test/src/resources/extensions/hx/tests/integration/auto-worktree-milestone-merge.test.js

# After T02: git subsystem tests
node --test dist-test/src/resources/extensions/hx/tests/worktree-nested-git-safety.test.js
node --test dist-test/src/resources/extensions/hx/tests/parallel-commit-scope.test.js
node --test dist-test/src/resources/extensions/hx/tests/hxroot-worktree-detection.test.js

# After T03: auto-mode tests
node --test dist-test/src/tests/auto-mode-piped.test.js
node --test dist-test/src/resources/extensions/hx/tests/empty-content-abort-loop.test.js
node --test dist-test/src/resources/extensions/hx/tests/stop-auto-race-null-unit.test.js

# After T04: queue + hooks tests
node --test dist-test/src/resources/extensions/hx/tests/queue-execution-guard.test.js
node --test dist-test/src/resources/extensions/hx/tests/quick-turn-end-cleanup.test.js
node --test dist-test/src/resources/extensions/hx/tests/auto-mode-interactive-guard.test.js

# Full suite (run from worktree root with node_modules symlink):
node --test dist-test/src/resources/extensions/hx/tests/*.test.js
```

**Compilation pattern** (from S01 knowledge):
```bash
# Must run from main project root:
cd /Users/beratcan/Desktop/GithubProjects/hx-ai && node scripts/compile-tests.mjs
# Then recompile worktree-unique files via esbuild from main project root
```
