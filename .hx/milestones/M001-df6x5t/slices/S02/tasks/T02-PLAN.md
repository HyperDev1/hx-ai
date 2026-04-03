---
estimated_steps: 52
estimated_files: 10
skills_used: []
---

# T02: Rename GSD_* env vars in packages/ and src/loader.ts comments

Rename all GSD_* env var references in packages/pi-coding-agent, packages/daemon, packages/mcp-server, and comment-only references in src/loader.ts. The rpc-mode.ts rename is a critical correctness fix: the write side (bridge-service.ts) already uses HX_WEB_BRIDGE_TUI but the read side still uses GSD_WEB_BRIDGE_TUI — the embedded terminal feature is currently broken.

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

## Inputs

- ``packages/pi-coding-agent/src/modes/rpc/rpc-mode.ts` — reads GSD_WEB_BRIDGE_TUI (broken: write side already uses HX_WEB_BRIDGE_TUI)`
- ``packages/pi-coding-agent/src/core/lsp/lspmux.ts` — reads GSD_DISABLE_LSPMUX`
- ``packages/pi-coding-agent/src/core/extensions/loader.ts` — reads GSD_STARTUP_TIMING`
- ``packages/pi-coding-agent/src/modes/interactive/components/footer.ts` — reads GSD_SHOW_TOKEN_COST`
- ``packages/pi-coding-agent/src/modes/interactive/theme/theme.ts` — reads GSD_ENABLE_NATIVE_TUI_HIGHLIGHT`
- ``packages/daemon/src/daemon.test.ts` — sets GSD_DAEMON_CONFIG (test is broken: production code reads HX_DAEMON_CONFIG)`
- ``packages/daemon/src/session-manager.ts` — comment-only GSD_CLI_PATH reference`
- ``packages/daemon/src/types.ts` — JSDoc comment-only GSD_CLI_PATH reference`
- ``packages/mcp-server/src/types.ts` — JSDoc comment-only GSD_CLI_PATH reference`
- ``src/loader.ts` — comment-only GSD_VERSION and GSD_FIRST_RUN_BANNER references`

## Expected Output

- ``packages/pi-coding-agent/src/modes/rpc/rpc-mode.ts` — reads HX_WEB_BRIDGE_TUI (bug fixed)`
- ``packages/pi-coding-agent/src/core/lsp/lspmux.ts` — reads HX_DISABLE_LSPMUX`
- ``packages/pi-coding-agent/src/core/extensions/loader.ts` — reads HX_STARTUP_TIMING`
- ``packages/pi-coding-agent/src/modes/interactive/components/footer.ts` — reads HX_SHOW_TOKEN_COST`
- ``packages/pi-coding-agent/src/modes/interactive/theme/theme.ts` — reads HX_ENABLE_NATIVE_TUI_HIGHLIGHT`
- ``packages/daemon/src/daemon.test.ts` — sets HX_DAEMON_CONFIG (test fixed)`
- ``packages/daemon/src/session-manager.ts` — comment updated to HX_CLI_PATH`
- ``packages/daemon/src/types.ts` — JSDoc updated to HX_CLI_PATH`
- ``packages/mcp-server/src/types.ts` — JSDoc updated to HX_CLI_PATH`
- ``src/loader.ts` — comments updated to HX_VERSION and HX_FIRST_RUN_BANNER`

## Verification

grep -rn 'GSD_' --include='*.ts' packages/ src/loader.ts | grep -v node_modules | wc -l | grep -q '^0$' && npm run typecheck:extensions
