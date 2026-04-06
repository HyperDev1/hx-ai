import test from "node:test";
import assert from "node:assert/strict";

import {
  slugify,
  quickBranchName,
  workflowBranchName,
  QUICK_BRANCH_RE,
  WORKFLOW_BRANCH_RE,
} from "../branch-patterns.js";

// ─── slugify ─────────────────────────────────────────────────────────────────

test("slugify: lowercases input", () => {
  assert.equal(slugify("Hello World"), "hello-world");
});

test("slugify: replaces non-alphanumeric runs with single hyphen", () => {
  assert.equal(slugify("fix login  button!!"), "fix-login-button");
});

test("slugify: strips leading and trailing hyphens", () => {
  assert.equal(slugify("  fix bug  "), "fix-bug");
});

test("slugify: truncates to 40 chars", () => {
  const long = "a".repeat(50);
  assert.equal(slugify(long).length, 40);
});

test("slugify: no trailing hyphen after truncation", () => {
  // Construct a string where truncation would leave a trailing hyphen
  const text = "a".repeat(39) + " trailing";
  const result = slugify(text);
  assert.ok(!result.endsWith("-"), `Expected no trailing hyphen, got: ${result}`);
});

test("slugify: empty string returns empty string", () => {
  assert.equal(slugify(""), "");
});

// ─── quickBranchName ────────────────────────────────────────────────────────

test("quickBranchName: produces expected format", () => {
  assert.equal(quickBranchName(3, "fix-login"), "hx/quick/3-fix-login");
});

test("quickBranchName: matches QUICK_BRANCH_RE", () => {
  const name = quickBranchName(1, "some-task");
  assert.ok(QUICK_BRANCH_RE.test(name), `Expected branch to match QUICK_BRANCH_RE: ${name}`);
});

// ─── workflowBranchName ─────────────────────────────────────────────────────

test("workflowBranchName: produces expected format", () => {
  assert.equal(workflowBranchName("bugfix", "fix-login-bug"), "hx/bugfix/fix-login-bug");
});

test("workflowBranchName: matches WORKFLOW_BRANCH_RE", () => {
  const name = workflowBranchName("spike", "evaluate-auth");
  assert.ok(WORKFLOW_BRANCH_RE.test(name), `Expected branch to match WORKFLOW_BRANCH_RE: ${name}`);
});

test("workflowBranchName: works for all template IDs", () => {
  const templates = ["bugfix", "hotfix", "small-feature", "spike", "refactor", "revise", "dep-upgrade"];
  for (const t of templates) {
    const slug = slugify("some description");
    const name = workflowBranchName(t, slug);
    assert.ok(name.startsWith(`hx/${t}/`), `Expected branch to start with hx/${t}/: ${name}`);
  }
});
