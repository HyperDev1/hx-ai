# Requirements

This file is the explicit capability and coverage contract for the project.

## Validated

All R001–R012 requirements were validated during M001-df6x5t. See VALIDATION.md for full evidence.

### R001 — All TypeScript type/interface names use HX prefix
- Class: core-capability
- Status: validated
- Description: Every `GSD*` type and interface renamed to `HX*` / `Hx*` equivalents (~37 unique types, 100+ files).
- Source: user
- Primary owning slice: M001-df6x5t/S01
- Validation: `grep -rn 'GSD[A-Za-z]|Gsd[A-Z]|gsd[A-Z]' --include='*.ts' --include='*.tsx'` returns 0 hits (excl. migrate-gsd-to-hx.ts, batchParseGsdFiles N-API call, gsd_engine path strings). npm run typecheck:extensions exits 0.

### R002 — All environment variables use HX_ prefix
- Class: core-capability
- Status: validated
- Description: Every `GSD_*` environment variable renamed to `HX_*` (~43 unique env vars across all source types).
- Source: user
- Primary owning slice: M001-df6x5t/S02
- Validation: `grep -rn 'GSD_'` across all .ts/.tsx/.js/.sh/.yml/.yaml/.json (excl node_modules/dist/.next/.hx/.git) returns 0 hits.

### R003 — All DB tool names use hx_ prefix
- Class: core-capability
- Status: validated
- Description: All 14 canonical tool names and aliases changed from `gsd_*` to `hx_*`. All 29 prompt files updated.
- Source: user
- Primary owning slice: M001-df6x5t/S03
- Validation: `grep -rn 'gsd_' src/resources/extensions/hx/prompts/` returns 0. 13 registerAlias calls in db-tools.ts. All 12 hx test files assert hx_* names.

### R004 — Native Rust engine uses hx naming
- Class: core-capability
- Status: validated
- Description: Rust source `gsd_parser.rs` → `hx_parser.rs`; N-API functions `batch_parse_hx_files`/`scan_hx_tree`; binaries `hx_engine.*.node`; packages `@hx-build/engine-*`.
- Source: user
- Primary owning slice: M001-df6x5t/S04
- Validation: hx_parser.rs exists; gsd_parser.rs absent; lib.rs uses `mod hx_parser`; all 5 @hx-build/engine-* platform packages updated; native.ts loads hx_engine.*.node. Note: D005 corrected scope from @hyperlab to @hx-build to match existing require path in native.ts.

### R005 — Internal variable names use hx prefix
- Class: quality-attribute
- Status: validated
- Description: All internal variable names using `gsd` prefix renamed to `hx` equivalents (~30 unique names, ~250+ usages across ~60 files).
- Source: user
- Primary owning slice: M001-df6x5t/S01
- Supporting slices: S05
- Validation: grep for all gsd* variable patterns returns 0 hits outside intentionally preserved files.

### R006 — Web module uses HX naming
- Class: core-capability
- Status: validated
- Description: Package name `hx-web`; `HX_WEB_*` env vars throughout; HX-prefixed React components; pty-manager.ts prefix filter uses `HX_WEB_`.
- Source: user
- Primary owning slice: M001-df6x5t/S02
- Validation: web/package-lock.json shows hx-web; pty-manager.ts uses HX_WEB_ prefix; rpc-mode.ts reads HX_WEB_BRIDGE_TUI.

### R007 — Docker, CI/CD, and docs use HX naming
- Class: core-capability
- Status: validated
- Description: All Docker, CI/CD workflows, .plans/, docs/, CHANGELOG.md, README.md use HX naming.
- Source: user
- Primary owning slice: M001-df6x5t/S05
- Validation: All 5 GitHub Actions workflows updated; docker/entrypoint.sh and docker-compose.full.yaml updated; all docs and .plans/ files updated (~330 hits across 17 .plans/ files).

### R008 — File renames from gsd to hx
- Class: core-capability
- Status: validated
- Description: All gsd-named files renamed: gsd_parser.rs→hx_parser.rs, 4 test files git-mv'd to hx-*, 7 native platform package dirs renamed, recovery scripts renamed.
- Source: user
- Primary owning slice: M001-df6x5t/S04
- Supporting slices: S01, S05
- Validation: All old gsd-named files absent; new hx-named present. `test ! -f src/resources/extensions/hx/tests/gsd-db.test.ts` passes; `test -f src/resources/extensions/hx/tests/hx-db.test.ts` passes.

### R009 — migrate-gsd-to-hx.ts remains untouched
- Class: constraint
- Status: validated
- Description: The migration file `src/resources/extensions/hx/migrate-gsd-to-hx.ts` preserved with all 4 GSD-named exports intact.
- Source: user
- Validation: `git diff src/resources/extensions/hx/migrate-gsd-to-hx.ts | wc -l` → 0 throughout all slices. File has 4 GSD-named exports intact.

### R010 — TypeScript compilation passes after rename
- Class: quality-attribute
- Status: validated
- Description: `npm run typecheck:extensions` passes with zero errors after all renames.
- Source: inferred
- Primary owning slice: M001-df6x5t/S01
- Supporting slices: S02, S03, S04, S05
- Validation: npm run typecheck:extensions exits 0 — verified after S01, S02, S03, S04, S05, and independently during milestone validation.

### R011 — All existing tests pass after rename
- Class: quality-attribute
- Status: partially-validated
- Description: Test files renamed and content updated; TypeScript compilation passes. Unit/integration test execution not runnable in worktree (missing esbuild dev dependency).
- Source: inferred
- Primary owning slice: M001-df6x5t/S05
- Validation: All test file renames complete; all grep checks pass; typecheck:extensions exits 0. Full test:unit/test:integration execution must be verified in main repo after merge.

### R012 — Zero gsd/GSD references remain (excluding migration code)
- Class: core-capability
- Status: validated
- Description: Final comprehensive grep across all file types returns 0 hits outside migrate-gsd-to-hx.ts and auto-generated package-lock.json.
- Source: user
- Primary owning slice: M001-df6x5t/S05
- Validation: `grep -rn 'gsd|GSD|Gsd' . --include='*.ts' --include='*.tsx' --include='*.js' --include='*.mjs' --include='*.sh' --include='*.ps1' --include='*.yml' --include='*.yaml' --include='*.md' --include='*.rs' --include='*.json' --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.next --exclude-dir=.git --exclude-dir=.hx | grep -v migrate-gsd-to-hx | grep -v 'package-lock.json' | wc -l` → 0.

## Active

(none — all requirements validated by M001-df6x5t)

## Deferred

(none)

## Out of Scope

### R020 — npm registry package rename (gsd-pi → @hyperlab/hx)
- Class: constraint
- Status: out-of-scope
- Description: Actual npm registry publish is outside this milestone's scope. Source files updated but no npm publish performed.
- Validation: n/a

### R021 — GitHub org/repo rename (gsd-build → hyperlab)
- Class: constraint
- Status: out-of-scope
- Description: GitHub org/repo URL references updated in source, but no actual GitHub org/repo rename performed.
- Validation: n/a

## Traceability

| ID | Class | Status | Primary owner | Evidence |
|---|---|---|---|---|
| R001 | core-capability | validated | M001-df6x5t/S01 | grep returns 0 GSD type hits; typecheck exits 0 |
| R002 | core-capability | validated | M001-df6x5t/S02 | grep -rn 'GSD_' returns 0 across all source |
| R003 | core-capability | validated | M001-df6x5t/S03 | gsd_ in prompts → 0; 13 registerAlias calls |
| R004 | core-capability | validated | M001-df6x5t/S04 | hx_parser.rs exists; @hx-build packages updated |
| R005 | quality-attribute | validated | M001-df6x5t/S01 | gsd variable grep returns 0 |
| R006 | core-capability | validated | M001-df6x5t/S02 | hx-web package name; HX_WEB_* env vars |
| R007 | core-capability | validated | M001-df6x5t/S05 | all CI/Docker/docs updated; grep returns 0 |
| R008 | core-capability | validated | M001-df6x5t/S04 | all gsd-named files absent; hx-named present |
| R009 | constraint | validated | all slices | git diff migrate-gsd-to-hx.ts = 0 lines |
| R010 | quality-attribute | validated | M001-df6x5t/S01 | typecheck:extensions exits 0 (verified 5+ times) |
| R011 | quality-attribute | partially-validated | M001-df6x5t/S05 | files renamed; typecheck passes; runtime tests deferred to post-merge |
| R012 | core-capability | validated | M001-df6x5t/S05 | comprehensive grep returns 0 hits |
| R020 | constraint | out-of-scope | none | n/a |
| R021 | constraint | out-of-scope | none | n/a |

## Coverage Summary

- Requirements validated: 11 (R001–R010, R012)
- Partially validated: 1 (R011 — test execution deferred to post-merge)
- Out of scope: 2 (R020, R021)
- Active requirements remaining: 0
