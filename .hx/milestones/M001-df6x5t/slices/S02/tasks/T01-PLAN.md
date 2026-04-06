---
estimated_steps: 41
estimated_files: 10
skills_used: []
---

# T01: Rename GSD_* env vars and JS identifiers in web/ module

Rename all GSD_WEB_* env var references, the GSD_SURFACE_SUBCOMMANDS / GSD_PASSTHROUGH_SUBCOMMANDS / GSD_HELP_TEXT JS identifiers, the "gsd_help" string literal and type union member, NEXT_PUBLIC_GSD_DEV, and the gsd-web package name in web/package-lock.json. The pty-manager.ts prefix filter (!key.startsWith("GSD_WEB_")) must be updated to "HX_WEB_" or the filter stops working.

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

## Inputs

- ``web/proxy.ts` — contains GSD_WEB_AUTH_TOKEN, GSD_WEB_HOST, GSD_WEB_PORT, GSD_WEB_ALLOWED_ORIGINS env var reads`
- ``web/lib/pty-manager.ts` — contains GSD_WEB_PROJECT_CWD, GSD_WEB_PACKAGE_ROOT, GSD_WEB_HOST_KIND, GSD_WEB_PTY, and the critical prefix filter`
- ``web/lib/shutdown-gate.ts` — contains GSD_WEB_DAEMON_MODE env var read and comments`
- ``web/lib/__tests__/shutdown-gate.test.ts` — contains 8 GSD_WEB_DAEMON_MODE test references`
- ``web/lib/browser-slash-command-dispatch.ts` — contains GSD_SURFACE_SUBCOMMANDS, GSD_PASSTHROUGH_SUBCOMMANDS, GSD_HELP_TEXT, and "gsd_help" literal`
- ``web/lib/hx-workspace-store.tsx` — imports GSD_HELP_TEXT and references "gsd_help" action`
- ``web/lib/dev-overrides.tsx` — contains NEXT_PUBLIC_GSD_DEV`
- ``web/app/api/dev-mode/route.ts` — contains GSD_WEB_HOST_KIND, GSD_WEB_PACKAGE_ROOT`
- ``web/app/api/boot/route.ts` — comment-only GSD_WEB_PROJECT_CWD reference`
- ``web/package-lock.json` — contains "gsd-web" package name on lines 2 and 8`

## Expected Output

- ``web/proxy.ts` — all HX_WEB_* env var names`
- ``web/lib/pty-manager.ts` — all HX_WEB_* env var names and HX_WEB_ prefix filter`
- ``web/lib/shutdown-gate.ts` — HX_WEB_DAEMON_MODE env var read`
- ``web/lib/__tests__/shutdown-gate.test.ts` — HX_WEB_DAEMON_MODE in all test references`
- ``web/lib/browser-slash-command-dispatch.ts` — HX_SURFACE_SUBCOMMANDS, HX_PASSTHROUGH_SUBCOMMANDS, HX_HELP_TEXT, "hx_help"`
- ``web/lib/hx-workspace-store.tsx` — imports HX_HELP_TEXT, references "hx_help"`
- ``web/lib/dev-overrides.tsx` — NEXT_PUBLIC_HX_DEV`
- ``web/app/api/dev-mode/route.ts` — HX_WEB_HOST_KIND, HX_WEB_PACKAGE_ROOT`
- ``web/app/api/boot/route.ts` — comment updated to HX_WEB_PROJECT_CWD`
- ``web/package-lock.json` — "hx-web" on lines 2 and 8`

## Verification

grep -rn 'GSD_\|gsd_help\|gsd-web' --include='*.ts' --include='*.tsx' --include='*.json' web/ | grep -v node_modules | grep -v .next | wc -l | grep -q '^0$' && npm run typecheck:extensions
