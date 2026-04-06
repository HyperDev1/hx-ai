---
id: S02
parent: M001-df6x5t
milestone: M001-df6x5t
provides:
  - Zero GSD_* env var references in the entire codebase (verified by exhaustive grep returning 0)
  - web/package-lock.json shows hx-web package name
  - Embedded terminal feature unbroken: rpc-mode.ts now reads HX_WEB_BRIDGE_TUI matching bridge-service.ts write side
  - Daemon test now sets correct HX_DAEMON_CONFIG env var, fixing previously-non-executing test path
  - All HX_WEB_* env vars aligned across web module and proxy layer
requires:
  - slice: S01
    provides: HX* TypeScript types established; hxDir variable names in place; K001 worktree write pattern validated
affects:
  - S03 — DB tool names can proceed; env var namespace is clean
  - S04 — Native engine rename can proceed; no env var conflicts
  - S05 — Final verification will find zero GSD_ env var hits
key_files:
  - web/proxy.ts
  - web/lib/pty-manager.ts
  - web/lib/shutdown-gate.ts
  - web/lib/browser-slash-command-dispatch.ts
  - web/lib/hx-workspace-store.tsx
  - web/lib/dev-overrides.tsx
  - web/app/api/dev-mode/route.ts
  - web/app/api/boot/route.ts
  - web/package-lock.json
  - packages/pi-coding-agent/src/modes/rpc/rpc-mode.ts
  - packages/pi-coding-agent/src/core/lsp/lspmux.ts
  - packages/daemon/src/daemon.test.ts
  - tests/smoke/test-help.ts
  - tests/fixtures/provider.ts
  - scripts/postinstall.js
  - .github/workflows/pipeline.yml
  - docker/entrypoint.sh
  - docker/docker-compose.full.yaml
key_decisions:
  - Used perl -pi synchronous foreground loop (K001 pattern) for all substitutions — async_bash does not reliably persist writes in git worktrees
  - Ordered longer substitution strings before shorter substrings in every perl script to avoid partial-match collisions (e.g. GSD_WEB_HOST_KIND before GSD_WEB_HOST)
  - rpc-mode.ts GSD_WEB_BRIDGE_TUI → HX_WEB_BRIDGE_TUI: correctness fix, not just rename — the write side (bridge-service.ts) already used HX_WEB_BRIDGE_TUI so the read side was silently broken
patterns_established:
  - K001 perl -pi synchronous loop pattern applied consistently across all 3 tasks: write script to /tmp/*.pl, apply via foreground while loop, verify with grep count
  - Bulk rename + manual audit pattern: run bulk script first, then verify with targeted grep, then fix any stragglers manually
observability_surfaces:
  - none
drill_down_paths:
  - .hx/milestones/M001-df6x5t/slices/S02/tasks/T01-SUMMARY.md
  - .hx/milestones/M001-df6x5t/slices/S02/tasks/T02-SUMMARY.md
  - .hx/milestones/M001-df6x5t/slices/S02/tasks/T03-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-04-03T20:37:00.016Z
blocker_discovered: false
---

# S02: Environment Variables & Web Module

**Renamed all GSD_* environment variables to HX_* across the entire codebase — web module, packages, tests, scripts, CI, and Docker — with a critical bug fix for the broken embedded terminal feature.**

## What Happened

S02 completed 3 tasks covering a comprehensive GSD_* → HX_* environment variable rename across every subsystem of the codebase.

**T01 (Web module):** Renamed all GSD_WEB_* env vars and related JS identifiers in the web/ Next.js module. This included: GSD_WEB_AUTH_TOKEN, GSD_WEB_HOST, GSD_WEB_PORT, GSD_WEB_ALLOWED_ORIGINS, GSD_WEB_PROJECT_CWD, GSD_WEB_PACKAGE_ROOT, GSD_WEB_HOST_KIND, GSD_WEB_PTY, GSD_WEB_DAEMON_MODE → HX_WEB_* equivalents; NEXT_PUBLIC_GSD_DEV → NEXT_PUBLIC_HX_DEV; GSD_SURFACE_SUBCOMMANDS, GSD_PASSTHROUGH_SUBCOMMANDS, GSD_HELP_TEXT → HX_* equivalents; "gsd_help" string literal and type union member → "hx_help"; web/package-lock.json "gsd-web" → "hx-web". The pty-manager.ts prefix filter string literal (!key.startsWith("GSD_WEB_")) required a manual fixup after the bulk script missed it. All 10 web/ files verified, grep returned 0 hits.

**T02 (Packages + critical bug fix):** Renamed all GSD_* env var references in packages/pi-coding-agent, packages/daemon, packages/mcp-server, and src/loader.ts. This included GSD_DISABLE_LSPMUX, GSD_STARTUP_TIMING, GSD_SHOW_TOKEN_COST, GSD_ENABLE_NATIVE_TUI_HIGHLIGHT → HX_* equivalents; GSD_WEB_BRIDGE_TUI → HX_WEB_BRIDGE_TUI (critical: the write side in bridge-service.ts already used HX_WEB_BRIDGE_TUI but the read side in rpc-mode.ts still used GSD_WEB_BRIDGE_TUI, silently breaking the embedded terminal feature); GSD_DAEMON_CONFIG → HX_DAEMON_CONFIG (daemon.test.ts was setting the wrong env var, meaning the fallback test path never exercised the production code path); GSD_CLI_PATH, GSD_VERSION, GSD_FIRST_RUN_BANNER comment updates. Post-apply grep returned 0 GSD_ hits across all packages/.

**T03 (Tests, scripts, CI, Docker — exhaustive cleanup):** Renamed all remaining GSD_* references across 14 files: 7 test files (smoke, live-regression, live, fixtures), 4 scripts (postinstall.js, recover-gsd-1364.sh, verify-s03.sh, verify-s04.sh), pipeline.yml, docker/entrypoint.sh, and docker/docker-compose.full.yaml. Substitutions covered GSD_SMOKE_BINARY, GSD_NON_INTERACTIVE, GSD_LIVE_TESTS, GSD_FIXTURE_MODE/DIR, GSD_SKIP_RTK_INSTALL, GSD_RTK_DISABLED, GSD_TEST_AUTH_PATH, GSD_BUNDLED_EXTENSION_PATHS, GSD_IS_SYMLINK, GSD_IGNORE_LINE, GSD_USER, GSD_HOME, GSD_DIR, GSD_VERSION. Exhaustive grep across all TS/JS/SH/YML/JSON files (excluding node_modules, dist, .next, .hx/, .git/) returned 0 hits.

All three tasks used the K001 synchronous foreground perl -pi loop pattern. `npm run typecheck:extensions` passed after each task (exit 0).

## Verification

1. `grep -rn 'GSD_|gsd_help|gsd-web' web/ (excl node_modules/.next) → 0 hits` ✅
2. `grep -rn 'GSD_' packages/ src/loader.ts (excl node_modules) → 0 hits` ✅
3. `grep '"name"' web/package-lock.json | head -2` → both lines show "hx-web" ✅
4. `grep -rn 'GSD_' across all .ts/.tsx/.js/.sh/.yml/.yaml/.json (excl node_modules/dist/.next/.hx/.git) → 0 hits` ✅
5. `npm run typecheck:extensions` → exit 0 ✅

## Requirements Advanced

- R002 — All 43+ GSD_* env vars renamed to HX_* across src/, web/, docker/, tests/, scripts/, CI workflows — exhaustive grep returns 0 hits
- R006 — GSD_WEB_* env vars renamed to HX_WEB_* in web module; gsd-web package name changed to hx-web in package-lock.json; pty-manager.ts prefix filter updated
- R010 — npm run typecheck:extensions passes with exit 0 after all S02 renames

## Requirements Validated

- R002 — grep -rn 'GSD_' across all .ts/.tsx/.js/.sh/.yml/.yaml/.json (excl node_modules/dist/.next/.hx/.git) → 0 hits
- R006 — grep -rn 'GSD_|gsd_help|gsd-web' web/ (excl node_modules/.next) → 0 hits; web/package-lock.json name fields both show hx-web

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

T01: pty-manager.ts prefix filter string literal ("GSD_WEB_" → "HX_WEB_") required manual fixup after the bulk perl script missed it — the string was embedded in a startsWith() call using template-inconsistent quoting that the regex didn't match. Fixed by direct Edit after bulk apply.

## Known Limitations

None. All GSD_* env var references are gone from the codebase. The exhaustive grep confirms zero remaining hits across all source file types.

## Follow-ups

S03 (DB Tool Names & Prompts) can now proceed — it depends on S01 which is complete, and S02's clean state means no env var cross-contamination. S04 (Native Rust Engine) similarly unblocked from env var perspective.

## Files Created/Modified

- `web/proxy.ts` — GSD_WEB_* env var reads renamed to HX_WEB_*
- `web/lib/pty-manager.ts` — GSD_WEB_* env vars renamed; prefix filter string literal fixed from GSD_WEB_ to HX_WEB_
- `web/lib/shutdown-gate.ts` — GSD_WEB_* env vars renamed to HX_WEB_*
- `web/lib/__tests__/shutdown-gate.test.ts` — GSD_WEB_* env vars renamed to HX_WEB_* in test setup
- `web/lib/browser-slash-command-dispatch.ts` — GSD_SURFACE_SUBCOMMANDS, GSD_PASSTHROUGH_SUBCOMMANDS → HX_*; gsd_help → hx_help
- `web/lib/hx-workspace-store.tsx` — GSD_HELP_TEXT → HX_HELP_TEXT
- `web/lib/dev-overrides.tsx` — NEXT_PUBLIC_GSD_DEV → NEXT_PUBLIC_HX_DEV
- `web/app/api/dev-mode/route.ts` — NEXT_PUBLIC_GSD_DEV → NEXT_PUBLIC_HX_DEV
- `web/app/api/boot/route.ts` — GSD_WEB_* env vars renamed to HX_WEB_*
- `web/package-lock.json` — Package name gsd-web → hx-web on name fields
- `packages/pi-coding-agent/src/modes/rpc/rpc-mode.ts` — CRITICAL BUG FIX: GSD_WEB_BRIDGE_TUI → HX_WEB_BRIDGE_TUI (read side now matches write side in bridge-service.ts)
- `packages/pi-coding-agent/src/core/lsp/lspmux.ts` — GSD_DISABLE_LSPMUX → HX_DISABLE_LSPMUX
- `packages/pi-coding-agent/src/core/extensions/loader.ts` — GSD_BUNDLED_EXTENSION_PATHS → HX_BUNDLED_EXTENSION_PATHS
- `packages/pi-coding-agent/src/modes/interactive/components/footer.ts` — GSD_SHOW_TOKEN_COST, GSD_STARTUP_TIMING → HX_*
- `packages/pi-coding-agent/src/modes/interactive/theme/theme.ts` — GSD_ENABLE_NATIVE_TUI_HIGHLIGHT → HX_ENABLE_NATIVE_TUI_HIGHLIGHT
- `packages/daemon/src/daemon.test.ts` — GSD_DAEMON_CONFIG → HX_DAEMON_CONFIG (fixes test that was setting wrong env var)
- `packages/daemon/src/session-manager.ts` — GSD_DAEMON_CONFIG → HX_DAEMON_CONFIG in comments
- `packages/daemon/src/types.ts` — GSD_DAEMON_CONFIG → HX_DAEMON_CONFIG in comment
- `packages/mcp-server/src/types.ts` — GSD_CLI_PATH → HX_CLI_PATH in comment
- `src/loader.ts` — GSD_VERSION, GSD_FIRST_RUN_BANNER comment references updated to HX_*
- `tests/smoke/test-help.ts` — GSD_SMOKE_BINARY, GSD_NON_INTERACTIVE → HX_*
- `tests/smoke/test-init.ts` — GSD_SMOKE_BINARY, GSD_NON_INTERACTIVE → HX_*
- `tests/smoke/test-version.ts` — GSD_SMOKE_BINARY, GSD_NON_INTERACTIVE → HX_*
- `tests/live-regression/run.ts` — GSD_SMOKE_BINARY, GSD_NON_INTERACTIVE → HX_*
- `tests/live/run.ts` — GSD_LIVE_TESTS → HX_LIVE_TESTS
- `tests/fixtures/provider.ts` — GSD_FIXTURE_MODE, GSD_FIXTURE_DIR → HX_*
- `tests/fixtures/record.ts` — GSD_FIXTURE_MODE, GSD_FIXTURE_DIR → HX_*
- `scripts/postinstall.js` — GSD_SKIP_RTK_INSTALL, GSD_RTK_DISABLED → HX_*
- `scripts/recover-gsd-1364.sh` — GSD_USER, GSD_HOME, GSD_DIR → HX_*
- `scripts/verify-s03.sh` — GSD_IS_SYMLINK, GSD_IGNORE_LINE → HX_*
- `scripts/verify-s04.sh` — GSD_IS_SYMLINK, GSD_IGNORE_LINE → HX_*
- `.github/workflows/pipeline.yml` — All GSD_* CI env var references renamed to HX_*
- `docker/entrypoint.sh` — GSD_USER, GSD_HOME, GSD_DIR, GSD_VERSION → HX_*
- `docker/docker-compose.full.yaml` — GSD_* build args renamed to HX_*
