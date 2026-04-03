---
id: T01
parent: S04
milestone: M001-df6x5t
provides: []
requires: []
affects: []
key_files: ["native/crates/engine/src/hx_parser.rs", "native/crates/engine/src/lib.rs", "native/npm/darwin-arm64/package.json", "native/npm/darwin-x64/package.json", "native/npm/linux-x64-gnu/package.json", "native/npm/linux-arm64-gnu/package.json", "native/npm/win32-x64-msvc/package.json", "src/resources/extensions/hx/native-parser-bridge.ts", "packages/native/src/hx-parser/index.ts", "packages/native/src/native.ts"]
key_decisions: ["Used sed for bulk Rust identifier renames after Edit tool missed duplicate struct definitions", "Kept @hx-build npm scope — native.ts already used this scope from S01 partial work"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "Ran grep -rn for gsd/GSD/Gsd in native/crates/engine/src/ (0 hits), native/npm/ (0 hits), and all 3 TS bridge files (0 hits). npm run typecheck:extensions exited 0 in 11.6s."
completed_at: 2026-04-03T21:19:09.996Z
blocker_discovered: false
---

# T01: Renamed gsd_parser.rs → hx_parser.rs, updated all 11 Rust GSD identifiers, 5 platform npm packages to @hx-build/hx_engine scope, and cleared S01 carve-outs in 3 TypeScript bridge files

> Renamed gsd_parser.rs → hx_parser.rs, updated all 11 Rust GSD identifiers, 5 platform npm packages to @hx-build/hx_engine scope, and cleared S01 carve-outs in 3 TypeScript bridge files

## What Happened
---
id: T01
parent: S04
milestone: M001-df6x5t
key_files:
  - native/crates/engine/src/hx_parser.rs
  - native/crates/engine/src/lib.rs
  - native/npm/darwin-arm64/package.json
  - native/npm/darwin-x64/package.json
  - native/npm/linux-x64-gnu/package.json
  - native/npm/linux-arm64-gnu/package.json
  - native/npm/win32-x64-msvc/package.json
  - src/resources/extensions/hx/native-parser-bridge.ts
  - packages/native/src/hx-parser/index.ts
  - packages/native/src/native.ts
key_decisions:
  - Used sed for bulk Rust identifier renames after Edit tool missed duplicate struct definitions
  - Kept @hx-build npm scope — native.ts already used this scope from S01 partial work
duration: ""
verification_result: passed
completed_at: 2026-04-03T21:19:09.997Z
blocker_discovered: false
---

# T01: Renamed gsd_parser.rs → hx_parser.rs, updated all 11 Rust GSD identifiers, 5 platform npm packages to @hx-build/hx_engine scope, and cleared S01 carve-outs in 3 TypeScript bridge files

**Renamed gsd_parser.rs → hx_parser.rs, updated all 11 Rust GSD identifiers, 5 platform npm packages to @hx-build/hx_engine scope, and cleared S01 carve-outs in 3 TypeScript bridge files**

## What Happened

Renamed native/crates/engine/src/gsd_parser.rs to hx_parser.rs via git mv, updated lib.rs mod declaration, replaced all 11 GSD Rust identifiers in hx_parser.rs using sed (Edit tool missed duplicate struct tokens), wrote all 5 platform npm package.json files with @hx-build scope and hx_engine.node binary names, and applied targeted sed replacements to native-parser-bridge.ts (5 hits), hx-parser/index.ts (1 hit), and native.ts (6 hits). All four slice verification checks pass.

## Verification

Ran grep -rn for gsd/GSD/Gsd in native/crates/engine/src/ (0 hits), native/npm/ (0 hits), and all 3 TS bridge files (0 hits). npm run typecheck:extensions exited 0 in 11.6s.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `grep -rn 'gsd|GSD|Gsd' native/crates/engine/src/ | wc -l` | 0 | ✅ pass | 50ms |
| 2 | `grep -rn 'gsd|GSD|Gsd' native/npm/ | wc -l` | 0 | ✅ pass | 30ms |
| 3 | `grep -n 'gsd|GSD|Gsd' native-parser-bridge.ts hx-parser/index.ts native.ts | wc -l` | 0 | ✅ pass | 20ms |
| 4 | `npm run typecheck:extensions` | 0 | ✅ pass | 11600ms |


## Deviations

Switched from Edit-tool surgical replacement to sed -i '' for Rust identifier renames — Edit tool missed tokens appearing in multiple struct/Vec contexts. Sed cleared all 11 occurrences cleanly.

## Known Issues

None.

## Files Created/Modified

- `native/crates/engine/src/hx_parser.rs`
- `native/crates/engine/src/lib.rs`
- `native/npm/darwin-arm64/package.json`
- `native/npm/darwin-x64/package.json`
- `native/npm/linux-x64-gnu/package.json`
- `native/npm/linux-arm64-gnu/package.json`
- `native/npm/win32-x64-msvc/package.json`
- `src/resources/extensions/hx/native-parser-bridge.ts`
- `packages/native/src/hx-parser/index.ts`
- `packages/native/src/native.ts`


## Deviations
Switched from Edit-tool surgical replacement to sed -i '' for Rust identifier renames — Edit tool missed tokens appearing in multiple struct/Vec contexts. Sed cleared all 11 occurrences cleanly.

## Known Issues
None.
