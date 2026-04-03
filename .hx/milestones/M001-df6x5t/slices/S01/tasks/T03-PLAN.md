---
estimated_steps: 25
estimated_files: 3
skills_used: []
---

# T03: Fix pre-existing type errors and run final typecheck verification

Fix the 8 pre-existing TypeScript errors that exist before any rename work, then run the full typecheck and grep verification to prove S01 is complete.

## Steps

1. Fix `src/resources/extensions/hx/tests/update-command.test.ts`:
   - The file declares `const hx = pi.commands.get("hx")` but then references `hxCmd` (undefined). At lines 37, 49, 57: change `const hx =` to `const hxCmd =`.

2. Fix `src/resources/extensions/hx/tests/autocomplete-regressions-1675.test.ts`:
   - Same pattern: `const hx = pi.commands.get("hx")` then uses `hxCmd`. Change `const hx =` to `const hxCmd =` at the declaration site (around line 38).

3. Fix `src/resources/extensions/hx/tests/integration/doctor-enhancements.test.ts`:
   - Line 217: `timing.gsdState` should be `timing.hxState` (the type was already renamed in a prior partial rename, but the test wasn't updated). After T01's rename this should reference `hxState`.
   - NOTE: T01/T02 batch sed may have already changed this. Verify and fix only if still broken.

4. Run `npm run typecheck:extensions` — must return 0 errors.

5. Run final comprehensive grep to prove zero GSD references remain (excluding allowed exceptions):
   ```bash
   grep -rn 'GSD[A-Za-z]\|Gsd[A-Z]\|gsd[A-Z]' --include='*.ts' --include='*.tsx' . | grep -v node_modules | grep -v dist | grep -v .next | grep -v migrate-gsd-to-hx | grep -v '.hx/' | grep -v 'gsd_engine' | grep -v 'native\.scanGsdTree\|native\.batchParseGsdFiles\|mod\.batchParseGsdFiles'
   ```
   Expected: 0 hits.

6. Verify migrate-gsd-to-hx.ts is unchanged:
   ```bash
   git diff src/resources/extensions/hx/migrate-gsd-to-hx.ts
   ```
   Expected: no output (no changes).

## Must-Haves

- All 8 pre-existing type errors fixed
- `npm run typecheck:extensions` passes with 0 errors
- Zero GSD/Gsd/gsd references remain in .ts/.tsx files (excluding migration code and native binary names)
- migrate-gsd-to-hx.ts confirmed unchanged

## Inputs

- ``src/resources/extensions/hx/tests/update-command.test.ts` — has pre-existing hxCmd error`
- ``src/resources/extensions/hx/tests/autocomplete-regressions-1675.test.ts` — has pre-existing hxCmd error`
- ``src/resources/extensions/hx/tests/integration/doctor-enhancements.test.ts` — has pre-existing timing.gsdState error`

## Expected Output

- ``src/resources/extensions/hx/tests/update-command.test.ts` — const hxCmd = pi.commands.get("hx") at all 3 sites`
- ``src/resources/extensions/hx/tests/autocomplete-regressions-1675.test.ts` — const hxCmd = pi.commands.get("hx")`
- ``src/resources/extensions/hx/tests/integration/doctor-enhancements.test.ts` — timing.hxState`

## Verification

npm run typecheck:extensions 2>&1 | tail -5  # must show no errors; exit code 0
