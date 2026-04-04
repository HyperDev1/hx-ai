# S02: Worktree/Git & Auto-mode Fixes

**Goal:** Port 21 upstream worktree/git merge and auto-mode dispatch fixes from gsd-2 v2.59.0 into hx-ai with GSD→HX naming. All fixes adapted, typecheck passes, new + regression tests pass.
**Demo:** After this: After this: Worktree merge, MERGE_HEAD cleanup, pre-merge safety, auto-mode dispatch, headless routing, and parallel mode boundary fixes are applied. typecheck + tests pass.

## Tasks
- [x] **T01: Port 5 upstream auto-worktree.ts fixes: DB truncation guard, mcp.json sync, MERGE_HEAD stale-artifact cleanup, nativeMergeAbort on error paths, and milestone shelter before stash** — Port 5 upstream fixes to auto-worktree.ts — the largest and most complex file in S02 (1726 lines). Each fix targets a specific code region.

## Steps

1. **Fix #3255 — DB truncation guard** (~line 236): In `syncProjectRootToWorktree()`, find the block that unconditionally deletes `hx.db`. Change to check `statSync(wtDb).size === 0` before deleting — only delete if the DB file is empty (zero bytes). Add `statSync` to the `node:fs` import if not already present. This prevents destroying a valid worktree DB when sync runs.

2. **Fix #3251 — mcp.json in ROOT_STATE_FILES** (~line 78): Add `"mcp.json"` to the `ROOT_STATE_FILES` constant array. Then in `copyPlanningArtifacts()` (~line 1000), add `"mcp.json"` to the `for...of` file list so it's copied to new worktrees.

3. **Fix #2912 — MERGE_HEAD pre-merge cleanup** (~line 1410-1430): Before the `nativeMergeSquash` call, add a cleanup loop: `for (const stale of ["SQUASH_MSG", "MERGE_MSG", "MERGE_HEAD"]) { try { const p = join(resolveGitDir(originalBasePath_), stale); if (existsSync(p)) unlinkSync(p); } catch {} }`. This prevents stale merge artifacts from a prior interrupted merge from blocking the new squash merge.

4. **Fix #2912 — MERGE_HEAD error-path cleanup**: At the dirty-tree error path (~line 1445, the `__dirty_working_tree__` block) and the code-conflict error path (~line 1500, the MergeConflictError throw): before each `throw`, add `try { nativeMergeAbort(originalBasePath_); } catch {}` followed by the same 3-file cleanup loop. Import `nativeMergeAbort` from `./native-git-bridge.js` at the top of the file. At the success path (~line 1518), replace the single `SQUASH_MSG` cleanup with the same 3-file loop (SQUASH_MSG + MERGE_MSG + MERGE_HEAD).

5. **Fix #3273 — stash milestone shelter**: Before the stash push (~line 1410), add a milestone shelter step: scan `.hx/milestones/` in `originalBasePath_`, identify directories that are NOT the current `milestoneId`, move them to `.hx/.milestone-shelter/<dirname>` using `cpSync` + `rmSync`. After the stash push, change the stash command args to include `-- :(exclude).hx/milestones` pathspec (append to the args array). On ALL exit paths (success, dirty-tree error, conflict error), add a finally-style restore: if `.hx/.milestone-shelter/` exists, move each child back to `.hx/milestones/` and remove the shelter dir. Use `mkdirSync`, `cpSync`, `rmSync`, `readdirSync`.

6. **Naming**: All paths must use `.hx/` (not `.gsd/`), all env vars use `HX_` prefix, stash message uses `hx: pre-merge stash`.

7. Run `npx tsc --noEmit` to verify typecheck passes.
  - Estimate: 2h
  - Files: src/resources/extensions/hx/auto-worktree.ts
  - Verify: npx tsc --noEmit && grep -c 'mcp.json' src/resources/extensions/hx/auto-worktree.ts | grep -q '[1-9]' && grep -c 'MERGE_HEAD' src/resources/extensions/hx/auto-worktree.ts | grep -q '[3-9]' && grep -c 'milestone-shelter' src/resources/extensions/hx/auto-worktree.ts | grep -q '[1-9]' && grep -c 'statSync' src/resources/extensions/hx/auto-worktree.ts | grep -q '[1-9]'
- [x] **T02: Port 6 git-subsystem fixes: isInsideHxWorktree path guard, HX_MILESTONE_LOCK milestone scope, findNestedGitDirs cleanup, isolation-none worktree safety, and DB-complete milestone detection** — Port 6 upstream fixes across 5 git-subsystem files. These are smaller, focused changes.

## Steps

1. **Fix #3083 — isInsideHxWorktree guard in paths.ts** (~line 310): Add a new exported function `isInsideHxWorktree(p: string): boolean` that returns `true` if the path contains `.hx/worktrees/` as a path segment. Implementation: `return /[\/\\]\.hx[\/\\]worktrees[\/\\]/.test(p) || p.startsWith('.hx/worktrees/');`. In `probeHxRoot()`, after the fast-path `if (existsSync(local)) return local;` check (line ~314), add: `if (isInsideHxWorktree(rawBasePath)) return local;` — this prevents the function from escaping to the project-root `.hx/` when already inside a worktree's `.hx/`. Also add a second guard after `basePath` is resolved: `if (basePath !== rawBasePath && isInsideHxWorktree(basePath)) { const localResolved = join(basePath, '.hx'); if (existsSync(localResolved)) return localResolved; }`. Export `isInsideHxWorktree` so worktree-resolver.ts can use it if needed.

2. **Fix #3047 — parallel worker milestone scope in git-service.ts** (~line 500): In `smartStage()`, after `const allExclusions = [...]`, add a block: check `process.env.HX_MILESTONE_LOCK`; if set, read `.hx/milestones/` with `readdirSync`, filter entries that don't match the lock value, and add `:(exclude).hx/milestones/${entry}/` for each non-locked milestone to `allExclusions`. Import `readdirSync` from `node:fs`. This ensures parallel workers only stage their own milestone's files.

3. **Fix #3043 — JSDoc correction in git-service.ts** (~line 55): Find the `isolation` JSDoc comment and fix: remove "(default)" from the `"worktree"` line, add "(default at runtime)" to the `"none"` line. This is a documentation-only change.

4. **Fix #3044 — nested .git detection in worktree-manager.ts**: Add `NESTED_GIT_SKIP_DIRS` constant: `new Set(["node_modules", ".hx", "dist", "dist-test", ".git"])`. Add exported function `findNestedGitDirs(rootPath: string): string[]` that recursively scans for `.git` directories/files, skipping entries in the skip set. In `removeWorktree()` (~line 284), before the cleanup steps, call `findNestedGitDirs(resolvedWtPath)` and for each found nested `.git`, remove it with `rmSync`. Import `lstatSync` if not already imported.

5. **Fix #3043 — worktree-resolver.ts isolation safety** (~line 353): Currently the `if (mode === "none")` block returns early (skips merge). Change to: `const inWorktree = this.deps.isInAutoWorktree(this.s.basePath) && this.s.originalBasePath; if (mode === "none" && !inWorktree) { ... return; }`. This ensures that even with `isolation: "none"`, if we're inside an auto-worktree, the merge still executes. The existing `if (mode === "worktree" || (this.deps.isInAutoWorktree(...)))` compound condition already handles routing to worktree merge — verify it's correct as-is.

6. **Fix #3256 — DB-complete milestone detection in parallel-merge.ts**: Add exported function `isMilestoneCompleteInWorktreeDb(basePath: string, mid: string): boolean` that checks `.hx/worktrees/${mid}/.hx/hx.db` using `spawnSync("sqlite3", [dbPath, "SELECT status FROM milestones WHERE id = ? AND status = 'complete'"])`. Add `discoverDbCompletedMilestones(basePath: string): string[]` that scans `.hx/worktrees/` for milestone dirs with complete DB status. In `determineMergeOrder()`, include DB-complete milestones alongside worker-reported ones. Import `existsSync`, `readdirSync` from `node:fs`, `join` from `node:path`, `spawnSync` from `node:child_process`.

7. **Naming**: All paths use `.hx/worktrees/`, `.hx/milestones/`, `.hx/hx.db` (not GSD equivalents). Env var is `HX_MILESTONE_LOCK`.

8. Run `npx tsc --noEmit`.
  - Estimate: 2h
  - Files: src/resources/extensions/hx/paths.ts, src/resources/extensions/hx/git-service.ts, src/resources/extensions/hx/worktree-manager.ts, src/resources/extensions/hx/worktree-resolver.ts, src/resources/extensions/hx/parallel-merge.ts
  - Verify: npx tsc --noEmit && grep -c 'isInsideHxWorktree' src/resources/extensions/hx/paths.ts | grep -q '[1-9]' && grep -c 'HX_MILESTONE_LOCK' src/resources/extensions/hx/git-service.ts | grep -q '[1-9]' && grep -c 'findNestedGitDirs' src/resources/extensions/hx/worktree-manager.ts | grep -q '[1-9]' && grep -c 'isMilestoneCompleteInWorktreeDb' src/resources/extensions/hx/parallel-merge.ts | grep -q '[1-9]'
- [x] **T03: Port 5 auto-mode dispatch fixes: hx auto subcommand, empty-content abort fast-path, stopAuto null-unit guard, shouldBlockQueueExecution, and turn_end quick-branch cleanup** — Port 5 upstream auto-mode dispatch fixes across 5 files. These control how auto-mode starts, recovers from errors, and blocks dangerous operations.

## Steps

1. **Fix #3057 — `hx auto` subcommand in cli.ts** (~line 297): After the existing `if (cliFlags.messages[0] === 'headless')` block, add a new block: `if (cliFlags.messages[0] === 'auto') { await ensureRtkBootstrap(); const { runHeadless, parseHeadlessArgs } = await import('./headless.js'); cliFlags.messages.shift(); await runHeadless(parseHeadlessArgs(['headless', ...cliFlags.messages, ...process.argv.filter(a => a.startsWith('--'))])); process.exit(0); }`. Also find the TTY error hint messages (search for `'headless'` in error messages) and add `'hx auto'` as an alternative. Check `src/help-text.ts` for any mention of `gsd auto` and ensure it says `hx auto`.

2. **Fix #3045 — empty-content abort handling in agent-end-recovery.ts** (~line 70): Inside the `stopReason === "aborted"` block, before `await pauseAuto(ctx, pi)`, add: `const content = "content" in lastMsg ? lastMsg.content : undefined; const hasEmptyContent = Array.isArray(content) && content.length === 0; const hasErrorMessage = "errorMessage" in lastMsg && !!lastMsg.errorMessage; if (hasEmptyContent && !hasErrorMessage) { resolveAgentEnd(event); return; }`. This routes empty-content aborts (provider returning empty response) to resolveAgentEnd instead of pausing, preventing stuck-pause loops.

3. **Fix #3241 — stopAuto null-unit guard in auto/phases.ts** (~line 1145): Wrap the `closeoutUnit` call in `if (s.currentUnit) { ... }`. Change `s.currentUnit.startedAt` to `s.currentUnit?.startedAt` in the zero-tool-call ledger check below (~line 1163). Also change `s.currentUnit!.startedAt` to `s.currentUnit?.startedAt` wherever it appears after the closeout block. This prevents null dereference when stopAuto races with unit completion.

4. **Fix #3082 — shouldBlockQueueExecution in write-gate.ts**: Add to the existing file: `export const HX_DIR_RE = /(^|[\/\\])\.hx([\/\\]|$)/;`, `export const QUEUE_SAFE_TOOLS = new Set(["read", "lsp", "web_search", "fetch_page", "ask_user_questions", "hx_journal_query"]);`, `export const BASH_READ_ONLY_RE = /^\s*(cat|head|tail|wc|grep|rg|find|fd|ls|tree|echo|printf|test|\[)\b/;`. Add exported function `shouldBlockQueueExecution(toolName: string, input: Record<string, unknown>, queuePhaseActive: boolean): { block: boolean; reason?: string }` that: (a) returns `{ block: false }` if `!queuePhaseActive`; (b) returns `{ block: false }` if tool is in QUEUE_SAFE_TOOLS; (c) for `"bash"`, returns `{ block: false }` if `input.command` matches BASH_READ_ONLY_RE; (d) for `"write"` or `"edit"`, returns `{ block: false }` if the path does NOT match HX_DIR_RE (non-.hx writes are allowed); (e) otherwise returns `{ block: true, reason: "Blocked: tool '${toolName}' is not allowed during queue execution phase" }`.

5. **Fix #3082 — wire shouldBlockQueueExecution into register-hooks.ts**: Import `shouldBlockQueueExecution` from `../bootstrap/write-gate.js`. In the `tool_call` hook (the `pi.on("tool_call", ...)` handler), after the existing checks and before the `shouldBlockContextWrite` call, add: `if (isQueuePhaseActive()) { const queueBlock = shouldBlockQueueExecution(event.toolName, event.input as Record<string, unknown>, true); if (queueBlock.block) return queueBlock; }`.

6. **Fix #3054 — turn_end quick branch cleanup in register-hooks.ts**: Add a new `pi.on("turn_end", ...)` handler (or extend an existing one) that calls `cleanupQuickBranch(process.cwd())`. Import `cleanupQuickBranch` from `../quick.js`. Guard with `if (!isAutoActive()) return;` so it only runs in auto mode.

7. Run `npx tsc --noEmit`.
  - Estimate: 1.5h
  - Files: src/cli.ts, src/resources/extensions/hx/bootstrap/agent-end-recovery.ts, src/resources/extensions/hx/auto/phases.ts, src/resources/extensions/hx/bootstrap/write-gate.ts, src/resources/extensions/hx/bootstrap/register-hooks.ts
  - Verify: npx tsc --noEmit && grep -c 'hx auto\|auto.*subcommand' src/cli.ts | grep -q '[1-9]' && grep -c 'hasEmptyContent' src/resources/extensions/hx/bootstrap/agent-end-recovery.ts | grep -q '[1-9]' && grep -c 'shouldBlockQueueExecution' src/resources/extensions/hx/bootstrap/write-gate.ts | grep -q '[1-9]' && grep -c 'cleanupQuickBranch' src/resources/extensions/hx/bootstrap/register-hooks.ts | grep -q '[1-9]'
- [x] **T04: Ported 5 upstream metadata fixes (preferences unit types, prompt autonomous guards, captures milestone staleness); typecheck clean, 3100/3103 tests pass with 0 new failures** — Port 5 smaller upstream fixes for preferences, prompts, and captures, then run full typecheck + test verification for the entire slice.

## Steps

1. **Fix #3066 — worktree-merge unit type in preferences-models.ts** (~line 80): In the `switch (unitType)` block of `resolveModelWithFallbacksForUnit()`, add a new case: `case "worktree-merge": phaseConfig = m.completion; break;`. Place it near the existing completion cases. Also add `case "validate-milestone":` and `case "rewrite-docs":` to the validation/planning group (they may already be there — check first). Add `case "discuss-milestone":` and `case "discuss-slice":` — these already exist but verify they use `m.discuss ?? m.planning`.

2. **Fix #3066 — KNOWN_UNIT_TYPES in preferences-types.ts** (~line 101): Add `"worktree-merge"`, `"validate-milestone"`, `"rewrite-docs"`, `"discuss-milestone"`, `"discuss-slice"` to the `KNOWN_UNIT_TYPES` array. Check which are already present and only add missing ones.

3. **Fix #3240 — autonomous execution paragraphs in prompts**: In each of these three prompt files, add the following paragraph at an appropriate location (near the end, before any closing instructions):
   - `src/resources/extensions/hx/prompts/plan-slice.md`: Add `**Autonomous execution:** You MUST call \`hx_plan_slice\` to persist the planning state before finishing. Do not use \`ask_user_questions\` — you are running autonomously without human interaction.`
   - `src/resources/extensions/hx/prompts/execute-task.md`: Add `**Autonomous execution:** You MUST call \`hx_complete_task\` (or \`hx_task_complete\`) to record task completion before finishing. Do not use \`ask_user_questions\` — you are running autonomously without human interaction.`
   - `src/resources/extensions/hx/prompts/complete-slice.md`: Add `**Autonomous execution:** You MUST call \`hx_complete_slice\` (or \`hx_slice_complete\`) to record slice completion before finishing. Do not use \`ask_user_questions\` — you are running autonomously without human interaction.`

4. **Fix #3084 — captures milestone staleness**: In `captures.ts`:
   - Add `resolvedInMilestone?: string` to the `CaptureEntry` interface (~line 20).
   - Add new exported function `stampCaptureMilestone(basePath: string, captureId: string, milestoneId: string): void` that loads captures, finds the matching entry, sets `resolvedInMilestone = milestoneId`, and writes back.
   - Modify `loadActionableCaptures(basePath: string)` signature to accept optional `currentMilestoneId?: string`. When provided, add filter: exclude entries where `resolvedInMilestone` is set AND differs from `currentMilestoneId` (stale captures from a different milestone).
   - Update `parseCapturesContent()` to read the `resolvedInMilestone` field from markdown.
   - Update the markdown writer to output `resolvedInMilestone` when set.

5. **Fix #3084 — wire captures milestone staleness in triage-resolution.ts**: In `executeTriageResolutions()` (~line 385), pass the `mid` parameter as `currentMilestoneId` to `loadActionableCaptures(basePath, mid)`. After processing each capture, call `stampCaptureMilestone(basePath, captureId, mid)`.

6. **Full verification**: Run `npx tsc --noEmit` for typecheck. Run `node scripts/compile-tests.mjs` from the main project root (via the established symlink pattern). Run the full test suite: `node --test dist-test/src/resources/extensions/hx/tests/*.test.js` and verify 0 new failures vs S01 baseline (3100/3103). Run GSD/gsd grep check across all S02-modified files to confirm no naming regressions.
  - Estimate: 1.5h
  - Files: src/resources/extensions/hx/preferences-models.ts, src/resources/extensions/hx/preferences-types.ts, src/resources/extensions/hx/prompts/plan-slice.md, src/resources/extensions/hx/prompts/execute-task.md, src/resources/extensions/hx/prompts/complete-slice.md, src/resources/extensions/hx/captures.ts, src/resources/extensions/hx/triage-resolution.ts
  - Verify: npx tsc --noEmit && grep -c 'worktree-merge' src/resources/extensions/hx/preferences-types.ts | grep -q '[1-9]' && grep -c 'Autonomous execution' src/resources/extensions/hx/prompts/plan-slice.md | grep -q '[1-9]' && grep -c 'resolvedInMilestone' src/resources/extensions/hx/captures.ts | grep -q '[1-9]' && grep -c 'stampCaptureMilestone' src/resources/extensions/hx/triage-resolution.ts | grep -q '[1-9]'
