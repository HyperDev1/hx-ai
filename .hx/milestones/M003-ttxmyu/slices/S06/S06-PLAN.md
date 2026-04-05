# S06: Remaining Bugfixes, Security + Final Verification

**Goal:** Port all remaining ~25 upstream commits not yet applied across S01–S05: security command-prefix overrides, ask-user-questions dedup, WAL/SHM orphan cleanup, steer worktree path fix, preferences bootstrap, interview notes loop, DB transaction races, deferred-slice dispatch, complete-milestone sanitization, milestone status promotion, worktree health monorepo support, cold-resume DB reopen, dashboard model label, worktree teardown safety, diagnostic enrichment, codebase preferences validation, Claude Code skill dirs, auto-prompts slice context injection, and pi-coding-agent patches. End with a full tsc + test + GSD grep verification pass confirming all 82+ upstream commits are accounted for.
**Demo:** After this: After this: all 82 upstream commits accounted for; tsc clean; 0 new test failures; 0 GSD regressions — milestone complete

## Tasks
- [x] **T01: Add runtime-configurable command prefix and fetch URL allowlists (security-overrides cluster), wired into cli.ts startup** — Port the security-overrides cluster from upstream commit e78db4c18. This adds runtime-configurable command prefix allowlists and fetch URL allowlists, replacing the hardcoded SAFE_COMMAND_PREFIXES check.

Steps:
1. In `packages/pi-coding-agent/src/core/resolve-config-value.ts`:
   - Add `let activeCommandPrefixes: string[] | null = null` module var
   - Add `setAllowedCommandPrefixes(prefixes: string[] | null): void` — sets the var and calls `clearConfigValueCache()` (if that exists; add it if not: clears `commandResultCache`)
   - Add `getAllowedCommandPrefixes(): string[] | null` getter
   - Update `executeCommand()` to use `activeCommandPrefixes ?? SAFE_COMMAND_PREFIXES` instead of hardcoded `SAFE_COMMAND_PREFIXES`

2. In `packages/pi-coding-agent/src/core/settings-manager.ts`:
   - Add `allowedCommandPrefixes?: string[]` and `fetchAllowedUrls?: string[]` to the `Settings` interface
   - Add `const GLOBAL_ONLY_KEYS = new Set(['allowedCommandPrefixes', 'fetchAllowedUrls'])` constant
   - Add `stripGlobalOnlyKeys(settings: Partial<Settings>): Partial<Settings>` function that deletes those keys from project-level settings
   - Apply `stripGlobalOnlyKeys` at the 3 sites where project settings are merged/applied (search for where project settings override global)
   - Add `getAllowedCommandPrefixes(): string[] | undefined`, `setAllowedCommandPrefixes(v: string[]): void`, `getFetchAllowedUrls(): string[] | undefined`, `setFetchAllowedUrls(v: string[]): void` to `SettingsManager` class

3. In `packages/pi-coding-agent/src/index.ts`:
   - Export `SAFE_COMMAND_PREFIXES`, `setAllowedCommandPrefixes`, `getAllowedCommandPrefixes` from `'./core/resolve-config-value.js'`

4. In `src/resources/extensions/search-the-web/url-utils.ts`:
   - Add `let fetchAllowedHostnames: string[] | null = null` module var
   - Add `setFetchAllowedUrls(urls: string[] | null): void` — parses hostnames from URL strings
   - Add `getFetchAllowedUrls(): string[] | null` getter
   - In `isBlockedUrl()`: add early-return `if (fetchAllowedHostnames && fetchAllowedHostnames.includes(new URL(url).hostname)) return false` guard before the block logic

5. Create `src/security-overrides.ts` — new file:
   ```typescript
   import { setAllowedCommandPrefixes, getAllowedCommandPrefixes } from '@hyperlab/hx-coding-agent';
   import { setFetchAllowedUrls, getFetchAllowedUrls } from './resources/extensions/search-the-web/url-utils.js';
   
   export function applySecurityOverrides(settingsManager: { getAllowedCommandPrefixes(): string[] | undefined; getFetchAllowedUrls(): string[] | undefined }): void {
     const envPrefixes = process.env.HX_ALLOWED_COMMAND_PREFIXES;
     const prefixes = envPrefixes ? envPrefixes.split(',').map(s => s.trim()).filter(Boolean) : settingsManager.getAllowedCommandPrefixes();
     if (prefixes && prefixes.length > 0) setAllowedCommandPrefixes(prefixes);
     
     const envUrls = process.env.HX_FETCH_ALLOWED_URLS;
     const urls = envUrls ? envUrls.split(',').map(s => s.trim()).filter(Boolean) : settingsManager.getFetchAllowedUrls();
     if (urls && urls.length > 0) setFetchAllowedUrls(urls);
   }
   ```
   IMPORTANT: env var names must be `HX_ALLOWED_COMMAND_PREFIXES` / `HX_FETCH_ALLOWED_URLS` (not GSD_*).
   IMPORTANT: import from `'@hyperlab/hx-coding-agent'` (not `'@gsd/pi-coding-agent'`).

6. In `src/cli.ts`:
   - Import `applySecurityOverrides` from `'./security-overrides.js'`
   - Call `applySecurityOverrides(settingsManager)` after `SettingsManager.create` (search for that call)

7. Create test files:
   - `packages/pi-coding-agent/src/core/resolve-config-value-override.test.ts`: 4 tests for setAllowedCommandPrefixes (blocked by default, override allows, null resets to default, clear cache called)
   - `packages/pi-coding-agent/src/core/settings-manager-security.test.ts`: tests for GLOBAL_ONLY_KEYS enforcement, stripGlobalOnlyKeys removes keys from project settings, global settings retain them
   - `src/tests/security-overrides.test.ts`: integration tests — env var HX_ALLOWED_COMMAND_PREFIXES sets prefixes, env var HX_FETCH_ALLOWED_URLS sets URLs, fallback to settingsManager getters when env vars absent
   - `src/tests/url-utils-override.test.ts`: tests for setFetchAllowedUrls / isBlockedUrl exemptions
  - Estimate: 60m
  - Files: packages/pi-coding-agent/src/core/resolve-config-value.ts, packages/pi-coding-agent/src/core/settings-manager.ts, packages/pi-coding-agent/src/index.ts, src/resources/extensions/search-the-web/url-utils.ts, src/security-overrides.ts, src/cli.ts, packages/pi-coding-agent/src/core/resolve-config-value-override.test.ts, packages/pi-coding-agent/src/core/settings-manager-security.test.ts, src/tests/security-overrides.test.ts, src/tests/url-utils-override.test.ts
  - Verify: npx tsc --noEmit && npm run test:unit -- --reporter=dot 2>&1 | tail -3
- [x] **T02: Added per-turn dedup cache to ask-user-questions and strict 1-call loop guard threshold for ask_user_questions tool** — Port the ask-user-questions dedup cluster from commits 7bd8fe47d, b75af3bc2, 4c9073f62. Adds a per-turn signature cache that prevents the same question set from being dispatched twice in one turn, and adds a strict single-dispatch threshold for ask_user_questions in the loop guard.

Steps:
1. In `src/resources/extensions/ask-user-questions.ts`:
   - Import `createHash` from `'crypto'` (or use existing hash utility)
   - Add `const turnCache = new Map<string, { questions: unknown[]; result: unknown }>()` module var
   - Export `resetAskUserQuestionsCache(): void` — clears turnCache
   - Add `questionSignature(questions: unknown[]): string` — stringify + sha256 the canonicalized array (sort by id, include header, question, options, allowMultiple)
   - In `execute()`: compute sig = questionSignature(params.questions); check turnCache before dispatching; cache results on success (non-error, non-timeout)
   - Move the `tryRemoteQuestions` call BEFORE the `!ctx.hasUI` guard (this is the remote-questions interactive mode fix from commit b75af3bc2 — remote questions should be attempted even in non-interactive sessions)

2. In `src/resources/extensions/hx/bootstrap/register-hooks.ts`:
   - Import `resetAskUserQuestionsCache` from the ask-user-questions extension
   - Wire it into `session_start`, `session_switch`, and `agent_end` hooks (add the import and the call)

3. In `src/resources/extensions/hx/bootstrap/tool-call-loop-guard.ts`:
   - Add `const STRICT_LOOP_TOOLS = new Set(["ask_user_questions"])` constant
   - Add `const MAX_CONSECUTIVE_STRICT = 1` constant  
   - Add `let lastToolName: string | null = null` state var
   - In the loop detection logic: when `toolName` is in `STRICT_LOOP_TOOLS`, use `MAX_CONSECUTIVE_STRICT` as the threshold instead of `MAX_CONSECUTIVE`
   - Reset `lastToolName = null` in `resetToolCallLoopGuard()`

4. Create test files:
   - `src/resources/extensions/hx/tests/ask-user-questions-dedup.test.ts`: tests for cache hit on identical signature, cache miss on different questions, cache reset on session_start/session_switch/agent_end hooks
   - `src/resources/extensions/hx/tests/tool-call-loop-guard.test.ts` (update existing): add test for STRICT_LOOP_TOOLS threshold — ask_user_questions triggers loop guard after 1 consecutive call instead of the default threshold
  - Estimate: 35m
  - Files: src/resources/extensions/ask-user-questions.ts, src/resources/extensions/hx/bootstrap/register-hooks.ts, src/resources/extensions/hx/bootstrap/tool-call-loop-guard.ts, src/resources/extensions/hx/tests/ask-user-questions-dedup.test.ts, src/resources/extensions/hx/tests/tool-call-loop-guard.test.ts
  - Verify: npx tsc --noEmit && npm run test:unit -- --reporter=dot 2>&1 | tail -3
- [x] **T03: Ported five DB-layer fixes: WAL/SHM orphan cleanup, atomic decision ID transaction, deferred-slice status predicates + dispatch hook, milestone title/status preservation on re-plan, and seed-requirements-from-markdown fallback** — Five targeted DB-layer fixes. All surgical changes to existing files.

**Cluster 3 — WAL/SHM orphan cleanup (commit 1c9032a70):**
In `src/resources/extensions/hx/auto-worktree.ts`, the `syncProjectRootToWorktree` function deletes an empty `hx.db` but leaves orphan `hx.db-wal` and `hx.db-shm` files. Fix: after deleting (or discovering the main DB is already missing), also delete the companion WAL/SHM if they exist. `unlinkSync` is already imported. Pattern: `for (const suffix of ['-wal', '-shm']) { const companion = wtDb + suffix; if (existsSync(companion)) unlinkSync(companion); }`

**Cluster 8 — Decision/requirement transaction race (commit 18cc75138):**
In `src/resources/extensions/hx/db-writer.ts`, wrap the requirement ID assignment + insert in `db.transaction()`. Find the `saveDecisionToDb` or equivalent section. Look for requirement ID auto-assignment (the sequential ID logic like R001, R002...). Wrap it in a transaction: `db._getAdapter()?.transaction(() => { /* id assignment + insert */ })()`.

**Cluster 9 — Deferred slice dispatch prevention (commit 93295f7b5):**
In `src/resources/extensions/hx/status-guards.ts`:
- Add `export function isDeferredStatus(status: string): boolean { return status === 'deferred'; }`
- Add `export function isInactiveStatus(status: string): boolean { return isClosedStatus(status) || isDeferredStatus(status); }`
In `src/resources/extensions/hx/db-writer.ts`:
- Add `extractDeferredSliceRef(decisionText: string): { milestoneId: string; sliceId: string } | null` helper — extract milestone+slice IDs from decision text that mentions deferring a slice
- In `saveDecisionToDb` (or the decision save path): when a decision defers a slice, call `db.updateSliceStatus(milestoneId, sliceId, 'deferred')` wrapped in try/catch (non-fatal)

**Cluster 11 — Milestone status promotion on re-plan (commits fea1b7431, 8b43b56f8):**
In `src/resources/extensions/hx/hx-db.ts`, in `upsertMilestonePlanning()`, add `title` and `status` to the UPDATE SET clause:
```sql
title = COALESCE(NULLIF(:title,''),title),
status = COALESCE(NULLIF(:status,''),status)
```
Accept optional `title`/`status` in the params binding.
In `src/resources/extensions/hx/tools/plan-milestone.ts`: add a guard that refuses to re-plan if any completed slices would be dropped. Before applying the new plan, load existing slices from DB; if any have status 'complete'/'done' and are absent from the new slice list, return an error or preserve them.

**Cluster 20 — Seed requirements from REQUIREMENTS.md (commit a4e43ca41):**
In `src/resources/extensions/hx/db-writer.ts`, in `updateRequirementInDb`: when `db.getRequirementById(id)` returns null (requirement not in DB), parse REQUIREMENTS.md via `parseRequirementsSections()` and seed all requirements into the DB before retrying the lookup. Pattern: load file → parse → for each requirement, call `db.upsertRequirement(r)` with INSERT OR IGNORE semantics (skip if already exists). This addresses the K-note: 'Requirements DB vs REQUIREMENTS.md: always seed the DB before using hx_requirement_update'.

**Test files:**
- `src/resources/extensions/hx/tests/worktree-db-respawn-truncation.test.ts` — new: verifies WAL/SHM files are cleaned when main DB is deleted or missing
- `src/resources/extensions/hx/tests/deferred-slice-dispatch.test.ts` — new: verifies isDeferredStatus, isInactiveStatus, extractDeferredSliceRef
- `src/resources/extensions/hx/tests/plan-milestone-title.test.ts` — new: verifies title/status survive re-plan via upsertMilestonePlanning
- `src/resources/extensions/hx/tests/insert-slice-no-wipe.test.ts` — new: verifies completed slices are preserved on milestone re-plan
  - Estimate: 45m
  - Files: src/resources/extensions/hx/auto-worktree.ts, src/resources/extensions/hx/db-writer.ts, src/resources/extensions/hx/status-guards.ts, src/resources/extensions/hx/hx-db.ts, src/resources/extensions/hx/tools/plan-milestone.ts, src/resources/extensions/hx/tests/worktree-db-respawn-truncation.test.ts, src/resources/extensions/hx/tests/deferred-slice-dispatch.test.ts, src/resources/extensions/hx/tests/plan-milestone-title.test.ts, src/resources/extensions/hx/tests/insert-slice-no-wipe.test.ts
  - Verify: npx tsc --noEmit && npm run test:unit -- --reporter=dot 2>&1 | tail -3
- [x] **T04: Seven surgical patches to auto-mode orchestration: steer worktree routing, preferences model bootstrap, cold-resume DB reopen, dashboard dispatched-model label, heavy checkmark detection, complete-milestone sanitization, and slice CONTEXT.md injection — tsc clean, 4281 tests pass (15 new)** — Seven surgical patches to the auto-mode orchestration layer.

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
  - Estimate: 55m
  - Files: src/resources/extensions/hx/commands-handlers.ts, src/resources/extensions/hx/auto-start.ts, src/resources/extensions/hx/auto.ts, src/resources/extensions/hx/auto-dashboard.ts, src/resources/extensions/hx/auto/session.ts, src/resources/extensions/hx/auto/phases.ts, src/resources/extensions/hx/roadmap-slices.ts, src/resources/extensions/hx/worktree-resolver.ts, src/resources/extensions/hx/auto-prompts.ts, src/resources/extensions/hx/bootstrap/sanitize-complete-milestone.ts, src/resources/extensions/hx/bootstrap/db-tools.ts, src/resources/extensions/hx/tests/steer-worktree-path.test.ts, src/resources/extensions/hx/tests/cold-resume-db-reopen.test.ts, src/resources/extensions/hx/tests/dashboard-model-label-ordering.test.ts
  - Verify: npx tsc --noEmit && npm run test:unit -- --reporter=dot 2>&1 | tail -3
- [ ] **T05: Worktree + Health + Misc + Pi-Coding-Agent Fixes (Clusters 6, 7, 12, 16, 17, 18, 19, 22)** — Eight clusters covering worktree safety, interview UI regression, LSP alias, diagnostics, preferences validation, skill dirs, and pi-coding-agent patches.

**Cluster 6 — Interview notes loop fix (commit f517a8534):**
In `src/resources/extensions/shared/interview-ui.ts`, in `goNextOrSubmit()` (line ~293), the auto-open notes guard is:
```typescript
if (!isMultiSelect(currentIdx) && states[currentIdx].cursorIndex === noneOrDoneIdx(currentIdx)) {
  states[currentIdx].notesVisible = true;
  ...
}
```
Add `&& !states[currentIdx].notes` to the condition so notes only auto-open when still empty:
```typescript
if (!isMultiSelect(currentIdx) && states[currentIdx].cursorIndex === noneOrDoneIdx(currentIdx) && !states[currentIdx].notes) {
```
Create `src/resources/extensions/hx/tests/interview-ui-notes-loop.test.ts`: regression test for #3502 — notes field does not re-open when cursor returns to 'None of the above' and notes are already filled.

**Cluster 7 — LSP Kotlin alias (commit 8efd651d7):**
In `packages/pi-coding-agent/src/core/lsp/config.ts`, in `mergeServers()`:
- Add `const LEGACY_ALIASES: Record<string, string> = { 'kotlin-language-server': 'kotlin-lsp' }` before the function
- In `mergeServers()`, before merging a server, apply alias: `const effectiveName = LEGACY_ALIASES[server.name] ?? server.name`
- Create `packages/pi-coding-agent/src/core/lsp/lsp-legacy-alias.test.ts`: test that kotlin-language-server config merges under kotlin-lsp key

**Cluster 12 — Worktree health monorepo support (commit 1adee33d0 + 08e9c1013):**
In `src/resources/extensions/hx/auto/phases.ts`, in the worktree health check (around line 893 where `hasProjectFile` is computed):
- After the existing `hasProjectFile` check, add parent-directory walk (up to git root) to detect project markers in parent directories: `hasProjectFileInParent`
- Add `hasXcodeBundle` scan: `readdirSync(s.basePath).some(f => f.endsWith('.xcodeproj') || f.endsWith('.xcworkspace'))` wrapped in try/catch
- Update the greenfield warning condition to also pass when `hasXcodeBundle || hasProjectFileInParent`
- Create `src/resources/extensions/hx/tests/worktree-health-monorepo.test.ts`: tests that monorepo subdir with project file in parent does not trigger greenfield warning

**Cluster 16 — Worktree teardown path validation (commit f3342a1a6):**
- In `src/resources/extensions/hx/worktree-manager.ts`: add `export function isInsideWorktreesDir(basePath: string, targetPath: string): boolean` — verifies targetPath starts with `join(basePath, '.hx', 'worktrees')`
- Apply as safety gate before `rmSync` in `removeWorktree()`: `if (!isInsideWorktreesDir(basePath, wtPath)) { logError(...); return; }`
- In `src/resources/extensions/hx/auto-worktree.ts`: import `isInsideWorktreesDir`; guard fallback `rmSync` with the same check
- Create `src/resources/extensions/hx/tests/worktree-teardown-safety.test.ts`: tests that rmSync is not called when path is outside worktrees dir

**Cluster 17 — Diagnostic messages + misc (commits 039c13321, a5cab49ee, 0684f6fe7):**
- `039c13321` (enrich diagnostic messages): In `src/resources/extensions/hx/auto-post-unit.ts`, import `diagnoseExpectedArtifact` from `'../auto-artifact-paths.js'`; in the artifact-missing error message construction, call `diagnoseExpectedArtifact(artifactType, unitId, basePath)` and append the returned description to the error message.
- `a5cab49ee` (prevent artifact rendering corruption): In `src/resources/extensions/hx/workflow-projections.ts` and/or `src/resources/extensions/hx/tools/complete-milestone.ts`, add guards against double-prefix in renderPlanContent/renderRoadmapContent/renderStateContent. Search for prefix patterns like `## S` or `# Milestone` and ensure they're not prepended twice.
- `0684f6fe7` (metrics dedup): In `src/resources/extensions/hx/auto.ts` or `src/resources/extensions/hx/forensics.ts` (check which file has idle-watchdog metrics), add deduplication to prevent double-logging idle-watchdog entries. Existing `tests/metrics.test.ts` already covers 'snapshotUnitMetrics handles simulated idle-watchdog duplicate pattern' — verify it passes with the fix.

**Cluster 18 — Preferences codebase validation (commit d0e1eeb46):**
In `src/resources/extensions/hx/preferences-validation.ts`, add a codebase validation section for fields defined in `CodebaseMapPreferences` (from `preferences-types.ts`):
- Validate `codebase.exclude_patterns`: must be an array of strings
- Validate `codebase.max_files`: must be a positive integer
- Validate `codebase.collapse_threshold`: must be a positive integer
Follow the existing validation pattern in the file (look at how other nested preference objects are validated).

**Cluster 19 — Claude Code skill directories (commit dd92b9703):**
- In `src/resources/extensions/hx/skill-discovery.ts`: find where `~/.agents/skills` is added to skill scan dirs; add `~/.claude/skills` alongside it
- In `src/resources/extensions/hx/preferences-skills.ts`: add Claude Code skill dir entries (follow existing pattern for ~/.agents/skills)
- In `src/resources/extensions/hx/skill-catalog.ts`: add `~/.claude/skills` to catalog scan

**Cluster 22 — Pi-coding-agent patches:**
- `22ff184a6` (stale retries after model switch): In `packages/pi-coding-agent/src/core/retry-handler.ts`, add `clearQueued(): void` method that clears any queued retry state. In `packages/pi-coding-agent/src/core/agent-session.ts`, call `this.retryHandler.clearQueued()` (or the RetryHandler instance method) on explicit model switch (find the model-switch path).
- `9c43fc281` (repairToolJson XML + truncated numbers): `packages/pi-ai/src/utils/repair-tool-json.ts` does NOT exist in this repo — create it as a new utility with `stripXmlParameterTags(json: string): string` (strips `<parameter>...</parameter>` wrapper tags) and `repairTruncatedNumber(json: string): string` (appends closing `}` if JSON ends mid-number). Export both from `packages/pi-ai/src/index.ts`.
- `5d35fd107` (route non-builtin slash commands): In `packages/pi-coding-agent/src/modes/interactive/controllers/input-controller.ts` and `packages/pi-coding-agent/src/modes/interactive/slash-command-handlers.ts`, add routing for unrecognized slash commands to the session (forward them as user input rather than silently dropping).
  - Estimate: 55m
  - Files: src/resources/extensions/shared/interview-ui.ts, src/resources/extensions/hx/auto/phases.ts, src/resources/extensions/hx/worktree-manager.ts, src/resources/extensions/hx/auto-worktree.ts, src/resources/extensions/hx/auto-post-unit.ts, src/resources/extensions/hx/workflow-projections.ts, src/resources/extensions/hx/preferences-validation.ts, src/resources/extensions/hx/skill-discovery.ts, src/resources/extensions/hx/preferences-skills.ts, src/resources/extensions/hx/skill-catalog.ts, packages/pi-coding-agent/src/core/lsp/config.ts, packages/pi-coding-agent/src/core/retry-handler.ts, packages/pi-coding-agent/src/core/agent-session.ts, packages/pi-ai/src/utils/repair-tool-json.ts, packages/pi-ai/src/index.ts, packages/pi-coding-agent/src/modes/interactive/controllers/input-controller.ts, packages/pi-coding-agent/src/modes/interactive/slash-command-handlers.ts, src/resources/extensions/hx/tests/interview-ui-notes-loop.test.ts, src/resources/extensions/hx/tests/worktree-health-monorepo.test.ts, src/resources/extensions/hx/tests/worktree-teardown-safety.test.ts, packages/pi-coding-agent/src/core/lsp/lsp-legacy-alias.test.ts
  - Verify: npx tsc --noEmit && npm run test:unit -- --reporter=dot 2>&1 | tail -3
- [ ] **T06: Final Verification + Requirement Status Updates** — Run the full verification pass and update requirement statuses.

Steps:
1. Run `npx tsc --noEmit` — must exit 0. Fix any remaining type errors.
2. Run `npm run test:unit` — must pass ≥ 4215 (new tests increase count), 0 failed, 5 skipped. Fix any failures.
3. Run GSD grep across all modified files:
   ```bash
   grep -rn '\bgsd\b|\bGSD\b' \
     src/resources/extensions/hx/ \
     src/resources/extensions/ask-user-questions.ts \
     src/resources/extensions/shared/interview-ui.ts \
     src/security-overrides.ts \
     src/cli.ts \
     packages/pi-coding-agent/src/core/settings-manager.ts \
     packages/pi-coding-agent/src/core/resolve-config-value.ts \
     | grep -v 'node_modules' | grep -v '.test.' | wc -l
   ```
   Must return 0. Fix any GSD leaks.
4. Verify the 2 security env vars use HX_ prefix: `grep -n 'HX_ALLOWED_COMMAND_PREFIXES\|HX_FETCH_ALLOWED_URLS' src/security-overrides.ts` — must return 2 hits.
5. Update `.hx/REQUIREMENTS.md` requirement statuses to validated:
   - R010: All upstream v2.59.0→v2.63.0 changes applied — validated
   - R014: GSD→HX naming — 0 new GSD hits introduced in S06 — validated
   - R017: All S06 bugfixes applied — validated
   - R018: Final tsc clean + test pass — validated
   Note: Update REQUIREMENTS.md directly (the DB may not have these requirements seeded; check with `sqlite3 .hx/hx.db 'SELECT COUNT(*) FROM requirements;'` first — if > 0, use hx_requirement_update tool; if 0, edit REQUIREMENTS.md directly).
  - Estimate: 20m
  - Files: .hx/REQUIREMENTS.md
  - Verify: npx tsc --noEmit && npm run test:unit -- --reporter=dot 2>&1 | tail -3 && grep -rn '\bgsd\b|\bGSD\b' src/resources/extensions/hx/ src/security-overrides.ts packages/pi-coding-agent/src/core/settings-manager.ts packages/pi-coding-agent/src/core/resolve-config-value.ts | grep -v node_modules | grep -v '.test.' | wc -l
