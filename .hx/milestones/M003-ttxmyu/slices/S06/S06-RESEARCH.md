# S06 Research: Remaining Bugfixes, Security + Final Verification

## Summary

S06 is the milestone close slice. It ports ~25 remaining upstream commits (from both v2.59.0→v2.63.0 and two post-v2.63.0 commits explicitly included in the plan) and runs full verification. The baseline entering S06 is **4215 passed / 0 failed / 5 skipped**, tsc clean. All work is surgical — no new subsystems, only targeted patches to existing files.

**Difficulty: low-medium.** Most fixes are 5–30 line patches to well-understood files. Two items require creating new files (`src/security-overrides.ts`, `packages/pi-coding-agent/src/core/resolve-config-value-override.test.ts`). Three items require changes to `packages/pi-coding-agent` which build separately but tests run via `npm run test:unit`. The slice ends with a final tsc + test + GSD grep verification pass.

---

## Requirement Coverage

- **R017** — This slice owns all remaining bugfixes: security overrides, ask-user-questions dedup, WAL/SHM cleanup, steer worktree path, interview notes loop, remote-questions interactive mode, and ~20 others
- **R014** — GSD→HX naming: env vars in security-overrides.ts (`GSD_ALLOWED_COMMAND_PREFIXES` → `HX_ALLOWED_COMMAND_PREFIXES`, `GSD_FETCH_ALLOWED_URLS` → `HX_FETCH_ALLOWED_URLS`)
- **R018** — Final verification: tsc clean, 0 new test failures, 0 GSD regressions
- **R010** — All 82+ upstream commits accounted for

---

## Upstream Commit Inventory for S06

The following commits from v2.59.0→v2.63.0 (plus 2 post-v2.63.0 explicitly in S06 plan) are **not yet ported** and belong to S06:

### Cluster 1: Security Overrides (3 files + 3 test files)
**Commits:** `e78db4c18`

Files to change:
1. `packages/pi-coding-agent/src/core/resolve-config-value.ts` — Add `activeCommandPrefixes` module-level var, `setAllowedCommandPrefixes()`, `getAllowedCommandPrefixes()`, update `executeCommand` to use `activeCommandPrefixes` instead of hardcoded `SAFE_COMMAND_PREFIXES`. Add `clearConfigValueCache()` call in setter.
2. `packages/pi-coding-agent/src/core/settings-manager.ts` — Add `allowedCommandPrefixes?: string[]` and `fetchAllowedUrls?: string[]` to `Settings` interface; add `GLOBAL_ONLY_KEYS` set; add `stripGlobalOnlyKeys()` fn; apply strip at 3 assignment sites; add `getAllowedCommandPrefixes()`, `setAllowedCommandPrefixes()`, `getFetchAllowedUrls()`, `setFetchAllowedUrls()` methods to `SettingsManager` class.
3. `packages/pi-coding-agent/src/index.ts` — Export `SAFE_COMMAND_PREFIXES`, `setAllowedCommandPrefixes`, `getAllowedCommandPrefixes` from `resolve-config-value.js`.
4. `src/resources/extensions/search-the-web/url-utils.ts` — Add `fetchAllowedHostnames` module var, `setFetchAllowedUrls()`, `getFetchAllowedUrls()`, guard in `isBlockedUrl()` to return false for allowed hostnames.
5. `src/security-overrides.ts` — **New file.** `applySecurityOverrides(settingsManager)` reads env vars `HX_ALLOWED_COMMAND_PREFIXES` (not `GSD_*`) and `HX_FETCH_ALLOWED_URLS`, falls back to settingsManager getters. Import from `@hyperlab/hx-coding-agent` (not `@gsd/pi-coding-agent`).
6. `src/cli.ts` — Import `applySecurityOverrides` from `./security-overrides.js`; call `applySecurityOverrides(settingsManager)` after `SettingsManager.create`.

Test files:
- `packages/pi-coding-agent/src/core/resolve-config-value-override.test.ts` — New: 4 tests for setAllowedCommandPrefixes overrides
- `packages/pi-coding-agent/src/core/settings-manager-security.test.ts` — New: 15 tests for global-only enforcement, stripGlobalOnlyKeys
- `src/tests/security-overrides.test.ts` — New: integration tests for applySecurityOverrides
- `src/tests/url-utils-override.test.ts` — New: tests for setFetchAllowedUrls / isBlockedUrl exemptions

**⚠️ Naming adaptation:** env vars must use `HX_ALLOWED_COMMAND_PREFIXES` / `HX_FETCH_ALLOWED_URLS` (not GSD_*). The package import must use `@hyperlab/hx-coding-agent`.

### Cluster 2: Ask-User-Questions Dedup (2 commits, 3 files + tests)
**Commits:** `7bd8fe47d`, `b75af3bc2`, `4c9073f62`

Files to change:
1. `src/resources/extensions/ask-user-questions.ts` — Add `turnCache: Map<string, CachedResult>`, `resetAskUserQuestionsCache()` export, `questionSignature(questions)` that hashes full canonicalized payload (id, header, question, options, allowMultiple) via sha256. In `execute()`: check cache before dispatch; cache remote results on success (when no error/timeout); cache local results. Move `tryRemoteQuestions` call BEFORE `!ctx.hasUI` guard (remote-questions interactive mode fix bundled here).
2. `src/resources/extensions/hx/bootstrap/register-hooks.ts` — Wire `resetAskUserQuestionsCache()` into `session_start`, `session_switch`, and `agent_end` hooks.
3. `src/resources/extensions/hx/bootstrap/tool-call-loop-guard.ts` — Add `STRICT_LOOP_TOOLS = new Set(["ask_user_questions"])`, `MAX_CONSECUTIVE_STRICT = 1`; add `lastToolName` state var; apply strict threshold when toolName is in STRICT_LOOP_TOOLS. Reset `lastToolName` in `resetToolCallLoopGuard()`.

Test files to create/update:
- `src/resources/extensions/hx/tests/ask-user-questions-dedup.test.ts` — New: tests for dedup cache hit, signature correctness, cache reset on session boundaries
- `src/resources/extensions/hx/tests/tool-call-loop-guard.test.ts` — Update: add STRICT_LOOP_TOOLS threshold test

**Note:** `4c9073f62` (reset dedup cache between ask-user-freetext tests) is a test-only fix that must also be applied.

### Cluster 3: WAL/SHM Orphan Cleanup
**Commit:** `1c9032a70`

File: `src/resources/extensions/hx/auto-worktree.ts`
The `syncProjectRootToWorktree` function deletes empty `hx.db` but must also delete companion `hx.db-wal` and `hx.db-shm` when the main DB is deleted OR already missing. Requires `unlinkSync` import. Add also in the case where the DB was already missing (orphaned from prior partial cleanup).

Test: new `tests/worktree-db-respawn-truncation.test.ts` (83 lines upstream).

### Cluster 4: Steer Worktree Path Fix (2 commits)
**Commits:** `724e65643`, `cb3f38c27`

File: `src/resources/extensions/hx/commands-handlers.ts` — `handleSteer()`:
- Import `getAutoWorktreePath` from `./auto-worktree.js`
- Compute `wtPath = mid !== "none" ? getAutoWorktreePath(basePath, mid) : null`
- Gate worktree path use on active auto session: import `checkRemoteAutoSession` from `./auto.js`; only use `wtPath` when `isAutoActive() || checkRemoteAutoSession(basePath).isRunning`
- `targetPath = wtPath ?? basePath`
- Call `appendOverride(targetPath, change, appliedAt)` instead of `appendOverride(basePath, ...)`

Test: new `tests/steer-worktree-path.test.ts`.

### Cluster 5: Preferences Bootstrap Fix (2 commits)
**Commits:** `c79213790`, `c0f005789`

File: `src/resources/extensions/hx/auto-start.ts`:
- Import `resolveDefaultSessionModel` from `./preferences-models.js`
- Pass `ctx.model?.provider` to `resolveDefaultSessionModel(ctx.model?.provider)` (bare model ID fix)
- Use `preferredModel` to build `startModelSnapshot`, preferring it over `ctx.model`

`preferences-models.ts` already exists in hx-ai — verify `resolveDefaultSessionModel` accepts an optional `provider` param; if not, add it. Current hx `auto-start.ts` does not call `resolveDefaultSessionModel()`.

Test: update `tests/auto-start-model-capture.test.ts` and `tests/model-isolation.test.ts`.

### Cluster 6: Interview Notes Loop Fix
**Commit:** `f517a8534`

File: `src/resources/extensions/shared/interview-ui.ts` — In `goNextOrSubmit()`, add `&& !states[currentIdx].notes` guard to the `if (!isMultiSelect(currentIdx) && states[currentIdx].cursorIndex === noneOrDoneIdx(currentIdx))` block so notes field only auto-opens when notes are still empty.

Test: new `tests/interview-ui-notes-loop.test.ts` (regression for #3502).

### Cluster 7: LSP Kotlin Alias
**Commit:** `8efd651d7`

File: `packages/pi-coding-agent/src/core/lsp/config.ts` — Add `LEGACY_ALIASES: Record<string, string> = { "kotlin-language-server": "kotlin-lsp" }`. In `mergeServers()`, apply alias lookup before merging.

Test: new `packages/pi-coding-agent/src/core/lsp/lsp-legacy-alias.test.ts`.

### Cluster 8: Decision/Requirement Transaction Race
**Commit:** `18cc75138`

File: `src/resources/extensions/hx/db-writer.ts` — Wrap requirement ID assignment + insert in `db.transaction()` to prevent parallel race. Same pattern as existing decision save transaction.

### Cluster 9: Deferred Slice Dispatch Prevention
**Commit:** `93295f7b5`

Files:
- `src/resources/extensions/hx/status-guards.ts` — Add `isDeferredStatus(status)` and `isInactiveStatus(status)` (= `isClosedStatus || isDeferredStatus`). Neither exists yet in hx status-guards.ts.
- `src/resources/extensions/hx/db-writer.ts` — In `saveDecisionToDb`: when a decision defers a slice, call `db.updateSliceStatus(milestoneId, sliceId, 'deferred')` (non-fatal, wrapped in try/catch). Add `extractDeferredSliceRef()` helper.

Test: new `tests/deferred-slice-dispatch.test.ts`.

### Cluster 10: Complete-Milestone Input Sanitization
**Commit:** `3e8e4a540`

Files:
- `src/resources/extensions/hx/bootstrap/sanitize-complete-milestone.ts` — **New file.** `sanitizeCompleteMilestoneParams()` coerces all fields to trimmed strings/booleans/arrays to handle type mismatches from smaller LLMs.
- `src/resources/extensions/hx/bootstrap/db-tools.ts` — Import `sanitizeCompleteMilestoneParams` and apply it before `handleCompleteMilestone(sanitized, ...)`.

### Cluster 11: Milestone Status Promotion on Re-plan
**Commits:** `fea1b7431`, `8b43b56f8`

File: `src/resources/extensions/hx/hx-db.ts` — In `upsertMilestonePlanning()`: add `title` and `status` to the UPDATE SET clause (`title = COALESCE(NULLIF(:title,''),title), status = COALESCE(NULLIF(:status,''),status)`); accept optional `title`/`status` in params. Also add: completed-slice preservation guard in plan-milestone tool.

File: `src/resources/extensions/hx/tools/plan-milestone.ts` — Add guard: refuse to re-plan if any completed slices would be dropped. Preserve `status = "complete"/"done"` on re-plan for existing completed slices.

Test: `tests/plan-milestone-title.test.ts` and `tests/insert-slice-no-wipe.test.ts`.

### Cluster 12: Worktree Health Monorepo Support
**Commit:** `1adee33d0`

File: `src/resources/extensions/hx/auto/phases.ts` — In worktree health check: add parent-directory walk (up to git root) to detect project markers in monorepos. Add `hasXcodeBundle` scan via `readdirSync` for `*.xcodeproj`/`*.xcworkspace` suffixes with debugLog catch (xcodegen detection also from commit `08e9c1013`). Update the greenfield warning condition to include both `hasXcodeBundle` and `hasProjectFileInParent`.

Test: new `tests/worktree-health-monorepo.test.ts` and `tests/worktree-health-dispatch.test.ts`.

### Cluster 13: Merge Failure Notification Fix
**Commit:** `75507e5b9`

File: `src/resources/extensions/hx/worktree-resolver.ts` — The hx file already has `/hx dispatch complete-milestone` in the message, but needs a minor text tweak: wrap in backticks. Check exact text vs upstream. One test to add: `tests/worktree-resolver.test.ts` update.

### Cluster 14: Reopen DB on Cold Resume + Heavy Check Mark
**Commit:** `62f11b9c3`

Files:
- `src/resources/extensions/hx/auto-start.ts` — Export `openProjectDbIfPresent` (currently private).
- `src/resources/extensions/hx/auto.ts` — Import `openProjectDbIfPresent` from `./auto-start.js`; call it before `rebuildState(s.basePath)` in the resume path.
- `src/resources/extensions/hx/roadmap-slices.ts` — Add U+2714 (✔) to the `[✅☑✓]` regex on line 85, and add U+2705 to `headerPattern`/`prefixCheckPattern` which currently only match U+2713 (✓).

Test: new `tests/cold-resume-db-reopen.test.ts` and `tests/roadmap-slices.test.ts` update.

### Cluster 15: Dashboard Model Label Fix
**Commit:** `f18305c50`

Files:
- `src/resources/extensions/hx/auto/session.ts` — Add `currentDispatchedModelId: string | null = null` to `AutoSession` class; reset in `reset()`.
- `src/resources/extensions/hx/auto-dashboard.ts` — Add `getCurrentDispatchedModelId(): string | null` to `AutoSessionAccessors` interface; use it to build `modelId`/`modelProvider` display strings (prefer dispatched model over stale `cmdCtx.model`).
- `src/resources/extensions/hx/auto.ts` — Wire `getCurrentDispatchedModelId: () => s.currentDispatchedModelId` into accessors.
- `src/resources/extensions/hx/auto/phases.ts` — Set `s.currentDispatchedModelId` after `selectAndApplyModel`; reset to null at unit start.

Test: new `tests/dashboard-model-label-ordering.test.ts`.

### Cluster 16: Worktree Teardown Path Validation
**Commit:** `f3342a1a6`

File: `src/resources/extensions/hx/worktree-manager.ts` — Add `isInsideWorktreesDir(basePath, targetPath)` export; apply as safety gate before `rmSync` in `removeWorktree()`.
File: `src/resources/extensions/hx/auto-worktree.ts` — Import `isInsideWorktreesDir`; guard fallback `rmSync` to prevent #2365 data loss.

Test: new `tests/worktree-teardown-safety.test.ts`.

### Cluster 17: Diagnostic Messages + Misc
**Commits:** `039c13321` (enrich diagnostic messages), `a5cab49ee` (prevent artifact rendering corruption), `0684f6fe7` (metrics dedup)

- `039c13321`: `auto-post-unit.ts` — Use `diagnoseExpectedArtifact` to enrich artifact-missing messages. `auto-verification.ts` — summarize failed commands list in verification failure messages. Both `diagnoseExpectedArtifact` and the auto-post-unit call site need to be wired — currently `diagnoseExpectedArtifact` is imported only in integration test, not in `auto-post-unit.ts`.
- `a5cab49ee`: `workflow-projections.ts` / `complete-milestone.ts` — Prevent milestone title double-prefix and STATE.md double-prefix. Upstream added guards for the `renderPlanContent`/`renderRoadmapContent`/`renderStateContent` functions.
- `0684f6fe7`: `metrics.ts` / `forensics.ts` — Deduplicate idle-watchdog entries; fix forensics false-positives.

### Cluster 18: Preferences Validation for Codebase
**Commit:** `d0e1eeb46`

File: `src/resources/extensions/hx/preferences-validation.ts` — Add codebase validation section: validate `codebase.exclude_patterns` (array of strings), `codebase.max_files` (positive integer), `codebase.collapse_threshold` (positive integer). Currently missing — S05 added `CodebaseMapPreferences` type but didn't add validation.

### Cluster 19: Claude Code Skill Directories
**Commit:** `dd92b9703`

Files:
- `src/resources/extensions/hx/skill-discovery.ts` — Add `~/.claude/skills` to skill scan dirs alongside existing `~/.agents/skills`.
- `src/resources/extensions/hx/preferences-skills.ts` — Add Claude Code skill dir entries.
- `src/resources/extensions/hx/skill-catalog.ts` — Add `~/.claude/skills` to catalog scan.

### Cluster 20: Seed Requirements from REQUIREMENTS.md (post-v2.63.0, in plan)
**Commit:** `a4e43ca41`

File: `src/resources/extensions/hx/db-writer.ts` — In `updateRequirementInDb`: when requirement ID not found in DB, parse REQUIREMENTS.md via `parseRequirementsSections()` and seed all requirements into DB (lazy, collision-safe). This directly addresses the K-note about requirements DB vs REQUIREMENTS.md.

### Cluster 21: Inject S##-CONTEXT.md Into Prompt Builders (post-v2.63.0, in plan)
**Commit:** `09a450b2c`

File: `src/resources/extensions/hx/auto-prompts.ts`:

Currently: `buildResearchSlicePrompt` (line 992) and `buildPlanSlicePrompt` (line 1047) already have slice context injection.

**Missing** — add `sliceContextPath`/`sliceContextInline` injection to:
1. `buildCompleteSlicePrompt` (line ~1259) — after slice plan inline, before task summaries
2. `buildReplanSlicePrompt` (line ~1512) — after slice plan inline
3. `buildReassessRoadmapPrompt` (line ~1628) — using `completedSliceId` as the `sid`

Pattern: `resolveSliceFile(base, mid, sid, "CONTEXT")` + `inlineFileOptional(path, rel, "Slice Context (from discussion)")` + `if (inline) inlined.push(inline)`.

### Cluster 22: Remaining Pi-Coding-Agent Fixes (packages/)
These touch `packages/pi-coding-agent` but run in the same test suite:

- `22ff184a6` (stale retries after model switch): `retry-handler.ts` — Add `clearQueued()` method; call on explicit model switch in `agent-session.ts`.
- `9c43fc281` (repairToolJson XML + truncated numbers): `packages/pi-ai/src/utils/repair-tool-json.ts` — Add `stripXmlParameterTags()` and truncated-number repair. Check if `packages/pi-ai` exists in this repo.
- `5d35fd107` (route non-builtin slash commands): `packages/pi-coding-agent/.../input-controller.ts` + `slash-command-handlers.ts` — Route unrecognized slash commands to the session after TUI dispatch.
- `8efd651d7` already covered in Cluster 7.

### Commits Already Ported (not S06 scope)
- S01: `0c6cf7800`, `39c4b69bb`, `25f96fde2`, `b6ddf82e0`, `50a410acf`, `0b045fceb`, `eb3a6ef35`, `c397beeb2`
- S02: `fea9d72de` (parallel)
- S03: `a7b574acf` (context optimization), `d77b3dd7f` (stop/backtrack captures)
- S04: `02388f439`, `2c2be0d87`, `8b6b15d81`, `5d4e056c0`, `4112c4d28`, `b91038e22`, `6e756ab4c`, `6ccec0599`
- S05: `206ebf8c9` (MCP readers), `7a046098b`, `6e681c8ce` (/btw skill), `45a48c4ae`, `11ad12fee`, `d0e1eeb46` (codebase)

### Commits to Skip (out of scope)
- `fd2a2feca` (chore: .gitignore) — non-code
- `12e5d6abd` (remove copyright from test) — trivial, no functional change
- `7870f6e2a` (MCP OAuth provider) — upstream-specific, not relevant to hx
- `7f2c7dbab` (Gemini CLI OAuth detection) — upstream-specific token detection
- `bda7ff773` (git add -u in .gsd symlink fallback) — references .gsd symlink path, skip

---

## Implementation Landscape

### High-Impact Files (multiple clusters touch these)
- `src/resources/extensions/hx/auto/phases.ts` — Clusters 12 (monorepo health) + 15 (dashboard model label)
- `src/resources/extensions/hx/auto-start.ts` — Clusters 5 (preferences bootstrap) + 14 (cold resume DB)
- `src/resources/extensions/hx/auto.ts` — Clusters 14 (cold resume) + 15 (dashboard model)
- `src/resources/extensions/hx/db-writer.ts` — Clusters 8 (transaction race) + 9 (deferred slices) + 20 (seed requirements)
- `src/resources/extensions/hx/hx-db.ts` — Cluster 11 (milestone status promotion)
- `src/resources/extensions/ask-user-questions.ts` — Cluster 2 (dedup + remote mode fix)
- `src/resources/extensions/hx/bootstrap/tool-call-loop-guard.ts` — Cluster 2
- `packages/pi-coding-agent/src/core/settings-manager.ts` — Cluster 1

### New Files to Create
1. `src/security-overrides.ts`
2. `src/resources/extensions/hx/bootstrap/sanitize-complete-milestone.ts`
3. All test files (10+): dedup, steer-worktree-path, worktree-health-monorepo, steer, notes-loop, cold-resume, dashboard-model, teardown-safety, deferred-slice, interview-ui-notes-loop

### Files That Don't Need Changes (already correct in hx)
- `src/resources/extensions/hx/worktree-resolver.ts` — merge failure message already uses `/hx dispatch complete-milestone` in backticks
- `src/resources/extensions/hx/status-guards.ts` (exists but needs new functions added)

---

## Task Decomposition Recommendation

S06 has 22 clusters. Group by blast-radius and test dependencies:

**T01 — Security Overrides + URL Utils** (~45 min)
- Clusters 1 (security overrides in packages/pi-coding-agent + src/security-overrides.ts + url-utils.ts + cli.ts)
- All test files for cluster 1
- Verify: `npx tsc --noEmit`, `npm run test:unit`

**T02 — Ask-User-Questions Dedup + Remote Questions + Loop Guard** (~30 min)
- Clusters 2 (dedup cache, questionSignature, cache reset hooks, strict loop threshold, remote-questions interactive mode fix)
- All test files for cluster 2

**T03 — DB-Level Fixes** (~30 min)
- Clusters 3 (WAL/SHM orphan), 8 (transaction race), 9 (deferred slice status), 20 (seed requirements from REQUIREMENTS.md)
- Clusters 11 (milestone status promotion + preserve completed slices in plan-milestone)
- All test files for these clusters

**T04 — Auto-Mode Fixes** (~40 min)
- Clusters 4 (steer worktree), 5 (preferences bootstrap), 13 (merge failure), 14 (cold resume + heavy checkmark), 15 (dashboard model label)
- Clusters 10 (complete-milestone sanitization), 21 (inject slice context into 3 missing prompt builders)
- All test files

**T05 — Worktree + Health + Misc + Pi-Coding-Agent Fixes** (~30 min)
- Clusters 12 (monorepo health + xcode), 16 (teardown safety)
- Clusters 6 (interview notes loop), 7 (LSP Kotlin alias), 17 (diagnostic messages, artifact rendering, metrics)
- Clusters 18 (preferences codebase validation), 19 (Claude Code skill dirs), 22 (pi-coding-agent: retry-handler, repairToolJson, slash-command routing)

**T06 — Final Verification** (~20 min)
- `npx tsc --noEmit` → must exit 0
- `npm run test:unit` → must match or exceed 4215/0/5 (new tests will increase the count)
- `grep -rn '\bgsd\b|\bGSD\b' src/resources/extensions/hx/ packages/mcp-server/src/` across all modified files → 0 hits
- Update requirements R010, R014, R017, R018 status

---

## Key Risks and Constraints

1. **GSD→HX env var naming**: `security-overrides.ts` must use `HX_ALLOWED_COMMAND_PREFIXES` / `HX_FETCH_ALLOWED_URLS`, not `GSD_*`. This is a naming adaptation from the upstream code.

2. **Package import adaptation**: `src/security-overrides.ts` imports `setAllowedCommandPrefixes` from `'@gsd/pi-coding-agent'` upstream — must be changed to `'@hyperlab/hx-coding-agent'`.

3. **`packages/pi-ai` check**: The `repairToolJson` fix touches `packages/pi-ai/src/utils/repair-tool-json.ts`. Verify this package exists:
   ```
   ls packages/pi-ai/src/utils/repair-tool-json.ts
   ```
   If it's part of `packages/pi-coding-agent`, adjust path accordingly.

4. **auto-start.ts `openProjectDbIfPresent`**: Currently a private function (line 108). Export it; the cold resume path in auto.ts must import and call it before `rebuildState`.

5. **test file compile path**: Per K-note, new tests go in flat `src/resources/extensions/hx/tests/` (not `tests/integration/`). Pi-coding-agent tests stay in their package. The few `src/tests/` files (security-overrides, url-utils-override) are root-level tests.

6. **S06 includes 2 post-v2.63.0 commits**: `a4e43ca41` and `09a450b2c` are above v2.63.0 but the S06 plan explicitly lists them. They are in scope.

---

## Verification Checklist

```bash
# 1. tsc
npx tsc --noEmit
# Expected: exit 0

# 2. tests
npm run test:unit
# Expected: ≥ 4215 passed (new tests increase count), 0 failed, 5 skipped

# 3. GSD grep across all modified files
grep -rn '\bgsd\b|\bGSD\b' \
  src/resources/extensions/hx/ \
  src/resources/extensions/ask-user-questions.ts \
  src/resources/extensions/shared/interview-ui.ts \
  src/security-overrides.ts \
  src/web/bridge-service.ts \
  src/resource-loader.ts \
  packages/mcp-server/src/ \
  packages/pi-coding-agent/src/core/settings-manager.ts \
  packages/pi-coding-agent/src/core/resolve-config-value.ts \
  | grep -v "node_modules" | grep -v ".test." | wc -l
# Expected: 0

# 4. Commit count accounted for
git log --oneline v2.59.0..upstream/main | grep -v "Merge\|release:\|docs:\|chore:\|ci:" | wc -l
# All commits must be either ported or explicitly skipped with rationale
```
