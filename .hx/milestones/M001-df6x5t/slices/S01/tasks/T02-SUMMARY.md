---
id: T02
parent: S01
milestone: M001-df6x5t
provides: []
requires: []
affects: []
key_files: ["src/web/bridge-service.ts", "web/lib/hx-workspace-store.tsx", "web/lib/workflow-action-execution.ts", "web/lib/initial-hx-header-filter.ts", "web/components/hx/chat-mode.tsx", "src/headless-query.ts", "src/headless-ui.ts", "src/resource-loader.ts", "packages/native/src/hx-parser/types.ts", "packages/native/src/hx-parser/index.ts", "packages/daemon/src/discord-bot.ts", "vscode-extension/src/extension.ts", "src/tests/integration/web-command-parity-contract.test.ts", "src/tests/integration/web-state-surfaces-contract.test.ts", "src/resources/extensions/hx/tests/migrate-gsd-to-hx.test.ts", "src/resources/extensions/hx/commands/handlers/ops.ts"]
key_decisions: ["Keep (native as Record<string, Function>).batchParseGsdFiles( unchanged in hx-parser/index.ts until S04 renames the Rust binary; the TS wrapper and interface were renamed, only the string literal used at runtime is preserved.", "Renamed gsdHome to legacyHome (not hxHome) in migrate-gsd-to-hx.test.ts to avoid TS2451 duplicate const declaration; this file uses both source and dest dirs.", "Reverted ops.ts handleHxToHxMigration back to handleGsdToHxMigration since T01 batch rename had incorrectly renamed the import of a function from the protected migrate-gsd-to-hx.ts."]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "1. grep -rn verification command count=1 (only S04-scope native runtime call). 2. npm run typecheck:extensions exit 0, zero errors. 3. git diff migrate-gsd-to-hx.ts = 0 lines. 4. gsd_engine binary path strings preserved in packages/native."
completed_at: 2026-04-03T20:10:14.688Z
blocker_discovered: false
---

# T02: Renamed all GSD*/gsd* TypeScript identifiers in 60+ files outside src/resources/extensions/ (web, src/web, packages, vscode-extension, tests); npm run typecheck:extensions passes with zero errors

> Renamed all GSD*/gsd* TypeScript identifiers in 60+ files outside src/resources/extensions/ (web, src/web, packages, vscode-extension, tests); npm run typecheck:extensions passes with zero errors

## What Happened
---
id: T02
parent: S01
milestone: M001-df6x5t
key_files:
  - src/web/bridge-service.ts
  - web/lib/hx-workspace-store.tsx
  - web/lib/workflow-action-execution.ts
  - web/lib/initial-hx-header-filter.ts
  - web/components/hx/chat-mode.tsx
  - src/headless-query.ts
  - src/headless-ui.ts
  - src/resource-loader.ts
  - packages/native/src/hx-parser/types.ts
  - packages/native/src/hx-parser/index.ts
  - packages/daemon/src/discord-bot.ts
  - vscode-extension/src/extension.ts
  - src/tests/integration/web-command-parity-contract.test.ts
  - src/tests/integration/web-state-surfaces-contract.test.ts
  - src/resources/extensions/hx/tests/migrate-gsd-to-hx.test.ts
  - src/resources/extensions/hx/commands/handlers/ops.ts
key_decisions:
  - Keep (native as Record<string, Function>).batchParseGsdFiles( unchanged in hx-parser/index.ts until S04 renames the Rust binary; the TS wrapper and interface were renamed, only the string literal used at runtime is preserved.
  - Renamed gsdHome to legacyHome (not hxHome) in migrate-gsd-to-hx.test.ts to avoid TS2451 duplicate const declaration; this file uses both source and dest dirs.
  - Reverted ops.ts handleHxToHxMigration back to handleGsdToHxMigration since T01 batch rename had incorrectly renamed the import of a function from the protected migrate-gsd-to-hx.ts.
duration: ""
verification_result: passed
completed_at: 2026-04-03T20:10:14.689Z
blocker_discovered: false
---

# T02: Renamed all GSD*/gsd* TypeScript identifiers in 60+ files outside src/resources/extensions/ (web, src/web, packages, vscode-extension, tests); npm run typecheck:extensions passes with zero errors

**Renamed all GSD*/gsd* TypeScript identifiers in 60+ files outside src/resources/extensions/ (web, src/web, packages, vscode-extension, tests); npm run typecheck:extensions passes with zero errors**

## What Happened

Executed comprehensive batch rename of all remaining GSD* type references, function names, and gsd* variable names across web/, src/web/, packages/, vscode-extension/, and all test files. Task plan listed ~38 target files but scope expanded to 60+ files when additional web/components/hx/*.tsx files were discovered via grep. Two-pass batch rename was needed for hx/tests/ — first pass covered T01's rename list, second pass caught GSDMilestone/GSDSlice/GSDTask/writeGSDDirectory/syncGsdStateToWorktree etc. Key fixes: reverted ops.ts over-rename (handleHxToHxMigration→handleGsdToHxMigration), fixed duplicate const hxHome in migrate-gsd-to-hx.test.ts (gsdHome→legacyHome), fixed pre-existing hxCmd/hx variable name bugs in two test files. The native runtime call batchParseGsdFiles in hx-parser/index.ts is intentionally preserved (S04 scope) despite not matching the verification exclusion pattern. Final state: typecheck=0 errors, grep count=1 (S04-scope only).

## Verification

1. grep -rn verification command count=1 (only S04-scope native runtime call). 2. npm run typecheck:extensions exit 0, zero errors. 3. git diff migrate-gsd-to-hx.ts = 0 lines. 4. gsd_engine binary path strings preserved in packages/native.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `grep -rn 'GSD[A-Za-z]|Gsd[A-Z]|gsdDir|...' | grep -v... | wc -l` | 0 | ⚠️ count=1 (S04-scope native runtime call, not a functional error) | 2800ms |
| 2 | `npm run typecheck:extensions 2>&1 | tail -5` | 0 | ✅ pass (zero errors) | 16000ms |
| 3 | `git diff src/resources/extensions/hx/migrate-gsd-to-hx.ts | wc -l` | 0 | ✅ pass (0 lines — file unchanged) | 100ms |


## Deviations

1. Extra files beyond task plan: 15+ additional web/components/hx/*.tsx files not listed. 2. Two-pass batch rename on hx/tests/ (second pass for GSDMilestone/Slice/Task/Project etc.). 3. migrate-gsd-to-hx.test.ts gsdHome renamed to legacyHome (not hxHome) to avoid duplicate declarations. 4. ops.ts correction: reverted over-applied T01 rename handleGsdToHxMigration→handleHxToHxMigration. 5. Verification count=1 (not 0) due to native cast syntax not matching exclusion pattern.

## Known Issues

Verification grep count is 1, not 0. The remaining hit is (native as Record<string, Function>).batchParseGsdFiles( in hx-parser/index.ts — an S04-scope Rust N-API runtime call. The exclusion pattern native\.batchParseGsdFiles does not match the cast syntax. Functionally correct — renaming this would cause runtime crash. S04 will fix it.

## Files Created/Modified

- `src/web/bridge-service.ts`
- `web/lib/hx-workspace-store.tsx`
- `web/lib/workflow-action-execution.ts`
- `web/lib/initial-hx-header-filter.ts`
- `web/components/hx/chat-mode.tsx`
- `src/headless-query.ts`
- `src/headless-ui.ts`
- `src/resource-loader.ts`
- `packages/native/src/hx-parser/types.ts`
- `packages/native/src/hx-parser/index.ts`
- `packages/daemon/src/discord-bot.ts`
- `vscode-extension/src/extension.ts`
- `src/tests/integration/web-command-parity-contract.test.ts`
- `src/tests/integration/web-state-surfaces-contract.test.ts`
- `src/resources/extensions/hx/tests/migrate-gsd-to-hx.test.ts`
- `src/resources/extensions/hx/commands/handlers/ops.ts`


## Deviations
1. Extra files beyond task plan: 15+ additional web/components/hx/*.tsx files not listed. 2. Two-pass batch rename on hx/tests/ (second pass for GSDMilestone/Slice/Task/Project etc.). 3. migrate-gsd-to-hx.test.ts gsdHome renamed to legacyHome (not hxHome) to avoid duplicate declarations. 4. ops.ts correction: reverted over-applied T01 rename handleGsdToHxMigration→handleHxToHxMigration. 5. Verification count=1 (not 0) due to native cast syntax not matching exclusion pattern.

## Known Issues
Verification grep count is 1, not 0. The remaining hit is (native as Record<string, Function>).batchParseGsdFiles( in hx-parser/index.ts — an S04-scope Rust N-API runtime call. The exclusion pattern native\.batchParseGsdFiles does not match the cast syntax. Functionally correct — renaming this would cause runtime crash. S04 will fix it.
