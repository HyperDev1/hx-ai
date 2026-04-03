---
estimated_steps: 73
estimated_files: 10
skills_used: []
---

# T01: Rename Rust source, lib.rs, platform npm packages, and TypeScript bridge files

Core rename at the Rust/JS N-API boundary. Renames the Rust source file, all internal Rust identifiers, the lib.rs module declaration, all 5 platform npm package.json files, and the 3 TypeScript bridge files that had S01 carve-outs.

## Steps

1. Rename Rust source file: `git mv native/crates/engine/src/gsd_parser.rs native/crates/engine/src/hx_parser.rs`
2. Update `native/crates/engine/src/lib.rs` line 25: `mod gsd_parser;` → `mod hx_parser;`
3. In `native/crates/engine/src/hx_parser.rs`, rename all GSD identifiers:
   - Line 10 doc comment: `batchParseGsdFiles` → `batchParseHxFiles`
   - Line 41: `pub struct ParsedGsdFile` → `pub struct ParsedHxFile`
   - Line 59: `pub files: Vec<ParsedGsdFile>` → `pub files: Vec<ParsedHxFile>`
   - Line 732: `#[napi(js_name = "batchParseGsdFiles")]` → `#[napi(js_name = "batchParseHxFiles")]`
   - Line 733: `pub fn batch_parse_gsd_files` → `pub fn batch_parse_hx_files`
   - Line 770: `parsed_files.push(ParsedGsdFile {` → `parsed_files.push(ParsedHxFile {`
   - Line 841: `pub struct GsdTreeEntry` → `pub struct HxTreeEntry`
   - Line 848: `#[napi(js_name = "scanGsdTree")]` → `#[napi(js_name = "scanHxTree")]`
   - Line 849: `pub fn scan_gsd_tree` → `pub fn scan_hx_tree`
   - Line 859: `fn collect_tree_entries(... entries: &mut Vec<GsdTreeEntry>)` → `Vec<HxTreeEntry>`
   - Line 889: `entries.push(GsdTreeEntry {` → `entries.push(HxTreeEntry {`
4. Update all 5 `native/npm/*/package.json` files:
   - `name`: `@gsd-build/engine-*` → `@hx-build/engine-*` (MUST use `@hx-build` to match `native.ts` line 39 require path)
   - `description`: `GSD` → `HX`
   - `main`: `gsd_engine.node` → `hx_engine.node`
   - `files[0]`: `gsd_engine.node` → `hx_engine.node`
   - `repository.url`: `gsd-build/gsd-2` → `hyperlabai/hx` (or equivalent)
5. Update `src/resources/extensions/hx/native-parser-bridge.ts` — all 5 gsd hits:
   - Line 17: `batchParseGsdFiles:` → `batchParseHxFiles:` (interface property)
   - Line 25: `scanGsdTree:` → `scanHxTree:` (interface property)
   - Line 42: `mod.batchParseGsdFiles` → `mod.batchParseHxFiles` (load check)
   - Line 131: `native.batchParseGsdFiles` → `native.batchParseHxFiles` (call site)
   - Line 163: `native.scanGsdTree` → `native.scanHxTree` (call site)
6. Update `packages/native/src/hx-parser/index.ts` line 83: `(native as Record<string, Function>).batchParseGsdFiles(` → `.batchParseHxFiles(`
7. Update `packages/native/src/native.ts` — 6 gsd_engine references:
   - Line 7 comment: `gsd_engine.{platform}.node` → `hx_engine.{platform}.node`
   - Line 8 comment: `gsd_engine.dev.node` → `hx_engine.dev.node`
   - Line 46 comment: `gsd_engine.{platform}.node` → `hx_engine.{platform}.node`
   - Line 47: `` `gsd_engine.${platformTag}.node` `` → `` `hx_engine.${platformTag}.node` ``
   - Line 55 comment: `gsd_engine.dev.node` → `hx_engine.dev.node`
   - Line 56: `"gsd_engine.dev.node"` → `"hx_engine.dev.node"`
8. Verify: grep for gsd in all modified files returns 0 hits; run `npm run typecheck:extensions`

## Must-Haves

- [ ] `gsd_parser.rs` renamed to `hx_parser.rs` on disk
- [ ] `lib.rs` references `mod hx_parser`
- [ ] All 11 Rust identifier occurrences renamed
- [ ] All 5 platform package.json files use `@hx-build/engine-*` scope
- [ ] All 5 native-parser-bridge.ts references renamed
- [ ] hx-parser/index.ts cast call uses `batchParseHxFiles`
- [ ] native.ts uses `hx_engine` in all 6 references
- [ ] `npm run typecheck:extensions` exits 0

## Verification

- `grep -rn "gsd\|GSD\|Gsd" native/crates/engine/src/ | wc -l` returns 0
- `grep -rn "gsd\|GSD\|Gsd" native/npm/ | wc -l` returns 0
- `grep -n "gsd\|GSD\|Gsd" src/resources/extensions/hx/native-parser-bridge.ts packages/native/src/hx-parser/index.ts packages/native/src/native.ts | wc -l` returns 0
- `npm run typecheck:extensions` exits 0

## Inputs

- `native/crates/engine/src/gsd_parser.rs` — Rust source file to rename and edit
- `native/crates/engine/src/lib.rs` — module declaration to update
- `native/npm/darwin-arm64/package.json` — platform package to update
- `native/npm/darwin-x64/package.json` — platform package to update
- `native/npm/linux-x64-gnu/package.json` — platform package to update
- `native/npm/linux-arm64-gnu/package.json` — platform package to update
- `native/npm/win32-x64-msvc/package.json` — platform package to update
- `src/resources/extensions/hx/native-parser-bridge.ts` — TS bridge with 5 gsd references (S01 carve-out)
- `packages/native/src/hx-parser/index.ts` — cast call with batchParseGsdFiles (S01 carve-out)
- `packages/native/src/native.ts` — binary path strings with gsd_engine

## Expected Output

- `native/crates/engine/src/hx_parser.rs` — renamed Rust source with all HX identifiers
- `native/crates/engine/src/lib.rs` — updated mod declaration
- `native/npm/darwin-arm64/package.json` — @hx-build scope, hx_engine binary
- `native/npm/darwin-x64/package.json` — @hx-build scope, hx_engine binary
- `native/npm/linux-x64-gnu/package.json` — @hx-build scope, hx_engine binary
- `native/npm/linux-arm64-gnu/package.json` — @hx-build scope, hx_engine binary
- `native/npm/win32-x64-msvc/package.json` — @hx-build scope, hx_engine binary
- `src/resources/extensions/hx/native-parser-bridge.ts` — all batchParseHxFiles/scanHxTree
- `packages/native/src/hx-parser/index.ts` — batchParseHxFiles cast call
- `packages/native/src/native.ts` — hx_engine path strings

## Inputs

- `native/crates/engine/src/gsd_parser.rs`
- `native/crates/engine/src/lib.rs`
- `native/npm/darwin-arm64/package.json`
- `native/npm/darwin-x64/package.json`
- `native/npm/linux-x64-gnu/package.json`
- `native/npm/linux-arm64-gnu/package.json`
- `native/npm/win32-x64-msvc/package.json`
- `src/resources/extensions/hx/native-parser-bridge.ts`
- `packages/native/src/hx-parser/index.ts`
- `packages/native/src/native.ts`

## Expected Output

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

## Verification

grep -rn 'gsd\|GSD\|Gsd' native/crates/engine/src/ native/npm/ | wc -l  # 0
grep -n 'gsd\|GSD\|Gsd' src/resources/extensions/hx/native-parser-bridge.ts packages/native/src/hx-parser/index.ts packages/native/src/native.ts | wc -l  # 0
npm run typecheck:extensions  # exit 0
