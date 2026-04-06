---
id: T05
parent: S06
milestone: M003-ttxmyu
provides: []
requires: []
affects: []
key_files: ["src/resources/extensions/shared/interview-ui.ts", "src/resources/extensions/hx/auto/phases.ts", "src/resources/extensions/hx/worktree-manager.ts", "src/resources/extensions/hx/auto-worktree.ts", "src/resources/extensions/hx/auto-post-unit.ts", "src/resources/extensions/hx/workflow-projections.ts", "src/resources/extensions/hx/preferences-validation.ts", "src/resources/extensions/hx/skill-discovery.ts", "src/resources/extensions/hx/preferences-skills.ts", "packages/pi-coding-agent/src/core/lsp/config.ts", "packages/pi-coding-agent/src/core/retry-handler.ts", "packages/pi-coding-agent/src/core/agent-session.ts", "packages/pi-ai/src/utils/repair-tool-json.ts", "packages/pi-ai/src/index.ts", "packages/pi-coding-agent/src/modes/interactive/controllers/input-controller.ts", "src/resources/extensions/hx/tests/interview-ui-notes-loop.test.ts", "src/resources/extensions/hx/tests/worktree-health-monorepo.test.ts", "src/resources/extensions/hx/tests/worktree-teardown-safety.test.ts", "packages/pi-coding-agent/src/core/lsp-legacy-alias.test.ts"]
key_decisions: ["listSkillDirs returns 'dir:name' qualified entries to support scanning both ~/.agents/skills and ~/.claude/skills without refactoring callers", "repairTruncatedNumber is conservative — only repairs trailing digit truncation", "isInsideWorktreesDir uses string prefix check after normalize-to-forward-slash for Windows compatibility", "lsp test moved to core level so it's picked up by test:packages glob", "skill-catalog.ts not modified — manages skills.sh repo packs not local scan dirs", "metrics dedup already in place — no change needed for 0684f6fe7"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "npx tsc --noEmit → 0 errors. npm run test:unit --reporter=dot → 4298 passed, 0 failed, 5 skipped. Targeted 3-file HX test run → 17/17 pass. GSD grep → 0 regressions."
completed_at: 2026-04-05T19:47:38.811Z
blocker_discovered: false
---

# T05: Eight-cluster port: interview notes loop, LSP alias, worktree monorepo + safety, diagnostics, preferences validation, skill dirs, and pi-agent patches — tsc clean, 4298 tests pass (17 new)

> Eight-cluster port: interview notes loop, LSP alias, worktree monorepo + safety, diagnostics, preferences validation, skill dirs, and pi-agent patches — tsc clean, 4298 tests pass (17 new)

## What Happened
---
id: T05
parent: S06
milestone: M003-ttxmyu
key_files:
  - src/resources/extensions/shared/interview-ui.ts
  - src/resources/extensions/hx/auto/phases.ts
  - src/resources/extensions/hx/worktree-manager.ts
  - src/resources/extensions/hx/auto-worktree.ts
  - src/resources/extensions/hx/auto-post-unit.ts
  - src/resources/extensions/hx/workflow-projections.ts
  - src/resources/extensions/hx/preferences-validation.ts
  - src/resources/extensions/hx/skill-discovery.ts
  - src/resources/extensions/hx/preferences-skills.ts
  - packages/pi-coding-agent/src/core/lsp/config.ts
  - packages/pi-coding-agent/src/core/retry-handler.ts
  - packages/pi-coding-agent/src/core/agent-session.ts
  - packages/pi-ai/src/utils/repair-tool-json.ts
  - packages/pi-ai/src/index.ts
  - packages/pi-coding-agent/src/modes/interactive/controllers/input-controller.ts
  - src/resources/extensions/hx/tests/interview-ui-notes-loop.test.ts
  - src/resources/extensions/hx/tests/worktree-health-monorepo.test.ts
  - src/resources/extensions/hx/tests/worktree-teardown-safety.test.ts
  - packages/pi-coding-agent/src/core/lsp-legacy-alias.test.ts
key_decisions:
  - listSkillDirs returns 'dir:name' qualified entries to support scanning both ~/.agents/skills and ~/.claude/skills without refactoring callers
  - repairTruncatedNumber is conservative — only repairs trailing digit truncation
  - isInsideWorktreesDir uses string prefix check after normalize-to-forward-slash for Windows compatibility
  - lsp test moved to core level so it's picked up by test:packages glob
  - skill-catalog.ts not modified — manages skills.sh repo packs not local scan dirs
  - metrics dedup already in place — no change needed for 0684f6fe7
duration: ""
verification_result: passed
completed_at: 2026-04-05T19:47:38.812Z
blocker_discovered: false
---

# T05: Eight-cluster port: interview notes loop, LSP alias, worktree monorepo + safety, diagnostics, preferences validation, skill dirs, and pi-agent patches — tsc clean, 4298 tests pass (17 new)

**Eight-cluster port: interview notes loop, LSP alias, worktree monorepo + safety, diagnostics, preferences validation, skill dirs, and pi-agent patches — tsc clean, 4298 tests pass (17 new)**

## What Happened

All eight clusters implemented: (6) interview-ui notes loop fix adding !states[currentIdx].notes guard; (7) LSP LEGACY_ALIASES for kotlin-language-server→kotlin-lsp in mergeServers; (12) worktree health monorepo support with parent-dir walk + Xcode bundle scan; (16) isInsideWorktreesDir safety guard on all rmSync calls in worktree teardown paths; (17) diagnoseExpectedArtifact enrichment in auto-post-unit retry messages + double-prefix guards in workflow-projections rendering; (18) full codebase preferences validation block (exclude_patterns, max_files, collapse_threshold); (19) ~/.claude/skills added to skill-discovery and preferences-skills; (22) RetryHandler.clearQueued() wired into setModel(), repair-tool-json utilities created, unrecognized slash commands routed to session.prompt(). Metrics dedup was already present. Four test files written (17 tests), all passing.

## Verification

npx tsc --noEmit → 0 errors. npm run test:unit --reporter=dot → 4298 passed, 0 failed, 5 skipped. Targeted 3-file HX test run → 17/17 pass. GSD grep → 0 regressions.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx tsc --noEmit` | 0 | ✅ pass | 4400ms |
| 2 | `npm run test:unit -- --reporter=dot` | 0 | ✅ pass | 74200ms |
| 3 | `targeted 3-file HX test run (17 new tests)` | 0 | ✅ pass | 2400ms |
| 4 | `grep GSD regressions` | 0 | ✅ pass | 200ms |


## Deviations

Metrics dedup (0684f6fe7) already present — no change. skill-catalog.ts not modified (curates skills.sh packs, not local dirs). lsp test moved to core/ level. listSkillDirs refactored to return 'dir:name' entries.

## Known Issues

None.

## Files Created/Modified

- `src/resources/extensions/shared/interview-ui.ts`
- `src/resources/extensions/hx/auto/phases.ts`
- `src/resources/extensions/hx/worktree-manager.ts`
- `src/resources/extensions/hx/auto-worktree.ts`
- `src/resources/extensions/hx/auto-post-unit.ts`
- `src/resources/extensions/hx/workflow-projections.ts`
- `src/resources/extensions/hx/preferences-validation.ts`
- `src/resources/extensions/hx/skill-discovery.ts`
- `src/resources/extensions/hx/preferences-skills.ts`
- `packages/pi-coding-agent/src/core/lsp/config.ts`
- `packages/pi-coding-agent/src/core/retry-handler.ts`
- `packages/pi-coding-agent/src/core/agent-session.ts`
- `packages/pi-ai/src/utils/repair-tool-json.ts`
- `packages/pi-ai/src/index.ts`
- `packages/pi-coding-agent/src/modes/interactive/controllers/input-controller.ts`
- `src/resources/extensions/hx/tests/interview-ui-notes-loop.test.ts`
- `src/resources/extensions/hx/tests/worktree-health-monorepo.test.ts`
- `src/resources/extensions/hx/tests/worktree-teardown-safety.test.ts`
- `packages/pi-coding-agent/src/core/lsp-legacy-alias.test.ts`


## Deviations
Metrics dedup (0684f6fe7) already present — no change. skill-catalog.ts not modified (curates skills.sh packs, not local dirs). lsp test moved to core/ level. listSkillDirs refactored to return 'dir:name' entries.

## Known Issues
None.
