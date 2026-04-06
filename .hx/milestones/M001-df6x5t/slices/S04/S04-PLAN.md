# S04: Native Rust Engine & Bindings

**Goal:** Rename all GSD identifiers in the Rust engine source, N-API bindings, platform npm packages, TypeScript bridge layers, build scripts, test fixtures, and gsd-named files — clearing S01's carve-outs for the native boundary.
**Demo:** After this: After this: Rust source is hx_parser.rs, binary is hx_engine.*.node, JS bindings call batchParseHxFiles/scanHxTree.

## Tasks
- [x] **T01: Renamed gsd_parser.rs → hx_parser.rs, updated all 11 Rust GSD identifiers, 5 platform npm packages to @hx-build/hx_engine scope, and cleared S01 carve-outs in 3 TypeScript bridge files** — Core rename at the Rust/JS N-API boundary. Renames the Rust source file, all internal Rust identifiers, the lib.rs module declaration, all 5 platform npm package.json files, and the 3 TypeScript bridge files that had S01 carve-outs.

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
  - Estimate: 45m
  - Files: native/crates/engine/src/gsd_parser.rs, native/crates/engine/src/lib.rs, native/npm/darwin-arm64/package.json, native/npm/darwin-x64/package.json, native/npm/linux-x64-gnu/package.json, native/npm/linux-arm64-gnu/package.json, native/npm/win32-x64-msvc/package.json, src/resources/extensions/hx/native-parser-bridge.ts, packages/native/src/hx-parser/index.ts, packages/native/src/native.ts
  - Verify: grep -rn 'gsd\|GSD\|Gsd' native/crates/engine/src/ native/npm/ | wc -l  # 0
grep -n 'gsd\|GSD\|Gsd' src/resources/extensions/hx/native-parser-bridge.ts packages/native/src/hx-parser/index.ts packages/native/src/native.ts | wc -l  # 0
npm run typecheck:extensions  # exit 0
- [x] **T02: Replaced all gsd_engine path strings in build.js and 15 test .mjs files; git-mv'd 7 gsd-named files to hx-* equivalents; all 4 slice verification checks pass** — Complete the ripple rename across build tooling, test fixtures, and all remaining gsd-named files for R008.

## Steps

1. Update `native/scripts/build.js` — 2 gsd_engine references:
   - Line 75: `"gsd_engine.dev.node"` → `"hx_engine.dev.node"`
   - Line 76: `` `gsd_engine.${platformTag}.node` `` → `` `hx_engine.${platformTag}.node` ``
2. Update all 13 test `.mjs` files in `packages/native/src/__tests__/` — each has the same 2-line change:
   - `` path.join(addonDir, `gsd_engine.${platformTag}.node`) `` → `` `hx_engine.${platformTag}.node` ``
   - `path.join(addonDir, "gsd_engine.dev.node")` → `"hx_engine.dev.node"`
   - Files: clipboard.test.mjs, diff.test.mjs, fd.test.mjs, glob.test.mjs, grep.test.mjs, highlight.test.mjs, html.test.mjs, image.test.mjs, json-parse.test.mjs, ps.test.mjs, text.test.mjs, truncate.test.mjs, ttsr.test.mjs
   - Use a shell loop: `for f in packages/native/src/__tests__/*.test.mjs; do sed -i '' 's/gsd_engine/hx_engine/g' "$f"; done`
3. Rename gsd-named test files (git mv):
   - `git mv src/tests/initial-gsd-header-filter.test.ts src/tests/initial-hx-header-filter.test.ts`
   - `git mv src/tests/gsd-web-launcher-contract.test.ts src/tests/hx-web-launcher-contract.test.ts`
   - No imports reference these files by old name (already verified in planning)
4. Rename gsd-named scripts (git mv):
   - `git mv scripts/recover-gsd-1364.sh scripts/recover-hx-1364.sh`
   - `git mv scripts/recover-gsd-1364.ps1 scripts/recover-hx-1364.ps1`
   - `git mv scripts/recover-gsd-1668.sh scripts/recover-hx-1668.sh`
   - `git mv scripts/recover-gsd-1668.ps1 scripts/recover-hx-1668.ps1`
5. Rename gsd-named skill doc (git mv):
   - `git mv src/resources/skills/create-skill/references/gsd-skill-ecosystem.md src/resources/skills/create-skill/references/hx-skill-ecosystem.md`
6. Run comprehensive verification:
   - grep for gsd in native/, packages/native/src/, native/scripts/ → 0 hits
   - Verify old files don't exist on disk
   - `npm run typecheck:extensions` → exit 0

**Note:** `recover-gsd-1364.ps1` contains internal `$gsdDir`/`$GsdIsSymlink` variable names — these are PowerShell variables, not TypeScript, and their content rename is deferred to S05 (scripts/docs cleanup). S04 only does the file rename per R008.

## Must-Haves

- [ ] `build.js` uses `hx_engine` in both path strings
- [ ] All 13 test `.mjs` files use `hx_engine` path strings
- [ ] `initial-gsd-header-filter.test.ts` → `initial-hx-header-filter.test.ts`
- [ ] `gsd-web-launcher-contract.test.ts` → `hx-web-launcher-contract.test.ts`
- [ ] All 4 `recover-gsd-*` scripts → `recover-hx-*`
- [ ] `gsd-skill-ecosystem.md` → `hx-skill-ecosystem.md`
- [ ] `npm run typecheck:extensions` exits 0

## Verification

- `grep -rn 'gsd_engine' native/scripts/build.js packages/native/src/__tests__/ | wc -l` returns 0
- `test ! -f src/tests/initial-gsd-header-filter.test.ts && test ! -f src/tests/gsd-web-launcher-contract.test.ts && test ! -f scripts/recover-gsd-1364.sh && test ! -f src/resources/skills/create-skill/references/gsd-skill-ecosystem.md`
- `test -f src/tests/initial-hx-header-filter.test.ts && test -f src/tests/hx-web-launcher-contract.test.ts && test -f scripts/recover-hx-1364.sh && test -f src/resources/skills/create-skill/references/hx-skill-ecosystem.md`
- `npm run typecheck:extensions` exits 0

## Inputs

- `native/scripts/build.js` — build script with gsd_engine paths
- `packages/native/src/__tests__/clipboard.test.mjs` — test fixture with gsd_engine paths
- `packages/native/src/__tests__/diff.test.mjs` — test fixture
- `packages/native/src/__tests__/fd.test.mjs` — test fixture
- `packages/native/src/__tests__/glob.test.mjs` — test fixture
- `packages/native/src/__tests__/grep.test.mjs` — test fixture
- `packages/native/src/__tests__/highlight.test.mjs` — test fixture
- `packages/native/src/__tests__/html.test.mjs` — test fixture
- `packages/native/src/__tests__/image.test.mjs` — test fixture
- `packages/native/src/__tests__/json-parse.test.mjs` — test fixture
- `packages/native/src/__tests__/ps.test.mjs` — test fixture
- `packages/native/src/__tests__/text.test.mjs` — test fixture
- `packages/native/src/__tests__/truncate.test.mjs` — test fixture
- `packages/native/src/__tests__/ttsr.test.mjs` — test fixture
- `src/tests/initial-gsd-header-filter.test.ts` — file to rename
- `src/tests/gsd-web-launcher-contract.test.ts` — file to rename
- `scripts/recover-gsd-1364.sh` — file to rename
- `scripts/recover-gsd-1364.ps1` — file to rename
- `scripts/recover-gsd-1668.sh` — file to rename
- `scripts/recover-gsd-1668.ps1` — file to rename
- `src/resources/skills/create-skill/references/gsd-skill-ecosystem.md` — file to rename

## Expected Output

- `native/scripts/build.js` — hx_engine path strings
- `packages/native/src/__tests__/clipboard.test.mjs` — hx_engine paths
- `packages/native/src/__tests__/diff.test.mjs` — hx_engine paths
- `packages/native/src/__tests__/fd.test.mjs` — hx_engine paths
- `packages/native/src/__tests__/glob.test.mjs` — hx_engine paths
- `packages/native/src/__tests__/grep.test.mjs` — hx_engine paths
- `packages/native/src/__tests__/highlight.test.mjs` — hx_engine paths
- `packages/native/src/__tests__/html.test.mjs` — hx_engine paths
- `packages/native/src/__tests__/image.test.mjs` — hx_engine paths
- `packages/native/src/__tests__/json-parse.test.mjs` — hx_engine paths
- `packages/native/src/__tests__/ps.test.mjs` — hx_engine paths
- `packages/native/src/__tests__/text.test.mjs` — hx_engine paths
- `packages/native/src/__tests__/truncate.test.mjs` — hx_engine paths
- `packages/native/src/__tests__/ttsr.test.mjs` — hx_engine paths
- `src/tests/initial-hx-header-filter.test.ts` — renamed file
- `src/tests/hx-web-launcher-contract.test.ts` — renamed file
- `scripts/recover-hx-1364.sh` — renamed file
- `scripts/recover-hx-1364.ps1` — renamed file
- `scripts/recover-hx-1668.sh` — renamed file
- `scripts/recover-hx-1668.ps1` — renamed file
- `src/resources/skills/create-skill/references/hx-skill-ecosystem.md` — renamed file
  - Estimate: 30m
  - Files: native/scripts/build.js, packages/native/src/__tests__/clipboard.test.mjs, packages/native/src/__tests__/diff.test.mjs, packages/native/src/__tests__/fd.test.mjs, packages/native/src/__tests__/glob.test.mjs, packages/native/src/__tests__/grep.test.mjs, packages/native/src/__tests__/highlight.test.mjs, packages/native/src/__tests__/html.test.mjs, packages/native/src/__tests__/image.test.mjs, packages/native/src/__tests__/json-parse.test.mjs, packages/native/src/__tests__/ps.test.mjs, packages/native/src/__tests__/text.test.mjs, packages/native/src/__tests__/truncate.test.mjs, packages/native/src/__tests__/ttsr.test.mjs, src/tests/initial-gsd-header-filter.test.ts, src/tests/gsd-web-launcher-contract.test.ts, scripts/recover-gsd-1364.sh, scripts/recover-gsd-1364.ps1, scripts/recover-gsd-1668.sh, scripts/recover-gsd-1668.ps1, src/resources/skills/create-skill/references/gsd-skill-ecosystem.md
  - Verify: grep -rn 'gsd_engine' native/scripts/build.js packages/native/src/__tests__/ | wc -l  # 0
test ! -f src/tests/initial-gsd-header-filter.test.ts && test ! -f src/tests/gsd-web-launcher-contract.test.ts && test ! -f scripts/recover-gsd-1364.sh && test ! -f src/resources/skills/create-skill/references/gsd-skill-ecosystem.md
npm run typecheck:extensions  # exit 0
