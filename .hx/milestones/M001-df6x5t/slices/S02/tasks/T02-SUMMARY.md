---
id: T02
parent: S02
milestone: M001-df6x5t
provides: []
requires: []
affects: []
key_files: ["packages/pi-coding-agent/src/modes/rpc/rpc-mode.ts", "packages/pi-coding-agent/src/core/lsp/lspmux.ts", "packages/pi-coding-agent/src/core/extensions/loader.ts", "packages/pi-coding-agent/src/modes/interactive/components/footer.ts", "packages/pi-coding-agent/src/modes/interactive/theme/theme.ts", "packages/daemon/src/daemon.test.ts", "packages/daemon/src/session-manager.ts", "packages/daemon/src/types.ts", "packages/mcp-server/src/types.ts", "src/loader.ts"]
key_decisions: ["Used perl -pi loop (K001 pattern) for synchronous foreground substitution", "Ordered longer strings before shorter substrings in substitution script to avoid partial matches"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "grep -rn 'GSD_' --include='*.ts' packages/ src/loader.ts | grep -v node_modules | wc -l → 0; npm run typecheck:extensions → exit 0 (13.6s)"
completed_at: 2026-04-03T20:32:05.624Z
blocker_discovered: false
---

# T02: Renamed all GSD_* env vars to HX_* in packages/pi-coding-agent, packages/daemon, packages/mcp-server, and src/loader.ts; fixed broken embedded terminal feature by aligning rpc-mode.ts read side with HX_WEB_BRIDGE_TUI write side

> Renamed all GSD_* env vars to HX_* in packages/pi-coding-agent, packages/daemon, packages/mcp-server, and src/loader.ts; fixed broken embedded terminal feature by aligning rpc-mode.ts read side with HX_WEB_BRIDGE_TUI write side

## What Happened
---
id: T02
parent: S02
milestone: M001-df6x5t
key_files:
  - packages/pi-coding-agent/src/modes/rpc/rpc-mode.ts
  - packages/pi-coding-agent/src/core/lsp/lspmux.ts
  - packages/pi-coding-agent/src/core/extensions/loader.ts
  - packages/pi-coding-agent/src/modes/interactive/components/footer.ts
  - packages/pi-coding-agent/src/modes/interactive/theme/theme.ts
  - packages/daemon/src/daemon.test.ts
  - packages/daemon/src/session-manager.ts
  - packages/daemon/src/types.ts
  - packages/mcp-server/src/types.ts
  - src/loader.ts
key_decisions:
  - Used perl -pi loop (K001 pattern) for synchronous foreground substitution
  - Ordered longer strings before shorter substrings in substitution script to avoid partial matches
duration: ""
verification_result: passed
completed_at: 2026-04-03T20:32:05.625Z
blocker_discovered: false
---

# T02: Renamed all GSD_* env vars to HX_* in packages/pi-coding-agent, packages/daemon, packages/mcp-server, and src/loader.ts; fixed broken embedded terminal feature by aligning rpc-mode.ts read side with HX_WEB_BRIDGE_TUI write side

**Renamed all GSD_* env vars to HX_* in packages/pi-coding-agent, packages/daemon, packages/mcp-server, and src/loader.ts; fixed broken embedded terminal feature by aligning rpc-mode.ts read side with HX_WEB_BRIDGE_TUI write side**

## What Happened

Wrote /tmp/s02-t02-packages.pl with 9 ordered substitution rules and applied synchronously via perl -pi loop to 10 files. Critical fix: rpc-mode.ts was reading GSD_WEB_BRIDGE_TUI while bridge-service.ts wrote HX_WEB_BRIDGE_TUI — embedded terminal was silently broken; both sides now use HX_WEB_BRIDGE_TUI. daemon.test.ts was setting GSD_DAEMON_CONFIG while production code reads HX_DAEMON_CONFIG — the env-var fallback test path was never executing the real code; now both match. Comment-only references in types.ts, session-manager.ts, and src/loader.ts updated for documentation consistency. Post-apply grep: 0 remaining GSD_ hits. typecheck:extensions passed.

## Verification

grep -rn 'GSD_' --include='*.ts' packages/ src/loader.ts | grep -v node_modules | wc -l → 0; npm run typecheck:extensions → exit 0 (13.6s)

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `grep 'GSD_WEB_BRIDGE_TUI\|HX_WEB_BRIDGE_TUI' packages/pi-coding-agent/src/modes/rpc/rpc-mode.ts` | 0 | ✅ pass | 50ms |
| 2 | `grep 'GSD_DAEMON_CONFIG\|HX_DAEMON_CONFIG' packages/daemon/src/daemon.test.ts` | 0 | ✅ pass | 50ms |
| 3 | `grep -rn 'GSD_' --include='*.ts' packages/ src/loader.ts | grep -v node_modules | wc -l` | 0 | ✅ pass | 150ms |
| 4 | `npm run typecheck:extensions` | 0 | ✅ pass | 13600ms |


## Deviations

None. The perl script covered all 18 pre-flight hits without requiring manual follow-up patches.

## Known Issues

None.

## Files Created/Modified

- `packages/pi-coding-agent/src/modes/rpc/rpc-mode.ts`
- `packages/pi-coding-agent/src/core/lsp/lspmux.ts`
- `packages/pi-coding-agent/src/core/extensions/loader.ts`
- `packages/pi-coding-agent/src/modes/interactive/components/footer.ts`
- `packages/pi-coding-agent/src/modes/interactive/theme/theme.ts`
- `packages/daemon/src/daemon.test.ts`
- `packages/daemon/src/session-manager.ts`
- `packages/daemon/src/types.ts`
- `packages/mcp-server/src/types.ts`
- `src/loader.ts`


## Deviations
None. The perl script covered all 18 pre-flight hits without requiring manual follow-up patches.

## Known Issues
None.
