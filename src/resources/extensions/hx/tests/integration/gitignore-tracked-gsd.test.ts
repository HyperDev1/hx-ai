/**
 * gitignore-tracked-gsd.test.ts — Regression tests for #1364.
 *
 * Verifies that ensureGitignore() does NOT add ".gsd" to .gitignore
 * when .hx/ contains git-tracked files, and that migrateToExternalState()
 * aborts migration for tracked .hx/ directories.
 *
 * Uses real temporary git repos — no mocks.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { ensureGitignore, hasGitTrackedGsdFiles } from "../../gitignore.ts";
import { migrateToExternalState } from "../../migrate-external.ts";

// ─── Helpers ─────────────────────────────────────────────────────────

function git(dir: string, ...args: string[]): string {
  return execFileSync("git", args, { cwd: dir, stdio: "pipe", encoding: "utf-8" }).trim();
}

function makeTempRepo(): string {
  const dir = mkdtempSync(join(tmpdir(), "hx-gitignore-test-"));
  git(dir, "init");
  git(dir, "config", "user.email", "test@test.com");
  git(dir, "config", "user.name", "Test");
  writeFileSync(join(dir, "README.md"), "# init\n");
  git(dir, "add", "-A");
  git(dir, "commit", "-m", "init");
  git(dir, "branch", "-M", "main");
  return dir;
}

function cleanup(dir: string): void {
  try {
    rmSync(dir, { recursive: true, force: true });
  } catch {
    // ignore
  }
}

// ─── hasGitTrackedGsdFiles ───────────────────────────────────────────

test("hasGitTrackedGsdFiles returns false when .hx/ does not exist", (t) => {
  const dir = makeTempRepo();
  t.after(() => { cleanup(dir); });

  assert.equal(hasGitTrackedGsdFiles(dir), false);
});

test("hasGitTrackedGsdFiles returns true when .hx/ has tracked files", (t) => {
  const dir = makeTempRepo();
  t.after(() => { cleanup(dir); });

  mkdirSync(join(dir, ".hx", "milestones"), { recursive: true });
  writeFileSync(join(dir, ".hx", "PROJECT.md"), "# Test Project\n");
  git(dir, "add", ".hx/PROJECT.md");
  git(dir, "commit", "-m", "add hx");
  assert.equal(hasGitTrackedGsdFiles(dir), true);
});

test("hasGitTrackedGsdFiles returns false when .hx/ exists but is untracked", (t) => {
  const dir = makeTempRepo();
  t.after(() => { cleanup(dir); });

  mkdirSync(join(dir, ".hx"), { recursive: true });
  writeFileSync(join(dir, ".hx", "STATE.md"), "state\n");
  // Not git-added — should return false
  assert.equal(hasGitTrackedGsdFiles(dir), false);
});

// ─── ensureGitignore — tracked .hx/ protection ─────────────────────

test("ensureGitignore does NOT add .hx when .hx/ has tracked files (#1364)", (t) => {
  const dir = makeTempRepo();
  try {
    // Set up .hx/ with tracked files
    mkdirSync(join(dir, ".hx", "milestones"), { recursive: true });
    writeFileSync(join(dir, ".hx", "PROJECT.md"), "# Test Project\n");
    writeFileSync(join(dir, ".hx", "DECISIONS.md"), "# Decisions\n");
    git(dir, "add", ".hx/");
    git(dir, "commit", "-m", "track hx state");

    // Run ensureGitignore
    ensureGitignore(dir);

    // Verify .hx is NOT in .gitignore
    const gitignore = readFileSync(join(dir, ".gitignore"), "utf-8");
    const lines = gitignore.split("\n").map((l) => l.trim());
    assert.ok(
      !lines.includes(".hx"),
      `Expected .hx NOT to appear in .gitignore, but it does:\n${gitignore}`,
    );

    // Other baseline patterns should still be present
    assert.ok(lines.includes(".DS_Store"), "Expected .DS_Store in .gitignore");
    assert.ok(lines.includes("node_modules/"), "Expected node_modules/ in .gitignore");
  } finally {
    cleanup(dir);
  }
});

test("ensureGitignore adds .hx when .hx/ has NO tracked files", (t) => {
  const dir = makeTempRepo();
  try {
    // Run ensureGitignore (no .hx/ at all)
    ensureGitignore(dir);

    // Verify .hx IS in .gitignore
    const gitignore = readFileSync(join(dir, ".gitignore"), "utf-8");
    const lines = gitignore.split("\n").map((l) => l.trim());
    assert.ok(
      lines.includes(".hx"),
      `Expected .hx in .gitignore, but it's missing:\n${gitignore}`,
    );
  } finally {
    cleanup(dir);
  }
});

test("ensureGitignore respects manageGitignore: false", (t) => {
  const dir = makeTempRepo();
  t.after(() => { cleanup(dir); });

  const result = ensureGitignore(dir, { manageGitignore: false });
  assert.equal(result, false);
  assert.ok(!existsSync(join(dir, ".gitignore")), "Should not create .gitignore");
});

// ─── ensureGitignore — verify no tracked files become invisible ─────

test("ensureGitignore with tracked .hx/ does not cause git to see files as deleted", (t) => {
  const dir = makeTempRepo();
  try {
    // Create tracked .hx/ files
    mkdirSync(join(dir, ".hx", "milestones", "M001"), { recursive: true });
    writeFileSync(join(dir, ".hx", "PROJECT.md"), "# Project\n");
    writeFileSync(
      join(dir, ".hx", "milestones", "M001", "M001-CONTEXT.md"),
      "# M001\n",
    );
    git(dir, "add", ".hx/");
    git(dir, "commit", "-m", "track hx state");

    // Run ensureGitignore
    ensureGitignore(dir);

    // git status should show NO deleted files under .hx/
    const status = git(dir, "status", "--porcelain", ".hx/");

    // Filter for deletions (lines starting with " D" or "D ")
    const deletions = status
      .split("\n")
      .filter((l) => l.match(/^\s*D\s/) || l.match(/^D\s/));

    assert.equal(
      deletions.length,
      0,
      `Expected no deleted .hx/ files, but found:\n${deletions.join("\n")}`,
    );
  } finally {
    cleanup(dir);
  }
});

test("hasGitTrackedGsdFiles returns true (fail-safe) when git is not available", (t) => {
  const dir = makeTempRepo();
  try {
    // Create and track .hx/ files
    mkdirSync(join(dir, ".hx"), { recursive: true });
    writeFileSync(join(dir, ".hx", "PROJECT.md"), "# Project\n");
    git(dir, "add", ".hx/");
    git(dir, "commit", "-m", "track hx");

    // Corrupt the git index to simulate git failure
    const indexPath = join(dir, ".git", "index.lock");
    writeFileSync(indexPath, "locked");

    // Should fail safe — assume tracked rather than silently returning false
    // (The index lock causes git ls-files to fail; rev-parse also fails → true)
    const result = hasGitTrackedGsdFiles(dir);
    assert.equal(result, true, "Should return true (fail-safe) when git is unavailable");
  } finally {
    cleanup(dir);
  }
});

// ─── migrateToExternalState — tracked .hx/ protection ──────────────

test("migrateToExternalState aborts when .hx/ has tracked files (#1364)", (t) => {
  const dir = makeTempRepo();
  try {
    // Create tracked .hx/ files
    mkdirSync(join(dir, ".hx", "milestones"), { recursive: true });
    writeFileSync(join(dir, ".hx", "PROJECT.md"), "# Project\n");
    git(dir, "add", ".hx/");
    git(dir, "commit", "-m", "track hx state");

    // Attempt migration — should abort without moving anything
    const result = migrateToExternalState(dir);

    assert.equal(result.migrated, false, "Should NOT migrate tracked .hx/");
    assert.equal(result.error, undefined, "Should not report an error — just skip");

    // .hx/ should still be a real directory, not a symlink
    assert.ok(existsSync(join(dir, ".hx", "PROJECT.md")), ".hx/PROJECT.md should still exist");

    // No .gsd.migrating should exist
    assert.ok(
      !existsSync(join(dir, ".hx.migrating")),
      ".hx.migrating should not exist",
    );
  } finally {
    cleanup(dir);
  }
});

test("migrateToExternalState cleans git index so tracked files don't show as deleted (#1364 path 2)", (t) => {
  const dir = makeTempRepo();
  try {
    // Track .hx/ files, then untrack them so migration proceeds
    mkdirSync(join(dir, ".hx", "milestones", "M001"), { recursive: true });
    writeFileSync(join(dir, ".hx", "PROJECT.md"), "# Project\n");
    writeFileSync(join(dir, ".hx", "milestones", "M001", "PLAN.md"), "# Plan\n");
    git(dir, "add", ".hx/");
    git(dir, "commit", "-m", "track hx state");
    git(dir, "rm", "-r", "--cached", ".hx/");
    git(dir, "commit", "-m", "untrack hx (simulates pre-migration project)");

    const result = migrateToExternalState(dir);
    assert.equal(result.migrated, true, "Migration should succeed");

    // git status must show NO deleted files after migration
    const status = git(dir, "status", "--porcelain");
    const deletions = status.split("\n").filter((l) => /^\s*D\s/.test(l) || /^D\s/.test(l));
    assert.equal(
      deletions.length,
      0,
      `Expected no deleted files after migration, but found:\n${deletions.join("\n")}`,
    );
  } finally {
    cleanup(dir);
  }
});
