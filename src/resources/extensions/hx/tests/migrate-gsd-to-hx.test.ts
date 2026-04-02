/**
 * Tests for .gsd → .hx project migration.
 */

import test from "node:test";
import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
  lstatSync,
  readlinkSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { migrateProjectGsdToHx, migrateGlobalGsdToHx } from "../migrate-gsd-to-hx.ts";

// ─── Helpers ─────────────────────────────────────────────────────────

function makeTempDir(prefix = "hx-migrate-test-"): string {
  return mkdtempSync(join(tmpdir(), prefix));
}

function cleanup(dir: string): void {
  try { rmSync(dir, { recursive: true, force: true }); } catch {}
}

// ─── migrateProjectGsdToHx ──────────────────────────────────────────

test("migrates .gsd/ directory to .hx/", () => {
  const dir = makeTempDir();
  try {
    mkdirSync(join(dir, ".gsd", "milestones"), { recursive: true });
    writeFileSync(join(dir, ".gsd", "PROJECT.md"), "# Test\n");

    const result = migrateProjectGsdToHx(dir);

    assert.equal(result.migrated, true);
    assert.equal(result.error, undefined);
    assert.ok(existsSync(join(dir, ".hx")));
    assert.ok(existsSync(join(dir, ".hx", "PROJECT.md")));
    assert.ok(existsSync(join(dir, ".hx", "milestones")));
    assert.ok(!existsSync(join(dir, ".gsd")));
  } finally {
    cleanup(dir);
  }
});

test("no-op when .hx/ already exists", () => {
  const dir = makeTempDir();
  try {
    mkdirSync(join(dir, ".gsd"), { recursive: true });
    mkdirSync(join(dir, ".hx"), { recursive: true });

    const result = migrateProjectGsdToHx(dir);

    assert.equal(result.migrated, false);
    // Both directories should still exist
    assert.ok(existsSync(join(dir, ".gsd")));
    assert.ok(existsSync(join(dir, ".hx")));
  } finally {
    cleanup(dir);
  }
});

test("no-op when neither .gsd/ nor .hx/ exists", () => {
  const dir = makeTempDir();
  try {
    const result = migrateProjectGsdToHx(dir);
    assert.equal(result.migrated, false);
  } finally {
    cleanup(dir);
  }
});

test("handles .gsd/ symlink by re-creating as .hx/", () => {
  const dir = makeTempDir();
  const target = makeTempDir("hx-symlink-target-");
  try {
    writeFileSync(join(target, "STATE.md"), "# State\n");
    symlinkSync(target, join(dir, ".gsd"));

    const result = migrateProjectGsdToHx(dir);

    assert.equal(result.migrated, true);
    assert.ok(existsSync(join(dir, ".hx")));
    assert.ok(lstatSync(join(dir, ".hx")).isSymbolicLink());
    assert.equal(readlinkSync(join(dir, ".hx")), target);
    assert.ok(existsSync(join(dir, ".hx", "STATE.md")));
  } finally {
    cleanup(dir);
    cleanup(target);
  }
});

test("updates .gitignore from .gsd to .hx", () => {
  const dir = makeTempDir();
  try {
    mkdirSync(join(dir, ".gsd"), { recursive: true });
    writeFileSync(join(dir, ".gitignore"), ".gsd\nnode_modules\n.gsd/debug/\n");

    migrateProjectGsdToHx(dir);

    const content = readFileSync(join(dir, ".gitignore"), "utf-8");
    assert.ok(content.includes(".hx\n"), "should have .hx");
    assert.ok(!content.includes(".gsd\n"), "should not have .gsd");
    assert.ok(content.includes("node_modules"), "should keep other entries");
    assert.ok(content.includes(".hx/debug/"), "should replace .gsd/ prefix in paths");
  } finally {
    cleanup(dir);
  }
});

// ─── migrateGlobalGsdToHx ───────────────────────────────────────────

test("syncs auth.json from ~/.gsd/agent/ to ~/.hx/agent/", () => {
  const gsdHome = makeTempDir("gsd-home-");
  const hxHome = makeTempDir("hx-home-");
  try {
    mkdirSync(join(gsdHome, "agent"), { recursive: true });
    writeFileSync(join(gsdHome, "agent", "auth.json"), '{"anthropic":{"type":"api_key"}}');

    // Set env vars for the test
    const origGsd = process.env.GSD_HOME;
    const origHx = process.env.HX_HOME;
    process.env.GSD_HOME = gsdHome;
    process.env.HX_HOME = hxHome;

    try {
      const result = migrateGlobalGsdToHx();
      assert.equal(result.migrated, true);
      assert.ok(existsSync(join(hxHome, "agent", "auth.json")));
    } finally {
      if (origGsd !== undefined) process.env.GSD_HOME = origGsd; else delete process.env.GSD_HOME;
      if (origHx !== undefined) process.env.HX_HOME = origHx; else delete process.env.HX_HOME;
    }
  } finally {
    cleanup(gsdHome);
    cleanup(hxHome);
  }
});

test("does not overwrite existing hx auth.json", () => {
  const gsdHome = makeTempDir("gsd-home-");
  const hxHome = makeTempDir("hx-home-");
  try {
    mkdirSync(join(gsdHome, "agent"), { recursive: true });
    mkdirSync(join(hxHome, "agent"), { recursive: true });
    writeFileSync(join(gsdHome, "agent", "auth.json"), '{"old":"gsd"}');
    writeFileSync(join(hxHome, "agent", "auth.json"), '{"fresh":"hx"}');

    const origGsd = process.env.GSD_HOME;
    const origHx = process.env.HX_HOME;
    process.env.GSD_HOME = gsdHome;
    process.env.HX_HOME = hxHome;

    try {
      const result = migrateGlobalGsdToHx();
      assert.equal(result.migrated, false);
      const content = readFileSync(join(hxHome, "agent", "auth.json"), "utf-8");
      assert.ok(content.includes("fresh"), "should not overwrite existing file");
    } finally {
      if (origGsd !== undefined) process.env.GSD_HOME = origGsd; else delete process.env.GSD_HOME;
      if (origHx !== undefined) process.env.HX_HOME = origHx; else delete process.env.HX_HOME;
    }
  } finally {
    cleanup(gsdHome);
    cleanup(hxHome);
  }
});
