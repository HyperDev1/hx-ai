import { setAllowedCommandPrefixes, getAllowedCommandPrefixes } from '@hyperlab/hx-coding-agent';
import { setFetchAllowedUrls, getFetchAllowedUrls } from './resources/extensions/search-the-web/url-utils.js';

// Re-export getters for downstream consumers
export { getAllowedCommandPrefixes, getFetchAllowedUrls };

/**
 * Apply security overrides from env vars or settings.
 * - HX_ALLOWED_COMMAND_PREFIXES: comma-separated list of allowed command prefixes
 * - HX_FETCH_ALLOWED_URLS: comma-separated list of allowed fetch URLs/hostnames
 * Settings values are used as fallback when env vars are absent.
 */
export function applySecurityOverrides(settingsManager: {
  getAllowedCommandPrefixes(): string[] | undefined;
  getFetchAllowedUrls(): string[] | undefined;
}): void {
  const envPrefixes = process.env.HX_ALLOWED_COMMAND_PREFIXES;
  const prefixes = envPrefixes
    ? envPrefixes.split(',').map((s) => s.trim()).filter(Boolean)
    : settingsManager.getAllowedCommandPrefixes();
  if (prefixes && prefixes.length > 0) setAllowedCommandPrefixes(prefixes);

  const envUrls = process.env.HX_FETCH_ALLOWED_URLS;
  const urls = envUrls
    ? envUrls.split(',').map((s) => s.trim()).filter(Boolean)
    : settingsManager.getFetchAllowedUrls();
  if (urls && urls.length > 0) setFetchAllowedUrls(urls);
}
