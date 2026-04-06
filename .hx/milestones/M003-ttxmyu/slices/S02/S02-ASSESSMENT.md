---
sliceId: S02
uatType: runtime-executable
verdict: PASS
date: 2026-04-05T18:10:00.000Z
---

# UAT Result — S02

## Checks

| Check | Mode | Result | Notes |
|-------|------|--------|-------|
| TC01: TypeScript compilation clean | runtime | PASS | `npx tsc --noEmit` → exit 0, no output |
| TC02: Full test suite passes (≥4155) | runtime | PASS | `✔ 4155 passed, 0 failed, 5 skipped` |
| TC03: HX_SLICE_LOCK in state.ts and dispatch-guard.ts (≥4) | artifact | PASS | `grep … \| wc -l` → 6 |
| TC04: No GSD references in 3 new source files | artifact | PASS | `grep -rn '\\bGSD\\b\\|\\bgsd\\b' … \| wc -l` → 0 |
| TC05: slice-parallel-eligibility tests pass | runtime | PASS | 7 leaf tests pass, 0 fail (suite wrappers also ✔); UAT expected "9" counted wrappers — 0 failures is the true signal |
| TC06: slice-parallel-conflict tests pass (≥4) | runtime | PASS | `ℹ pass 4, fail 0` |
| TC07: slice-parallel-orchestrator tests pass (4) | runtime | PASS | `ℹ pass 4, fail 0` |
| TC08: HX_SLICE_LOCK count in orchestrator (≥1) | artifact | PASS | `grep -c 'HX_SLICE_LOCK' slice-parallel-orchestrator.ts` → 4 |
| TC09: slice_locks table in initSchema (≥2 matches) | artifact | PASS | 5 matches: line 404 (initSchema CREATE TABLE), line 762 (v15 migration CREATE TABLE), lines 1777/1801/1812 (acquire/release/query helpers) |
| TC10: HX_SLICE_LOCK derive-state tests pass | runtime | PASS | 2 HX_SLICE_LOCK leaf tests ✔ + suite wrapper ✔; no failures |
| TC11: HX_PARALLEL_DEPTH guard present in orchestrator (≥1) | artifact | PASS | Lines 117 (comment), 137 (read), 148 (set on child env), 239 (nested-spawn guard) — 4 hits |
| EC01: dispatch-guard dependency check not skipped by HX_SLICE_LOCK | artifact | PASS | `continue` is inside the positional `else` branch; dependency check loop runs before the else branch and is not skipped |
| EC02: file-overlap slices are warned, not excluded | runtime | PASS | TC05 test "file overlap detection — two eligible slices sharing a file" ✔ (warning path exercised) |
| EC03: fresh :memory: DB includes slice_locks table | runtime | PASS | TC07 orchestrator tests use :memory: DB and all 4 pass — confirms initSchema fix works |

## Overall Verdict

PASS — All 14 checks passed: TypeScript clean, 4155 tests pass, HX_SLICE_LOCK correctly isolated in state.ts/dispatch-guard.ts, 3 new parallelism modules are GSD-free, all targeted test files pass with 0 failures, and both edge cases (dependency-check ordering and fresh in-memory DB) confirmed correct.

## Notes

**TC05 count discrepancy:** The UAT expected `✔ 9 passed` but `node --test` reports `ℹ pass 7`. This is because the node test runner's `pass` counter counts only leaf tests (individual `it`/`test` nodes). The 2 `✔` suite-level wrappers (`analyzeSliceParallelEligibility` and `formatSliceEligibilityReport`) are shown as passing in the tree output but are not counted in the `ℹ pass` metric. All 7 leaf tests are ✔ and fail count is 0 — this is a genuine pass.

**TC09:** The `slice_locks` table appears in both `initSchema` (line 404, the fix for :memory: DBs) and the v15 migration (line 762), plus 3 query helpers — well above the ≥2 threshold.

**EC01 depth confirmation:** The `continue` that skips positional ordering appears only inside the `else` branch (i.e., when the positional check would fire). Declared dependency checks are in the loop body before the `else` branch and are unaffected by `HX_SLICE_LOCK`. This preserves the invariant that locked workers still respect explicit `depends` declarations.
