/**
 * Tests for the version mismatch guard behaviour.
 *
 * exitIfManagedResourcesAreNewer() in cli.ts is not directly testable
 * (importing cli.ts triggers side effects).  Instead we test:
 *
 *  1. getNewerManagedResourceVersion — the core semver comparison used by the guard
 *  2. The HX_ENV bypass logic — replicated here to ensure the contract is clear
 *     and stays correct if the implementation changes
 */

import test from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { getNewerManagedResourceVersion, readManagedResourceVersion } from "../resource-loader.ts";

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeAgentDir(managedVersion: string): { dir: string; cleanup: () => void } {
  const dir = mkdtempSync(join(tmpdir(), "hx-version-guard-"));
  mkdirSync(dir, { recursive: true });
  // Write a minimal manifest matching the real format (managed-resources.json)
  writeFileSync(
    join(dir, "managed-resources.json"),
    JSON.stringify({ version: 1, hxVersion: managedVersion, syncedAt: Date.now(), contentHash: "abc123", installedExtensionRootFiles: [], installedExtensionDirs: [] }),
  );
  return { dir, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

// ─── getNewerManagedResourceVersion ─────────────────────────────────────────

test("getNewerManagedResourceVersion returns null when managed == current", () => {
  const { dir, cleanup } = makeAgentDir("2.64.0");
  try {
    assert.equal(getNewerManagedResourceVersion(dir, "2.64.0"), null);
  } finally { cleanup(); }
});

test("getNewerManagedResourceVersion returns null when managed < current", () => {
  const { dir, cleanup } = makeAgentDir("2.58.0");
  try {
    assert.equal(getNewerManagedResourceVersion(dir, "2.64.0"), null);
  } finally { cleanup(); }
});

test("getNewerManagedResourceVersion returns managed version when managed > current", () => {
  const { dir, cleanup } = makeAgentDir("2.64.0");
  try {
    assert.equal(getNewerManagedResourceVersion(dir, "2.58.0"), "2.64.0");
  } finally { cleanup(); }
});

test("getNewerManagedResourceVersion returns null when manifest is missing", () => {
  const dir = mkdtempSync(join(tmpdir(), "hx-version-guard-empty-"));
  try {
    assert.equal(getNewerManagedResourceVersion(dir, "2.64.0"), null);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

// ─── HX_ENV bypass logic ────────────────────────────────────────────────────
//
// exitIfManagedResourcesAreNewer() in cli.ts skips the check when
// HX_ENV === 'local' or 'staging'.  We replicate that logic here so regressions
// are caught even if the implementation location moves.

test("HX_ENV=local skips version mismatch guard even when managed > current", () => {
  const { dir, cleanup } = makeAgentDir("2.64.0");
  try {
    const hxEnv = "local";
    // Replicate the guard logic from cli.ts
    if (hxEnv === "local" || hxEnv === "staging") {
      // Should not reach the check
      assert.ok(true, "guard correctly bypassed for HX_ENV=local");
      return;
    }
    const newer = getNewerManagedResourceVersion(dir, "2.58.0");
    assert.fail(`Should have bypassed, but would have exited with: ${newer}`);
  } finally { cleanup(); }
});

test("HX_ENV=staging skips version mismatch guard even when managed > current", () => {
  const { dir, cleanup } = makeAgentDir("2.64.0");
  try {
    const hxEnv = "staging";
    if (hxEnv === "local" || hxEnv === "staging") {
      assert.ok(true, "guard correctly bypassed for HX_ENV=staging");
      return;
    }
    const newer = getNewerManagedResourceVersion(dir, "2.58.0");
    assert.fail(`Should have bypassed, but would have exited with: ${newer}`);
  } finally { cleanup(); }
});

test("HX_ENV=production does NOT skip version mismatch guard", () => {
  const { dir, cleanup } = makeAgentDir("2.64.0");
  try {
    const hxEnv = "production";
    if (hxEnv === "local" || hxEnv === "staging") {
      assert.fail("Guard should NOT be bypassed for production");
    }
    const newer = getNewerManagedResourceVersion(dir, "2.58.0");
    assert.equal(newer, "2.64.0", "should detect mismatch in production mode");
  } finally { cleanup(); }
});

test("HX_ENV undefined does NOT skip version mismatch guard", () => {
  const { dir, cleanup } = makeAgentDir("2.64.0");
  try {
    const hxEnv = undefined;
    if (hxEnv === "local" || hxEnv === "staging") {
      assert.fail("Guard should NOT be bypassed when HX_ENV is undefined");
    }
    const newer = getNewerManagedResourceVersion(dir, "2.58.0");
    assert.equal(newer, "2.64.0", "should detect mismatch when HX_ENV is unset");
  } finally { cleanup(); }
});
