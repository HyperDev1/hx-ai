---
estimated_steps: 75
estimated_files: 14
skills_used: []
---

# T03: Rename GSD_* in tests, scripts, CI, Docker and run final verification

Rename all remaining GSD_* references in tests/, scripts/, .github/workflows/pipeline.yml, and docker/. Then run exhaustive grep verification confirming zero GSD_ references remain in the entire codebase (outside .hx/ and node_modules).

Use synchronous foreground perl -pi loops (K001 pattern from S01).

## Steps

1. Write a perl rename script to /tmp/s02-t03-misc.pl with all substitutions:
   - GSD_SMOKE_BINARY → HX_SMOKE_BINARY
   - GSD_NON_INTERACTIVE → HX_NON_INTERACTIVE
   - GSD_LIVE_TESTS → HX_LIVE_TESTS
   - GSD_FIXTURE_MODE → HX_FIXTURE_MODE
   - GSD_FIXTURE_DIR → HX_FIXTURE_DIR
   - GSD_SKIP_RTK_INSTALL → HX_SKIP_RTK_INSTALL
   - GSD_RTK_DISABLED → HX_RTK_DISABLED
   - GSD_TEST_AUTH_PATH → HX_TEST_AUTH_PATH
   - GSD_BUNDLED_EXTENSION_PATHS → HX_BUNDLED_EXTENSION_PATHS
   - GSD_IS_SYMLINK → HX_IS_SYMLINK
   - GSD_IGNORE_LINE → HX_IGNORE_LINE
   - GSD_USER → HX_USER
   - GSD_HOME → HX_HOME
   - GSD_DIR → HX_DIR
   - GSD_VERSION → HX_VERSION
   Order longer strings before shorter substrings.

2. Apply to test files:
   ```
   for FILE in \
     tests/smoke/test-help.ts \
     tests/smoke/test-init.ts \
     tests/smoke/test-version.ts \
     tests/live-regression/run.ts \
     tests/live/run.ts \
     tests/fixtures/provider.ts \
     tests/fixtures/record.ts; do
     perl -pi /tmp/s02-t03-misc.pl "$FILE"
   done
   ```

3. Apply to scripts:
   ```
   for FILE in \
     scripts/postinstall.js \
     scripts/recover-gsd-1364.sh \
     scripts/verify-s03.sh \
     scripts/verify-s04.sh; do
     perl -pi /tmp/s02-t03-misc.pl "$FILE"
   done
   ```

4. Apply to CI workflow:
   ```
   perl -pi /tmp/s02-t03-misc.pl .github/workflows/pipeline.yml
   ```

5. Apply to Docker files:
   ```
   perl -pi /tmp/s02-t03-misc.pl docker/entrypoint.sh
   perl -pi /tmp/s02-t03-misc.pl docker/docker-compose.full.yaml
   ```

6. Run exhaustive final verification — the slice success criteria:
   ```
   grep -rn 'GSD_' --include='*.ts' --include='*.tsx' --include='*.js' --include='*.sh' --include='*.yml' --include='*.yaml' --include='*.json' . | grep -v node_modules | grep -v dist | grep -v .next | grep -v '.hx/' | grep -v '.git/' | wc -l
   ```
   Must be 0.

7. Verify web/package-lock.json:
   ```
   grep '"name"' web/package-lock.json | head -2
   ```
   Both lines must show hx-web.

8. Run `npm run typecheck:extensions` — must exit 0.

## Must-Haves

- All GSD_SMOKE_BINARY → HX_SMOKE_BINARY in tests/smoke/*.ts and tests/live-regression/run.ts
- GSD_NON_INTERACTIVE → HX_NON_INTERACTIVE in test files
- GSD_LIVE_TESTS → HX_LIVE_TESTS in tests/live/run.ts
- GSD_FIXTURE_MODE/DIR → HX_FIXTURE_MODE/DIR in tests/fixtures/*.ts
- GSD_SKIP_RTK_INSTALL/GSD_RTK_DISABLED → HX_* in scripts/postinstall.js
- All bash variable renames in docker/entrypoint.sh and scripts/recover-gsd-1364.sh
- CI pipeline.yml env vars renamed
- docker-compose.full.yaml build arg renamed
- scripts/verify-s03.sh and verify-s04.sh updated
- Exhaustive grep returns 0 GSD_ hits
- npm run typecheck:extensions passes

## Inputs

- ``tests/smoke/test-help.ts` — contains GSD_SMOKE_BINARY env var reads`
- ``tests/smoke/test-init.ts` — contains GSD_SMOKE_BINARY and GSD_NON_INTERACTIVE env vars`
- ``tests/smoke/test-version.ts` — contains GSD_SMOKE_BINARY env var reads`
- ``tests/live-regression/run.ts` — contains GSD_SMOKE_BINARY and GSD_NON_INTERACTIVE`
- ``tests/live/run.ts` — contains GSD_LIVE_TESTS env var check`
- ``tests/fixtures/provider.ts` — contains GSD_FIXTURE_MODE and GSD_FIXTURE_DIR`
- ``tests/fixtures/record.ts` — contains GSD_FIXTURE_MODE in comments and console.log`
- ``scripts/postinstall.js` — contains GSD_SKIP_RTK_INSTALL and GSD_RTK_DISABLED`
- ``scripts/recover-gsd-1364.sh` — contains GSD_DIR, GSD_IS_SYMLINK, GSD_IGNORE_LINE bash vars`
- ``scripts/verify-s03.sh` — contains GSD_TEST_AUTH_PATH env var`
- ``scripts/verify-s04.sh` — contains GSD_BUNDLED_EXTENSION_PATHS in grep patterns`
- ``.github/workflows/pipeline.yml` — contains GSD_SMOKE_BINARY and GSD_LIVE_TESTS`
- ``docker/entrypoint.sh` — contains GSD_USER, GSD_HOME, GSD_DIR bash vars`
- ``docker/docker-compose.full.yaml` — contains GSD_VERSION build arg`

## Expected Output

- ``tests/smoke/test-help.ts` — HX_SMOKE_BINARY`
- ``tests/smoke/test-init.ts` — HX_SMOKE_BINARY, HX_NON_INTERACTIVE`
- ``tests/smoke/test-version.ts` — HX_SMOKE_BINARY`
- ``tests/live-regression/run.ts` — HX_SMOKE_BINARY, HX_NON_INTERACTIVE`
- ``tests/live/run.ts` — HX_LIVE_TESTS`
- ``tests/fixtures/provider.ts` — HX_FIXTURE_MODE, HX_FIXTURE_DIR`
- ``tests/fixtures/record.ts` — HX_FIXTURE_MODE in comments`
- ``scripts/postinstall.js` — HX_SKIP_RTK_INSTALL, HX_RTK_DISABLED`
- ``scripts/recover-gsd-1364.sh` — HX_DIR, HX_IS_SYMLINK, HX_IGNORE_LINE`
- ``scripts/verify-s03.sh` — HX_TEST_AUTH_PATH`
- ``scripts/verify-s04.sh` — HX_BUNDLED_EXTENSION_PATHS`
- ``.github/workflows/pipeline.yml` — HX_SMOKE_BINARY, HX_LIVE_TESTS`
- ``docker/entrypoint.sh` — HX_USER, HX_HOME, HX_DIR`
- ``docker/docker-compose.full.yaml` — HX_VERSION build arg`

## Verification

grep -rn 'GSD_' --include='*.ts' --include='*.tsx' --include='*.js' --include='*.sh' --include='*.yml' --include='*.yaml' --include='*.json' . | grep -v node_modules | grep -v dist | grep -v .next | grep -v '.hx/' | grep -v '.git/' | wc -l | grep -q '^0$' && npm run typecheck:extensions
