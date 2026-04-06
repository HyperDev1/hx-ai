// Tests for the git-checkpoint safety harness module.
// Verifies createCheckpoint / rollbackToCheckpoint / cleanupCheckpoint
// using a real temporary git repository.

import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  createCheckpoint,
  rollbackToCheckpoint,
  cleanupCheckpoint,
  CHECKPOINT_PREFIX,
} from "../safety/git-checkpoint.js";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function setupGitRepo(): string {
  const dir = mkdtempSync(join(tmpdir(), "hx-checkpoint-test-"));
  execSync("git init", { cwd: dir, stdio: "pipe" });
  execSync("git config user.email test@hx.test", { cwd: dir, stdio: "pipe" });
  execSync("git config user.name TestUser", { cwd: dir, stdio: "pipe" });
  writeFileSync(join(dir, "README.md"), "initial");
  execSync("git add .", { cwd: dir, stdio: "pipe" });
  execSync('git commit -m "initial"', { cwd: dir, stdio: "pipe" });
  return dir;
}

function getCurrentSha(cwd: string): string {
  return execSync("git rev-parse HEAD", { cwd, encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }).trim();
}

function listCheckpointRefs(cwd: string): string[] {
  try {
    const out = execSync(`git for-each-ref --format="%(refname)" ${CHECKPOINT_PREFIX}`, {
      cwd,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return out.trim().split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("git-checkpoint", () => {
  let repoDir: string;

  before(() => {
    repoDir = setupGitRepo();
  });

  after(() => {
    rmSync(repoDir, { recursive: true, force: true });
  });

  it("createCheckpoint creates a ref under refs/hx/checkpoints/", () => {
    const sha = getCurrentSha(repoDir);
    const result = createCheckpoint(repoDir, "M001/S01/T01");

    assert.equal(result.success, true);
    assert.equal(result.sha, sha);
    assert.ok(result.ref?.startsWith("refs/hx/checkpoints/"), `Expected ref to start with refs/hx/checkpoints/, got: ${result.ref}`);

    // Verify the ref actually exists in git
    const refs = listCheckpointRefs(repoDir);
    assert.ok(refs.some(r => r.includes("M001")), `Expected checkpoint ref in: ${JSON.stringify(refs)}`);
  });

  it("cleanupCheckpoint removes the ref", () => {
    // Create a checkpoint first
    const result = createCheckpoint(repoDir, "M001/S01/T02");
    assert.equal(result.success, true);

    const refsBefore = listCheckpointRefs(repoDir);
    assert.ok(refsBefore.some(r => r.includes("T02")));

    // Clean it up
    cleanupCheckpoint(repoDir, "M001/S01/T02");

    const refsAfter = listCheckpointRefs(repoDir);
    assert.ok(!refsAfter.some(r => r.includes("T02")), `Expected T02 ref to be gone, refs: ${JSON.stringify(refsAfter)}`);
  });

  it("rollbackToCheckpoint restores HEAD to the checkpoint sha", () => {
    // Create a checkpoint at initial commit
    const initialSha = getCurrentSha(repoDir);
    const cpResult = createCheckpoint(repoDir, "M001/S01/T03");
    assert.equal(cpResult.success, true);
    assert.equal(cpResult.sha, initialSha);

    // Make a new commit
    writeFileSync(join(repoDir, "change.txt"), "new content");
    execSync("git add .", { cwd: repoDir, stdio: "pipe" });
    execSync('git commit -m "new commit"', { cwd: repoDir, stdio: "pipe" });

    const newSha = getCurrentSha(repoDir);
    assert.notEqual(newSha, initialSha);

    // Roll back to the checkpoint
    const rollback = rollbackToCheckpoint(repoDir, initialSha);
    assert.equal(rollback.success, true, `Rollback failed: ${rollback.error}`);
    assert.equal(rollback.restoredSha, initialSha);

    // HEAD should now be back at initialSha
    const headAfter = getCurrentSha(repoDir);
    assert.equal(headAfter, initialSha);
  });

  it("createCheckpoint in a non-git directory returns success=false", () => {
    const nonGitDir = mkdtempSync(join(tmpdir(), "hx-non-git-"));
    try {
      const result = createCheckpoint(nonGitDir, "M001/S01/T01");
      assert.equal(result.success, false);
      assert.ok(result.error, "Expected an error message");
    } finally {
      rmSync(nonGitDir, { recursive: true, force: true });
    }
  });
});
