---
id: T01
parent: S02
milestone: M001-df6x5t
provides: []
requires: []
affects: []
key_files: ["web/proxy.ts", "web/lib/pty-manager.ts", "web/lib/shutdown-gate.ts", "web/lib/__tests__/shutdown-gate.test.ts", "web/lib/browser-slash-command-dispatch.ts", "web/lib/hx-workspace-store.tsx", "web/lib/dev-overrides.tsx", "web/app/api/dev-mode/route.ts", "web/app/api/boot/route.ts", "web/package-lock.json"]
key_decisions: ["Used perl -pi loop (K001 pattern) for synchronous foreground substitution in git worktrees", "Ordered longer strings before shorter substrings in substitution script to avoid partial matches", "Fixed pty-manager.ts prefix filter string literal manually after bulk script missed it"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "grep -rn 'GSD_|gsd_help|gsd-web' web/ (excluding node_modules/.next) → 0 hits; npm run typecheck:extensions → exit 0"
completed_at: 2026-04-03T20:30:22.044Z
blocker_discovered: false
---

# T01: Renamed all GSD_WEB_* / GSD_SURFACE_SUBCOMMANDS / GSD_PASSTHROUGH_SUBCOMMANDS / GSD_HELP_TEXT / gsd_help / NEXT_PUBLIC_GSD_DEV to HX_* equivalents in web/ module and updated package-lock.json to hx-web

> Renamed all GSD_WEB_* / GSD_SURFACE_SUBCOMMANDS / GSD_PASSTHROUGH_SUBCOMMANDS / GSD_HELP_TEXT / gsd_help / NEXT_PUBLIC_GSD_DEV to HX_* equivalents in web/ module and updated package-lock.json to hx-web

## What Happened
---
id: T01
parent: S02
milestone: M001-df6x5t
key_files:
  - web/proxy.ts
  - web/lib/pty-manager.ts
  - web/lib/shutdown-gate.ts
  - web/lib/__tests__/shutdown-gate.test.ts
  - web/lib/browser-slash-command-dispatch.ts
  - web/lib/hx-workspace-store.tsx
  - web/lib/dev-overrides.tsx
  - web/app/api/dev-mode/route.ts
  - web/app/api/boot/route.ts
  - web/package-lock.json
key_decisions:
  - Used perl -pi loop (K001 pattern) for synchronous foreground substitution in git worktrees
  - Ordered longer strings before shorter substrings in substitution script to avoid partial matches
  - Fixed pty-manager.ts prefix filter string literal manually after bulk script missed it
duration: ""
verification_result: passed
completed_at: 2026-04-03T20:30:22.045Z
blocker_discovered: false
---

# T01: Renamed all GSD_WEB_* / GSD_SURFACE_SUBCOMMANDS / GSD_PASSTHROUGH_SUBCOMMANDS / GSD_HELP_TEXT / gsd_help / NEXT_PUBLIC_GSD_DEV to HX_* equivalents in web/ module and updated package-lock.json to hx-web

**Renamed all GSD_WEB_* / GSD_SURFACE_SUBCOMMANDS / GSD_PASSTHROUGH_SUBCOMMANDS / GSD_HELP_TEXT / gsd_help / NEXT_PUBLIC_GSD_DEV to HX_* equivalents in web/ module and updated package-lock.json to hx-web**

## What Happened

Wrote /tmp/s02-t01-web.pl with 14 ordered substitution rules and applied it to all web/**/*.ts and web/**/*.tsx files via a synchronous foreground perl -pi loop. Separately patched web/package-lock.json for the gsd-web → hx-web name change. The bulk script missed the startsWith("GSD_WEB_") string literal in pty-manager.ts (the env filter guard), which was fixed with a targeted Edit call after the post-apply grep scan revealed it. Final grep count = 0, typecheck:extensions passes cleanly.

## Verification

grep -rn 'GSD_|gsd_help|gsd-web' web/ (excluding node_modules/.next) → 0 hits; npm run typecheck:extensions → exit 0

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `grep -rn 'GSD_\|gsd_help\|gsd-web' --include='*.ts' --include='*.tsx' --include='*.json' web/ | grep -v node_modules | grep -v .next | wc -l` | 0 | ✅ pass | 200ms |
| 2 | `npm run typecheck:extensions` | 0 | ✅ pass | 8000ms |


## Deviations

The perl script missed the startsWith(\"GSD_WEB_\") string literal in pty-manager.ts because the substitution patterns targeted env var identifiers, not arbitrary string contents. Fixed with a targeted Edit after the verification grep revealed one remaining hit.

## Known Issues

None.

## Files Created/Modified

- `web/proxy.ts`
- `web/lib/pty-manager.ts`
- `web/lib/shutdown-gate.ts`
- `web/lib/__tests__/shutdown-gate.test.ts`
- `web/lib/browser-slash-command-dispatch.ts`
- `web/lib/hx-workspace-store.tsx`
- `web/lib/dev-overrides.tsx`
- `web/app/api/dev-mode/route.ts`
- `web/app/api/boot/route.ts`
- `web/package-lock.json`


## Deviations
The perl script missed the startsWith(\"GSD_WEB_\") string literal in pty-manager.ts because the substitution patterns targeted env var identifiers, not arbitrary string contents. Fixed with a targeted Edit after the verification grep revealed one remaining hit.

## Known Issues
None.
