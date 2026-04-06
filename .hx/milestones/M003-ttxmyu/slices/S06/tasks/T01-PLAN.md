---
estimated_steps: 45
estimated_files: 10
skills_used: []
---

# T01: Security Overrides + URL Utils (Cluster 1)

Port the security-overrides cluster from upstream commit e78db4c18. This adds runtime-configurable command prefix allowlists and fetch URL allowlists, replacing the hardcoded SAFE_COMMAND_PREFIXES check.

Steps:
1. In `packages/pi-coding-agent/src/core/resolve-config-value.ts`:
   - Add `let activeCommandPrefixes: string[] | null = null` module var
   - Add `setAllowedCommandPrefixes(prefixes: string[] | null): void` — sets the var and calls `clearConfigValueCache()` (if that exists; add it if not: clears `commandResultCache`)
   - Add `getAllowedCommandPrefixes(): string[] | null` getter
   - Update `executeCommand()` to use `activeCommandPrefixes ?? SAFE_COMMAND_PREFIXES` instead of hardcoded `SAFE_COMMAND_PREFIXES`

2. In `packages/pi-coding-agent/src/core/settings-manager.ts`:
   - Add `allowedCommandPrefixes?: string[]` and `fetchAllowedUrls?: string[]` to the `Settings` interface
   - Add `const GLOBAL_ONLY_KEYS = new Set(['allowedCommandPrefixes', 'fetchAllowedUrls'])` constant
   - Add `stripGlobalOnlyKeys(settings: Partial<Settings>): Partial<Settings>` function that deletes those keys from project-level settings
   - Apply `stripGlobalOnlyKeys` at the 3 sites where project settings are merged/applied (search for where project settings override global)
   - Add `getAllowedCommandPrefixes(): string[] | undefined`, `setAllowedCommandPrefixes(v: string[]): void`, `getFetchAllowedUrls(): string[] | undefined`, `setFetchAllowedUrls(v: string[]): void` to `SettingsManager` class

3. In `packages/pi-coding-agent/src/index.ts`:
   - Export `SAFE_COMMAND_PREFIXES`, `setAllowedCommandPrefixes`, `getAllowedCommandPrefixes` from `'./core/resolve-config-value.js'`

4. In `src/resources/extensions/search-the-web/url-utils.ts`:
   - Add `let fetchAllowedHostnames: string[] | null = null` module var
   - Add `setFetchAllowedUrls(urls: string[] | null): void` — parses hostnames from URL strings
   - Add `getFetchAllowedUrls(): string[] | null` getter
   - In `isBlockedUrl()`: add early-return `if (fetchAllowedHostnames && fetchAllowedHostnames.includes(new URL(url).hostname)) return false` guard before the block logic

5. Create `src/security-overrides.ts` — new file:
   ```typescript
   import { setAllowedCommandPrefixes, getAllowedCommandPrefixes } from '@hyperlab/hx-coding-agent';
   import { setFetchAllowedUrls, getFetchAllowedUrls } from './resources/extensions/search-the-web/url-utils.js';
   
   export function applySecurityOverrides(settingsManager: { getAllowedCommandPrefixes(): string[] | undefined; getFetchAllowedUrls(): string[] | undefined }): void {
     const envPrefixes = process.env.HX_ALLOWED_COMMAND_PREFIXES;
     const prefixes = envPrefixes ? envPrefixes.split(',').map(s => s.trim()).filter(Boolean) : settingsManager.getAllowedCommandPrefixes();
     if (prefixes && prefixes.length > 0) setAllowedCommandPrefixes(prefixes);
     
     const envUrls = process.env.HX_FETCH_ALLOWED_URLS;
     const urls = envUrls ? envUrls.split(',').map(s => s.trim()).filter(Boolean) : settingsManager.getFetchAllowedUrls();
     if (urls && urls.length > 0) setFetchAllowedUrls(urls);
   }
   ```
   IMPORTANT: env var names must be `HX_ALLOWED_COMMAND_PREFIXES` / `HX_FETCH_ALLOWED_URLS` (not GSD_*).
   IMPORTANT: import from `'@hyperlab/hx-coding-agent'` (not `'@gsd/pi-coding-agent'`).

6. In `src/cli.ts`:
   - Import `applySecurityOverrides` from `'./security-overrides.js'`
   - Call `applySecurityOverrides(settingsManager)` after `SettingsManager.create` (search for that call)

7. Create test files:
   - `packages/pi-coding-agent/src/core/resolve-config-value-override.test.ts`: 4 tests for setAllowedCommandPrefixes (blocked by default, override allows, null resets to default, clear cache called)
   - `packages/pi-coding-agent/src/core/settings-manager-security.test.ts`: tests for GLOBAL_ONLY_KEYS enforcement, stripGlobalOnlyKeys removes keys from project settings, global settings retain them
   - `src/tests/security-overrides.test.ts`: integration tests — env var HX_ALLOWED_COMMAND_PREFIXES sets prefixes, env var HX_FETCH_ALLOWED_URLS sets URLs, fallback to settingsManager getters when env vars absent
   - `src/tests/url-utils-override.test.ts`: tests for setFetchAllowedUrls / isBlockedUrl exemptions

## Inputs

- `packages/pi-coding-agent/src/core/resolve-config-value.ts`
- `packages/pi-coding-agent/src/core/settings-manager.ts`
- `packages/pi-coding-agent/src/index.ts`
- `src/resources/extensions/search-the-web/url-utils.ts`
- `src/cli.ts`

## Expected Output

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

## Verification

npx tsc --noEmit && npm run test:unit -- --reporter=dot 2>&1 | tail -3
