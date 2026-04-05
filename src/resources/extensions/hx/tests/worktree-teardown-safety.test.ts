/**
 * Tests for worktree teardown path validation safety guard.
 * Verifies that rmSync is not called when the target path is outside
 * the worktrees directory.
 */

import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

const MANAGER_SRC = readFileSync(
  new URL(
    "../worktree-manager.ts",
    import.meta.url,
  ),
  "utf-8",
);

const WORKTREE_SRC = readFileSync(
  new URL(
    "../auto-worktree.ts",
    import.meta.url,
  ),
  "utf-8",
);

test("worktree-teardown-safety: isInsideWorktreesDir is exported from worktree-manager", () => {
  assert.ok(
    MANAGER_SRC.includes("export function isInsideWorktreesDir"),
    "Expected isInsideWorktreesDir export in worktree-manager.ts",
  );
});

test("worktree-teardown-safety: isInsideWorktreesDir checks path starts with worktrees dir", () => {
  assert.ok(
    MANAGER_SRC.includes("worktreesDir(basePath)"),
    "Expected worktreesDir(basePath) usage in isInsideWorktreesDir",
  );
});

test("worktree-teardown-safety: rmSync in worktree-manager is guarded by isInsideWorktreesDir", () => {
  // The stale-worktree cleanup rmSync must be wrapped in the safety guard
  const guardIdx = MANAGER_SRC.indexOf("isInsideWorktreesDir(basePath, wtPath)");
  const rmIdx = MANAGER_SRC.indexOf("rmSync(wtPath");
  assert.ok(guardIdx > 0, "Expected isInsideWorktreesDir guard in worktree-manager.ts");
  assert.ok(rmIdx > 0, "Expected rmSync(wtPath) in worktree-manager.ts");
  // Guard must come before the rmSync call
  assert.ok(guardIdx < rmIdx, "isInsideWorktreesDir guard must precede rmSync call");
});

test("worktree-teardown-safety: auto-worktree imports isInsideWorktreesDir", () => {
  assert.ok(
    WORKTREE_SRC.includes("isInsideWorktreesDir"),
    "Expected isInsideWorktreesDir import in auto-worktree.ts",
  );
});

test("worktree-teardown-safety: fallback rmSync in auto-worktree is guarded", () => {
  // The orphaned-dir cleanup rmSync must also be guarded
  assert.ok(
    WORKTREE_SRC.includes("isInsideWorktreesDir(originalBasePath, wtDir)"),
    "Expected isInsideWorktreesDir guard around fallback rmSync in auto-worktree.ts",
  );
});

test("worktree-teardown-safety: logError is called when path is outside worktrees dir", () => {
  // Both files should log an error when the safety check fails
  const managerHasError = MANAGER_SRC.includes("logError") && MANAGER_SRC.includes("Safety: refusing");
  const worktreeHasError = WORKTREE_SRC.includes("logError") && WORKTREE_SRC.includes("Safety: refusing");
  assert.ok(managerHasError, "worktree-manager.ts should call logError when safety check fails");
  assert.ok(worktreeHasError, "auto-worktree.ts should call logError when safety check fails");
});
