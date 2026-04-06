---
estimated_steps: 9
estimated_files: 1
skills_used: []
---

# T01: Port 5 auto-worktree.ts fixes (DB truncation, MERGE_HEAD cleanup, mcp.json, milestone shelter)

Port 5 upstream fixes to auto-worktree.ts — the largest and most complex file in S02 (1726 lines). Each fix targets a specific code region.

## Steps

1. **Fix #3255 — DB truncation guard** (~line 236): In `syncProjectRootToWorktree()`, find the block that unconditionally deletes `hx.db`. Change to check `statSync(wtDb).size === 0` before deleting — only delete if the DB file is empty (zero bytes). Add `statSync` to the `node:fs` import if not already present. This prevents destroying a valid worktree DB when sync runs.

2. **Fix #3251 — mcp.json in ROOT_STATE_FILES** (~line 78): Add `"mcp.json"` to the `ROOT_STATE_FILES` constant array. Then in `copyPlanningArtifacts()` (~line 1000), add `"mcp.json"` to the `for...of` file list so it's copied to new worktrees.

3. **Fix #2912 — MERGE_HEAD pre-merge cleanup** (~line 1410-1430): Before the `nativeMergeSquash` call, add a cleanup loop: `for (const stale of ["SQUASH_MSG", "MERGE_MSG", "MERGE_HEAD"]) { try { const p = join(resolveGitDir(originalBasePath_), stale); if (existsSync(p)) unlinkSync(p); } catch {} }`. This prevents stale merge artifacts from a prior interrupted merge from blocking the new squash merge.

4. **Fix #2912 — MERGE_HEAD error-path cleanup**: At the dirty-tree error path (~line 1445, the `__dirty_working_tree__` block) and the code-conflict error path (~line 1500, the MergeConflictError throw): before each `throw`, add `try { nativeMergeAbort(originalBasePath_); } catch {}` followed by the same 3-file cleanup loop. Import `nativeMergeAbort` from `./native-git-bridge.js` at the top of the file. At the success path (~line 1518), replace the single `SQUASH_MSG` cleanup with the same 3-file loop (SQUASH_MSG + MERGE_MSG + MERGE_HEAD).

5. **Fix #3273 — stash milestone shelter**: Before the stash push (~line 1410), add a milestone shelter step: scan `.hx/milestones/` in `originalBasePath_`, identify directories that are NOT the current `milestoneId`, move them to `.hx/.milestone-shelter/<dirname>` using `cpSync` + `rmSync`. After the stash push, change the stash command args to include `-- :(exclude).hx/milestones` pathspec (append to the args array). On ALL exit paths (success, dirty-tree error, conflict error), add a finally-style restore: if `.hx/.milestone-shelter/` exists, move each child back to `.hx/milestones/` and remove the shelter dir. Use `mkdirSync`, `cpSync`, `rmSync`, `readdirSync`.

6. **Naming**: All paths must use `.hx/` (not `.gsd/`), all env vars use `HX_` prefix, stash message uses `hx: pre-merge stash`.

7. Run `npx tsc --noEmit` to verify typecheck passes.

## Inputs

- ``src/resources/extensions/hx/auto-worktree.ts` — target file (1726 lines) with all 5 fix locations`
- ``src/resources/extensions/hx/native-git-bridge.ts` — source of nativeMergeAbort import`

## Expected Output

- ``src/resources/extensions/hx/auto-worktree.ts` — modified with 5 upstream fixes applied`

## Verification

npx tsc --noEmit && grep -c 'mcp.json' src/resources/extensions/hx/auto-worktree.ts | grep -q '[1-9]' && grep -c 'MERGE_HEAD' src/resources/extensions/hx/auto-worktree.ts | grep -q '[3-9]' && grep -c 'milestone-shelter' src/resources/extensions/hx/auto-worktree.ts | grep -q '[1-9]' && grep -c 'statSync' src/resources/extensions/hx/auto-worktree.ts | grep -q '[1-9]'
