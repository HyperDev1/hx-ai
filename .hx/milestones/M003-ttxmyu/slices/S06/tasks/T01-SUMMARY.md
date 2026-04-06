---
id: T01
parent: S06
milestone: M003-ttxmyu
provides: []
requires: []
affects: []
key_files: ["packages/pi-coding-agent/src/core/resolve-config-value.ts", "packages/pi-coding-agent/src/core/settings-manager.ts", "packages/pi-coding-agent/src/index.ts", "src/resources/extensions/search-the-web/url-utils.ts", "src/security-overrides.ts", "src/cli.ts", "packages/pi-coding-agent/src/core/resolve-config-value-override.test.ts", "packages/pi-coding-agent/src/core/settings-manager-security.test.ts", "src/tests/security-overrides.test.ts", "src/tests/url-utils-override.test.ts"]
key_decisions: ["Used setGlobalSetting for allowedCommandPrefixes/fetchAllowedUrls — they only persist in global settings, never project", "stripGlobalOnlyKeys applied at 3 sites in SettingsManager (fromStorage, reload, saveProjectSettings)", "pi-coding-agent package rebuilt before main tsc check to emit new dist/ declarations", "applySecurityOverrides re-exports getters for downstream consumers"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "tsc --noEmit exits 0. npm run test:unit passes 4233 tests with 0 failures. New src/tests run standalone: 15 pass. pi-coding-agent tests run from dist/: 8 pass. GSD grep over all modified files returns 0 hits."
completed_at: 2026-04-05T19:01:22.663Z
blocker_discovered: false
---

# T01: Add runtime-configurable command prefix and fetch URL allowlists (security-overrides cluster), wired into cli.ts startup

> Add runtime-configurable command prefix and fetch URL allowlists (security-overrides cluster), wired into cli.ts startup

## What Happened
---
id: T01
parent: S06
milestone: M003-ttxmyu
key_files:
  - packages/pi-coding-agent/src/core/resolve-config-value.ts
  - packages/pi-coding-agent/src/core/settings-manager.ts
  - packages/pi-coding-agent/src/index.ts
  - src/resources/extensions/search-the-web/url-utils.ts
  - src/security-overrides.ts
  - src/cli.ts
  - packages/pi-coding-agent/src/core/resolve-config-value-override.test.ts
  - packages/pi-coding-agent/src/core/settings-manager-security.test.ts
  - src/tests/security-overrides.test.ts
  - src/tests/url-utils-override.test.ts
key_decisions:
  - Used setGlobalSetting for allowedCommandPrefixes/fetchAllowedUrls — they only persist in global settings, never project
  - stripGlobalOnlyKeys applied at 3 sites in SettingsManager (fromStorage, reload, saveProjectSettings)
  - pi-coding-agent package rebuilt before main tsc check to emit new dist/ declarations
  - applySecurityOverrides re-exports getters for downstream consumers
duration: ""
verification_result: passed
completed_at: 2026-04-05T19:01:22.663Z
blocker_discovered: false
---

# T01: Add runtime-configurable command prefix and fetch URL allowlists (security-overrides cluster), wired into cli.ts startup

**Add runtime-configurable command prefix and fetch URL allowlists (security-overrides cluster), wired into cli.ts startup**

## What Happened

Ported the security-overrides cluster from upstream commit e78db4c18. Added activeCommandPrefixes module var with setAllowedCommandPrefixes/getAllowedCommandPrefixes to resolve-config-value.ts, replacing the hardcoded SAFE_COMMAND_PREFIXES check in executeCommand(). Added allowedCommandPrefixes/fetchAllowedUrls to the Settings interface in settings-manager.ts with GLOBAL_ONLY_KEYS enforcement (stripGlobalOnlyKeys applied at fromStorage, reload, and saveProjectSettings). Added 4 new SettingsManager accessor methods. Exported the 3 new symbols from packages/pi-coding-agent/src/index.ts and rebuilt the package. Added fetchAllowedHostnames module var with setFetchAllowedUrls/getFetchAllowedUrls to url-utils.ts, with an allowlist early-return guard in isBlockedUrl(). Created src/security-overrides.ts with applySecurityOverrides() that reads HX_ALLOWED_COMMAND_PREFIXES/HX_FETCH_ALLOWED_URLS env vars, falls back to settingsManager getters. Wired applySecurityOverrides(settingsManager) into cli.ts immediately after SettingsManager.create(). Created 4 test files totaling 27 tests (8 in pi-coding-agent/dist, 23 in src/tests).

## Verification

tsc --noEmit exits 0. npm run test:unit passes 4233 tests with 0 failures. New src/tests run standalone: 15 pass. pi-coding-agent tests run from dist/: 8 pass. GSD grep over all modified files returns 0 hits.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx tsc --noEmit` | 0 | ✅ pass | 4500ms |
| 2 | `npm run test:unit -- --reporter=dot` | 0 | ✅ pass | 74700ms |
| 3 | `node --test dist-test/src/tests/security-overrides.test.js dist-test/src/tests/url-utils-override.test.js` | 0 | ✅ pass | 3200ms |
| 4 | `node --test dist/core/resolve-config-value-override.test.js dist/core/settings-manager-security.test.js` | 0 | ✅ pass | 240ms |


## Deviations

security-overrides.ts re-exports getAllowedCommandPrefixes and getFetchAllowedUrls which the plan template omitted — added for downstream consumers and test imports.

## Known Issues

pi-coding-agent tests are not included in the main npm run test:unit suite (compile-tests.mjs only covers src/, not packages/). They pass when run directly from packages/pi-coding-agent/dist/.

## Files Created/Modified

- `packages/pi-coding-agent/src/core/resolve-config-value.ts`
- `packages/pi-coding-agent/src/core/settings-manager.ts`
- `packages/pi-coding-agent/src/index.ts`
- `src/resources/extensions/search-the-web/url-utils.ts`
- `src/security-overrides.ts`
- `src/cli.ts`
- `packages/pi-coding-agent/src/core/resolve-config-value-override.test.ts`
- `packages/pi-coding-agent/src/core/settings-manager-security.test.ts`
- `src/tests/security-overrides.test.ts`
- `src/tests/url-utils-override.test.ts`


## Deviations
security-overrides.ts re-exports getAllowedCommandPrefixes and getFetchAllowedUrls which the plan template omitted — added for downstream consumers and test imports.

## Known Issues
pi-coding-agent tests are not included in the main npm run test:unit suite (compile-tests.mjs only covers src/, not packages/). They pass when run directly from packages/pi-coding-agent/dist/.
