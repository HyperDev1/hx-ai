# S04: Native Rust Engine & Bindings — UAT

**Milestone:** M001-df6x5t
**Written:** 2026-04-03T21:24:34.821Z

## UAT Type
UAT mode: artifact-driven

## Preconditions
- Working directory: repo root (M001-df6x5t worktree)
- No build step required — all checks are static file/grep verifications
- `node` and `npm` available for typecheck

## Test Cases

### TC-01: Rust source file renamed and contains no GSD identifiers
**Steps:**
1. `ls native/crates/engine/src/ | grep -E "gsd_parser|hx_parser"`
2. `grep -rn "gsd\|GSD\|Gsd" native/crates/engine/src/ | wc -l`

**Expected:**
1. Only `hx_parser.rs` appears; `gsd_parser.rs` is absent
2. Output: `0`

---

### TC-02: lib.rs module declaration updated
**Steps:**
1. `grep -n "mod.*parser" native/crates/engine/src/lib.rs`

**Expected:**
- Output contains `mod hx_parser;` and does NOT contain `mod gsd_parser`

---

### TC-03: HX N-API function names exported
**Steps:**
1. `grep -n "napi\|pub fn" native/crates/engine/src/hx_parser.rs | grep -E "batch|scan"`

**Expected:**
- Lines contain `batchParseHxFiles`, `batch_parse_hx_files`, `scanHxTree`, `scan_hx_tree`
- No lines contain `batchParseGsdFiles`, `scan_gsd_tree`

---

### TC-04: All 5 platform npm packages use @hx-build scope and hx_engine binary
**Steps:**
1. `for f in native/npm/*/package.json; do echo "=== $f ==="; grep -E '"name"|"main"' "$f"; done`

**Expected:**
- Each package shows `"name": "@hx-build/engine-*"` (5 different platform suffixes)
- Each package shows `"main": "hx_engine.node"`
- No package shows `@gsd-build` or `gsd_engine`

---

### TC-05: TypeScript bridge files use HX function names
**Steps:**
1. `grep -n "batchParse\|scanTree\|gsd_engine" src/resources/extensions/hx/native-parser-bridge.ts`
2. `grep -n "batchParse\|scanTree\|gsd_engine" packages/native/src/hx-parser/index.ts`
3. `grep -n "gsd_engine\|hx_engine" packages/native/src/native.ts`

**Expected:**
1. All lines show `batchParseHxFiles` or `scanHxTree`; no `batchParseGsdFiles` or `scanGsdTree`
2. Shows `batchParseHxFiles` cast call; no `batchParseGsdFiles`
3. Shows `hx_engine` in both path template and dev path; no `gsd_engine`

---

### TC-06: No GSD hits across entire native boundary
**Steps:**
1. `grep -rn "gsd\|GSD\|Gsd" native/crates/engine/src/ native/npm/ | wc -l`
2. `grep -n "gsd\|GSD\|Gsd" src/resources/extensions/hx/native-parser-bridge.ts packages/native/src/hx-parser/index.ts packages/native/src/native.ts | wc -l`

**Expected:**
1. `0`
2. `0`

---

### TC-07: Build script uses hx_engine path strings
**Steps:**
1. `grep -n "gsd_engine\|hx_engine" native/scripts/build.js`

**Expected:**
- Lines show `hx_engine.dev.node` and `hx_engine.${platformTag}.node`
- No `gsd_engine` references

---

### TC-08: All 15 .mjs test fixtures use hx_engine paths
**Steps:**
1. `grep -rn "gsd_engine" packages/native/src/__tests__/ | wc -l`
2. `grep -rn "hx_engine" packages/native/src/__tests__/ | grep -c "hx_engine"`

**Expected:**
1. `0`
2. Non-zero (each of the 15 files has at least one `hx_engine` reference)

---

### TC-09: gsd-named files absent, hx-named files present
**Steps:**
1. `test ! -f src/tests/initial-gsd-header-filter.test.ts && echo "PASS" || echo "FAIL"`
2. `test ! -f src/tests/gsd-web-launcher-contract.test.ts && echo "PASS" || echo "FAIL"`
3. `test ! -f scripts/recover-gsd-1364.sh && test ! -f scripts/recover-gsd-1364.ps1 && test ! -f scripts/recover-gsd-1668.sh && test ! -f scripts/recover-gsd-1668.ps1 && echo "PASS" || echo "FAIL"`
4. `test ! -f src/resources/skills/create-skill/references/gsd-skill-ecosystem.md && echo "PASS" || echo "FAIL"`
5. `test -f src/tests/initial-hx-header-filter.test.ts && test -f src/tests/hx-web-launcher-contract.test.ts && test -f scripts/recover-hx-1364.sh && test -f scripts/recover-hx-1364.ps1 && test -f scripts/recover-hx-1668.sh && test -f scripts/recover-hx-1668.ps1 && test -f src/resources/skills/create-skill/references/hx-skill-ecosystem.md && echo "PASS" || echo "FAIL"`

**Expected:** All 5 checks print `PASS`

---

### TC-10: TypeScript compilation passes
**Steps:**
1. `npm run typecheck:extensions`

**Expected:**
- Exit code 0
- No TypeScript errors in stdout/stderr

---

### Edge Cases

**EC-01: PowerShell internal variables (known deferred):** Verify `$gsdDir` and `$GsdIsSymlink` still appear inside `scripts/recover-hx-1364.ps1` and `scripts/recover-hx-1668.ps1` — these are intentionally deferred to S05 and should NOT be treated as failures for S04.

**EC-02: migrate-gsd-to-hx.ts exclusion:** Verify that `grep -rn "gsd" src/resources/extensions/hx/migrate-gsd-to-hx.ts` produces hits — this file must NOT have been modified. Its GSD references are intentional preservation (R009).

