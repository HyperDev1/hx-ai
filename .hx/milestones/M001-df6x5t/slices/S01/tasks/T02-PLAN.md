---
estimated_steps: 42
estimated_files: 38
skills_used: []
---

# T02: Rename GSD references in web, test, packages, and outer source files

Rename all remaining GSD type references, function references, and gsd-prefixed variable names in files outside `src/resources/extensions/` — this covers web/, tests/, packages/, vscode-extension/, src/web/, src/headless-*.ts, src/resource-loader.ts, and all test files in src/resources/extensions/hx/tests/.

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

## Inputs

- ``src/resources/extensions/hx/types.ts` — T01 renamed GSDState → HXState here`
- ``src/resources/extensions/hx/preferences-types.ts` — T01 renamed GSD* types here`
- ``src/resources/extensions/hx/migrate/types.ts` — T01 renamed GSD* types here`
- ``src/resources/extensions/hx/doctor.ts` — T01 renamed runGSDDoctor → runHXDoctor here`
- ``src/resources/extensions/hx/workspace-index.ts` — T01 renamed GSDWorkspaceIndex → HXWorkspaceIndex here`
- ``src/resources/extensions/hx/commands.ts` — T01 renamed registerGSDCommand → registerHXCommand here`
- ``src/web/bridge-service.ts` — GSD* interface declarations to rename`
- ``web/lib/hx-workspace-store.tsx` — GSDWorkspaceStore class to rename`
- ``web/lib/workflow-action-execution.ts` — GSDViewName, navigateToGSDView to rename`
- ``src/headless-query.ts` — gsdExtensionPath variable to rename`
- ``vscode-extension/src/extension.ts` — Gsd* class imports to rename`

## Expected Output

- ``src/web/bridge-service.ts` — all 5 GSD* interfaces renamed to HX*`
- ``web/lib/hx-workspace-store.tsx` — HXWorkspaceStore, HXWorkspaceProvider, useHXWorkspaceState, useHXWorkspaceActions`
- ``web/lib/workflow-action-execution.ts` — HXViewName, navigateToHXView`
- ``web/lib/browser-slash-command-dispatch.ts` — dispatchHXSubcommand`
- ``web/lib/pty-manager.ts` — __hx_pty_sessions__, __hx_pty_cleanup_installed__`
- ``web/lib/initial-hx-header-filter.ts` — InitialHxHeaderFilterResult, filterInitialHxHeader`
- ``web/components/hx/chat-mode.tsx` — HXActionDef, HX_ACTIONS`
- ``src/headless-query.ts` — hxExtensionPath, HXState`
- ``src/headless-ui.ts` — summarizeHxTool`
- ``src/resource-loader.ts` — hxNodeModules`
- ``src/web/cli-entry.ts` — HxCliEntry, resolveHxCliEntry`
- ``vscode-extension/src/extension.ts` — all Gsd* → Hx* imports`
- ``src/tests/integration/web-command-parity-contract.test.ts` — EXPECTED_HX_OUTCOMES, hxSurfaces`
- ``src/tests/integration/web-state-surfaces-contract.test.ts` — makeHxFixture, hxDir`
- ``tests/smoke/test-init.ts` — hxDir`
- ``tests/live-regression/run.ts` — hxDir`

## Verification

grep -rn 'GSD[A-Za-z]\|Gsd[A-Z]\|gsdDir\|gsdHome\|gsdPath\|gsdState\|gsdExtensionPath\|gsdNodeModules\|gsdSurfaces\|EXPECTED_GSD\|makeGsd\|dispatchGSD\|navigateToGSD\|__gsd_pty\|summarizeGsd\|filterInitialGsd\|resolveGsd\|getGsdHome\|getGsdRoot\|handleGsd\|GSDAction' --include='*.ts' --include='*.tsx' . | grep -v node_modules | grep -v dist | grep -v .next | grep -v migrate-gsd-to-hx | grep -v '.hx/' | grep -v 'gsd_engine' | grep -v 'native\.scanGsdTree\|native\.batchParseGsdFiles\|mod\.batchParseGsdFiles' | wc -l  # must be 0
