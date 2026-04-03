# S02: Environment Variables & Web Module

**Goal:** All GSD_* environment variables renamed to HX_* equivalents, web module JS identifiers (GSD_SURFACE_SUBCOMMANDS, GSD_PASSTHROUGH_SUBCOMMANDS, GSD_HELP_TEXT, "gsd_help") renamed to HX_*, web/package-lock.json shows hx-web, and the broken GSD_WEB_BRIDGE_TUI read in rpc-mode.ts is fixed to HX_WEB_BRIDGE_TUI.
**Demo:** After this: After this: all GSD_WEB_*, GSD_DAEMON_CONFIG, and other GSD_* env vars are HX_*. Web components use HXAppShell. Package name is hx-web.

## Tasks
- [x] **T01: Renamed all GSD_WEB_* / GSD_SURFACE_SUBCOMMANDS / GSD_PASSTHROUGH_SUBCOMMANDS / GSD_HELP_TEXT / gsd_help / NEXT_PUBLIC_GSD_DEV to HX_* equivalents in web/ module and updated package-lock.json to hx-web** — Rename all GSD_WEB_* env var references, the GSD_SURFACE_SUBCOMMANDS / GSD_PASSTHROUGH_SUBCOMMANDS / GSD_HELP_TEXT JS identifiers, the "gsd_help" string literal and type union member, NEXT_PUBLIC_GSD_DEV, and the gsd-web package name in web/package-lock.json. The pty-manager.ts prefix filter (!key.startsWith("GSD_WEB_")) must be updated to "HX_WEB_" or the filter stops working.

Use synchronous foreground perl -pi loops (K001 pattern from S01). Do NOT use async_bash — writes don't persist in git worktrees.

## Steps

1. Write a perl rename script to /tmp/s02-t01-web.pl with all substitutions:
   - GSD_WEB_AUTH_TOKEN → HX_WEB_AUTH_TOKEN
   - GSD_WEB_HOST → HX_WEB_HOST (but NOT GSD_WEB_HOST_KIND yet — that's a longer string)
   - GSD_WEB_PORT → HX_WEB_PORT
   - GSD_WEB_ALLOWED_ORIGINS → HX_WEB_ALLOWED_ORIGINS
   - GSD_WEB_PROJECT_CWD → HX_WEB_PROJECT_CWD
   - GSD_WEB_PACKAGE_ROOT → HX_WEB_PACKAGE_ROOT
   - GSD_WEB_HOST_KIND → HX_WEB_HOST_KIND
   - GSD_WEB_PTY → HX_WEB_PTY
   - GSD_WEB_DAEMON_MODE → HX_WEB_DAEMON_MODE
   - NEXT_PUBLIC_GSD_DEV → NEXT_PUBLIC_HX_DEV
   - GSD_SURFACE_SUBCOMMANDS → HX_SURFACE_SUBCOMMANDS
   - GSD_PASSTHROUGH_SUBCOMMANDS → HX_PASSTHROUGH_SUBCOMMANDS
   - GSD_HELP_TEXT → HX_HELP_TEXT
   - "gsd_help" → "hx_help"
   Order longer strings before shorter substrings (GSD_WEB_HOST_KIND before GSD_WEB_HOST).

2. Apply to all web/ .ts/.tsx files:
   ```
   find web/ -type f \( -name '*.ts' -o -name '*.tsx' \) ! -path '*/node_modules/*' ! -path '*/.next/*' | while IFS= read -r FILE; do perl -pi /tmp/s02-t01-web.pl "$FILE"; done
   ```

3. Patch web/package-lock.json — replace "gsd-web" with "hx-web" on lines 2 and 8:
   ```
   perl -pi -e 's/"gsd-web"/"hx-web"/g' web/package-lock.json
   ```

4. Verify with grep:
   ```
   grep -rn 'GSD_\|gsd_help\|gsd-web' --include='*.ts' --include='*.tsx' --include='*.json' web/ | grep -v node_modules | grep -v .next | wc -l
   ```
   Must be 0.

5. Run `npm run typecheck:extensions` — must exit 0.

## Must-Haves

- All GSD_WEB_* env vars in web/ renamed to HX_WEB_*
- pty-manager.ts prefix filter uses "HX_WEB_" not "GSD_WEB_"
- GSD_SURFACE_SUBCOMMANDS, GSD_PASSTHROUGH_SUBCOMMANDS, GSD_HELP_TEXT renamed to HX_*
- "gsd_help" literal and type union member renamed to "hx_help"
- NEXT_PUBLIC_GSD_DEV → NEXT_PUBLIC_HX_DEV
- web/package-lock.json shows hx-web
- npm run typecheck:extensions passes
  - Estimate: 25m
  - Files: web/proxy.ts, web/lib/pty-manager.ts, web/lib/shutdown-gate.ts, web/lib/__tests__/shutdown-gate.test.ts, web/lib/browser-slash-command-dispatch.ts, web/lib/hx-workspace-store.tsx, web/lib/dev-overrides.tsx, web/app/api/dev-mode/route.ts, web/app/api/boot/route.ts, web/package-lock.json
  - Verify: grep -rn 'GSD_\|gsd_help\|gsd-web' --include='*.ts' --include='*.tsx' --include='*.json' web/ | grep -v node_modules | grep -v .next | wc -l | grep -q '^0$' && npm run typecheck:extensions
- [x] **T02: Renamed all GSD_* env vars to HX_* in packages/pi-coding-agent, packages/daemon, packages/mcp-server, and src/loader.ts; fixed broken embedded terminal feature by aligning rpc-mode.ts read side with HX_WEB_BRIDGE_TUI write side** — Rename all GSD_* env var references in packages/pi-coding-agent, packages/daemon, packages/mcp-server, and comment-only references in src/loader.ts. The rpc-mode.ts rename is a critical correctness fix: the write side (bridge-service.ts) already uses HX_WEB_BRIDGE_TUI but the read side still uses GSD_WEB_BRIDGE_TUI — the embedded terminal feature is currently broken.

Use synchronous foreground perl -pi loops (K001 pattern from S01).

## Steps

1. Write a perl rename script to /tmp/s02-t02-packages.pl with all substitutions:
   - GSD_DISABLE_LSPMUX → HX_DISABLE_LSPMUX
   - GSD_STARTUP_TIMING → HX_STARTUP_TIMING
   - GSD_SHOW_TOKEN_COST → HX_SHOW_TOKEN_COST
   - GSD_ENABLE_NATIVE_TUI_HIGHLIGHT → HX_ENABLE_NATIVE_TUI_HIGHLIGHT
   - GSD_WEB_BRIDGE_TUI → HX_WEB_BRIDGE_TUI
   - GSD_DAEMON_CONFIG → HX_DAEMON_CONFIG
   - GSD_CLI_PATH → HX_CLI_PATH
   - GSD_VERSION → HX_VERSION (for src/loader.ts comments only)
   - GSD_FIRST_RUN_BANNER → HX_FIRST_RUN_BANNER (for src/loader.ts comment only)

2. Apply to target files:
   ```
   for FILE in \
     packages/pi-coding-agent/src/core/lsp/lspmux.ts \
     packages/pi-coding-agent/src/core/extensions/loader.ts \
     packages/pi-coding-agent/src/modes/interactive/components/footer.ts \
     packages/pi-coding-agent/src/modes/interactive/theme/theme.ts \
     packages/pi-coding-agent/src/modes/rpc/rpc-mode.ts \
     packages/daemon/src/daemon.test.ts \
     packages/daemon/src/session-manager.ts \
     packages/daemon/src/types.ts \
     packages/mcp-server/src/types.ts \
     src/loader.ts; do
     perl -pi /tmp/s02-t02-packages.pl "$FILE"
   done
   ```

3. Verify rpc-mode.ts specifically — this is the critical bug fix:
   ```
   grep 'GSD_WEB_BRIDGE_TUI\|HX_WEB_BRIDGE_TUI' packages/pi-coding-agent/src/modes/rpc/rpc-mode.ts
   ```
   Must show only HX_WEB_BRIDGE_TUI.

4. Verify daemon.test.ts — must use HX_DAEMON_CONFIG:
   ```
   grep 'GSD_DAEMON_CONFIG\|HX_DAEMON_CONFIG' packages/daemon/src/daemon.test.ts
   ```
   Must show only HX_DAEMON_CONFIG.

5. Verify no GSD_ remains in packages/ or src/loader.ts:
   ```
   grep -rn 'GSD_' --include='*.ts' packages/ src/loader.ts | grep -v node_modules | wc -l
   ```
   Must be 0.

6. Run `npm run typecheck:extensions` — must exit 0.

## Must-Haves

- rpc-mode.ts reads HX_WEB_BRIDGE_TUI (fixes broken embedded terminal feature)
- daemon.test.ts sets HX_DAEMON_CONFIG (fixes test that was setting wrong env var name)
- All 5 pi-coding-agent env var reads use HX_* prefix
- Comment-only references in daemon/types.ts, daemon/session-manager.ts, mcp-server/types.ts updated
- src/loader.ts comments updated (GSD_VERSION → HX_VERSION, GSD_FIRST_RUN_BANNER → HX_FIRST_RUN_BANNER)
- npm run typecheck:extensions passes
  - Estimate: 15m
  - Files: packages/pi-coding-agent/src/core/lsp/lspmux.ts, packages/pi-coding-agent/src/core/extensions/loader.ts, packages/pi-coding-agent/src/modes/interactive/components/footer.ts, packages/pi-coding-agent/src/modes/interactive/theme/theme.ts, packages/pi-coding-agent/src/modes/rpc/rpc-mode.ts, packages/daemon/src/daemon.test.ts, packages/daemon/src/session-manager.ts, packages/daemon/src/types.ts, packages/mcp-server/src/types.ts, src/loader.ts
  - Verify: grep -rn 'GSD_' --include='*.ts' packages/ src/loader.ts | grep -v node_modules | wc -l | grep -q '^0$' && npm run typecheck:extensions
- [x] **T03: Renamed all remaining GSD_* env vars in tests, scripts, CI, and Docker — exhaustive grep confirms zero GSD_ references remain in the codebase; typecheck:extensions passes** — Rename all remaining GSD_* references in tests/, scripts/, .github/workflows/pipeline.yml, and docker/. Then run exhaustive grep verification confirming zero GSD_ references remain in the entire codebase (outside .hx/ and node_modules).

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
  - Estimate: 20m
  - Files: tests/smoke/test-help.ts, tests/smoke/test-init.ts, tests/smoke/test-version.ts, tests/live-regression/run.ts, tests/live/run.ts, tests/fixtures/provider.ts, tests/fixtures/record.ts, scripts/postinstall.js, scripts/recover-gsd-1364.sh, scripts/verify-s03.sh, scripts/verify-s04.sh, .github/workflows/pipeline.yml, docker/entrypoint.sh, docker/docker-compose.full.yaml
  - Verify: grep -rn 'GSD_' --include='*.ts' --include='*.tsx' --include='*.js' --include='*.sh' --include='*.yml' --include='*.yaml' --include='*.json' . | grep -v node_modules | grep -v dist | grep -v .next | grep -v '.hx/' | grep -v '.git/' | wc -l | grep -q '^0$' && npm run typecheck:extensions
