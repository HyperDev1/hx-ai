# S01: TypeScript Types & Internal Variables

**Goal:** All GSD* TypeScript types, interfaces, classes, functions, and internal variables are renamed to HX*/hx* equivalents. `npm run typecheck:extensions` passes with zero errors.
**Demo:** After this: After this: tsc compiles with zero GSD type references. All GSD* types are HX*, all gsdDir variables are hxDir.

## Tasks
- [x] **T01: Renamed ~450 GSD* type/function/variable references across 60+ source files in hx/ extension and 5 neighbor extensions; migrate-gsd-to-hx.ts untouched; Rust N-API function names preserved** — Batch-rename all GSD* type names, interface names, class names, function names, and gsd* variable names in the core extension source files (src/resources/extensions/hx/**/*.ts non-test, plus neighbor extensions cmux, ttsr, subagent, search-the-web, remote-questions). This is the bulk of the work — renaming the definitions where names are declared and all their same-directory consumers.

## Steps

1. Run batch sed replacements for all GSD type/interface/class names across `src/resources/extensions/hx/` (excluding `migrate-gsd-to-hx.ts` and test files). The patterns are:
   - `GSDState` → `HXState`
   - `GSDPreferences` → `HXPreferences`
   - `GSDSkillRule` → `HXSkillRule`
   - `GSDPhaseModelConfig` → `HXPhaseModelConfig`
   - `GSDModelConfigV2` → `HXModelConfigV2` (do V2 BEFORE GSDModelConfig)
   - `GSDModelConfig` → `HXModelConfig`
   - `LoadedGSDPreferences` → `LoadedHXPreferences`
   - `GSDProject` → `HXProject`
   - `GSDMilestone` → `HXMilestone`
   - `GSDSliceSummaryData` → `HXSliceSummaryData` (do before GSDSlice)
   - `GSDSlice` → `HXSlice`
   - `GSDTaskSummaryData` → `HXTaskSummaryData` (do before GSDTask)
   - `GSDTask` → `HXTask`
   - `GSDRequirement` → `HXRequirement`
   - `GSDBoundaryEntry` → `HXBoundaryEntry`
   - `GSDDashboardOverlay` → `HXDashboardOverlay`
   - `GSDVisualizerOverlay` → `HXVisualizerOverlay`
   - `GSDWorkspaceIndex` → `HXWorkspaceIndex`
   - `GsdTreeEntry` → `HxTreeEntry`
   - `nativeScanGsdTree` → `nativeScanHxTree`
   - `nativeBatchParseGsdFiles` → `nativeBatchParseHxFiles`
   - `runGSDDoctor` → `runHXDoctor`
   - `registerGSDCommand` → `registerHXCommand`
   - `handleGSDCommand` → `handleHXCommand`
   - `registerLazyGSDCommand` → `registerLazyHXCommand`
   - `writeGSDDirectory` → `writeHXDirectory`
   - `transformToGSD` → `transformToHX`
   - `getWorktreeGSDDiff` → `getWorktreeHXDiff`
   - `diffWorktreeGSD` → `diffWorktreeHX`

2. Run batch sed replacements for gsd* internal variable names in the same file scope:
   - `gsdDir` → `hxDir` (in paths.ts, session-lock.ts, bootstrap/dynamic-tools.ts, auto-start.ts)
   - `gsdDirPath` → `hxDirPath`
   - `gsdDirName` → `hxDirName`
   - `gsdBinPath` → `hxBinPath`
   - `gsdState` → `hxState` (local variable in auto/loop.ts)
   - `gsdMarker` → `hxMarker`
   - `gsdIdx` → `hxIdx`
   - `gsdPath` → `hxPath` (in repo-identity.ts, migrate/command.ts, md-importer.ts)
   - `gsdDbPath` → `hxDbPath`

3. Rename in neighbor extension files:
   - `src/resources/extensions/cmux/index.ts`: `GSDPreferences` → `HXPreferences`, `GSDState` → `HXState`
   - `src/resources/extensions/ttsr/rule-loader.ts`: `gsdHome` → `hxHome`
   - `src/resources/extensions/search-the-web/provider.ts`: `gsdHome` → `hxHome`
   - `src/resources/extensions/subagent/isolation.ts`: `gsdHome` → `hxHome`
   - `src/resources/extensions/remote-questions/status.ts`: `getGsdHome` → `getHxHome`
   - `src/resources/extensions/remote-questions/store.ts`: `getGsdHome` → `getHxHome`

4. **CRITICAL CONSTRAINT**: In `native-parser-bridge.ts`, rename ONLY the TypeScript wrapper names (`GsdTreeEntry` → `HxTreeEntry`, `nativeScanGsdTree` → `nativeScanHxTree`, `nativeBatchParseGsdFiles` → `nativeBatchParseHxFiles`). Keep `native.scanGsdTree` and `native.batchParseGsdFiles` and `mod.batchParseGsdFiles` **unchanged** — these are Rust N-API function names that S04 renames.

5. **CRITICAL CONSTRAINT**: Do NOT touch `src/resources/extensions/hx/migrate-gsd-to-hx.ts` (backward-compat migration code, R009).

6. After all renames, run a quick grep to check for remaining GSD references in the touched scope:
   ```bash
   grep -rn 'GSD[A-Za-z]\|Gsd[A-Z]\|gsdDir\|gsdHome\|gsdPath\|gsdDbPath\|gsdState\|gsdBinPath\|gsdDirPath\|gsdDirName\|gsdMarker\|gsdIdx' --include='*.ts' src/resources/extensions/ | grep -v migrate-gsd-to-hx | grep -v '/tests/' | grep -v node_modules
   ```
   Only expected remaining hits: `native.scanGsdTree`, `native.batchParseGsdFiles`, `mod.batchParseGsdFiles` in native-parser-bridge.ts.

## Must-Haves

- All GSD* type/interface/class definitions renamed to HX*
- All GSD-named function definitions renamed to HX-named
- All gsd* internal variable names renamed to hx* in extension source files
- migrate-gsd-to-hx.ts untouched
- native.scanGsdTree and native.batchParseGsdFiles call strings preserved
  - Estimate: 45m
  - Files: src/resources/extensions/hx/types.ts, src/resources/extensions/hx/preferences-types.ts, src/resources/extensions/hx/migrate/types.ts, src/resources/extensions/hx/dashboard-overlay.ts, src/resources/extensions/hx/visualizer-overlay.ts, src/resources/extensions/hx/workspace-index.ts, src/resources/extensions/hx/native-parser-bridge.ts, src/resources/extensions/hx/doctor.ts, src/resources/extensions/hx/commands.ts, src/resources/extensions/hx/commands/index.ts, src/resources/extensions/hx/commands/dispatcher.ts, src/resources/extensions/hx/commands-bootstrap.ts, src/resources/extensions/hx/migrate/writer.ts, src/resources/extensions/hx/migrate/index.ts, src/resources/extensions/hx/migrate/transformer.ts, src/resources/extensions/hx/worktree-manager.ts, src/resources/extensions/hx/paths.ts, src/resources/extensions/hx/session-lock.ts, src/resources/extensions/hx/auto-start.ts, src/resources/extensions/hx/auto/loop.ts, src/resources/extensions/hx/repo-identity.ts, src/resources/extensions/hx/md-importer.ts, src/resources/extensions/hx/bootstrap/dynamic-tools.ts, src/resources/extensions/hx/bootstrap/register-extension.ts, src/resources/extensions/hx/bootstrap/register-hooks.ts, src/resources/extensions/hx/bootstrap/register-shortcuts.ts, src/resources/extensions/hx/commands/handlers/core.ts, src/resources/extensions/hx/preferences.ts, src/resources/extensions/hx/state.ts, src/resources/extensions/hx/worktree.ts, src/resources/extensions/cmux/index.ts, src/resources/extensions/ttsr/rule-loader.ts, src/resources/extensions/search-the-web/provider.ts, src/resources/extensions/subagent/isolation.ts, src/resources/extensions/remote-questions/status.ts, src/resources/extensions/remote-questions/store.ts
  - Verify: grep -rn 'GSD[A-Za-z]\|Gsd[A-Z]\|gsdDir\|gsdHome\|gsdPath\|gsdDbPath\|gsdState\|gsdBinPath\|gsdDirPath\|gsdDirName\|gsdMarker\|gsdIdx' --include='*.ts' src/resources/extensions/ | grep -v migrate-gsd-to-hx | grep -v '/tests/' | grep -v node_modules | grep -v 'native\.scanGsdTree\|native\.batchParseGsdFiles\|mod\.batchParseGsdFiles' | wc -l  # must be 0
- [x] **T02: Renamed all GSD*/gsd* TypeScript identifiers in 60+ files outside src/resources/extensions/ (web, src/web, packages, vscode-extension, tests); npm run typecheck:extensions passes with zero errors** — Rename all remaining GSD type references, function references, and gsd-prefixed variable names in files outside `src/resources/extensions/` — this covers web/, tests/, packages/, vscode-extension/, src/web/, src/headless-*.ts, src/resource-loader.ts, and all test files in src/resources/extensions/hx/tests/.

## Steps

1. Rename GSD types and functions in **web/ and src/web/** files:
   - `src/web/bridge-service.ts`: `GSDWorkspaceTaskTarget` → `HXWorkspaceTaskTarget`, `GSDWorkspaceSliceTarget` → `HXWorkspaceSliceTarget`, `GSDWorkspaceMilestoneTarget` → `HXWorkspaceMilestoneTarget`, `GSDWorkspaceScopeTarget` → `HXWorkspaceScopeTarget`, `GSDWorkspaceIndex` → `HXWorkspaceIndex`
   - `src/web/doctor-service.ts`: `runGSDDoctor` → `runHXDoctor` (in string literals — these are dynamic import call references)
   - `src/web/recovery-diagnostics-service.ts`: `runGSDDoctor` → `runHXDoctor` (in string literal)
   - `src/web/cli-entry.ts`: `GsdCliEntry` → `HxCliEntry`, `ResolveGsdCliEntryOptions` → `ResolveHxCliEntryOptions`, `resolveGsdCliEntry` → `resolveHxCliEntry`
   - `web/lib/hx-workspace-store.tsx`: `GSDWorkspaceStore` → `HXWorkspaceStore`, `GSDWorkspaceProvider` → `HXWorkspaceProvider`, `useGSDWorkspaceState` → `useHXWorkspaceState`, `useGSDWorkspaceActions` → `useHXWorkspaceActions`
   - `web/lib/workflow-action-execution.ts`: `GSDViewName` → `HXViewName`, `navigateToGSDView` → `navigateToHXView`
   - `web/lib/browser-slash-command-dispatch.ts`: `dispatchGSDSubcommand` → `dispatchHXSubcommand`
   - `web/lib/project-store-manager.tsx`: `GSDWorkspaceStore` → `HXWorkspaceStore`
   - `web/lib/pty-manager.ts`: `__gsd_pty_sessions__` → `__hx_pty_sessions__`, `__gsd_pty_cleanup_installed__` → `__hx_pty_cleanup_installed__`
   - `web/lib/initial-hx-header-filter.ts`: `InitialGsdHeaderFilterResult` → `InitialHxHeaderFilterResult`, `filterInitialGsdHeader` → `filterInitialHxHeader`
   - `web/app/page.tsx`: `GSDAppShell` → `HXAppShell`
   - `web/app/api/files/route.ts`: `getGsdRoot` → `getHxRoot`
   - `web/app/api/terminal/sessions/route.ts`: `__gsd_pty_next_index__` → `__hx_pty_next_index__`
   - `web/components/hx/chat-mode.tsx`: `GSDActionDef` → `HXActionDef`, `GSD_ACTIONS` → `HX_ACTIONS`

2. Rename gsd-prefixed variables in **outer src/ files**:
   - `src/headless-query.ts`: `gsdExtensionPath` → `hxExtensionPath`, `GSDState` → `HXState`
   - `src/headless-ui.ts`: `summarizeGsdTool` → `summarizeHxTool`
   - `src/resource-loader.ts`: `gsdNodeModules` → `hxNodeModules`

3. Rename in **packages/** files:
   - `packages/native/src/native.ts`: `batchParseGsdFiles` type reference → `batchParseHxFiles` (this is the TS type declaration for the native function — the actual native binary rename is S04)
   - NOTE: `packages/native/src/native.ts` also has `gsd_engine` file path strings — those are S04 scope (binary artifact names). Only rename the TS-side type name `batchParseGsdFiles` in the interface.
   - `packages/daemon/src/discord-bot.ts`: `handleGsdStart` → `handleHxStart`, `handleGsdStop` → `handleHxStop`

4. Rename in **test files** (both `src/resources/extensions/hx/tests/` and `src/tests/`):
   - All test files that import/reference GSD* types or gsd* variables — batch sed across all test files
   - Key files: `src/tests/app-smoke.test.ts` (runGSDDoctor references), `src/tests/integration/web-diagnostics-contract.test.ts` (GSDWorkspaceStore), `src/tests/integration/web-command-parity-contract.test.ts` (EXPECTED_GSD_OUTCOMES, gsdSurfaces, gsdExtension), `src/tests/integration/web-state-surfaces-contract.test.ts` (makeGsdFixture, gsdDir), `src/tests/integration/web-workflow-action-execution.test.ts` (navigateToGSDView), `src/tests/initial-gsd-header-filter.test.ts` (filterInitialGsdHeader), `src/tests/integration/web-cli-entry.test.ts` (resolveGsdCliEntry), `src/tests/integration/web-project-discovery-contract.test.ts` (hasGsdFolder)
   - `tests/smoke/test-init.ts`: `gsdDir` → `hxDir`
   - `tests/live-regression/run.ts`: `gsdDir` → `hxDir`
   - All ~70 test files in `src/resources/extensions/hx/tests/` that reference GSD types or gsd variables

5. Rename in **vscode-extension/** files:
   - `vscode-extension/src/extension.ts`: `GsdSidebarProvider` → `HxSidebarProvider`, `GsdFileDecorationProvider` → `HxFileDecorationProvider`, `GsdBashTerminal` → `HxBashTerminal`, `GsdSessionTreeProvider` → `HxSessionTreeProvider`, `GsdConversationHistoryPanel` → `HxConversationHistoryPanel`, `GsdSlashCompletionProvider` → `HxSlashCompletionProvider`, `GsdCodeLensProvider` → `HxCodeLensProvider`, `GsdActivityFeedProvider` → `HxActivityFeedProvider`
   - Each individual vscode-extension/src/*.ts file that exports a Gsd*-named class: rename the class definition

6. Verify with grep that no GSD/Gsd/gsd references remain outside migrate-gsd-to-hx.ts (excluding gsd_engine binary names in packages/native which are S04 scope).

## Must-Haves

- All GSD* type references updated in consumer files to match T01 definitions
- All gsd-prefixed local variables renamed to hx in test files and outer source files
- GSDWorkspaceStore → HXWorkspaceStore in hx-workspace-store.tsx and all ~28 downstream usages
- vscode-extension class names renamed from Gsd* to Hx*
- migrate-gsd-to-hx.ts NOT touched
- String literals `gsd_engine` in packages/native NOT touched (S04 scope)
  - Estimate: 45m
  - Files: src/web/bridge-service.ts, src/web/doctor-service.ts, src/web/recovery-diagnostics-service.ts, src/web/cli-entry.ts, web/lib/hx-workspace-store.tsx, web/lib/workflow-action-execution.ts, web/lib/browser-slash-command-dispatch.ts, web/lib/project-store-manager.tsx, web/lib/pty-manager.ts, web/lib/initial-hx-header-filter.ts, web/app/page.tsx, web/app/api/files/route.ts, web/app/api/terminal/sessions/route.ts, web/components/hx/chat-mode.tsx, src/headless-query.ts, src/headless-ui.ts, src/resource-loader.ts, packages/daemon/src/discord-bot.ts, packages/native/src/native.ts, vscode-extension/src/extension.ts, vscode-extension/src/sidebar.ts, vscode-extension/src/bash-terminal.ts, vscode-extension/src/session-tree.ts, vscode-extension/src/conversation-history.ts, vscode-extension/src/slash-completion.ts, vscode-extension/src/code-lens.ts, vscode-extension/src/activity-feed.ts, vscode-extension/src/file-decorations.ts, src/tests/app-smoke.test.ts, src/tests/integration/web-diagnostics-contract.test.ts, src/tests/integration/web-command-parity-contract.test.ts, src/tests/integration/web-state-surfaces-contract.test.ts, src/tests/integration/web-workflow-action-execution.test.ts, src/tests/initial-gsd-header-filter.test.ts, src/tests/integration/web-cli-entry.test.ts, src/tests/integration/web-project-discovery-contract.test.ts, tests/smoke/test-init.ts, tests/live-regression/run.ts
  - Verify: grep -rn 'GSD[A-Za-z]\|Gsd[A-Z]\|gsdDir\|gsdHome\|gsdPath\|gsdState\|gsdExtensionPath\|gsdNodeModules\|gsdSurfaces\|EXPECTED_GSD\|makeGsd\|dispatchGSD\|navigateToGSD\|__gsd_pty\|summarizeGsd\|filterInitialGsd\|resolveGsd\|getGsdHome\|getGsdRoot\|handleGsd\|GSDAction' --include='*.ts' --include='*.tsx' . | grep -v node_modules | grep -v dist | grep -v .next | grep -v migrate-gsd-to-hx | grep -v '.hx/' | grep -v 'gsd_engine' | grep -v 'native\.scanGsdTree\|native\.batchParseGsdFiles\|mod\.batchParseGsdFiles' | wc -l  # must be 0
- [x] **T03: Fixed two missed gsd* variable renames, confirmed all pre-existing type errors resolved by T02, and verified typecheck:extensions exits 0 with zero GSD identifier hits** — Fix the 8 pre-existing TypeScript errors that exist before any rename work, then run the full typecheck and grep verification to prove S01 is complete.

## Steps

1. Fix `src/resources/extensions/hx/tests/update-command.test.ts`:
   - The file declares `const hx = pi.commands.get("hx")` but then references `hxCmd` (undefined). At lines 37, 49, 57: change `const hx =` to `const hxCmd =`.

2. Fix `src/resources/extensions/hx/tests/autocomplete-regressions-1675.test.ts`:
   - Same pattern: `const hx = pi.commands.get("hx")` then uses `hxCmd`. Change `const hx =` to `const hxCmd =` at the declaration site (around line 38).

3. Fix `src/resources/extensions/hx/tests/integration/doctor-enhancements.test.ts`:
   - Line 217: `timing.gsdState` should be `timing.hxState` (the type was already renamed in a prior partial rename, but the test wasn't updated). After T01's rename this should reference `hxState`.
   - NOTE: T01/T02 batch sed may have already changed this. Verify and fix only if still broken.

4. Run `npm run typecheck:extensions` — must return 0 errors.

5. Run final comprehensive grep to prove zero GSD references remain (excluding allowed exceptions):
   ```bash
   grep -rn 'GSD[A-Za-z]\|Gsd[A-Z]\|gsd[A-Z]' --include='*.ts' --include='*.tsx' . | grep -v node_modules | grep -v dist | grep -v .next | grep -v migrate-gsd-to-hx | grep -v '.hx/' | grep -v 'gsd_engine' | grep -v 'native\.scanGsdTree\|native\.batchParseGsdFiles\|mod\.batchParseGsdFiles'
   ```
   Expected: 0 hits.

6. Verify migrate-gsd-to-hx.ts is unchanged:
   ```bash
   git diff src/resources/extensions/hx/migrate-gsd-to-hx.ts
   ```
   Expected: no output (no changes).

## Must-Haves

- All 8 pre-existing type errors fixed
- `npm run typecheck:extensions` passes with 0 errors
- Zero GSD/Gsd/gsd references remain in .ts/.tsx files (excluding migration code and native binary names)
- migrate-gsd-to-hx.ts confirmed unchanged
  - Estimate: 20m
  - Files: src/resources/extensions/hx/tests/update-command.test.ts, src/resources/extensions/hx/tests/autocomplete-regressions-1675.test.ts, src/resources/extensions/hx/tests/integration/doctor-enhancements.test.ts
  - Verify: npm run typecheck:extensions 2>&1 | tail -5  # must show no errors; exit code 0
