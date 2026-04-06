# S01 Research — TypeScript Types & Internal Variables

**Date:** 2026-04-03
**Milestone:** M001-df6x5t (GSD → HX Complete Rename)
**Requirements addressed:** R001 (GSD* types → HX*), R005 (gsd* variables → hx*), R010 (typecheck passes)

---

## Summary

S01 owns the TypeScript layer: renaming all `GSD*` type/interface/class names to `HX*` equivalents, and renaming all `gsd*` internal variable names to `hx*`. The codebase currently has **684 total GSD-type references** across **117 files**. There are **8 pre-existing typecheck errors** that must be fixed as part of this slice. All GSD names are still present in source (no partial rename has been applied except `timing.hxState` in doctor-types/doctor.ts, which broke the test that still checks `timing.gsdState`).

The work is high-volume but mechanically straightforward: every change is a text substitution with no logic changes. TypeScript's strict type checking provides real-time feedback during the rename.

## Recommendation

Rename definition files first (sources of truth), then fan out to consumers. Use sed/in-place batch replacement organized by file group. Verify with `npm run typecheck:extensions` after each group. The 8 pre-existing type errors must be fixed as part of this slice before the slice can claim "typecheck passes."

Work in this order:
1. **Leaf type definitions** (no GSD imports): `types.ts`, `preferences-types.ts`, `migrate/types.ts`
2. **Re-exporters and function definitions**: `preferences.ts`, `doctor.ts`, `commands*.ts`, `migrate/writer.ts`, `migrate/transformer.ts`, `dashboard-overlay.ts`, `visualizer-overlay.ts`, `workspace-index.ts`, `native-parser-bridge.ts`, `worktree-manager.ts`
3. **Web bridge/store types**: `bridge-service.ts`, `hx-workspace-store.tsx`, `workflow-action-execution.ts`
4. **All consumers** (files that import GSD types): ~90 remaining files
5. **Fix pre-existing typecheck errors** (hxCmd undefined, gsdState→hxState)

## Implementation Landscape

### Type Definition Files (where names are declared)

| File | What to rename |
|------|----------------|
| `src/resources/extensions/hx/types.ts:236` | `GSDState` → `HXState` |
| `src/resources/extensions/hx/preferences-types.ts` | `GSDPreferences`, `GSDSkillRule`, `GSDPhaseModelConfig`, `GSDModelConfig`, `GSDModelConfigV2`, `LoadedGSDPreferences` → `HX*` |
| `src/resources/extensions/hx/migrate/types.ts` | `GSDProject`, `GSDMilestone`, `GSDSlice`, `GSDTask`, `GSDRequirement`, `GSDSliceSummaryData`, `GSDTaskSummaryData`, `GSDBoundaryEntry` → `HX*` |
| `src/resources/extensions/hx/dashboard-overlay.ts:50` | `class GSDDashboardOverlay` → `class HXDashboardOverlay` |
| `src/resources/extensions/hx/visualizer-overlay.ts:37` | `class GSDVisualizerOverlay` → `class HXVisualizerOverlay` |
| `src/resources/extensions/hx/workspace-index.ts:54` | `GSDWorkspaceIndex` → `HXWorkspaceIndex` |
| `src/resources/extensions/hx/native-parser-bridge.ts` | `GsdTreeEntry` → `HxTreeEntry`, `nativeScanGsdTree` → `nativeScanHxTree`, `nativeBatchParseGsdFiles` → `nativeBatchParseHxFiles`, also `scanGsdTree`/`batchParseGsdFiles` references to native module API |
| `src/web/bridge-service.ts` | `GSDWorkspaceTaskTarget`, `GSDWorkspaceSliceTarget`, `GSDWorkspaceMilestoneTarget`, `GSDWorkspaceScopeTarget`, `GSDWorkspaceIndex` → `HX*` |
| `web/lib/hx-workspace-store.tsx` | `GSDWorkspaceStore`, `GSDWorkspaceProvider`, `useGSDWorkspaceState`, `useGSDWorkspaceActions`, `GSDWorkspaceState`, `GSDWorkspaceActions` → `HX*` |
| `web/lib/workflow-action-execution.ts` | `GSDViewName` → `HXViewName`, `navigateToGSDView` → `navigateToHXView` |
| `web/components/hx/app-shell.tsx:540` | `GSDAppShell` → `HXAppShell` |

### Function Definition Files (GSD-named functions declared here)

| File | Functions to rename |
|------|-------------------|
| `src/resources/extensions/hx/doctor.ts:324` | `runGSDDoctor` → `runHXDoctor` |
| `src/resources/extensions/hx/commands.ts` | `registerGSDCommand` → `registerHXCommand`, `handleGSDCommand` → `handleHXCommand` |
| `src/resources/extensions/hx/commands/index.ts` | `registerGSDCommand` → `registerHXCommand` |
| `src/resources/extensions/hx/commands/dispatcher.ts` | `handleGSDCommand` → `handleHXCommand` |
| `src/resources/extensions/hx/commands-bootstrap.ts` | `registerLazyGSDCommand` → `registerLazyHXCommand`, `handleGSDCommand` → `handleHXCommand` |
| `src/resources/extensions/hx/bootstrap/register-extension.ts` | `registerGSDCommand` → `registerHXCommand` |
| `src/resources/extensions/hx/migrate/writer.ts:421` | `writeGSDDirectory` → `writeHXDirectory` |
| `src/resources/extensions/hx/migrate/index.ts` | `writeGSDDirectory` → `writeHXDirectory` export |
| `src/resources/extensions/hx/migrate/transformer.ts:294` | `transformToGSD` → `transformToHX` |
| `src/resources/extensions/hx/worktree-manager.ts` | `getWorktreeGSDDiff` → `getWorktreeHXDiff`, `diffWorktreeGSD` → `diffWorktreeHX` |
| `src/resources/extensions/hx/commands/handlers/core.ts` | references to `GSDDashboardOverlay`, `GSDVisualizerOverlay` |
| `src/resources/extensions/hx/bootstrap/register-shortcuts.ts` | import/use of `GSDDashboardOverlay` |
| `web/lib/browser-slash-command-dispatch.ts` | `dispatchGSDSubcommand` → `dispatchHXSubcommand` |

### Internal Variable Names to Rename

| Pattern | New name | Files |
|---------|---------|-------|
| `gsdExtensionPath` | `hxExtensionPath` | `src/headless-query.ts` |
| `gsdNodeModules` | `hxNodeModules` | `src/resource-loader.ts` |
| `gsdDir` (param/local var) | `hxDir` | `src/resources/extensions/hx/paths.ts`, `session-lock.ts`, `bootstrap/dynamic-tools.ts`, `auto-start.ts`, many tests, `tests/smoke/test-init.ts`, `tests/live-regression/run.ts` |
| `gsdDirPath` | `hxDirPath` | `src/resources/extensions/hx/auto-start.ts` |
| `gsdDirName` | `hxDirName` | `src/resources/extensions/hx/session-lock.ts` |
| `gsdBinPath` | `hxBinPath` | `src/resources/extensions/hx/bootstrap/register-hooks.ts` |
| `gsdState` (local var) | `hxState` | `src/resources/extensions/hx/auto/loop.ts` |
| `gsdMarker`, `gsdIdx` | `hxMarker`, `hxIdx` | `src/resources/extensions/hx/worktree.ts` |
| `gsdPath` (local var) | `hxPath` | `src/resources/extensions/hx/repo-identity.ts`, `migrate/command.ts`, `md-importer.ts` |
| `gsdHome` | `hxHome` | `src/resources/extensions/ttsr/rule-loader.ts`, `src/resources/extensions/subagent/isolation.ts`, `src/resources/extensions/search-the-web/provider.ts`, many tests |
| `gsdPrefix` | `hxPrefix` | `web/components/hx/files-view.tsx`, `web/components/hx/sidebar.tsx` |
| `gsdTree` (state var) | `hxTree` | `web/components/hx/files-view.tsx` |
| `__gsd_pty_sessions__` | `__hx_pty_sessions__` | `web/lib/pty-manager.ts` |
| `__gsd_pty_cleanup_installed__` | `__hx_pty_cleanup_installed__` | `web/lib/pty-manager.ts` |
| `gsdDbPath` | `hxDbPath` | `src/resources/extensions/hx/auto-start.ts`, tests |
| `EXPECTED_GSD_OUTCOMES`, `gsdSurfaces`, `makeGsdFixture`, `gsdExtension` | `EXPECTED_HX_OUTCOMES`, `hxSurfaces`, `makeHxFixture`, `hxExtension` | test files |

### Pre-existing Type Errors to Fix (part of this slice)

1. **`update-command.test.ts`** — declares `const hx = pi.commands.get("hx")` but then uses `hxCmd` (undefined). Fix: rename `hx` → `hxCmd` at the declaration site (lines 37, 49, 57).
2. **`autocomplete-regressions-1675.test.ts`** — same `hx` vs `hxCmd` pattern.
3. **`doctor-enhancements.test.ts:217`** — checks `timing.gsdState` but `DoctorReport.timing` now has `hxState`. Fix: update test to use `hxState`.

### Excluded File (DO NOT TOUCH)

- `src/resources/extensions/hx/migrate-gsd-to-hx.ts` — backward-compat migration code, must remain exactly as-is (R009)

### Build Order

1. **Rename the 5 leaf definition files** (`types.ts`, `preferences-types.ts`, `migrate/types.ts`, `doctor-types.ts` check, `workflow-action-execution.ts`) — these have no cross-GSD imports, so no cascade errors yet.
2. **Rename function/class definitions** and re-export files (doctor.ts, commands*.ts, dashboard-overlay.ts, visualizer-overlay.ts, workspace-index.ts, native-parser-bridge.ts, migrate/*, worktree-manager.ts, bridge-service.ts, hx-workspace-store.tsx, app-shell.tsx) — these import from the leaf files.
3. **Rename all consumer files** — these import from the definition files. Batch-process by running `npm run typecheck:extensions` after each group to catch misses.
4. **Fix the 8 pre-existing typecheck errors** (hxCmd, gsdState→hxState).
5. **Run final typecheck** — must return 0 errors.

### Key Non-Obvious Files

- `src/resources/extensions/hx/native-parser-bridge.ts` — bridges to Rust native module; `scanGsdTree` and `batchParseGsdFiles` are the **JS-side call names** that must match Rust exports. The Rust rename happens in S04. For S01, rename only the **TypeScript wrapper names** (`GsdTreeEntry` → `HxTreeEntry`, `nativeScanGsdTree` → `nativeScanHxTree`) while keeping the **native module method calls** (`native.scanGsdTree`, `native.batchParseGsdFiles`) unchanged until S04.
- `web/lib/hx-workspace-store.tsx` — huge file (5000+ lines), defines `GSDWorkspaceStore` class and related hooks. Class rename cascades into many web components.
- `src/resources/extensions/hx/migrate/transformer.ts:294` — `transformToGSD` is in the `migrate/` directory (not `migrate-gsd-to-hx.ts`), so it IS in scope for rename.
- `web/components/hx/chat-mode.tsx` — defines local interface `GSDActionDef` and constant `GSD_ACTIONS`; these are file-local, rename to `HXActionDef`/`HX_ACTIONS`.

### Verification Approach

```bash
# After S01 is complete:
npm run typecheck:extensions   # must return 0 errors

# Quick progress check during work:
grep -rn "GSD[A-Za-z]\|GsdTree" --type ts . | grep -v node_modules | grep -v dist | grep -v .next | grep -v migrate-gsd-to-hx | wc -l
# Should decrease toward 0 as work progresses
```

## Constraints

- `native-parser-bridge.ts` must keep `native.scanGsdTree` and `native.batchParseGsdFiles` call names intact until S04 renames the Rust exports. Only the TS wrapper names change in S01.
- `migrate-gsd-to-hx.ts` is completely off-limits.
- The `web/lib/hx-workspace-store.tsx` file is large (~5200 lines). Be careful with batch replacements — verify no unintended changes.
- Tests that assert on string literals like `"timing.gsdState"` (in doctor-enhancements) or function names must be updated too (R011 ultimately requires tests to pass).

## Common Pitfalls

- **Partial rename leaving mismatched import/export** — after renaming `GSDState` in `types.ts`, all files importing it must be updated in the same batch or tsc will fail immediately. Work definition-then-consumers.
- **chat-mode.tsx `GSDActionDef`** — this is a *local* (non-exported) interface. Still rename it to avoid grep hits.
- **`dispatchGSDSubcommand`** in `browser-slash-command-dispatch.ts` — a private function; rename to `dispatchHXSubcommand`.
- **`hx-workspace-store.tsx` exports `GSDWorkspaceStore` class** — this class name appears ~28 times across the codebase including tests. Rename the class AND update all 28 usages atomically.
- **`web-command-parity-contract.test.ts`** — uses `EXPECTED_GSD_OUTCOMES` constant and `gsdSurfaces`/`gsdExtension` local vars. These are in-scope for S01 variable rename.
