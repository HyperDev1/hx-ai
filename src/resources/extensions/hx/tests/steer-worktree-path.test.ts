/**
 * steer-worktree-path.test.ts
 *
 * Verifies that handleSteer writes the override to the worktree path
 * when auto-mode is active, and to basePath when auto-mode is inactive.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = readFileSync(
  join(import.meta.dirname, "..", "commands-handlers.ts"),
  "utf-8",
);

test("commands-handlers.ts imports getAutoWorktreePath from auto-worktree.js (#724e65643)", () => {
  assert.ok(
    source.includes("getAutoWorktreePath"),
    "commands-handlers.ts must import getAutoWorktreePath",
  );
});

test("commands-handlers.ts imports checkRemoteAutoSession from auto.js (#cb3f38c27)", () => {
  assert.ok(
    source.includes("checkRemoteAutoSession"),
    "commands-handlers.ts must import checkRemoteAutoSession",
  );
});

test("handleSteer computes wtPath using getAutoWorktreePath when mid is not 'none'", () => {
  assert.ok(
    source.includes("getAutoWorktreePath(basePath, mid)"),
    "handleSteer must compute wtPath via getAutoWorktreePath",
  );
});

test("handleSteer gates worktree path on isAutoActive() || checkRemoteAutoSession().running", () => {
  assert.ok(
    source.includes("checkRemoteAutoSession(basePath).running"),
    "handleSteer must check checkRemoteAutoSession().running as a gate condition",
  );
});

test("handleSteer calls appendOverride with targetPath, not hardcoded basePath", () => {
  // The call should use targetPath which is conditionally the worktree path
  assert.ok(
    source.includes("appendOverride(targetPath, change, appliedAt)"),
    "handleSteer must call appendOverride(targetPath, ...) not appendOverride(basePath, ...)",
  );
});
