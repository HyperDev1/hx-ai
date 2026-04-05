/**
 * Integration tests for security-overrides.ts
 */

import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { setAllowedCommandPrefixes, getAllowedCommandPrefixes } from "@hyperlab/hx-coding-agent";
import { setFetchAllowedUrls, getFetchAllowedUrls } from "../resources/extensions/search-the-web/url-utils.js";
import { applySecurityOverrides } from "../security-overrides.js";

function makeMockSettingsManager(
  prefixes?: string[],
  urls?: string[],
): { getAllowedCommandPrefixes(): string[] | undefined; getFetchAllowedUrls(): string[] | undefined } {
  return {
    getAllowedCommandPrefixes: () => prefixes,
    getFetchAllowedUrls: () => urls,
  };
}

describe("applySecurityOverrides", () => {
  afterEach(() => {
    // Clean up module-level state
    setAllowedCommandPrefixes(null);
    setFetchAllowedUrls(null);
    delete process.env.HX_ALLOWED_COMMAND_PREFIXES;
    delete process.env.HX_FETCH_ALLOWED_URLS;
  });

  it("env var HX_ALLOWED_COMMAND_PREFIXES sets command prefixes", () => {
    process.env.HX_ALLOWED_COMMAND_PREFIXES = "my-tool,custom-cmd";
    applySecurityOverrides(makeMockSettingsManager());
    const active = getAllowedCommandPrefixes();
    assert.deepEqual(active, ["my-tool", "custom-cmd"]);
  });

  it("env var HX_FETCH_ALLOWED_URLS sets fetch URL allowlist", () => {
    process.env.HX_FETCH_ALLOWED_URLS = "https://example.com,https://trusted.org";
    applySecurityOverrides(makeMockSettingsManager());
    const active = getFetchAllowedUrls();
    assert.ok(active !== null);
    assert.ok(active!.includes("example.com"));
    assert.ok(active!.includes("trusted.org"));
  });

  it("falls back to settingsManager.getAllowedCommandPrefixes when env var is absent", () => {
    const sm = makeMockSettingsManager(["pass", "vault"], undefined);
    applySecurityOverrides(sm);
    const active = getAllowedCommandPrefixes();
    assert.deepEqual(active, ["pass", "vault"]);
  });

  it("falls back to settingsManager.getFetchAllowedUrls when env var is absent", () => {
    const sm = makeMockSettingsManager(undefined, ["https://api.example.com"]);
    applySecurityOverrides(sm);
    const active = getFetchAllowedUrls();
    assert.ok(active !== null);
    assert.ok(active!.includes("api.example.com"));
  });

  it("env var takes precedence over settingsManager value", () => {
    process.env.HX_ALLOWED_COMMAND_PREFIXES = "env-tool";
    const sm = makeMockSettingsManager(["settings-tool"], undefined);
    applySecurityOverrides(sm);
    const active = getAllowedCommandPrefixes();
    assert.deepEqual(active, ["env-tool"]);
  });

  it("does not set prefixes when both env var and settings are absent", () => {
    applySecurityOverrides(makeMockSettingsManager());
    assert.equal(getAllowedCommandPrefixes(), null);
  });
});
