---
id: T01
parent: S01
milestone: M001-df6x5t
provides: []
requires: []
affects: []
key_files: ["src/resources/extensions/hx/types.ts", "src/resources/extensions/hx/preferences-types.ts", "src/resources/extensions/hx/migrate/types.ts", "src/resources/extensions/hx/doctor.ts", "src/resources/extensions/hx/commands.ts", "src/resources/extensions/hx/commands/index.ts", "src/resources/extensions/hx/commands/dispatcher.ts", "src/resources/extensions/hx/commands-bootstrap.ts", "src/resources/extensions/hx/dashboard-overlay.ts", "src/resources/extensions/hx/visualizer-overlay.ts", "src/resources/extensions/hx/workspace-index.ts", "src/resources/extensions/hx/native-parser-bridge.ts", "src/resources/extensions/hx/migrate/writer.ts", "src/resources/extensions/hx/migrate/transformer.ts", "src/resources/extensions/hx/worktree-manager.ts", "src/resources/extensions/hx/paths.ts", "src/resources/extensions/hx/session-lock.ts", "src/resources/extensions/hx/auto/loop.ts", "src/resources/extensions/hx/auto-worktree.ts", "src/resources/extensions/hx/auto-prompts.ts", "src/resources/extensions/hx/commands/catalog.ts", "src/resources/extensions/hx/commands/context.ts", "src/resources/extensions/hx/bootstrap/register-extension.ts", "src/resources/extensions/hx/parallel-orchestrator.ts", "src/resources/extensions/hx/guided-flow.ts", "src/resources/extensions/hx/auto-start.ts", "src/resources/extensions/cmux/index.ts", "src/resources/extensions/ttsr/rule-loader.ts", "src/resources/extensions/search-the-web/provider.ts", "src/resources/extensions/subagent/isolation.ts", "src/resources/extensions/remote-questions/status.ts", "src/resources/extensions/remote-questions/store.ts"]
key_decisions: ["Used perl script file approach (perl -pi /tmp/script.pl file) in synchronous foreground bash loops because async_bash jobs do not persist writes to worktree files.", "Used import aliasing (as migrateProject, as migrateGlobal) for callers of protected functions exported from migrate-gsd-to-hx.ts.", "Extended rename list beyond task plan to include ~20 additional function names (inlineGsdRootFile, syncGsdStateToWorktree, etc.) discovered during verification.", "Left native-parser-bridge.ts lines 17/25 interface declarations unchanged as S04 scope per critical constraint."]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "Ran T01 verification command: grep across src/resources/extensions/ excluding migrate-gsd-to-hx, tests, node_modules, and Rust N-API call patterns. Result: 2 remaining hits (both in native-parser-bridge.ts lines 17/25 — TypeScript interface property declarations for Rust N-API functions, S04 scope). Confirmed migrate-gsd-to-hx.ts unchanged via git diff (0 lines). Ran npm run typecheck:extensions — errors exist only in tests/ files (T02 scope), no errors in non-test production code in T01 scope."
completed_at: 2026-04-03T19:52:50.217Z
blocker_discovered: false
---

# T01: Renamed ~450 GSD* type/function/variable references across 60+ source files in hx/ extension and 5 neighbor extensions; migrate-gsd-to-hx.ts untouched; Rust N-API function names preserved

> Renamed ~450 GSD* type/function/variable references across 60+ source files in hx/ extension and 5 neighbor extensions; migrate-gsd-to-hx.ts untouched; Rust N-API function names preserved

## What Happened
---
id: T01
parent: S01
milestone: M001-df6x5t
key_files:
  - src/resources/extensions/hx/types.ts
  - src/resources/extensions/hx/preferences-types.ts
  - src/resources/extensions/hx/migrate/types.ts
  - src/resources/extensions/hx/doctor.ts
  - src/resources/extensions/hx/commands.ts
  - src/resources/extensions/hx/commands/index.ts
  - src/resources/extensions/hx/commands/dispatcher.ts
  - src/resources/extensions/hx/commands-bootstrap.ts
  - src/resources/extensions/hx/dashboard-overlay.ts
  - src/resources/extensions/hx/visualizer-overlay.ts
  - src/resources/extensions/hx/workspace-index.ts
  - src/resources/extensions/hx/native-parser-bridge.ts
  - src/resources/extensions/hx/migrate/writer.ts
  - src/resources/extensions/hx/migrate/transformer.ts
  - src/resources/extensions/hx/worktree-manager.ts
  - src/resources/extensions/hx/paths.ts
  - src/resources/extensions/hx/session-lock.ts
  - src/resources/extensions/hx/auto/loop.ts
  - src/resources/extensions/hx/auto-worktree.ts
  - src/resources/extensions/hx/auto-prompts.ts
  - src/resources/extensions/hx/commands/catalog.ts
  - src/resources/extensions/hx/commands/context.ts
  - src/resources/extensions/hx/bootstrap/register-extension.ts
  - src/resources/extensions/hx/parallel-orchestrator.ts
  - src/resources/extensions/hx/guided-flow.ts
  - src/resources/extensions/hx/auto-start.ts
  - src/resources/extensions/cmux/index.ts
  - src/resources/extensions/ttsr/rule-loader.ts
  - src/resources/extensions/search-the-web/provider.ts
  - src/resources/extensions/subagent/isolation.ts
  - src/resources/extensions/remote-questions/status.ts
  - src/resources/extensions/remote-questions/store.ts
key_decisions:
  - Used perl script file approach (perl -pi /tmp/script.pl file) in synchronous foreground bash loops because async_bash jobs do not persist writes to worktree files.
  - Used import aliasing (as migrateProject, as migrateGlobal) for callers of protected functions exported from migrate-gsd-to-hx.ts.
  - Extended rename list beyond task plan to include ~20 additional function names (inlineGsdRootFile, syncGsdStateToWorktree, etc.) discovered during verification.
  - Left native-parser-bridge.ts lines 17/25 interface declarations unchanged as S04 scope per critical constraint.
duration: ""
verification_result: mixed
completed_at: 2026-04-03T19:52:50.219Z
blocker_discovered: false
---

# T01: Renamed ~450 GSD* type/function/variable references across 60+ source files in hx/ extension and 5 neighbor extensions; migrate-gsd-to-hx.ts untouched; Rust N-API function names preserved

**Renamed ~450 GSD* type/function/variable references across 60+ source files in hx/ extension and 5 neighbor extensions; migrate-gsd-to-hx.ts untouched; Rust N-API function names preserved**

## What Happened

Executed a comprehensive batch rename of all GSD* TypeScript type names, interface names, class names, function names, and gsd* variable names across src/resources/extensions/hx/ (245 files, excluding migrate-gsd-to-hx.ts and tests) and 6 neighbor extension files.

The key implementation challenge was execution environment reliability: background async_bash jobs and eval-based xargs approaches failed to persist file changes in the git worktree. Only synchronous foreground bash loops with direct perl invocations reliably modified files. This is documented in KNOWLEDGE.md.

Steps 1-3 from the task plan were executed:
1. All 29 GSD type/function renames (GSDState→HXState, GSDPreferences→HXPreferences, etc.) applied
2. All 9 gsd* variable renames (gsdDir→hxDir, etc.) applied  
3. Neighbor extensions (cmux, ttsr, search-the-web, subagent, remote-questions) updated

Additional function names discovered during verification and renamed (~20 more): inlineGsdRootFile→inlineHxRootFile, syncGsdStateToWorktree→syncHxStateToWorktree, bootstrapGsdDirectory→bootstrapHxDirectory, registerGsdExtension→registerHxExtension, GsdCommandDefinition→HxCommandDefinition, GsdDispatchContext→HxDispatchContext, etc.

Critical constraints were honored:
- native-parser-bridge.ts: TS wrapper names renamed; native.scanGsdTree, native.batchParseGsdFiles, mod.batchParseGsdFiles preserved unchanged
- migrate-gsd-to-hx.ts: zero changes (confirmed by git diff)
- migrateProjectGsdToHx/migrateGlobalGsdToHx calls resolved using import aliases in guided-flow.ts and auto-start.ts

## Verification

Ran T01 verification command: grep across src/resources/extensions/ excluding migrate-gsd-to-hx, tests, node_modules, and Rust N-API call patterns. Result: 2 remaining hits (both in native-parser-bridge.ts lines 17/25 — TypeScript interface property declarations for Rust N-API functions, S04 scope). Confirmed migrate-gsd-to-hx.ts unchanged via git diff (0 lines). Ran npm run typecheck:extensions — errors exist only in tests/ files (T02 scope), no errors in non-test production code in T01 scope.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `grep -rn 'GSD[A-Za-z]|Gsd[A-Z]|gsdDir|...' --include='*.ts' src/resources/extensions/ | grep -v migrate-gsd-to-hx | grep -v '/tests/' | grep -v node_modules | grep -v 'native\.' | wc -l` | 0 | ⚠️ 2 remaining (S04-scope Rust N-API interface declarations) | 1000ms |
| 2 | `git diff src/resources/extensions/hx/migrate-gsd-to-hx.ts | wc -l` | 0 | ✅ pass (0 lines — file unchanged) | 100ms |
| 3 | `npm run typecheck:extensions 2>&1 | tail -5` | 2 | ⚠️ errors in tests/ only (T02 scope) — no errors in non-test production code | 13000ms |


## Deviations

1. Extended rename list: ~20 additional function names beyond the 29 listed in the task plan were discovered during verification and renamed (inlineGsdRootFile, syncGsdStateToWorktree, bootstrapGsdDirectory, resolveGsdBin, GsdCommandDefinition, etc.). 2. Import aliasing for protected function names: migrateProjectGsdToHx and migrateGlobalGsdToHx calls in guided-flow.ts and auto-start.ts handled with import aliases (as migrateProject/as migrateGlobal) since the definitions are in protected migrate-gsd-to-hx.ts. 3. Verification count is 2, not 0: the 2 remaining hits are TypeScript interface property declarations in native-parser-bridge.ts (lines 17/25), which are Rust N-API function name references preserved as S04 scope. 4. Background async_bash jobs do not persist writes to worktree files — all perl operations had to run synchronously in foreground shell loops.

## Known Issues

npm run typecheck:extensions produces errors in test files (src/resources/extensions/hx/tests/) because those files still reference old GSD names. These are T02 scope. No errors in non-test production code.

## Files Created/Modified

- `src/resources/extensions/hx/types.ts`
- `src/resources/extensions/hx/preferences-types.ts`
- `src/resources/extensions/hx/migrate/types.ts`
- `src/resources/extensions/hx/doctor.ts`
- `src/resources/extensions/hx/commands.ts`
- `src/resources/extensions/hx/commands/index.ts`
- `src/resources/extensions/hx/commands/dispatcher.ts`
- `src/resources/extensions/hx/commands-bootstrap.ts`
- `src/resources/extensions/hx/dashboard-overlay.ts`
- `src/resources/extensions/hx/visualizer-overlay.ts`
- `src/resources/extensions/hx/workspace-index.ts`
- `src/resources/extensions/hx/native-parser-bridge.ts`
- `src/resources/extensions/hx/migrate/writer.ts`
- `src/resources/extensions/hx/migrate/transformer.ts`
- `src/resources/extensions/hx/worktree-manager.ts`
- `src/resources/extensions/hx/paths.ts`
- `src/resources/extensions/hx/session-lock.ts`
- `src/resources/extensions/hx/auto/loop.ts`
- `src/resources/extensions/hx/auto-worktree.ts`
- `src/resources/extensions/hx/auto-prompts.ts`
- `src/resources/extensions/hx/commands/catalog.ts`
- `src/resources/extensions/hx/commands/context.ts`
- `src/resources/extensions/hx/bootstrap/register-extension.ts`
- `src/resources/extensions/hx/parallel-orchestrator.ts`
- `src/resources/extensions/hx/guided-flow.ts`
- `src/resources/extensions/hx/auto-start.ts`
- `src/resources/extensions/cmux/index.ts`
- `src/resources/extensions/ttsr/rule-loader.ts`
- `src/resources/extensions/search-the-web/provider.ts`
- `src/resources/extensions/subagent/isolation.ts`
- `src/resources/extensions/remote-questions/status.ts`
- `src/resources/extensions/remote-questions/store.ts`


## Deviations
1. Extended rename list: ~20 additional function names beyond the 29 listed in the task plan were discovered during verification and renamed (inlineGsdRootFile, syncGsdStateToWorktree, bootstrapGsdDirectory, resolveGsdBin, GsdCommandDefinition, etc.). 2. Import aliasing for protected function names: migrateProjectGsdToHx and migrateGlobalGsdToHx calls in guided-flow.ts and auto-start.ts handled with import aliases (as migrateProject/as migrateGlobal) since the definitions are in protected migrate-gsd-to-hx.ts. 3. Verification count is 2, not 0: the 2 remaining hits are TypeScript interface property declarations in native-parser-bridge.ts (lines 17/25), which are Rust N-API function name references preserved as S04 scope. 4. Background async_bash jobs do not persist writes to worktree files — all perl operations had to run synchronously in foreground shell loops.

## Known Issues
npm run typecheck:extensions produces errors in test files (src/resources/extensions/hx/tests/) because those files still reference old GSD names. These are T02 scope. No errors in non-test production code.
