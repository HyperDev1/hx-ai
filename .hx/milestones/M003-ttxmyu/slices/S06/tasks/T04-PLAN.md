---
estimated_steps: 42
estimated_files: 14
skills_used: []
---

# T04: Auto-Mode Fixes: steer worktree, preferences bootstrap, cold resume, dashboard model, slice context injection, complete-milestone sanitization (Clusters 4, 5, 10, 13, 14, 15, 21)

Seven surgical patches to the auto-mode orchestration layer.

**Cluster 4 — Steer worktree path fix (commits 724e65643, cb3f38c27):**
In `src/resources/extensions/hx/commands-handlers.ts`, `handleSteer()`:
- Import `getAutoWorktreePath` from `'./auto-worktree.js'`
- Import `checkRemoteAutoSession` from `'./auto.js'` (verify this function exists; search the file)
- Compute `const wtPath = mid !== 'none' ? getAutoWorktreePath(basePath, mid) : null` where `mid` comes from the active session
- Gate worktree path on active session: `const targetPath = (wtPath && (isAutoActive() || checkRemoteAutoSession(basePath).isRunning)) ? wtPath : basePath`
- Call `appendOverride(targetPath, change, appliedAt)` instead of `appendOverride(basePath, ...)`
- Create `src/resources/extensions/hx/tests/steer-worktree-path.test.ts`: 2–3 tests — steer writes to worktree path when auto is active, steer writes to basePath when auto is inactive

**Cluster 5 — Preferences bootstrap fix (commits c79213790, c0f005789):**
In `src/resources/extensions/hx/auto-start.ts`, the `startModelSnapshot` (line 151) captures `ctx.model` but doesn't check resolved preferences model first. Fix:
- Import `resolveModelWithFallbacksForUnit` from `'./preferences-models.js'` (note: `resolveDefaultSessionModel` doesn't exist — use `resolveModelWithFallbacksForUnit('default')` or check what 'session' unit type resolves to)
- Before building `startModelSnapshot`, resolve the preferred model: `const preferredModel = resolveModelWithFallbacksForUnit('default')` (or the appropriate unit type)
- Build `startModelSnapshot` preferring `preferredModel` over `ctx.model` when `ctx.model?.provider` is undefined/bare
- Update `src/resources/extensions/hx/tests/auto-start-model-capture.test.ts` and `src/resources/extensions/hx/tests/model-isolation.test.ts` if relevant assertions change

**Cluster 10 — Complete-milestone input sanitization (commit 3e8e4a540):**
- Create `src/resources/extensions/hx/bootstrap/sanitize-complete-milestone.ts`: `sanitizeCompleteMilestoneParams(params: unknown): CompleteMilestoneParams` that coerces fields to trimmed strings/booleans/arrays. Export it.
- In `src/resources/extensions/hx/bootstrap/db-tools.ts`, import `sanitizeCompleteMilestoneParams` and apply it before `handleCompleteMilestone(sanitized, ...)`

**Cluster 13 — Merge failure notification (commit 75507e5b9):**
In `src/resources/extensions/hx/worktree-resolver.ts`, check whether the existing merge failure message already has `/hx dispatch complete-milestone` in backticks. If yes, no change needed. If not, wrap it. Grep: `grep -n 'complete-milestone' src/resources/extensions/hx/worktree-resolver.ts`

**Cluster 14 — Cold resume DB reopen + heavy checkmark (commit 62f11b9c3):**
- In `src/resources/extensions/hx/auto-start.ts`: export the `openProjectDbIfPresent` function (line 108 — currently not exported). Add `export` keyword.
- In `src/resources/extensions/hx/auto.ts`: import `openProjectDbIfPresent` from `'./auto-start.js'`; call it before `rebuildState(s.basePath)` in the resume path (search for 'rebuildState' and 'resume' in the file)
- In `src/resources/extensions/hx/roadmap-slices.ts`: on line 85, add U+2714 (✔) to the `[✅☑✓]` character class: `/[✅☑✓✔]/`. On lines 224/228 for `headerPattern` and `prefixCheckPattern` (which match U+2713 `\u2713`), also accept U+2705 `\u2705`. Update the patterns accordingly.
- Create `src/resources/extensions/hx/tests/cold-resume-db-reopen.test.ts`: verifies openProjectDbIfPresent is called in resume path

**Cluster 15 — Dashboard model label fix (commit f18305c50):**
- In `src/resources/extensions/hx/auto/session.ts`: add `currentDispatchedModelId: string | null = null` property to `AutoSession` class; reset to `null` in `reset()` if that method exists
- In `src/resources/extensions/hx/auto-dashboard.ts`: add `getCurrentDispatchedModelId(): string | null` to `AutoSessionAccessors` interface; use it to build `modelId`/`modelProvider` display strings (prefer dispatched model over stale `cmdCtx.model`)
- In `src/resources/extensions/hx/auto.ts`: wire `getCurrentDispatchedModelId: () => s.currentDispatchedModelId` into accessors object
- In `src/resources/extensions/hx/auto/phases.ts`: set `s.currentDispatchedModelId` after `selectAndApplyModel` call; reset to null at unit start
- Create `src/resources/extensions/hx/tests/dashboard-model-label-ordering.test.ts`: verifies dispatched model takes precedence over cmdCtx.model

**Cluster 21 — Inject S##-CONTEXT.md into missing prompt builders (commit 09a450b2c):**
In `src/resources/extensions/hx/auto-prompts.ts`:
- In `buildCompleteSlicePrompt` (line ~1259): after the `inlined.push(await inlineFile(slicePlanPath, ...))` line, add:
  ```typescript
  const sliceContextPath = resolveSliceFile(base, mid, sid, 'CONTEXT');
  const sliceContextRel = relSliceFile(base, mid, sid, 'CONTEXT');
  const sliceContextInline = await inlineFileOptional(sliceContextPath, sliceContextRel, 'Slice Context (from discussion)');
  if (sliceContextInline) inlined.push(sliceContextInline);
  ```
- In `buildReplanSlicePrompt` (line ~1512): same pattern after slice plan inline
- In `buildReassessRoadmapPrompt` (line ~1628): same pattern using `completedSliceId` as `sid`

## Inputs

- `src/resources/extensions/hx/commands-handlers.ts`
- `src/resources/extensions/hx/auto-start.ts`
- `src/resources/extensions/hx/auto.ts`
- `src/resources/extensions/hx/auto-dashboard.ts`
- `src/resources/extensions/hx/auto/session.ts`
- `src/resources/extensions/hx/auto/phases.ts`
- `src/resources/extensions/hx/roadmap-slices.ts`
- `src/resources/extensions/hx/worktree-resolver.ts`
- `src/resources/extensions/hx/auto-prompts.ts`
- `src/resources/extensions/hx/bootstrap/db-tools.ts`

## Expected Output

- `src/resources/extensions/hx/commands-handlers.ts`
- `src/resources/extensions/hx/auto-start.ts`
- `src/resources/extensions/hx/auto.ts`
- `src/resources/extensions/hx/auto-dashboard.ts`
- `src/resources/extensions/hx/auto/session.ts`
- `src/resources/extensions/hx/auto/phases.ts`
- `src/resources/extensions/hx/roadmap-slices.ts`
- `src/resources/extensions/hx/auto-prompts.ts`
- `src/resources/extensions/hx/bootstrap/sanitize-complete-milestone.ts`
- `src/resources/extensions/hx/bootstrap/db-tools.ts`
- `src/resources/extensions/hx/tests/steer-worktree-path.test.ts`
- `src/resources/extensions/hx/tests/cold-resume-db-reopen.test.ts`
- `src/resources/extensions/hx/tests/dashboard-model-label-ordering.test.ts`

## Verification

npx tsc --noEmit && npm run test:unit -- --reporter=dot 2>&1 | tail -3
