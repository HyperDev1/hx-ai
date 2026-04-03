---
estimated_steps: 83
estimated_files: 21
skills_used: []
---

# T02: Rename build script, test fixtures, and gsd-named files

Complete the ripple rename across build tooling, test fixtures, and all remaining gsd-named files for R008.

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

## Inputs

- `native/scripts/build.js`
- `packages/native/src/__tests__/clipboard.test.mjs`
- `packages/native/src/__tests__/diff.test.mjs`
- `packages/native/src/__tests__/fd.test.mjs`
- `packages/native/src/__tests__/glob.test.mjs`
- `packages/native/src/__tests__/grep.test.mjs`
- `packages/native/src/__tests__/highlight.test.mjs`
- `packages/native/src/__tests__/html.test.mjs`
- `packages/native/src/__tests__/image.test.mjs`
- `packages/native/src/__tests__/json-parse.test.mjs`
- `packages/native/src/__tests__/ps.test.mjs`
- `packages/native/src/__tests__/text.test.mjs`
- `packages/native/src/__tests__/truncate.test.mjs`
- `packages/native/src/__tests__/ttsr.test.mjs`
- `src/tests/initial-gsd-header-filter.test.ts`
- `src/tests/gsd-web-launcher-contract.test.ts`
- `scripts/recover-gsd-1364.sh`
- `scripts/recover-gsd-1364.ps1`
- `scripts/recover-gsd-1668.sh`
- `scripts/recover-gsd-1668.ps1`
- `src/resources/skills/create-skill/references/gsd-skill-ecosystem.md`

## Expected Output

- `native/scripts/build.js`
- `packages/native/src/__tests__/clipboard.test.mjs`
- `packages/native/src/__tests__/diff.test.mjs`
- `packages/native/src/__tests__/fd.test.mjs`
- `packages/native/src/__tests__/glob.test.mjs`
- `packages/native/src/__tests__/grep.test.mjs`
- `packages/native/src/__tests__/highlight.test.mjs`
- `packages/native/src/__tests__/html.test.mjs`
- `packages/native/src/__tests__/image.test.mjs`
- `packages/native/src/__tests__/json-parse.test.mjs`
- `packages/native/src/__tests__/ps.test.mjs`
- `packages/native/src/__tests__/text.test.mjs`
- `packages/native/src/__tests__/truncate.test.mjs`
- `packages/native/src/__tests__/ttsr.test.mjs`
- `src/tests/initial-hx-header-filter.test.ts`
- `src/tests/hx-web-launcher-contract.test.ts`
- `scripts/recover-hx-1364.sh`
- `scripts/recover-hx-1364.ps1`
- `scripts/recover-hx-1668.sh`
- `scripts/recover-hx-1668.ps1`
- `src/resources/skills/create-skill/references/hx-skill-ecosystem.md`

## Verification

grep -rn 'gsd_engine' native/scripts/build.js packages/native/src/__tests__/ | wc -l  # 0
test ! -f src/tests/initial-gsd-header-filter.test.ts && test ! -f src/tests/gsd-web-launcher-contract.test.ts && test ! -f scripts/recover-gsd-1364.sh && test ! -f src/resources/skills/create-skill/references/gsd-skill-ecosystem.md
npm run typecheck:extensions  # exit 0
