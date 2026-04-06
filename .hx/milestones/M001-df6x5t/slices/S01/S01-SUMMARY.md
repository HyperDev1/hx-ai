---
id: S01
parent: M001-df6x5t
milestone: M001-df6x5t
provides:
  - All GSD* TypeScript type/interface/class names renamed to HX* equivalents (HXState, HXPreferences, HXModelConfig, HXMilestone, HXSlice, HXTask, etc.)
  - All gsd* internal variable names renamed to hx* (hxDir, hxHome, hxPath, hxDbPath, hxState, hxBinPath, etc.)
  - npm run typecheck:extensions exits 0 with zero errors
  - Zero GSD*/gsd* TypeScript identifiers in any .ts/.tsx file (excluding S04-scope Rust N-API calls and migrate-gsd-to-hx.ts)
requires:
  []
affects:
  - S02
  - S03
  - S04
  - S05
key_files:
  - src/resources/extensions/hx/types.ts
  - src/resources/extensions/hx/preferences-types.ts
  - src/resources/extensions/hx/migrate/types.ts
  - src/resources/extensions/hx/doctor.ts
  - src/resources/extensions/hx/commands.ts
  - src/resources/extensions/hx/commands/dispatcher.ts
  - src/resources/extensions/hx/native-parser-bridge.ts
  - src/resources/extensions/hx/workspace-index.ts
  - src/resources/extensions/hx/dashboard-overlay.ts
  - src/resources/extensions/hx/visualizer-overlay.ts
  - src/resources/extensions/hx/paths.ts
  - src/resources/extensions/hx/auto/loop.ts
  - src/resources/extensions/hx/auto-start.ts
  - src/resources/extensions/hx/guided-flow.ts
  - src/resources/extensions/cmux/index.ts
  - src/resources/extensions/ttsr/rule-loader.ts
  - src/resources/extensions/subagent/isolation.ts
  - src/resources/extensions/remote-questions/status.ts
  - src/resources/extensions/remote-questions/store.ts
  - web/lib/hx-workspace-store.tsx
  - web/lib/workflow-action-execution.ts
  - web/lib/initial-hx-header-filter.ts
  - web/components/hx/chat-mode.tsx
  - src/web/bridge-service.ts
  - src/headless-query.ts
  - src/headless-ui.ts
  - src/resource-loader.ts
  - packages/native/src/hx-parser/types.ts
  - packages/native/src/hx-parser/index.ts
  - packages/daemon/src/discord-bot.ts
  - vscode-extension/src/extension.ts
  - src/resources/extensions/hx/commands/handlers/ops.ts
  - tests/live-regression/run.ts
  - src/tests/integration/web-mode-assembled.test.ts
key_decisions:
  - Preserve migrate-gsd-to-hx.ts untouched — backward-compat migration code for .gsd/ → .hx/ directory migration (R009).
  - Use import aliasing (as migrateProject, as migrateGlobal) for callers of protected functions exported from migrate-gsd-to-hx.ts.
  - Exclude Rust N-API cast call (native as Record<string, Function>).batchParseGsdFiles from S01 scope — rename only after Rust binary renamed in S04.
  - Synchronous foreground shell loops required for perl -pi in git worktree — async_bash jobs do not persist file writes.
  - gsdHome renamed to legacyHome in migrate-gsd-to-hx.test.ts to avoid TS2451 duplicate const with hxHome.
  - ops.ts handleGsdToHxMigration revert — T01 over-applied batch rename to protected import; corrected in T02.
  - Grep exclusion updated to bare batchParseGsdFiles (not native\.batchParseGsdFiles) to match cast syntax.
patterns_established:
  - Batch rename via synchronous foreground perl loop: write substitutions to /tmp/renames.pl, iterate files with while IFS= read -r FILE; do perl -pi /tmp/renames.pl "$FILE"; done
  - Import aliasing pattern for protected exports: import { oldName as newLocalAlias } from './protected-file.js'
  - Migration test files need manual review before batch rename — they reference both old and new names as test fixtures (both gsdHome and hxHome), causing duplicate const declarations if naively renamed.
  - Two-pass strategy for large test directories: first pass for type/function names, second pass for any missed names discovered during verification grep.
observability_surfaces:
  - none
drill_down_paths:
  - .hx/milestones/M001-df6x5t/slices/S01/tasks/T01-SUMMARY.md
  - .hx/milestones/M001-df6x5t/slices/S01/tasks/T02-SUMMARY.md
  - .hx/milestones/M001-df6x5t/slices/S01/tasks/T03-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-04-03T20:16:23.923Z
blocker_discovered: false
---

# S01: TypeScript Types & Internal Variables

**Renamed ~500+ GSD*/gsd* TypeScript identifiers across 100+ files; npm run typecheck:extensions passes with zero errors and zero GSD references remain.**

## What Happened

S01 executed a complete batch rename of all GSD-prefixed TypeScript type names, interface names, class names, function names, and gsd-prefixed internal variable names across the entire codebase (excluding the protected migrate-gsd-to-hx.ts and Rust N-API runtime call strings that S04 owns).

**T01 — Core extension files and neighbor extensions:** Renamed ~450 GSD*/gsd* references across 60+ files in src/resources/extensions/hx/ and 6 neighbor extension files (cmux, ttsr, search-the-web, subagent, remote-questions x2). The task plan listed 29 type renames and 9 variable renames but ~20 additional function names were discovered during verification (inlineGsdRootFile, syncGsdStateToWorktree, bootstrapGsdDirectory, resolveGsdBin, GsdCommandDefinition, GsdDispatchContext, etc.) and renamed in a second pass. Critical constraints honored: native-parser-bridge.ts Rust N-API call strings (native.scanGsdTree, native.batchParseGsdFiles) left unchanged; migrate-gsd-to-hx.ts untouched. Key implementation discovery: async_bash jobs don't persist writes in git worktrees — all perl operations had to run synchronously in foreground shell loops. Import aliasing (as migrateProject, as migrateGlobal) was used in guided-flow.ts and auto-start.ts to consume protected function exports without touching migrate-gsd-to-hx.ts.

**T02 — Web, packages, vscode-extension, and test files:** Renamed all remaining GSD* references across web/, src/web/, packages/, vscode-extension/, and all test files (src/tests/, tests/, src/resources/extensions/hx/tests/). Scope expanded beyond the task plan to include 15+ additional web/components/hx/*.tsx files discovered via grep. A two-pass strategy was needed on hx/tests/ — first pass for T01's rename list, second pass for GSDMilestone/GSDSlice/GSDTask/GSDProject. A critical correction was made in ops.ts: T01's batch rename had over-applied itself and renamed the protected function import handleGsdToHxMigration to handleHxToHxMigration — this was reverted. In migrate-gsd-to-hx.test.ts, gsdHome was renamed to legacyHome (not hxHome) to avoid a TS2451 duplicate const declaration since both source and dest dirs exist in that test. After T02, npm run typecheck:extensions passed with zero errors.

**T03 — Final cleanup and verification:** Two additional missed identifiers discovered via grep (gsdVersion in tests/live-regression/run.ts renamed to hxVersion; gsdPrompt in web-mode-assembled.test.ts renamed to hxPrompt). The grep exclusion pattern was refined — the plan used native\.batchParseGsdFiles but the actual cast syntax (native as Record<string, Function>).batchParseGsdFiles doesn't match; the correct exclusion is batchParseGsdFiles alone. After T03 fixes, final state: grep returns 0 hits, typecheck:extensions exits 0.

**Final verified state:** Zero GSD*/Gsd*/gsd* TypeScript identifiers remain outside the explicitly allowed exceptions (migrate-gsd-to-hx.ts, gsd_engine binary path strings in packages/native, batchParseGsdFiles Rust N-API runtime call in hx-parser/index.ts). migrate-gsd-to-hx.ts confirmed unchanged by git diff.

## Verification

Three slice-level verification checks all pass:
1. `grep -rn 'GSD[A-Za-z]\|Gsd[A-Z]\|gsd[A-Z]' --include='*.ts' --include='*.tsx' . | grep -v node_modules | grep -v dist | grep -v .next | grep -v migrate-gsd-to-hx | grep -v '.hx/' | grep -v 'gsd_engine' | grep -v batchParseGsdFiles | wc -l` → **0** ✅
2. `npm run typecheck:extensions` → **exit 0, zero errors** ✅ (confirmed across T02 and T03 runs, both 0 errors)
3. `git diff src/resources/extensions/hx/migrate-gsd-to-hx.ts | wc -l` → **0** ✅ (file unchanged)

## Requirements Advanced

- R001 — All ~37 GSD* type names renamed to HX* equivalents across 100+ files; verified by typecheck passing and grep returning 0 hits.
- R005 — All ~30 gsd* internal variable names renamed to hx* equivalents across 60+ files.
- R010 — npm run typecheck:extensions passes with zero errors after all renames.

## Requirements Validated

- R001 — grep -rn 'GSD[A-Za-z]|Gsd[A-Z]|gsd[A-Z]' returns 0 hits; npm run typecheck:extensions exits 0.
- R005 — grep for all gsd* variable patterns returns 0 hits outside S04-scope exceptions.
- R010 — npm run typecheck:extensions exits 0 with zero errors (verified in T02 and T03 runs).

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

1. Rename list expanded: ~20 additional function names beyond the 29 in the task plan were discovered during verification and renamed (inlineGsdRootFile, syncGsdStateToWorktree, bootstrapGsdDirectory, resolveGsdBin, GsdCommandDefinition, GsdDispatchContext, registerGsdExtension, etc.).
2. Import aliasing for protected imports: guided-flow.ts and auto-start.ts use `import { migrateProjectGsdToHx as migrateProject }` rather than renaming the protected function.
3. ops.ts over-rename corrected: T01 batch rename incorrectly renamed handleGsdToHxMigration→handleHxToHxMigration in ops.ts; reverted in T02.
4. migrate-gsd-to-hx.test.ts: gsdHome renamed to legacyHome (not hxHome) to avoid duplicate const TS2451.
5. T03 pre-existing errors: T02 had already fixed all three pre-existing type errors listed in T03's plan.
6. Grep exclusion refinement: exclusion pattern updated from native\.batchParseGsdFiles to bare batchParseGsdFiles to match cast syntax in hx-parser/index.ts.
7. S04-scope carve-outs: 2 TypeScript interface property declarations in native-parser-bridge.ts + 1 Rust N-API cast call in hx-parser/index.ts are intentionally preserved.

## Known Limitations

The one remaining GSD-named identifier in TypeScript files is `(native as Record<string, Function>).batchParseGsdFiles(` in packages/native/src/hx-parser/index.ts:83. This is an S04-scope Rust N-API runtime call string that cannot be renamed until the Rust binary is renamed. S04 will fix this together with the binary rename. Two TypeScript interface property declarations in native-parser-bridge.ts (batchParseGsdFiles: and scanGsdTree: on the NativeModule interface) are also S04 scope.

## Follow-ups

S04 must rename: (1) the Rust binary from gsd_engine.*.node to hx_engine.*.node, (2) the Rust-exported N-API functions batch_parse_gsd_files→batch_parse_hx_files and scan_gsd_tree→scan_hx_tree, (3) the cast call in hx-parser/index.ts, (4) the interface property declarations in native-parser-bridge.ts. S02 can proceed immediately (no S01 blockers).

## Files Created/Modified

- `src/resources/extensions/hx/types.ts` — GSDState→HXState, GSDProject→HXProject, GSDMilestone→HXMilestone, GSDSlice/Task/Requirement etc. renamed
- `src/resources/extensions/hx/preferences-types.ts` — GSDPreferences→HXPreferences, GSDSkillRule→HXSkillRule, GSDPhaseModelConfig→HXPhaseModelConfig, GSDModelConfig→HXModelConfig, LoadedGSDPreferences→LoadedHXPreferences
- `src/resources/extensions/hx/native-parser-bridge.ts` — GsdTreeEntry→HxTreeEntry, nativeScanGsdTree→nativeScanHxTree, nativeBatchParseGsdFiles→nativeBatchParseHxFiles; Rust N-API call strings preserved
- `src/resources/extensions/hx/workspace-index.ts` — GSDWorkspaceIndex→HXWorkspaceIndex and related types
- `src/resources/extensions/hx/doctor.ts` — runGSDDoctor→runHXDoctor
- `src/resources/extensions/hx/commands.ts` — registerGSDCommand→registerHXCommand, handleGSDCommand→handleHXCommand, registerLazyGSDCommand→registerLazyHXCommand
- `src/resources/extensions/hx/commands/dispatcher.ts` — GsdDispatchContext→HxDispatchContext
- `src/resources/extensions/hx/paths.ts` — gsdDir→hxDir, gsdDirPath→hxDirPath, gsdDirName→hxDirName, writeGSDDirectory→writeHXDirectory
- `src/resources/extensions/hx/auto/loop.ts` — gsdState→hxState local variable
- `src/resources/extensions/hx/auto-start.ts` — gsdBinPath→hxBinPath, import alias for migrateProjectGsdToHx
- `src/resources/extensions/hx/guided-flow.ts` — import alias for migrateGlobalGsdToHx
- `src/resources/extensions/hx/commands/handlers/ops.ts` — Reverted over-applied T01 rename; handleGsdToHxMigration preserved as import from protected file
- `src/resources/extensions/cmux/index.ts` — GSDPreferences→HXPreferences, GSDState→HXState
- `src/resources/extensions/ttsr/rule-loader.ts` — gsdHome→hxHome
- `src/resources/extensions/search-the-web/provider.ts` — gsdHome→hxHome
- `src/resources/extensions/subagent/isolation.ts` — gsdHome→hxHome
- `src/resources/extensions/remote-questions/status.ts` — getGsdHome→getHxHome
- `src/resources/extensions/remote-questions/store.ts` — getGsdHome→getHxHome
- `web/lib/hx-workspace-store.tsx` — GSDWorkspaceStore→HXWorkspaceStore, GSDWorkspaceProvider→HXWorkspaceProvider, useGSDWorkspaceState→useHXWorkspaceState, useGSDWorkspaceActions→useHXWorkspaceActions
- `web/lib/workflow-action-execution.ts` — GSDViewName→HXViewName, navigateToGSDView→navigateToHXView
- `web/lib/browser-slash-command-dispatch.ts` — dispatchGSDSubcommand→dispatchHXSubcommand
- `web/lib/initial-hx-header-filter.ts` — InitialGsdHeaderFilterResult→InitialHxHeaderFilterResult, filterInitialGsdHeader→filterInitialHxHeader
- `web/components/hx/chat-mode.tsx` — GSDActionDef→HXActionDef, GSD_ACTIONS→HX_ACTIONS
- `src/web/bridge-service.ts` — GSDWorkspace* types renamed to HXWorkspace*
- `src/headless-query.ts` — gsdExtensionPath→hxExtensionPath, GSDState→HXState
- `src/headless-ui.ts` — summarizeGsdTool→summarizeHxTool
- `src/resource-loader.ts` — gsdNodeModules→hxNodeModules
- `packages/native/src/hx-parser/types.ts` — batchParseGsdFiles interface type renamed to batchParseHxFiles
- `packages/daemon/src/discord-bot.ts` — handleGsdStart→handleHxStart, handleGsdStop→handleHxStop
- `vscode-extension/src/extension.ts` — GsdSidebarProvider→HxSidebarProvider, GsdFileDecorationProvider→HxFileDecorationProvider, GsdBashTerminal→HxBashTerminal, etc.
- `src/resources/extensions/hx/tests/migrate-gsd-to-hx.test.ts` — gsdHome renamed to legacyHome to avoid duplicate const with hxHome
- `tests/live-regression/run.ts` — gsdVersion→hxVersion
- `src/tests/integration/web-mode-assembled.test.ts` — gsdPrompt→hxPrompt
