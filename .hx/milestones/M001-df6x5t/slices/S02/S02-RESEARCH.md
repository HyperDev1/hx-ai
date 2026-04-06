# S02: Environment Variables & Web Module — Research

**Date:** 2026-04-03
**Status:** Ready for planning

## Summary

S02 owns two categories of change: (1) rename every `GSD_*` environment variable to `HX_*`, and (2) clean up web-module-specific identifiers (`GSD_SURFACE_SUBCOMMANDS`, `GSD_PASSTHROUGH_SUBCOMMANDS`, `GSD_HELP_TEXT`, `"gsd_help"` action literal, `NEXT_PUBLIC_GSD_DEV`). The work is entirely mechanical text replacement — no new abstractions, no runtime-behavior changes. 

The `web/package-lock.json` still has `"name": "gsd-web"` in two places (lines 2 and 8); the canonical `web/package.json` already reads `hx-web`, so only the lockfile needs updating (regenerate or patch). `GSDAppShell` is already gone — `web/app/page.tsx` already uses `HXAppShell`. The `packages/pi-coding-agent` files are an interesting boundary: they read `GSD_*` vars but are a vendored upstream dependency. The GSD_* reads there are backward-compat shims; renaming them is straightforward but must be done alongside any HX_* consumer to avoid breaking the feature gate.

Current typecheck:extensions exits 0 with zero errors — good baseline.

## Recommendation

One task per logical group of files, each ending with a `grep -rn 'GSD_' | wc -l` verification and a `npm run typecheck:extensions` check. Use the same synchronous foreground `perl -pi` loop pattern from S01 (K001 in KNOWLEDGE.md).

The pi-coding-agent files (`lspmux.ts`, `loader.ts`, `footer.ts`, `theme.ts`, `rpc-mode.ts`) should be handled as a single task since they are tightly coupled env-var reads for the same product. `GSD_WEB_BRIDGE_TUI` in `rpc-mode.ts` is the consumer side — `HX_WEB_BRIDGE_TUI` is already the write side in `bridge-service.ts` — so renaming `rpc-mode.ts` is a critical correctness fix.

## Implementation Landscape

### Key Files

#### Web module (web/)
- `web/proxy.ts` — reads `GSD_WEB_AUTH_TOKEN`, `GSD_WEB_HOST`, `GSD_WEB_PORT`, `GSD_WEB_ALLOWED_ORIGINS`; also comment references. → rename to `HX_WEB_*`
- `web/lib/pty-manager.ts` — reads `GSD_WEB_PROJECT_CWD`, `GSD_WEB_PACKAGE_ROOT`, `GSD_WEB_HOST_KIND`; writes `GSD_WEB_PTY = "1"`; has `!key.startsWith("GSD_WEB_")` prefix filter. All → `HX_WEB_*`
- `web/lib/shutdown-gate.ts` — reads `GSD_WEB_DAEMON_MODE === "1"`. → `HX_WEB_DAEMON_MODE`
- `web/lib/__tests__/shutdown-gate.test.ts` — sets/deletes `GSD_WEB_DAEMON_MODE` (8 occurrences). → `HX_WEB_DAEMON_MODE`. Test descriptions also reference the old name.
- `web/lib/browser-slash-command-dispatch.ts` — three module-level variable names (`GSD_SURFACE_SUBCOMMANDS`, `GSD_PASSTHROUGH_SUBCOMMANDS`, `GSD_HELP_TEXT`), one literal (`"gsd_help"`), one type union member `"gsd_help"`. → rename all to `HX_*`
- `web/lib/hx-workspace-store.tsx` — imports `GSD_HELP_TEXT` (→ `HX_HELP_TEXT`), references `"gsd_help"` action (→ `"hx_help"`). Two spots.
- `web/lib/dev-overrides.tsx` — `NEXT_PUBLIC_GSD_DEV` → `NEXT_PUBLIC_HX_DEV`
- `web/app/api/dev-mode/route.ts` — reads `GSD_WEB_HOST_KIND`, `GSD_WEB_PACKAGE_ROOT` → `HX_WEB_*`
- `web/app/api/boot/route.ts` — comment only: `no GSD_WEB_PROJECT_CWD env` → update comment to `HX_WEB_PROJECT_CWD`
- `web/package-lock.json` — `"name": "gsd-web"` at lines 2 and 8 → `"hx-web"`

#### src/ (loader + misc)
- `src/loader.ts` — two comment-only references: line 15 `GSD_VERSION below`, line 101 `GSD_FIRST_RUN_BANNER`. → update comment text only (actual env var already uses `HX_FIRST_RUN_BANNER`)

#### packages/daemon/
- `packages/daemon/src/daemon.test.ts` — test sets/reads `GSD_DAEMON_CONFIG` (8 hits). The real code in `packages/daemon/src/config.ts:36` already uses `HX_DAEMON_CONFIG`. Test is calling `resolveConfigPath()` which reads `HX_DAEMON_CONFIG` — but the test still sets `GSD_DAEMON_CONFIG`. This is a **broken test**: it sets the old name and the production code reads the new name, so the test is passing the wrong variable. → rename `GSD_DAEMON_CONFIG` → `HX_DAEMON_CONFIG` in test only. Also update test description strings.
- `packages/daemon/src/session-manager.ts` — comment only: `GSD_CLI_PATH env var` → `HX_CLI_PATH env var` (the actual code already uses `HX_CLI_PATH`)
- `packages/daemon/src/types.ts` — JSDoc comment only: `overrides GSD_CLI_PATH` → `overrides HX_CLI_PATH`
- `packages/mcp-server/src/types.ts` — JSDoc comment only: `overrides GSD_CLI_PATH` → `overrides HX_CLI_PATH`

#### packages/pi-coding-agent/
- `packages/pi-coding-agent/src/core/lsp/lspmux.ts:119` — `process.env.GSD_DISABLE_LSPMUX === "1"` → `process.env.HX_DISABLE_LSPMUX === "1"` (alongside existing `PI_DISABLE_LSPMUX` OR check)
- `packages/pi-coding-agent/src/core/extensions/loader.ts:94` — `process.env.GSD_STARTUP_TIMING === "1"` → `process.env.HX_STARTUP_TIMING === "1"` (alongside existing `PI_TIMING`)
- `packages/pi-coding-agent/src/modes/interactive/components/footer.ts:134` — `process.env.GSD_SHOW_TOKEN_COST === "1"` → `process.env.HX_SHOW_TOKEN_COST === "1"`
- `packages/pi-coding-agent/src/modes/interactive/theme/theme.ts:18` — `process.env.GSD_ENABLE_NATIVE_TUI_HIGHLIGHT === "1"` → `process.env.HX_ENABLE_NATIVE_TUI_HIGHLIGHT === "1"`
- `packages/pi-coding-agent/src/modes/rpc/rpc-mode.ts:91` — `process.env.GSD_WEB_BRIDGE_TUI === "1"` → `process.env.HX_WEB_BRIDGE_TUI === "1"`. **Critical**: the write side in `src/web/bridge-service.ts:1613` already sets `HX_WEB_BRIDGE_TUI = "1"`, so this is currently broken — the consumer reads `GSD_WEB_BRIDGE_TUI` but the producer writes `HX_WEB_BRIDGE_TUI`.

#### scripts/
- `scripts/postinstall.js:19-22` — `GSD_SKIP_RTK_INSTALL` (→ `HX_SKIP_RTK_INSTALL`), `GSD_RTK_DISABLED` (→ `HX_RTK_DISABLED`). The HX side in `src/rtk.ts` already exports `HX_SKIP_RTK_INSTALL_ENV = "HX_SKIP_RTK_INSTALL"` and `HX_RTK_DISABLED_ENV = "HX_RTK_DISABLED"`.
- `scripts/recover-gsd-1364.sh` — uses `GSD_DIR`, `GSD_IS_SYMLINK`, `GSD_IGNORE_LINE` as *local bash variables* (not env vars read by the app). These are internal to this one script. → rename to `HX_DIR`, `HX_IS_SYMLINK`, `HX_IGNORE_LINE`. Note: the script name itself (`recover-gsd-1364.sh`) is an R008 scope item but the script's internal variable names belong here.
- `scripts/verify-s03.sh:134` — `GSD_TEST_AUTH_PATH` set as env for a node invocation. The TS source does not read this env var (confirmed — no HX_TEST_AUTH_PATH exists in src/). This is a test harness variable → rename to `HX_TEST_AUTH_PATH`. (S02 scope: env var rename.)
- `scripts/verify-s04.sh:41,44,48-54` — references `GSD_BUNDLED_EXTENSION_PATHS` in comments and grep patterns checking the built `dist/loader.js`. The actual `src/loader.ts` already uses `HX_BUNDLED_EXTENSION_PATHS`. The verify script is checking the dist file's variable name → update grep patterns and comments to `HX_BUNDLED_EXTENSION_PATHS`.

#### tests/
- `tests/fixtures/provider.ts:45,55` — `GSD_FIXTURE_MODE` → `HX_FIXTURE_MODE`, `GSD_FIXTURE_DIR` → `HX_FIXTURE_DIR`
- `tests/fixtures/record.ts:7,12,39` — references to `GSD_FIXTURE_MODE` in comments and console.log → `HX_FIXTURE_MODE`
- `tests/live-regression/run.ts:30,58` — `GSD_SMOKE_BINARY` → `HX_SMOKE_BINARY`, `GSD_NON_INTERACTIVE` → `HX_NON_INTERACTIVE`
- `tests/live/run.ts:8,9` — `GSD_LIVE_TESTS` → `HX_LIVE_TESTS`
- `tests/smoke/test-help.ts:3,4` — `GSD_SMOKE_BINARY` → `HX_SMOKE_BINARY`
- `tests/smoke/test-init.ts:15,16,24` — `GSD_SMOKE_BINARY` → `HX_SMOKE_BINARY`, `GSD_NON_INTERACTIVE` → `HX_NON_INTERACTIVE`
- `tests/smoke/test-version.ts:3,4` — `GSD_SMOKE_BINARY` → `HX_SMOKE_BINARY`

#### CI (.github/workflows/)
- `.github/workflows/pipeline.yml:68,96,109` — `GSD_SMOKE_BINARY=...` → `HX_SMOKE_BINARY=...`
- `.github/workflows/pipeline.yml:162` — `GSD_LIVE_TESTS: "1"` → `HX_LIVE_TESTS: "1"`

#### docker/
- `docker/entrypoint.sh:15-81` — `GSD_USER`, `GSD_HOME`, `GSD_DIR` are bash local variables (not env vars). → rename to `HX_USER`, `HX_HOME`, `HX_DIR`. The file already uses the correct `~/.hx` path names for actual directories — only the bash variable names need updating.
- `docker/docker-compose.full.yaml:7` — build arg `GSD_VERSION: latest` → `HX_VERSION: latest`. Need to check if `docker/Dockerfile.sandbox` references this arg name.

### Build Order

1. **web/ env vars and web module identifiers** — highest impact (the `GSD_WEB_BRIDGE_TUI` mismatch is a runtime bug). Covers: `web/proxy.ts`, `web/lib/pty-manager.ts`, `web/lib/shutdown-gate.ts`, `web/lib/__tests__/shutdown-gate.test.ts`, `web/lib/browser-slash-command-dispatch.ts`, `web/lib/hx-workspace-store.tsx`, `web/lib/dev-overrides.tsx`, `web/app/api/dev-mode/route.ts`, `web/app/api/boot/route.ts`, `web/package-lock.json`.
2. **packages/ env vars** — covers daemon test fix, pi-coding-agent runtime vars (especially the rpc-mode.ts bridge-TUI fix), postinstall.js, comment-only docs.
3. **tests/ and CI** — test env var renames, CI workflow vars.
4. **docker/ and scripts/** — entrypoint.sh bash vars, docker-compose build arg, verify scripts.

After each group: run `grep -rn 'GSD_' --include='*.ts' --include='*.tsx' --include='*.js' --include='*.sh' --include='*.yml' --include='*.yaml' . | grep -v node_modules | grep -v dist | grep -v .next | grep -v '.hx/'` and `npm run typecheck:extensions`.

### Verification Approach

1. `grep -rn 'GSD_' --include='*.ts' --include='*.tsx' --include='*.js' --include='*.sh' --include='*.yml' --include='*.yaml' . | grep -v node_modules | grep -v dist | grep -v .next | grep -v '.hx/' | grep -v recover-gsd | wc -l` → **0**
2. `npm run typecheck:extensions` → **exit 0**
3. `grep "name" web/package-lock.json | head -2` → both lines show `hx-web`
4. `grep 'GSD_WEB_BRIDGE_TUI\|HX_WEB_BRIDGE_TUI' packages/pi-coding-agent/src/modes/rpc/rpc-mode.ts` → shows `HX_WEB_BRIDGE_TUI` only

## Constraints

- `scripts/recover-gsd-1364.sh` internal bash variable names (`GSD_DIR`, `GSD_IS_SYMLINK`, `GSD_IGNORE_LINE`) are purely local — they don't appear in env of any process; rename is safe but must be consistent throughout the file.
- `docker/Dockerfile.sandbox` must be checked for `GSD_VERSION` ARG declaration before renaming the compose build arg.
- `web/package-lock.json` is generated — the cleanest approach is to `sed -i` patch the 2 occurrences of `"name": "gsd-web"` rather than regenerating the entire lockfile (which would require running `npm install` in web/).
- `packages/pi-coding-agent/` is a vendored package. Changes there are valid since it's in the monorepo source tree, not a true external dep.
- `GSD_WEB_BRIDGE_TUI` mismatch: write side (`bridge-service.ts`) already uses `HX_WEB_BRIDGE_TUI`; only the read side (`rpc-mode.ts`) still uses `GSD_WEB_BRIDGE_TUI`. This means the embedded terminal feature is currently **broken** — fixing it is a correctness improvement.
- `NEXT_PUBLIC_GSD_DEV` is a Next.js build-time env var embedded at build time. Any running web build compiled with the old name won't see the new `NEXT_PUBLIC_HX_DEV` unless rebuilt. This is expected — docs only; no runtime impact on the already-built app.

## Common Pitfalls

- **`pty-manager.ts` prefix filter** — `!key.startsWith("GSD_WEB_")` is a string prefix check that filters the child PTY's env. Must be changed to `HX_WEB_` or the filter will stop working and HX_WEB_* vars will leak into the child shell.
- **`daemon.test.ts` broken test** — the test sets `GSD_DAEMON_CONFIG` but `config.ts` reads `HX_DAEMON_CONFIG`. The test currently passes only because the default fallback (`~/.hx/daemon.yaml`) is returned when neither the old nor new name is set. After rename the test will exercise the correct code path.
- **Synchronous perl loop required** — from K001: async_bash jobs don't persist writes in git worktrees. All perl operations must run in foreground synchronous shell loops.
- **`web/package-lock.json`** — do NOT run `npm install` in web/ as a side effect of other changes; that would update thousands of unrelated dep lines.

## Complete Rename Map

### Process.env reads/writes (env var renames)

| Old | New | File(s) |
|-----|-----|---------|
| `GSD_WEB_AUTH_TOKEN` | `HX_WEB_AUTH_TOKEN` | web/proxy.ts |
| `GSD_WEB_HOST` | `HX_WEB_HOST` | web/proxy.ts |
| `GSD_WEB_PORT` | `HX_WEB_PORT` | web/proxy.ts |
| `GSD_WEB_ALLOWED_ORIGINS` | `HX_WEB_ALLOWED_ORIGINS` | web/proxy.ts |
| `GSD_WEB_PROJECT_CWD` | `HX_WEB_PROJECT_CWD` | web/lib/pty-manager.ts |
| `GSD_WEB_PACKAGE_ROOT` | `HX_WEB_PACKAGE_ROOT` | web/lib/pty-manager.ts, web/app/api/dev-mode/route.ts |
| `GSD_WEB_HOST_KIND` | `HX_WEB_HOST_KIND` | web/lib/pty-manager.ts, web/app/api/dev-mode/route.ts |
| `GSD_WEB_PTY` | `HX_WEB_PTY` | web/lib/pty-manager.ts (write) |
| `GSD_WEB_` (prefix filter) | `HX_WEB_` | web/lib/pty-manager.ts |
| `GSD_WEB_DAEMON_MODE` | `HX_WEB_DAEMON_MODE` | web/lib/shutdown-gate.ts, web/lib/__tests__/shutdown-gate.test.ts |
| `GSD_WEB_BRIDGE_TUI` | `HX_WEB_BRIDGE_TUI` | packages/pi-coding-agent/src/modes/rpc/rpc-mode.ts |
| `NEXT_PUBLIC_GSD_DEV` | `NEXT_PUBLIC_HX_DEV` | web/lib/dev-overrides.tsx |
| `GSD_DAEMON_CONFIG` | `HX_DAEMON_CONFIG` | packages/daemon/src/daemon.test.ts |
| `GSD_DISABLE_LSPMUX` | `HX_DISABLE_LSPMUX` | packages/pi-coding-agent/src/core/lsp/lspmux.ts |
| `GSD_STARTUP_TIMING` | `HX_STARTUP_TIMING` | packages/pi-coding-agent/src/core/extensions/loader.ts |
| `GSD_SHOW_TOKEN_COST` | `HX_SHOW_TOKEN_COST` | packages/pi-coding-agent/src/modes/interactive/components/footer.ts |
| `GSD_ENABLE_NATIVE_TUI_HIGHLIGHT` | `HX_ENABLE_NATIVE_TUI_HIGHLIGHT` | packages/pi-coding-agent/src/modes/interactive/theme/theme.ts |
| `GSD_SKIP_RTK_INSTALL` | `HX_SKIP_RTK_INSTALL` | scripts/postinstall.js |
| `GSD_RTK_DISABLED` | `HX_RTK_DISABLED` | scripts/postinstall.js |
| `GSD_SMOKE_BINARY` | `HX_SMOKE_BINARY` | tests/smoke/*.ts, tests/live-regression/run.ts, .github/workflows/pipeline.yml |
| `GSD_NON_INTERACTIVE` | `HX_NON_INTERACTIVE` | tests/smoke/test-init.ts, tests/live-regression/run.ts |
| `GSD_LIVE_TESTS` | `HX_LIVE_TESTS` | tests/live/run.ts, .github/workflows/pipeline.yml |
| `GSD_FIXTURE_MODE` | `HX_FIXTURE_MODE` | tests/fixtures/provider.ts, tests/fixtures/record.ts |
| `GSD_FIXTURE_DIR` | `HX_FIXTURE_DIR` | tests/fixtures/provider.ts |

### Module-level variable names (JS identifier renames)

| Old | New | File(s) |
|-----|-----|---------|
| `GSD_SURFACE_SUBCOMMANDS` | `HX_SURFACE_SUBCOMMANDS` | web/lib/browser-slash-command-dispatch.ts |
| `GSD_PASSTHROUGH_SUBCOMMANDS` | `HX_PASSTHROUGH_SUBCOMMANDS` | web/lib/browser-slash-command-dispatch.ts |
| `GSD_HELP_TEXT` | `HX_HELP_TEXT` | web/lib/browser-slash-command-dispatch.ts, web/lib/hx-workspace-store.tsx |
| `"gsd_help"` (literal) | `"hx_help"` | web/lib/browser-slash-command-dispatch.ts, web/lib/hx-workspace-store.tsx |

### Bash local variables (script-internal, not process.env)

| Old | New | File(s) |
|-----|-----|---------|
| `GSD_USER` | `HX_USER` | docker/entrypoint.sh |
| `GSD_HOME` | `HX_HOME` | docker/entrypoint.sh |
| `GSD_DIR` | `HX_DIR` | docker/entrypoint.sh, scripts/recover-gsd-1364.sh |
| `GSD_IS_SYMLINK` | `HX_IS_SYMLINK` | scripts/recover-gsd-1364.sh |
| `GSD_IGNORE_LINE` | `HX_IGNORE_LINE` | scripts/recover-gsd-1364.sh |

### Build args / config keys

| Old | New | File(s) |
|-----|-----|---------|
| `GSD_VERSION` (compose build arg) | `HX_VERSION` | docker/docker-compose.full.yaml |
| `"name": "gsd-web"` | `"name": "hx-web"` | web/package-lock.json (2 lines) |

### Comment-only changes

| File | Line | Change |
|------|------|--------|
| `src/loader.ts` | 15 | `GSD_VERSION below` → `HX_VERSION below` |
| `src/loader.ts` | 101 | `Set GSD_FIRST_RUN_BANNER` → `Set HX_FIRST_RUN_BANNER` |
| `packages/daemon/src/session-manager.ts` | 280 | `GSD_CLI_PATH env var` → `HX_CLI_PATH env var` |
| `packages/daemon/src/types.ts` | 173 | `overrides GSD_CLI_PATH` → `overrides HX_CLI_PATH` |
| `packages/mcp-server/src/types.ts` | 95 | `overrides GSD_CLI_PATH` → `overrides HX_CLI_PATH` |
| `web/app/api/boot/route.ts` | 14 | `no GSD_WEB_PROJECT_CWD env` → `no HX_WEB_PROJECT_CWD env` |
| `web/proxy.ts` | 6,36 | comment references `GSD_WEB_AUTH_TOKEN`, `GSD_WEB_ALLOWED_ORIGINS` → `HX_WEB_*` |
| `web/lib/shutdown-gate.ts` | 10,34 | comment references `GSD_WEB_DAEMON_MODE` → `HX_WEB_DAEMON_MODE` |
| `scripts/verify-s04.sh` | 41,44,48-54 | `GSD_BUNDLED_EXTENSION_PATHS` grep patterns/comments → `HX_BUNDLED_EXTENSION_PATHS` |
| `scripts/verify-s03.sh` | 134 | `GSD_TEST_AUTH_PATH` → `HX_TEST_AUTH_PATH` |
| `tests/fixtures/record.ts` | 7,12,39 | `GSD_FIXTURE_MODE` in comments/console.log → `HX_FIXTURE_MODE` |
| `packages/daemon/src/daemon.test.ts` | 44 | test description `GSD_DAEMON_CONFIG env var` → `HX_DAEMON_CONFIG env var` |

### File needing check before rename

- `docker/Dockerfile.sandbox` — check for `ARG GSD_VERSION` declaration; if present, rename to `ARG HX_VERSION`
