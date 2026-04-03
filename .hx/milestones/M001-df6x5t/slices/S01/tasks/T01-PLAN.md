---
estimated_steps: 62
estimated_files: 36
skills_used: []
---

# T01: Rename GSD type/class/function definitions and all references in core extension source files

Batch-rename all GSD* type names, interface names, class names, function names, and gsd* variable names in the core extension source files (src/resources/extensions/hx/**/*.ts non-test, plus neighbor extensions cmux, ttsr, subagent, search-the-web, remote-questions). This is the bulk of the work — renaming the definitions where names are declared and all their same-directory consumers.

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

## Inputs

- ``src/resources/extensions/hx/types.ts` — declares GSDState`
- ``src/resources/extensions/hx/preferences-types.ts` — declares GSDPreferences, GSDSkillRule, GSDPhaseModelConfig, GSDModelConfig, GSDModelConfigV2, LoadedGSDPreferences`
- ``src/resources/extensions/hx/migrate/types.ts` — declares GSDProject, GSDMilestone, GSDSlice, GSDTask, GSDRequirement, GSDSliceSummaryData, GSDTaskSummaryData, GSDBoundaryEntry`
- ``src/resources/extensions/hx/doctor.ts` — declares runGSDDoctor`
- ``src/resources/extensions/hx/commands.ts` — re-exports registerGSDCommand, handleGSDCommand`
- ``src/resources/extensions/hx/commands/index.ts` — declares registerGSDCommand`
- ``src/resources/extensions/hx/commands/dispatcher.ts` — declares handleGSDCommand`
- ``src/resources/extensions/hx/commands-bootstrap.ts` — declares registerLazyGSDCommand`
- ``src/resources/extensions/hx/dashboard-overlay.ts` — declares GSDDashboardOverlay`
- ``src/resources/extensions/hx/visualizer-overlay.ts` — declares GSDVisualizerOverlay`
- ``src/resources/extensions/hx/workspace-index.ts` — declares GSDWorkspaceIndex`
- ``src/resources/extensions/hx/native-parser-bridge.ts` — declares GsdTreeEntry, nativeScanGsdTree, nativeBatchParseGsdFiles`
- ``src/resources/extensions/hx/migrate/writer.ts` — declares writeGSDDirectory`
- ``src/resources/extensions/hx/migrate/transformer.ts` — declares transformToGSD`
- ``src/resources/extensions/hx/worktree-manager.ts` — declares getWorktreeGSDDiff, diffWorktreeGSD`

## Expected Output

- ``src/resources/extensions/hx/types.ts` — HXState replaces GSDState`
- ``src/resources/extensions/hx/preferences-types.ts` — all 6 GSD* types renamed to HX*`
- ``src/resources/extensions/hx/migrate/types.ts` — all 8 GSD* types renamed to HX*`
- ``src/resources/extensions/hx/doctor.ts` — runHXDoctor replaces runGSDDoctor`
- ``src/resources/extensions/hx/commands.ts` — registerHXCommand, handleHXCommand`
- ``src/resources/extensions/hx/commands-bootstrap.ts` — registerLazyHXCommand`
- ``src/resources/extensions/hx/dashboard-overlay.ts` — HXDashboardOverlay`
- ``src/resources/extensions/hx/visualizer-overlay.ts` — HXVisualizerOverlay`
- ``src/resources/extensions/hx/native-parser-bridge.ts` — HxTreeEntry, nativeScanHxTree, nativeBatchParseHxFiles (native.* calls unchanged)`
- ``src/resources/extensions/hx/workspace-index.ts` — HXWorkspaceIndex`
- ``src/resources/extensions/hx/migrate/writer.ts` — writeHXDirectory`
- ``src/resources/extensions/hx/migrate/transformer.ts` — transformToHX`
- ``src/resources/extensions/hx/worktree-manager.ts` — getWorktreeHXDiff, diffWorktreeHX`
- ``src/resources/extensions/hx/paths.ts` — hxDir replaces gsdDir`
- ``src/resources/extensions/hx/session-lock.ts` — hxDir, hxDirName`
- ``src/resources/extensions/hx/auto/loop.ts` — hxState replaces gsdState (local var)`
- ``src/resources/extensions/cmux/index.ts` — HXPreferences, HXState`
- ``src/resources/extensions/ttsr/rule-loader.ts` — hxHome`
- ``src/resources/extensions/subagent/isolation.ts` — hxHome`
- ``src/resources/extensions/remote-questions/status.ts` — getHxHome`
- ``src/resources/extensions/remote-questions/store.ts` — getHxHome`

## Verification

grep -rn 'GSD[A-Za-z]\|Gsd[A-Z]\|gsdDir\|gsdHome\|gsdPath\|gsdDbPath\|gsdState\|gsdBinPath\|gsdDirPath\|gsdDirName\|gsdMarker\|gsdIdx' --include='*.ts' src/resources/extensions/ | grep -v migrate-gsd-to-hx | grep -v '/tests/' | grep -v node_modules | grep -v 'native\.scanGsdTree\|native\.batchParseGsdFiles\|mod\.batchParseGsdFiles' | wc -l  # must be 0
