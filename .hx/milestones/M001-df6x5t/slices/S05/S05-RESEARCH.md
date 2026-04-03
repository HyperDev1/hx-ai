# S05: Docs, CI/CD, Tests & Final Verification — Research

**Date:** 2026-04-04
**Status:** Ready for planning

## Summary

S05 is the final cleanup slice. S01–S04 renamed all TypeScript types, env vars, tool names, and Rust/native bindings. What remains is a mix of: (1) production source code with ~5 remaining GSD identifiers, (2) ~40 test files with gsd-named local variables or function names, (3) 4 gsd-named test files needing `git mv`, (4) CI/CD workflows with broken paths and gsd-named package references, (5) docs and .plans/ with historical GSD references.

The largest risk is `ci.yml` line 233: it still references the deleted path `src/resources/extensions/gsd/tests/` (that dir was renamed to `hx` in S01) — this is a **live CI break** that must be fixed. The second risk is that R012's stated verification command (`grep -rni "gsd"`) will produce ~300 false-positive hits from identifiers like `SettingsData` (which contains "gsD" as a case-insensitive substring). The S05 task plan must refine the final verification grep to use word-boundary or case-sensitive matching.

## Recommendation

Split into three tasks: T01 handles the 5 production source code hits + the critical CI path fix; T02 handles all test files (renames + content) + scripts; T03 handles docs/plans/workflows + final verification run.

The `SettingsData` false-positive issue means R012 needs its verification grep updated to use case-sensitive matching or a word-boundary approach. The milestone context's stated grep (`grep -rni "gsd"`) should be refined to `grep -rn 'gsd\|GSD' --include pattern` using appropriate word-boundary exclusions, OR simply accepted as passing after false-positive exclusions are documented.

## Implementation Landscape

### Key Files — Production Source (5 hits to rename)

- `src/resources/extensions/hx/bootstrap/register-extension.ts:31-38` — `_gsdEpipeGuard` internal function name (3 hits) → `_hxEpipeGuard`
- `src/resources/extensions/hx/detection.ts:288,356` — `detectV2Gsd()` function (2 hits) → `detectV2Hx()`

### Key Files — Test Files (content renames needed)

- `src/tests/integration/e2e-headless.test.ts` — `runGsd()`, `spawnGsd()` local function names → `runHx()`, `spawnHx()` (~7 hits)
- `src/tests/integration/e2e-smoke.test.ts` — `runGsd()` local function name → `runHx()` (~20 hits)
- `src/resources/extensions/hx/tests/integration/git-service.test.ts:484,536` — `GSD-Unit:` in assertion strings → `HX-Unit:` (2 hits; production `git-service.ts:541` already generates `HX-Unit:`)
- `src/resources/extensions/hx/tests/integration/parallel-merge.test.ts:171,181,216` — `GSD-Milestone:` in assertion strings → `HX-Milestone:` (3 hits; production `auto-worktree.ts:1342,1344` generates `HX-Milestone:`)
- `src/resources/extensions/hx/tests/debug-logger.test.ts` — `createTempGsdDir()` helper function (~10 calls)
- `src/resources/extensions/hx/tests/auto-start-cold-db-bootstrap.test.ts` — `gsd2`, `gsd3` local vars, `openDatabase(gsdDbPath)` assertion string
- `src/resources/extensions/hx/tests/integration/inherited-repo-home-dir.test.ts` — `origGsdHome`, `origGsdStateDir` vars, `tempGsdHome` var, `isProjectGsd` in comment
- `src/resources/extensions/hx/tests/worktree-db-same-file.test.ts` — `mainGsd`, `wtGsd` local vars
- `src/resources/extensions/hx/tests/session-lock-multipath.test.ts:136-137` — `gsd2` local var
- `src/resources/extensions/hx/tests/visualizer-data.test.ts:197-198` — `resolveGsdRootFile` assertion string (CAUTION: `commands-handlers.ts` now exports `resolveHxRootFile` — check if this assertion targets the actual function name or string literal)
- `src/resources/extensions/hx/tests/marketplace-test-fixtures.ts:36-37` — `gsd2Root` var
- `src/resources/extensions/hx/tests/rewrite-count-persist.test.ts` — `srcGsd`, `dstGsd` local vars
- `src/resources/extensions/hx/tests/preferences-worktree-sync.test.ts` — `srcGsd`, `dstGsd` local vars
- `src/resources/extensions/hx/tests/memory-leak-guards.test.ts` — `externalGsd` local var
- `src/resources/extensions/hx/tests/integration/doctor.test.ts` — `msGsd`, `bGsd`, `mhGsd` local vars
- `tests/repro-worktree-bug/verify-integration.mjs` — `gsdRoot`, `GSD_HOME`, `GSD_PROJECT_ROOT`, `gsdHome`, `gsdIdx`, `gsdMarker` vars (40 hits)
- `tests/repro-worktree-bug/repro.mjs` — same pattern (17 hits)
- `tests/repro-worktree-bug/verify-fix.mjs` — same pattern (28 hits)

### Key Files — gsd-named test files to `git mv`

These files have no `gsd` content inside but need file renames (R008 scope):
- `src/resources/extensions/hx/tests/gsd-db.test.ts` → `hx-db.test.ts`
- `src/resources/extensions/hx/tests/gsd-inspect.test.ts` → `hx-inspect.test.ts`
- `src/resources/extensions/hx/tests/gsd-recover.test.ts` → `hx-recover.test.ts`
- `src/resources/extensions/hx/tests/gsd-tools.test.ts` → `hx-tools.test.ts`

**CAUTION**: Any test or CI file that imports/references these by their current `gsd-*` filenames must be updated simultaneously. Check with:
```bash
grep -rn 'gsd-db\|gsd-inspect\|gsd-recover\|gsd-tools' . --include='*.ts' --include='*.yml' | grep -v '.hx/'
```

### Key Files — Scripts

- `scripts/recover-hx-1364.ps1:106-355` — Internal PowerShell vars `$gsdDir` → `$hxDir`, `$GsdIsSymlink` → `$HxIsSymlink`, `$gsdIgnoreLine` → `$hxIgnoreLine` (12 hits). **S04 carve-out, must fix now.**
- `scripts/parallel-monitor.mjs:278,308,317,324-336` — `findGsdLoader()` → `findHxLoader()`, `GSD_LOADER` → `HX_LOADER`, `GSD_MILESTONE_LOCK`/`GSD_PROJECT_ROOT`/`GSD_PARALLEL_WORKER` → `HX_*` (9 hits)
- `scripts/pr-risk-check.mjs:241` — `'GSD2 PR Risk Report'` string → `'HX PR Risk Report'` (1 hit)
- `scripts/dist-test-resolve.mjs:19-31` — `GSD_ALIASES` const → `HX_ALIASES` (3 hits)
- `scripts/compile-tests.mjs:203` — `gsdNodeModules` in comment → `hxNodeModules` (1 hit)
- `scripts/verify-s04.sh:165,174` — `has_gsd` local shell var → `has_hx` (harmless but verbose; may be acceptable to leave)
- `vscode-extension/package-lock.json:2,8` — `"name": "gsd-2"` → `"name": "hx"` (matches `package.json`)

### Key Files — CI/CD Workflows (CRITICAL)

- `.github/workflows/ci.yml:233,239,240` — **BROKEN PATH**: references `src/resources/extensions/gsd/tests/` (this directory no longer exists — was renamed to `hx`). Fix: `gsd` → `hx` in these paths.
- `.github/workflows/ci.yml:90-93` — `.gsd/` legacy directory check: can be updated to check for both `.gsd/` and `.hx/` tracking, or just update the error message.
- `.github/workflows/pipeline.yml:23,57,84-134,205,231,244-279` — `gsd-pi`, `ghcr.io/gsd-build/`, `gsd-ci-builder` references (19 hits). Per D002/R020: rename in source, no actual registry ops.
- `.github/workflows/build-native.yml:80-295` — `gsd_engine.node` binary paths → `hx_engine.node`, `@gsd-build/engine-*` → `@hx-build/engine-*`, `gsd-pi` → `hx-pi` (18 hits).
- `.github/workflows/cleanup-dev-versions.yml` — `gsd-pi` package reference (1 hit).
- `.github/workflows/ai-triage.yml` — `GSD-2` project name, `gsd-build` org (4 hits).
- `.github/ISSUE_TEMPLATE/bug_report.yml` — GSD references in template text (10 hits).
- `.github/ISSUE_TEMPLATE/feature_request.yml` — GSD references (4 hits).
- `.github/PULL_REQUEST_TEMPLATE.md` — one GSD reference (1 hit).

### Key Files — Docs

- `docs/configuration.md:158-161` — Table still shows `GSD_HOME`, `GSD_PROJECT_ID`, `GSD_STATE_DIR`, `GSD_CODING_AGENT_DIR` (4 hits) → `HX_*`
- `docs/FILE-SYSTEM-MAP.md:74,686,868` — `GSD_HOME`, `GSDAppShell`, `gsd_parser.rs` references (4 hits)
- `docs/ADR-001-branchless-worktree-architecture.md` — `GSD_DURABLE_PATHS` (3 hits)
- `docs/PRD-branchless-worktree-architecture.md` — `GSD_DURABLE_PATHS` (2 hits)
- `docs/ci-cd-pipeline.md:175` — `GSD_FIXTURE_MODE`, `GSD_FIXTURE_DIR` (1 hit)
- `docs/web-interface.md:43,53` — `GSD_WEB_PROJECT_CWD` (2 hits)
- `docs/parallel-orchestration.md:76,253-254` — `GSD_MILESTONE_LOCK`, `GSD_PARALLEL_WORKER` (3 hits)
- `docs/superpowers/plans/2026-03-17-cicd-pipeline.md` and `docs/superpowers/specs/` — various (several hits)
- `docker/README.md:127` — `GSD_VERSION` build arg (1 hit)
- `README.md:22` — `GSD_RTK_DISABLED` reference (1 hit)
- `CHANGELOG.md` — 8 historical entries referencing GSD (debatable: these are release history; could update with HX equivalents for cross-reference)

### Key Files — .plans/ (330+ hits)

All 17 plan files under `.plans/` contain historical GSD references. These are internal planning documents. They need bulk-rename via perl -pi loop (consistent with K001 pattern). Key substitutions: `GSD[A-Z]` → `HX_?`, `gsd_` → `hx_`, `gsd-parser.rs` → `hx-parser.rs`, `ParsedGsdFile` → `ParsedHxFile`, etc.

### False-Positive Warning: `SettingsData`

The word `SettingsData` contains `gsD` as a case-insensitive substring match. So does `computeSavingsDelta`. The R012 verification grep `grep -rni "gsd"` will always hit these. **Do not rename `SettingsData`** — it's unrelated to the GSD→HX rename. Instead, refine the final verification command to use a smarter pattern that excludes these false positives, e.g.:

```bash
grep -rn 'GSD[A-Za-z_]\|gsd[A-Za-z_]\|GSD_\|_gsd\b' . \
  --include='*.ts' --include='*.tsx' --include='*.js' --include='*.mjs' \
  --include='*.sh' --include='*.ps1' --include='*.yml' --include='*.yaml' \
  --include='*.md' --include='*.rs' \
  --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.next \
  --exclude-dir=.git --exclude-dir=.hx \
  | grep -v migrate-gsd-to-hx \
  | wc -l
```

This excludes the false-positive substring matches while catching all actual GSD identifiers.

### Build Order

1. **First**: Fix `ci.yml` broken path (`src/resources/extensions/gsd/tests/` → `src/resources/extensions/hx/tests/`) — this is a live CI break.
2. **Then**: Fix 5 production TypeScript hits (`_gsdEpipeGuard`, `detectV2Gsd`) — verify typecheck passes.
3. **Then**: Bulk rename test files (both file renames via `git mv` and content renames) — verify using refined grep.
4. **Then**: Scripts, docs, workflows, .plans/ — bulk substitutions.
5. **Finally**: Run `npm run typecheck:extensions` and final grep verification.

### Verification Approach

```bash
# 1. TypeScript compiles
npm run typecheck:extensions

# 2. Refined final grep (excludes false positives)
grep -rn 'GSD[A-Za-z_]\|gsd[A-Za-z_]\|GSD_\|_gsd\b\|gsd-[a-z]' . \
  --include='*.ts' --include='*.tsx' --include='*.js' --include='*.mjs' \
  --include='*.sh' --include='*.ps1' --include='*.yml' --include='*.yaml' \
  --include='*.md' --include='*.rs' \
  --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.next \
  --exclude-dir=.git --exclude-dir=.hx \
  | grep -v migrate-gsd-to-hx \
  | wc -l
# → Target: 0

# 3. Verify git mv'd files exist and old names are gone
test -f src/resources/extensions/hx/tests/hx-db.test.ts && echo "ok"
test ! -f src/resources/extensions/hx/tests/gsd-db.test.ts && echo "ok"

# 4. Verify ci.yml path is fixed
grep 'extensions/gsd' .github/workflows/ci.yml | wc -l  # → 0
```

## Constraints

- K001 pattern applies: synchronous foreground perl loops required for writes in git worktrees.
- `migrate-gsd-to-hx.ts` must not be touched (R009).
- `gsd_engine` binary path strings in test `.mjs` files are already clean (S04 did those).
- `batchParseGsdFiles` runtime call in `hx-parser/index.ts` is already clean (S04 did that).
- `CHANGELOG.md` historical entries: update is appropriate for consistency but keep prose accurate (these are historical records of when features were named GSD).
- `package-lock.json` stale `@gsd-build/daemon` etc. names: these are auto-generated from `package.json` entries. The `package.json` entries are already correct (`@hyperlab/hx-daemon`). Package-lock divergence is acceptable until `npm install` is re-run; no manual edit needed.
- `vscode-extension/package-lock.json` `"name": "gsd-2"` should be updated to match `package.json` name `"hx"` via direct edit (single field).

## Common Pitfalls

- **visualizer-data.test.ts assertion for `resolveGsdRootFile`**: The test asserts a string appears in source code. The source now uses `resolveHxRootFile`. The test assertion needs to be updated to check for `resolveHxRootFile`. Do NOT add a `resolveGsdRootFile` alias.
- **git mv vs cp for test files**: Use `git mv` for the 4 gsd-named test files to preserve history. The files have no content to update (already clean).
- **GSD-Unit/GSD-Milestone in test assertions**: These are *wrong* — the production code already generates `HX-Unit:` and `HX-Milestone:`. Fixing these actually corrects failing tests, not just renames.
- **ci.yml `extensions/gsd` path**: This is a real broken CI path, not just a rename. The fix is `gsd` → `hx` in those 3 lines.
- **`$gsdDir` in recover-hx-1364.ps1**: This is a complex PowerShell script — rename all 3 internal vars globally but do not change the logic. Use `sed` for bulk replacement.
- **CHANGELOG edits**: Update in-place. These are historical notes — preserve the version numbers and dates, only rename the identifiers.
