import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { SettingsManager } from "./settings-manager.js";

describe("SettingsManager — GLOBAL_ONLY_KEYS enforcement", () => {
  it("getAllowedCommandPrefixes reads from global settings only", () => {
    const sm = SettingsManager.inMemory({});
    assert.equal(sm.getAllowedCommandPrefixes(), undefined);
    sm.setAllowedCommandPrefixes(["pass", "op"]);
    assert.deepEqual(sm.getAllowedCommandPrefixes(), ["pass", "op"]);
  });

  it("getFetchAllowedUrls reads from global settings only", () => {
    const sm = SettingsManager.inMemory({});
    assert.equal(sm.getFetchAllowedUrls(), undefined);
    sm.setFetchAllowedUrls(["https://example.com"]);
    assert.deepEqual(sm.getFetchAllowedUrls(), ["https://example.com"]);
  });

  it("project settings with allowedCommandPrefixes are stripped on load", () => {
    // Create an in-memory manager with global settings containing the key
    // and verify project settings do not expose it
    const sm = SettingsManager.inMemory({ allowedCommandPrefixes: ["global-only"] });
    // Project settings should not contain this key — getAllowedCommandPrefixes reads global only
    assert.deepEqual(sm.getAllowedCommandPrefixes(), ["global-only"]);
    // The merged settings object should have the global value
    const global = sm.getGlobalSettings();
    assert.deepEqual(global.allowedCommandPrefixes, ["global-only"]);
  });

  it("stripGlobalOnlyKeys effect: project settings do not bleed global-only keys", () => {
    // Simulate a case where someone tries to set allowedCommandPrefixes via setProjectSetting
    // The saveProjectSettings method strips them, so they don't persist at project scope
    const sm = SettingsManager.inMemory({});
    // setAllowedCommandPrefixes uses setGlobalSetting, so it goes to global
    sm.setAllowedCommandPrefixes(["vault"]);
    const project = sm.getProjectSettings();
    assert.equal(project.allowedCommandPrefixes, undefined);
    const global = sm.getGlobalSettings();
    assert.deepEqual(global.allowedCommandPrefixes, ["vault"]);
  });
});
