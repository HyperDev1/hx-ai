---
id: S04
parent: M001-df6x5t
milestone: M001-df6x5t
provides:
  - hx_parser.rs Rust source with all HX identifiers (batchParseHxFiles, scanHxTree, ParsedHxFile, HxTreeEntry)
  - hx_engine.*.node binary name in all 5 platform packages under @hx-build scope
  - native-parser-bridge.ts, hx-parser/index.ts, native.ts all using HX function names — S01 carve-outs cleared
  - All gsd-named files renamed to hx-* equivalents via git mv
requires:
  - slice: S01
    provides: HX type renames and carve-out TODOs in native bridge files that S04 cleared
affects:
  - S05
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
  - native/scripts/build.js
  - src/tests/initial-hx-header-filter.test.ts
  - src/tests/hx-web-launcher-contract.test.ts
  - scripts/recover-hx-1364.sh
  - scripts/recover-hx-1364.ps1
  - scripts/recover-hx-1668.sh
  - scripts/recover-hx-1668.ps1
  - src/resources/skills/create-skill/references/hx-skill-ecosystem.md
key_decisions:
  - Used sed -i '' for bulk Rust identifier renames — Edit tool missed tokens appearing in duplicate struct/Vec contexts at multiple lines
  - Kept @hx-build npm scope (not @hyperlab/engine-*) — native.ts already expected this scope from partial S01 work, changing would break the require path
  - PowerShell internal variable content ($gsdDir, $GsdIsSymlink) deferred to S05 — S04 only covers file renames per R008 scope
  - For-loop glob *.test.mjs preferred over explicit file list — caught 2 unexpected extra test files cleanly
patterns_established:
  - For Rust source with repeated token patterns (struct names used in Vec<T>, push(), parameter types), sed -i '' is more reliable than targeted Edit-tool replacements which can miss occurrences
  - When bulk-renaming binary path strings across many homogeneous test files, a shell for-loop with sed -i '' glob is both faster and more complete than per-file edits
  - File renames should use git mv (not cp+rm) to preserve history — critical for test and script files that may be referenced in git blame or bisect
observability_surfaces:
  - none
drill_down_paths:
  - .hx/milestones/M001-df6x5t/slices/S04/tasks/T01-SUMMARY.md
  - .hx/milestones/M001-df6x5t/slices/S04/tasks/T02-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-04-03T21:24:34.821Z
blocker_discovered: false
---

# S04: Native Rust Engine & Bindings

**Renamed gsd_parser.rs → hx_parser.rs, all 11 Rust identifiers, 5 platform npm packages, 3 TS bridge files, build.js, 15 test fixtures, and 7 gsd-named files — zero GSD hits remain in the native/packages boundary.**

## What Happened

S04 cleared the native Rust/JS boundary — the last major domain that S01 deliberately deferred with carve-out TODOs.

**T01** handled the Rust/JS N-API core: `gsd_parser.rs` was git-mv'd to `hx_parser.rs`, `lib.rs`'s `mod gsd_parser` updated to `mod hx_parser`, and all 11 GSD identifiers inside the Rust source replaced (`ParsedGsdFile` → `ParsedHxFile`, `GsdTreeEntry` → `HxTreeEntry`, `batch_parse_gsd_files` → `batch_parse_hx_files`, `scan_gsd_tree` → `scan_hx_tree`, plus all their Vec references and napi js_name attributes). All 5 platform npm packages (`@gsd-build/engine-*`) were rewritten to use the `@hx-build/engine-*` scope with `hx_engine.node` binary names and `hyperlabai/hx` repo URLs. The three TypeScript bridge files that S01 had marked with carve-out TODOs were cleared: `native-parser-bridge.ts` (5 hits → `batchParseHxFiles`/`scanHxTree`), `hx-parser/index.ts` (1 cast call), and `native.ts` (6 path string references). A key discovery: the Edit tool missed duplicate struct tokens in the Rust file — sed was used instead for all 11 Rust identifier replacements.

**T02** completed the ripple rename across tooling and file names. `native/scripts/build.js` (2 `gsd_engine` path strings) and all 15 `.mjs` test fixtures in `packages/native/src/__tests__/` were bulk-updated with `sed -i '' 's/gsd_engine/hx_engine/g'` — the plan listed 13 files but the glob cleanly caught 15 (2 extras: `stream-process.test.mjs` and `xxhash.test.mjs`). Seven gsd-named files were renamed via `git mv` to preserve history: `initial-gsd-header-filter.test.ts` → `initial-hx-header-filter.test.ts`, `gsd-web-launcher-contract.test.ts` → `hx-web-launcher-contract.test.ts`, all 4 `recover-gsd-1364/1668.sh/.ps1` scripts, and `gsd-skill-ecosystem.md` → `hx-skill-ecosystem.md`. The `.ps1` script internal variable names (`$gsdDir`, `$GsdIsSymlink`) were intentionally left for S05 — only the file renames were in scope for S04.

All 4 slice-level verification checks passed across both tasks: 0 GSD hits in `native/crates/engine/src/`, 0 in `native/npm/`, 0 in the 3 TS bridge files, and `npm run typecheck:extensions` exits 0.

## Verification

Four slice verification commands all pass:
1. `grep -rn 'gsd|GSD|Gsd' native/crates/engine/src/ | wc -l` → 0
2. `grep -rn 'gsd|GSD|Gsd' native/npm/ | wc -l` → 0
3. `grep -n 'gsd|GSD|Gsd' src/resources/extensions/hx/native-parser-bridge.ts packages/native/src/hx-parser/index.ts packages/native/src/native.ts | wc -l` → 0
4. `npm run typecheck:extensions` → exit 0

File existence checks:
- `native/crates/engine/src/hx_parser.rs` exists, `gsd_parser.rs` absent
- `lib.rs` references `mod hx_parser`
- All 5 platform `package.json` files use `@hx-build` scope and `hx_engine.node`
- All 7 renamed files exist at new paths; old paths absent

## Requirements Advanced

- R004 — Rust source is hx_parser.rs, all exported N-API functions use hx naming, all 5 platform packages use @hx-build/engine-* scope with hx_engine.node binary
- R008 — All 7 gsd-named files renamed to hx-* via git mv: gsd_parser.rs, 2 test files, 4 recovery scripts, 1 skill doc

## Requirements Validated

- R004 — grep -rn 'gsd|GSD|Gsd' native/crates/engine/src/ native/npm/ returns 0 hits; npm run typecheck:extensions exits 0
- R008 — All old gsd-named files absent on disk; all hx-named equivalents present; verified via test ! -f / test -f shell checks

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

T01: Edit tool missed duplicate struct tokens in Rust source — switched to sed -i '' for all 11 Rust identifier renames.
T02: Plan listed 13 .mjs test files; 15 actually existed (stream-process.test.mjs and xxhash.test.mjs were extras). The for-loop glob covered all automatically — no remediation needed.

## Known Limitations

The .ps1 scripts (recover-hx-1364.ps1, recover-hx-1668.ps1) still contain internal PowerShell variable names `$gsdDir` and `$GsdIsSymlink`. File renames are complete (S04 scope), but internal content cleanup is deferred to S05 (scripts/docs cleanup). This is intentional per the task plan.

## Follow-ups

S05 must update internal content of recover-hx-1364.ps1 and recover-hx-1668.ps1 — the `$gsdDir` and `$GsdIsSymlink` variable names inside those scripts still use the gsd prefix.

## Files Created/Modified

- `native/crates/engine/src/hx_parser.rs` — Renamed from gsd_parser.rs; all 11 GSD Rust identifiers replaced with HX equivalents
- `native/crates/engine/src/lib.rs` — mod gsd_parser → mod hx_parser
- `native/npm/darwin-arm64/package.json` — @hx-build/engine-darwin-arm64 scope, hx_engine.node binary
- `native/npm/darwin-x64/package.json` — @hx-build/engine-darwin-x64 scope, hx_engine.node binary
- `native/npm/linux-x64-gnu/package.json` — @hx-build/engine-linux-x64-gnu scope, hx_engine.node binary
- `native/npm/linux-arm64-gnu/package.json` — @hx-build/engine-linux-arm64-gnu scope, hx_engine.node binary
- `native/npm/win32-x64-msvc/package.json` — @hx-build/engine-win32-x64-msvc scope, hx_engine.node binary
- `src/resources/extensions/hx/native-parser-bridge.ts` — 5 GSD hits cleared: batchParseHxFiles and scanHxTree in interface, load check, and call sites
- `packages/native/src/hx-parser/index.ts` — batchParseGsdFiles cast call → batchParseHxFiles
- `packages/native/src/native.ts` — 6 gsd_engine path string references → hx_engine
- `native/scripts/build.js` — 2 gsd_engine path strings → hx_engine on lines 75-76
- `packages/native/src/__tests__/*.test.mjs` — All 15 test fixtures: gsd_engine path strings → hx_engine
- `src/tests/initial-hx-header-filter.test.ts` — Renamed from initial-gsd-header-filter.test.ts via git mv
- `src/tests/hx-web-launcher-contract.test.ts` — Renamed from gsd-web-launcher-contract.test.ts via git mv
- `scripts/recover-hx-1364.sh` — Renamed from recover-gsd-1364.sh via git mv
- `scripts/recover-hx-1364.ps1` — Renamed from recover-gsd-1364.ps1 via git mv (internal $gsdDir vars deferred to S05)
- `scripts/recover-hx-1668.sh` — Renamed from recover-gsd-1668.sh via git mv
- `scripts/recover-hx-1668.ps1` — Renamed from recover-gsd-1668.ps1 via git mv (internal $gsdDir vars deferred to S05)
- `src/resources/skills/create-skill/references/hx-skill-ecosystem.md` — Renamed from gsd-skill-ecosystem.md via git mv
