/**
 * Tests for setFetchAllowedUrls / isBlockedUrl allowlist logic.
 */

import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  isBlockedUrl,
  setFetchAllowedUrls,
  getFetchAllowedUrls,
} from "../resources/extensions/search-the-web/url-utils.js";

describe("setFetchAllowedUrls / getFetchAllowedUrls", () => {
  afterEach(() => {
    setFetchAllowedUrls(null);
  });

  it("returns null by default", () => {
    assert.equal(getFetchAllowedUrls(), null);
  });

  it("extracts hostnames from URL strings", () => {
    setFetchAllowedUrls(["https://example.com", "https://trusted.org/path"]);
    const active = getFetchAllowedUrls();
    assert.ok(active !== null);
    assert.ok(active!.includes("example.com"));
    assert.ok(active!.includes("trusted.org"));
  });

  it("null resets the allowlist", () => {
    setFetchAllowedUrls(["https://example.com"]);
    setFetchAllowedUrls(null);
    assert.equal(getFetchAllowedUrls(), null);
  });
});

describe("isBlockedUrl with allowlist", () => {
  afterEach(() => {
    setFetchAllowedUrls(null);
  });

  it("blocks private IPs by default", () => {
    assert.equal(isBlockedUrl("http://192.168.1.1/"), true);
    assert.equal(isBlockedUrl("http://localhost/"), true);
    assert.equal(isBlockedUrl("http://10.0.0.1/"), true);
  });

  it("allows http/https public URLs by default", () => {
    assert.equal(isBlockedUrl("https://example.com"), false);
  });

  it("allowlisted private IP bypasses block", () => {
    setFetchAllowedUrls(["http://192.168.1.1"]);
    assert.equal(isBlockedUrl("http://192.168.1.1/"), false);
  });

  it("allowlisted localhost bypasses block", () => {
    setFetchAllowedUrls(["http://localhost"]);
    assert.equal(isBlockedUrl("http://localhost/"), false);
  });

  it("non-allowlisted private IP still blocked when allowlist is active", () => {
    setFetchAllowedUrls(["http://192.168.1.1"]);
    assert.equal(isBlockedUrl("http://10.0.0.1/"), true);
  });

  it("allowlist does not affect non-http protocols", () => {
    setFetchAllowedUrls(["file:///etc/passwd"]);
    assert.equal(isBlockedUrl("file:///etc/passwd"), true);
  });
});
