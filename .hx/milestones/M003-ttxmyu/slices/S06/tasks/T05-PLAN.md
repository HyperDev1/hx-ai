---
estimated_steps: 48
estimated_files: 21
skills_used: []
---

# T05: Worktree + Health + Misc + Pi-Coding-Agent Fixes (Clusters 6, 7, 12, 16, 17, 18, 19, 22)

Eight clusters covering worktree safety, interview UI regression, LSP alias, diagnostics, preferences validation, skill dirs, and pi-coding-agent patches.

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

## Inputs

- `src/resources/extensions/shared/interview-ui.ts`
- `src/resources/extensions/hx/auto/phases.ts`
- `src/resources/extensions/hx/worktree-manager.ts`
- `src/resources/extensions/hx/auto-worktree.ts`
- `src/resources/extensions/hx/auto-post-unit.ts`
- `src/resources/extensions/hx/workflow-projections.ts`
- `src/resources/extensions/hx/preferences-validation.ts`
- `src/resources/extensions/hx/skill-discovery.ts`
- `src/resources/extensions/hx/preferences-skills.ts`
- `src/resources/extensions/hx/skill-catalog.ts`
- `packages/pi-coding-agent/src/core/lsp/config.ts`
- `packages/pi-coding-agent/src/core/retry-handler.ts`
- `packages/pi-coding-agent/src/core/agent-session.ts`
- `packages/pi-ai/src/index.ts`
- `packages/pi-coding-agent/src/modes/interactive/controllers/input-controller.ts`
- `packages/pi-coding-agent/src/modes/interactive/slash-command-handlers.ts`

## Expected Output

- `src/resources/extensions/shared/interview-ui.ts`
- `src/resources/extensions/hx/auto/phases.ts`
- `src/resources/extensions/hx/worktree-manager.ts`
- `src/resources/extensions/hx/auto-worktree.ts`
- `src/resources/extensions/hx/auto-post-unit.ts`
- `src/resources/extensions/hx/workflow-projections.ts`
- `src/resources/extensions/hx/preferences-validation.ts`
- `src/resources/extensions/hx/skill-discovery.ts`
- `src/resources/extensions/hx/preferences-skills.ts`
- `src/resources/extensions/hx/skill-catalog.ts`
- `packages/pi-coding-agent/src/core/lsp/config.ts`
- `packages/pi-coding-agent/src/core/retry-handler.ts`
- `packages/pi-coding-agent/src/core/agent-session.ts`
- `packages/pi-ai/src/utils/repair-tool-json.ts`
- `packages/pi-ai/src/index.ts`
- `src/resources/extensions/hx/tests/interview-ui-notes-loop.test.ts`
- `src/resources/extensions/hx/tests/worktree-health-monorepo.test.ts`
- `src/resources/extensions/hx/tests/worktree-teardown-safety.test.ts`
- `packages/pi-coding-agent/src/core/lsp/lsp-legacy-alias.test.ts`

## Verification

npx tsc --noEmit && npm run test:unit -- --reporter=dot 2>&1 | tail -3
