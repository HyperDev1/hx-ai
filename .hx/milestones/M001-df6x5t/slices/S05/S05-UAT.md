# S05: Docs, CI/CD, Tests & Final Verification — UAT

**Milestone:** M001-df6x5t
**Written:** 2026-04-03T22:07:54.846Z

# S05 UAT: Docs, CI/CD, Tests & Final Verification

## UAT Type
UAT mode: artifact-driven

## Purpose
Verify that S05 delivered zero remaining GSD identifiers outside migrate-gsd-to-hx.ts, that TypeScript compiles cleanly, and that all file renames are complete.

## Preconditions
- Working directory: `/Users/beratcan/Desktop/GithubProjects/hx-ai/.hx/worktrees/M001-df6x5t`
- Node.js and npm installed
- TypeScript compiler available via `npm run typecheck:extensions`

## Test Cases

### TC-01: TypeScript compilation passes (R010)
**Steps:**
1. Run `npm run typecheck:extensions`
**Expected:** exits 0, no error output

### TC-02: Production source identifiers renamed (R005)
**Steps:**
1. Run `grep -rn '_gsdEpipeGuard\|detectV2Gsd\|gsdPrefix' src/resources/extensions/hx/bootstrap/register-extension.ts src/resources/extensions/hx/detection.ts web/components/hx/ 2>/dev/null | wc -l`
**Expected:** 0

### TC-03: Test file renames complete (R008)
**Steps:**
1. `test ! -f src/resources/extensions/hx/tests/gsd-db.test.ts && echo PASS`
2. `test -f src/resources/extensions/hx/tests/hx-db.test.ts && echo PASS`
3. `test ! -f src/resources/extensions/hx/tests/gsd-inspect.test.ts && echo PASS`
4. `test -f src/resources/extensions/hx/tests/hx-inspect.test.ts && echo PASS`
5. `test ! -f src/resources/extensions/hx/tests/gsd-recover.test.ts && echo PASS`
6. `test -f src/resources/extensions/hx/tests/hx-recover.test.ts && echo PASS`
7. `test ! -f src/resources/extensions/hx/tests/gsd-tools.test.ts && echo PASS`
8. `test -f src/resources/extensions/hx/tests/hx-tools.test.ts && echo PASS`
**Expected:** all 8 output "PASS"

### TC-04: CI/CD broken path fixed (R007)
**Steps:**
1. Run `grep 'extensions/gsd' .github/workflows/ci.yml | wc -l`
**Expected:** 0

### TC-05: CI/CD workflows fully renamed (R007)
**Steps:**
1. Run `grep -rn 'gsd\|GSD\|Gsd' .github/workflows/ .github/ISSUE_TEMPLATE/ .github/PULL_REQUEST_TEMPLATE.md --include='*.yml' --include='*.yaml' --include='*.md' | wc -l`
**Expected:** 0

### TC-06: Scripts fully renamed (R005, R002)
**Steps:**
1. Run `grep -rn 'gsd\|GSD\|Gsd' scripts/ --include='*.ps1' --include='*.mjs' --include='*.sh' | grep -v node_modules | grep -v migrate-gsd-to-hx | wc -l`
**Expected:** 0

### TC-07: Docs and README fully renamed (R007)
**Steps:**
1. Run `grep -rn 'gsd\|GSD\|Gsd' docs/ docker/README.md README.md CHANGELOG.md --include='*.md' | grep -v migrate-gsd-to-hx | wc -l`
**Expected:** 0

### TC-08: Test file content fully renamed
**Steps:**
1. Run `grep -rn 'runGsd\|spawnGsd\|createTempGsdDir\|GSD-Unit\|GSD-Milestone\|mainGsd\|wtGsd\|srcGsd\|dstGsd\|gsd2Root' --include='*.ts' --include='*.mjs' . | grep -v node_modules | grep -v '.hx/' | grep -v migrate-gsd-to-hx | wc -l`
**Expected:** 0

### TC-09: Final comprehensive grep — R012 proof
**Steps:**
1. Run:
```bash
grep -rn 'gsd\|GSD\|Gsd' . \
  --include='*.ts' --include='*.tsx' --include='*.js' --include='*.mjs' \
  --include='*.sh' --include='*.ps1' --include='*.yml' --include='*.yaml' \
  --include='*.md' --include='*.rs' --include='*.json' \
  --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.next \
  --exclude-dir=.git --exclude-dir=.hx \
  | grep -v migrate-gsd-to-hx \
  | grep -v 'package-lock.json' \
  | wc -l
```
**Expected:** 0

### TC-10: migrate-gsd-to-hx.ts preserved (R009)
**Steps:**
1. `test -f src/resources/extensions/hx/migrate-gsd-to-hx.ts && echo PASS`
2. `grep -c 'handleGsdToHxMigration\|migrateProjectGsdToHx\|migrateGlobalGsdToHx' src/resources/extensions/hx/migrate-gsd-to-hx.ts`
**Expected:** PASS, count ≥ 3

## Edge Cases

### EC-01: ci.yml `.gsd/` directory check is intentional
The `.github/workflows/ci.yml` lines 90-93 check that `.gsd/` does NOT exist in the repo (legacy directory guard). This is correct behavior — the `.gsd` string here should remain unchanged.

### EC-02: package-lock.json excluded from grep
Root `package-lock.json` is auto-generated and excluded from the final grep. It will be correct after the next `npm install`.

### EC-03: .plans/ files updated
If .plans/ directory exists, verify: `grep -rn 'gsd\|GSD\|Gsd' .plans/ --include='*.md' | wc -l` → 0
