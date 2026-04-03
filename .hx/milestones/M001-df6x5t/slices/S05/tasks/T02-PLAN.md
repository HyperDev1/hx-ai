---
estimated_steps: 51
estimated_files: 15
skills_used: []
---

# T02: Rename GSD identifiers in scripts, CI/CD workflows, GitHub templates, and vscode-extension

This task renames all remaining GSD identifiers in build/deploy infrastructure: scripts, CI/CD workflow files, GitHub issue/PR templates, and the vscode-extension package-lock.json.

## Steps

1. **Rename script file content** using bulk perl -pi substitution (K001 pattern). Write /tmp/s05-t02-script-renames.pl with patterns:

   For `scripts/recover-hx-1364.ps1` (15 hits):
   - `$gsdIgnoreLine` → `$hxIgnoreLine`
   - `$GsdIsSymlink` → `$HxIsSymlink`
   - `$gsdDir` → `$hxDir`
   Apply with: `perl -pi -e 's/\$gsdIgnoreLine/\$hxIgnoreLine/g; s/\$GsdIsSymlink/\$HxIsSymlink/g; s/\$gsdDir/\$hxDir/g;' scripts/recover-hx-1364.ps1`

   For `scripts/parallel-monitor.mjs` (9 hits):
   - `findGsdLoader` → `findHxLoader`
   - `GSD_LOADER` → `HX_LOADER`
   - `GSD_MILESTONE_LOCK` → `HX_MILESTONE_LOCK`
   - `GSD_PROJECT_ROOT` → `HX_PROJECT_ROOT`
   - `GSD_PARALLEL_WORKER` → `HX_PARALLEL_WORKER`

   For `scripts/dist-test-resolve.mjs` (3 hits): `GSD_ALIASES` → `HX_ALIASES`
   For `scripts/pr-risk-check.mjs` (1 hit): `GSD2 PR Risk Report` → `HX PR Risk Report`
   For `scripts/rtk-benchmark.mjs` (1 hit): `GSD_RTK_PATH` → `HX_RTK_PATH`
   For `scripts/compile-tests.mjs` (1 hit): `gsdNodeModules` → `hxNodeModules` in comment
   For `scripts/verify-s04.sh` (2 hits): `has_gsd` → `has_hx`

2. **Rename CI/CD workflow content** using perl -pi substitution:

   For `.github/workflows/pipeline.yml` (~19 hits):
   - `gsd-ci-builder` → `hx-ci-builder`
   - `ghcr.io/gsd-build/gsd-pi` → `ghcr.io/gsd-build/hx-pi`
   - `gsd-pi@` → `hx-pi@` (npm package references)
   - `gsd-pi` → `hx-pi` (standalone references)
   - `ghcr.io/gsd-build/gsd-ci-builder` → `ghcr.io/gsd-build/hx-ci-builder`
   - `GSD v` → `HX v` in Discord webhook message
   - `npm i gsd-pi` → `npm i hx-pi`
   Note: Per D002/R020, rename package names in source only; no registry ops.

   For `.github/workflows/build-native.yml` (~18 hits):
   - `libgsd_engine` → `libhx_engine`
   - `gsd_engine.dll` → `hx_engine.dll`
   - `gsd_engine.node` → `hx_engine.node`
   - `@gsd-build/engine-` → `@hx-build/engine-`
   - `gsd-pi@` → `hx-pi@`
   - `gsd-pi` → `hx-pi` (npm view)

   For `.github/workflows/cleanup-dev-versions.yml` (1 hit): `gsd-pi` → `hx-pi`

   For `.github/workflows/ai-triage.yml` (4 hits):
   - `gsd-build/GSD-2` → `gsd-build/hx` (or appropriate repo name)
   - `GSD-2` → `HX` in project name references

3. **Rename GitHub templates**:
   - `.github/ISSUE_TEMPLATE/bug_report.yml`: Replace GSD references with HX, `/gsd` commands with `/hx`, `.gsd/` paths with `.hx/`, `gsd_version` id with `hx_version`
   - `.github/ISSUE_TEMPLATE/feature_request.yml`: Replace GSD references with HX, `/gsd` with `/hx`, `.gsd/` with `.hx/`
   - `.github/PULL_REQUEST_TEMPLATE.md`: Replace `gsd extension` → `hx extension`, `GSD workflow` → `HX workflow`

4. **Fix vscode-extension/package-lock.json**: Change `"name": "gsd-2"` → `"name": "hx"` on both line 2 and line 8.

5. **Verify** all changes with targeted grep.

## Constraints
- K001: synchronous foreground perl loops required for writes in git worktrees.
- D002/R020: Rename package names in source only — no npm registry operations.
- The `.github/workflows/ai-triage.yml` references `gsd-build/GSD-2` which is the GitHub repo path — per R021, actual repo rename is out of scope, but source references should be updated for consistency.
- Longer substitution strings must come before shorter substrings in perl scripts to prevent partial matches.

## Inputs

- ``scripts/recover-hx-1364.ps1` — has $gsdDir, $GsdIsSymlink, $gsdIgnoreLine (15 hits, deferred from S04)`
- ``scripts/parallel-monitor.mjs` — has findGsdLoader, GSD_LOADER, GSD_MILESTONE_LOCK (9 hits)`
- ``scripts/dist-test-resolve.mjs` — has GSD_ALIASES (3 hits)`
- ``scripts/pr-risk-check.mjs` — has GSD2 PR Risk Report (1 hit)`
- ``scripts/rtk-benchmark.mjs` — has GSD_RTK_PATH (1 hit)`
- ``scripts/compile-tests.mjs` — has gsdNodeModules comment (1 hit)`
- ``scripts/verify-s04.sh` — has has_gsd var (2 hits)`
- ``.github/workflows/pipeline.yml` — has gsd-pi, ghcr.io/gsd-build/ (19 hits)`
- ``.github/workflows/build-native.yml` — has gsd_engine.node, @gsd-build/engine-* (18 hits)`
- ``.github/workflows/cleanup-dev-versions.yml` — has gsd-pi (1 hit)`
- ``.github/workflows/ai-triage.yml` — has gsd-build/GSD-2 (4 hits)`
- ``.github/ISSUE_TEMPLATE/bug_report.yml` — has GSD references (10+ hits)`
- ``.github/ISSUE_TEMPLATE/feature_request.yml` — has GSD references (4 hits)`
- ``.github/PULL_REQUEST_TEMPLATE.md` — has gsd extension reference (1 hit)`
- ``vscode-extension/package-lock.json` — has "gsd-2" package name (2 hits)`

## Expected Output

- ``scripts/recover-hx-1364.ps1` — $gsdDir→$hxDir, $GsdIsSymlink→$HxIsSymlink, $gsdIgnoreLine→$hxIgnoreLine`
- ``scripts/parallel-monitor.mjs` — findGsdLoader→findHxLoader, GSD_LOADER→HX_LOADER, GSD_MILESTONE_LOCK→HX_MILESTONE_LOCK`
- ``scripts/dist-test-resolve.mjs` — GSD_ALIASES→HX_ALIASES`
- ``scripts/pr-risk-check.mjs` — GSD2→HX in report title`
- ``scripts/rtk-benchmark.mjs` — GSD_RTK_PATH→HX_RTK_PATH`
- ``.github/workflows/pipeline.yml` — gsd-pi→hx-pi, ghcr.io/gsd-build/gsd-*→hx-*`
- ``.github/workflows/build-native.yml` — gsd_engine→hx_engine, @gsd-build→@hx-build`
- ``.github/workflows/cleanup-dev-versions.yml` — gsd-pi→hx-pi`
- ``.github/workflows/ai-triage.yml` — GSD-2→HX references updated`
- ``.github/ISSUE_TEMPLATE/bug_report.yml` — all GSD references replaced with HX`
- ``.github/ISSUE_TEMPLATE/feature_request.yml` — all GSD references replaced with HX`
- ``.github/PULL_REQUEST_TEMPLATE.md` — gsd→hx reference updated`
- ``vscode-extension/package-lock.json` — gsd-2→hx`

## Verification

grep -rn 'gsd\|GSD\|Gsd' scripts/ .github/ vscode-extension/package-lock.json --include='*.ps1' --include='*.mjs' --include='*.sh' --include='*.js' --include='*.yml' --include='*.yaml' --include='*.md' --include='*.json' | grep -v node_modules | grep -v '.hx/' | grep -v migrate-gsd-to-hx | wc -l returns 0
