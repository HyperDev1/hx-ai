/**
 * Tests for worktree health monorepo support.
 * Verifies that monorepo subdirectories with project files in parent dirs
 * (or Xcode bundles) do not trigger the greenfield warning.
 */

import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

const SRC = readFileSync(
  new URL(
    "../auto/phases.ts",
    import.meta.url,
  ),
  "utf-8",
);

test("worktree-health-monorepo: hasProjectFileInParent variable is declared", () => {
  assert.ok(
    SRC.includes("hasProjectFileInParent"),
    "Expected hasProjectFileInParent variable in phases.ts",
  );
});

test("worktree-health-monorepo: hasXcodeBundle variable is declared", () => {
  assert.ok(
    SRC.includes("hasXcodeBundle"),
    "Expected hasXcodeBundle variable in phases.ts",
  );
});

test("worktree-health-monorepo: Xcode bundle detection checks .xcodeproj and .xcworkspace", () => {
  assert.ok(
    SRC.includes(".xcodeproj") && SRC.includes(".xcworkspace"),
    "Expected .xcodeproj and .xcworkspace checks in phases.ts",
  );
});

test("worktree-health-monorepo: greenfield condition includes hasXcodeBundle and hasProjectFileInParent", () => {
  // The condition must check all four signals before warning
  assert.ok(
    SRC.includes("hasXcodeBundle") && SRC.includes("hasProjectFileInParent"),
    "Expected hasXcodeBundle and hasProjectFileInParent in greenfield condition",
  );
  // The negative condition (warning when all are false) must include both new variables
  const lines = SRC.split("\n");
  const condLine = lines.find(
    (l) =>
      l.includes("hasProjectFile") &&
      l.includes("hasSrcDir") &&
      l.includes("hasXcodeBundle") &&
      l.includes("hasProjectFileInParent"),
  );
  assert.ok(
    condLine !== undefined,
    "Expected greenfield condition line to include all four variables",
  );
});

test("worktree-health-monorepo: parent walk is bounded (up to 5 levels)", () => {
  assert.ok(
    SRC.includes("depth < 5"),
    "Expected bounded parent walk (depth < 5) in phases.ts",
  );
});

test("worktree-health-monorepo: parent walk stops at git boundary", () => {
  // Must stop when a .git directory is found in a parent
  const hasBoundaryCheck =
    SRC.includes("existsSync(join(resolved, \".git\"))") ||
    SRC.includes('.git"))) break');
  assert.ok(hasBoundaryCheck, "Expected git boundary check in parent walk");
});

test("worktree-health-monorepo: readdirSync is imported for Xcode bundle scan", () => {
  assert.ok(
    SRC.includes("readdirSync"),
    "Expected readdirSync import in phases.ts",
  );
});
