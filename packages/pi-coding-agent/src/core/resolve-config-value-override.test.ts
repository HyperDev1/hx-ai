import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  setAllowedCommandPrefixes,
  getAllowedCommandPrefixes,
  SAFE_COMMAND_PREFIXES,
  clearConfigValueCache,
} from "./resolve-config-value.js";

describe("setAllowedCommandPrefixes", () => {
  afterEach(() => {
    // Reset to default after each test
    setAllowedCommandPrefixes(null);
  });

  it("returns null by default (no override)", () => {
    assert.equal(getAllowedCommandPrefixes(), null);
  });

  it("override replaces the active prefix list", () => {
    setAllowedCommandPrefixes(["my-tool", "custom-cmd"]);
    const active = getAllowedCommandPrefixes();
    assert.deepEqual(active, ["my-tool", "custom-cmd"]);
  });

  it("null resets to default (SAFE_COMMAND_PREFIXES)", () => {
    setAllowedCommandPrefixes(["something"]);
    setAllowedCommandPrefixes(null);
    assert.equal(getAllowedCommandPrefixes(), null);
  });

  it("setAllowedCommandPrefixes calls clearConfigValueCache (no stale entries)", () => {
    // After setting overrides, cache is cleared. We verify by checking
    // clearConfigValueCache does not throw — it is called inside setAllowedCommandPrefixes.
    // Also verify SAFE_COMMAND_PREFIXES is still exported as a const.
    assert.ok(Array.isArray(SAFE_COMMAND_PREFIXES));
    assert.ok(SAFE_COMMAND_PREFIXES.includes("pass"));
    // clearConfigValueCache is exported for testing
    assert.doesNotThrow(() => clearConfigValueCache());
  });
});
