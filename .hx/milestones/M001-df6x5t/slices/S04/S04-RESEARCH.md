# S04: Native Rust Engine & Bindings — Research

**Date:** 2026-04-03
**Slice:** S04 — Native Rust Engine & Bindings
**Requirements:** R004 (native Rust naming), R008 (file renames), R010 (typecheck passes)

## Summary

S04 is a **targeted rename** of GSD identifiers across the Rust source, its compiled binary filenames, platform npm package metadata, and the TypeScript bridge layers. No new architecture is needed — this is a pure rename following the same pattern as S01. The work is mechanically well-bounded: one Rust file to rename, ~8 identifiers inside it, one `mod` declaration, five npm platform `package.json` files, two JS loader files, thirteen test fixture files, and two TypeScript bridge files. **No Rust recompile is needed** for the source-only renames to clear TypeScript verification — the Rust binary rebuild question is separated from the TS-layer rename.

The critical insight: `cargo` is **not available** in this worktree environment. Actual binary renaming (`gsd_engine.*.node → hx_engine.*.node`) cannot happen here. However, the TypeScript verification target (`npm run typecheck:extensions`) does not depend on the binary being present — it only type-checks the `.ts` source. So the TS-layer renames (native.ts path strings, native-parser-bridge.ts interface declarations, hx-parser/index.ts cast call) and the Rust source file rename (`gsd_parser.rs → hx_parser.rs`) can all be done and verified without a Rust rebuild. The `native/npm/*/package.json` renames are also pure text changes.

## Recommendation

Execute the rename in two tasks:
1. **T01 — Rust source + lib.rs + npm platform packages:** Rename `gsd_parser.rs → hx_parser.rs`, update `mod gsd_parser` in `lib.rs`, rename internal Rust identifiers (`ParsedGsdFile → ParsedHxFile`, `GsdTreeEntry → HxTreeEntry`, `batch_parse_gsd_files → batch_parse_hx_files`, `scan_gsd_tree → scan_hx_tree`, update `js_name` attributes to `batchParseHxFiles` / `scanHxTree`), update all five `native/npm/*/package.json` files (`@gsd-build → @hyperlab`, `gsd_engine.node → hx_engine.node`, update repo URL).
2. **T02 — TypeScript bridge + build scripts + test fixtures:** Update `native-parser-bridge.ts` (change interface property names, fix `batchParseGsdFiles` calls), `packages/native/src/native.ts` (change path strings from `gsd_engine.*.node` to `hx_engine.*.node`), `native/scripts/build.js` (same path strings), `packages/native/src/__tests__/*.test.mjs` (13 files, same path strings). Then rename the file-level file renames from R008 in src/tests/ (initial-gsd-header-filter.test.ts, gsd-web-launcher-contract.test.ts), scripts/ (recover-gsd-*.sh/.ps1), and skills/ (gsd-skill-ecosystem.md). Verify with grep and typecheck.

**Note on binary artifacts:** The compiled `.node` binary file in `native/addon/` would need to be physically renamed from `gsd_engine.{platform}.node` to `hx_engine.{platform}.node` by a developer running `cargo build` after this rename — that is a CI/release-time operation. The source rename is sufficient for R004 (Rust source), R008 (file renames), and R010 (typecheck) to pass in this worktree.

## Implementation Landscape

### Key Files

**Rust source (file rename + internal identifier renames):**
- `native/crates/engine/src/gsd_parser.rs` → rename to `hx_parser.rs`; inside: `ParsedGsdFile → ParsedHxFile`, `GsdTreeEntry → HxTreeEntry`, `batch_parse_gsd_files → batch_parse_hx_files`, `scan_gsd_tree → scan_hx_tree`, `#[napi(js_name = "batchParseGsdFiles")]` → `batchParseHxFiles`, `#[napi(js_name = "scanGsdTree")]` → `scanHxTree`; also update the doc comment on line 10 mentioning `batchParseGsdFiles`; the struct `ParsedGsdFile` is referenced on lines 41, 59, 770
- `native/crates/engine/src/lib.rs` — `mod gsd_parser;` → `mod hx_parser;`

**Platform npm packages (pure JSON edits, 5 files):**
- `native/npm/darwin-arm64/package.json` — `name: @gsd-build/engine-darwin-arm64 → @hyperlab/engine-darwin-arm64`, `main: gsd_engine.node → hx_engine.node`, `files[0]: gsd_engine.node → hx_engine.node`, repository URL
- `native/npm/darwin-x64/package.json` — same pattern
- `native/npm/linux-x64-gnu/package.json` — same pattern
- `native/npm/linux-arm64-gnu/package.json` — same pattern
- `native/npm/win32-x64-msvc/package.json` — same pattern

**TypeScript bridge (most important — clears S01 carve-outs):**
- `src/resources/extensions/hx/native-parser-bridge.ts` — has `batchParseGsdFiles` and `scanGsdTree` in 5 places: the interface type literal (lines 17, 25), the load-check (line 42), and two call sites (lines 131, 163). Change all to `batchParseHxFiles` / `scanHxTree`.
- `packages/native/src/hx-parser/index.ts` — line 83: `(native as Record<string, Function>).batchParseGsdFiles(` → `.batchParseHxFiles(`. This is the S01 carve-out that was intentionally deferred.
- `packages/native/src/native.ts` — lines 7-8, 46-47, 55-56: change path strings `gsd_engine.{platform}.node` → `hx_engine.{platform}.node` and `gsd_engine.dev.node` → `hx_engine.dev.node`

**Build script:**
- `native/scripts/build.js` — lines 75-76: same path string changes

**Test fixtures (all 13 files, same 2-line change each):**
- `packages/native/src/__tests__/clipboard.test.mjs` — lines 13-14
- `packages/native/src/__tests__/diff.test.mjs` — lines 22-23
- `packages/native/src/__tests__/fd.test.mjs` — lines 16-17
- `packages/native/src/__tests__/glob.test.mjs` — lines 24-25
- `packages/native/src/__tests__/grep.test.mjs` — lines 16-17
- `packages/native/src/__tests__/highlight.test.mjs` — lines 14-15
- `packages/native/src/__tests__/html.test.mjs` — lines 13-14
- `packages/native/src/__tests__/image.test.mjs` — lines 14-15
- `packages/native/src/__tests__/json-parse.test.mjs` — lines 13-14
- `packages/native/src/__tests__/ps.test.mjs` — lines 15-16
- `packages/native/src/__tests__/text.test.mjs` — lines 22-23
- `packages/native/src/__tests__/truncate.test.mjs` — lines 13-14
- `packages/native/src/__tests__/ttsr.test.mjs` — lines 14-15

**File renames from R008:**
- `src/tests/initial-gsd-header-filter.test.ts` → `src/tests/initial-hx-header-filter.test.ts` (content is already HX-branded based on inspection — confirm before rename)
- `src/tests/gsd-web-launcher-contract.test.ts` → `src/tests/hx-web-launcher-contract.test.ts`
- `scripts/recover-gsd-1364.sh` → `scripts/recover-hx-1364.sh`
- `scripts/recover-gsd-1364.ps1` → `scripts/recover-hx-1364.ps1`
- `scripts/recover-gsd-1668.sh` → `scripts/recover-hx-1668.sh`
- `scripts/recover-gsd-1668.ps1` → `scripts/recover-hx-1668.ps1`
- `src/resources/skills/create-skill/references/gsd-skill-ecosystem.md` → `hx-skill-ecosystem.md`

**Important observation:** The test files `initial-gsd-header-filter.test.ts` and `gsd-web-launcher-contract.test.ts` are file-renames only — their *contents* have already been updated in S01 (the functions inside use HX names). The file names just need to change. Verify there are no `import` statements pointing to these files by the old name before renaming.

### Build Order

1. Rust source rename first (`gsd_parser.rs → hx_parser.rs` + `lib.rs` mod update + internal identifiers) — no compilation needed, just file ops. This is the "file rename" from R008 and R004.
2. TypeScript bridge files (`native-parser-bridge.ts`, `hx-parser/index.ts`, `native.ts`) — clears the two S01 carve-outs. After this, `npm run typecheck:extensions` should pass with zero GSD references.
3. Build script + test fixtures — pure string changes, no type impact.
4. File renames (test files, scripts, skill doc).
5. Verification grep + typecheck.

### Verification Approach

```bash
# 1. Zero gsd references in Rust + TS + JS (excluding native-parser-bridge batchParseGsdFiles if Rust binary not rebuilt)
grep -rn "gsd\|GSD\|Gsd" native/crates/ --include="*.rs" | grep -v ".hx/"

# 2. Zero gsd references in TS bridge + native.ts
grep -rn "gsd" packages/native/src/ native/scripts/ | grep -v ".hx/"

# 3. TypeScript compiles
npm run typecheck:extensions

# 4. Test file names gone
ls src/tests/ | grep gsd  # should be empty
ls scripts/ | grep gsd    # should be empty
ls src/resources/skills/create-skill/references/ | grep gsd  # should be empty
```

## Constraints

- `cargo` is not available in this worktree — Rust source file rename is a `git mv` + text edit, not a compilation. The actual binary `hx_engine.*.node` will only exist after a developer runs `cargo build`. The TS typecheck target does NOT require the binary.
- The five `native/npm/*/package.json` files reference `@gsd-build/engine-*`. Per D002, rename in source only — no npm publish. The package.json names become `@hyperlab/engine-*` (matching the D002 decision) or `@hx-build/engine-*` (matching what `native.ts` already uses for `@hx-build/engine-${packageSuffix}`). **Critical:** `native.ts` line 39 already uses `@hx-build/engine-*` as the require path — the platform packages must rename to `@hx-build/engine-*` (not `@hyperlab/engine-*`) to match the loader. Verify before committing.
- `initial-gsd-header-filter.test.ts` must be renamed but the content already uses `filterInitialHxHeader` (updated in S01). Ensure no other file imports it by its old name.
- The `package-lock.json` still references `@gsd-build/engine-*` — this is a generated file. It is acceptable to leave it until `npm install` is re-run. If a fresh install is required, run `npm install` after renaming the platform package.json names.

## Common Pitfalls

- **`@hx-build` vs `@hyperlab`** — `native.ts` line 39 requires `@hx-build/engine-${packageSuffix}`. The platform `package.json` names must match this scope exactly. Do NOT rename to `@hyperlab/engine-*`; use `@hx-build/engine-*`.
- **Rust file rename order** — rename the file FIRST (`git mv gsd_parser.rs hx_parser.rs`), then update `lib.rs` mod declaration (`mod gsd_parser → mod hx_parser`). If lib.rs is updated before the file is renamed, Rust cargo build would fail (irrelevant here since no build, but keeps things consistent).
- **`native-parser-bridge.ts` has 5 gsd hits** — it's easy to miss the interface type declaration (lines 17 and 25) vs the call sites (lines 42, 131, 163). All 5 must be renamed.
- **The `hx-parser/index.ts` cast call** — this was the S01 carve-out. Line 83: `.batchParseGsdFiles(` must change to `.batchParseHxFiles(`. The surrounding function is already named `batchParseHxFiles` — only the runtime property key in the cast needs updating.
- **stream-process.test.mjs has no gsd reference** — confirm before skipping; it uses a direct import not the addon path pattern.
