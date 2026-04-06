// HX Extension — Git Checkpoint
// Creates lightweight git refs as safety checkpoints before risky operations.
// Allows the safety harness to roll back if post-unit validation fails.
//
// Adversarial fix (4e2ab76fc): rollback uses `git reset --hard <sha>`
// instead of the original double-reset + `git branch -f` pattern, which
// was susceptible to a TOCTOU race where an intermediate branch update
// could cause the branch pointer to drift.

import { spawnSync } from "node:child_process";
import { logWarning, logError } from "../workflow-logger.js";

// ─── Constants ───────────────────────────────────────────────────────────────

export const CHECKPOINT_PREFIX = "refs/hx/checkpoints/";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CheckpointResult {
  success: boolean;
  sha: string | null;
  ref: string | null;
  error?: string;
}

export interface RollbackResult {
  success: boolean;
  restoredSha: string | null;
  error?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function runGit(args: string[], cwd: string): { stdout: string; ok: boolean; error?: string } {
  const result = spawnSync("git", args, {
    cwd,
    encoding: "utf-8",
    stdio: ["pipe", "pipe", "pipe"],
  });
  if (result.error) {
    return { stdout: "", ok: false, error: result.error.message };
  }
  if (result.status !== 0) {
    return { stdout: "", ok: false, error: (result.stderr ?? "").trim() };
  }
  return { stdout: (result.stdout ?? "").trim(), ok: true };
}

function currentSha(cwd: string): { sha: string; ok: boolean; error?: string } {
  const r = runGit(["rev-parse", "HEAD"], cwd);
  return { sha: r.stdout, ok: r.ok, error: r.error };
}

function checkpointRef(unitId: string): string {
  // Sanitize unitId so it's valid as a git ref component
  const safe = unitId.replace(/[^a-zA-Z0-9/_-]/g, "-");
  return `${CHECKPOINT_PREFIX}${safe}`;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Create a lightweight git checkpoint ref before executing a unit.
 * The ref points to the current HEAD sha and can be used to roll back.
 *
 * @param cwd - Project root (working directory)
 * @param unitId - Unit identifier (e.g. "M001/S01/T01") used as ref suffix
 */
export function createCheckpoint(cwd: string, unitId: string): CheckpointResult {
  const { sha, ok: shaOk, error: shaErr } = currentSha(cwd);
  if (!shaOk) {
    const msg = `Failed to get HEAD sha for checkpoint ${unitId}: ${shaErr}`;
    logError("safety", msg, { unitId });
    return { success: false, sha: null, ref: null, error: msg };
  }

  const ref = checkpointRef(unitId);
  const { ok, error } = runGit(["update-ref", ref, sha], cwd);
  if (!ok) {
    const msg = `Failed to create git checkpoint for ${unitId}: ${error}`;
    logError("safety", msg, { unitId });
    return { success: false, sha: null, ref: null, error: msg };
  }

  return { success: true, sha, ref };
}

/**
 * Roll back to a previously created checkpoint.
 * Uses `git reset --hard <sha>` to atomically restore HEAD.
 * (Adversarial fix: avoids the original double-reset + branch-f pattern.)
 *
 * @param cwd - Project root
 * @param sha - The checkpoint sha to restore to
 */
export function rollbackToCheckpoint(cwd: string, sha: string): RollbackResult {
  // Verify the sha is reachable before resetting
  const verify = runGit(["cat-file", "-e", sha], cwd);
  if (!verify.ok) {
    const msg = `Checkpoint sha not reachable: ${sha} — ${verify.error}`;
    logError("safety", msg, { sha });
    return { success: false, restoredSha: null, error: msg };
  }

  // Atomic hard reset to the checkpoint sha
  const reset = runGit(["reset", "--hard", sha], cwd);
  if (!reset.ok) {
    const msg = `Failed to roll back to checkpoint ${sha}: ${reset.error}`;
    logError("safety", msg, { sha });
    return { success: false, restoredSha: null, error: msg };
  }

  const { sha: restoredSha, ok: headOk } = currentSha(cwd);
  if (!headOk || restoredSha !== sha) {
    const msg = `Rollback verification failed: expected ${sha}, got ${restoredSha ?? "unknown"}`;
    logError("safety", msg, { expected: sha, actual: restoredSha ?? "unknown" });
    return { success: false, restoredSha: restoredSha || null, error: msg };
  }

  return { success: true, restoredSha };
}

/**
 * Clean up (delete) a checkpoint ref after a successful unit.
 * Silently succeeds if the ref doesn't exist.
 *
 * @param cwd - Project root
 * @param unitId - Unit identifier used when creating the checkpoint
 */
export function cleanupCheckpoint(cwd: string, unitId: string): void {
  const ref = checkpointRef(unitId);
  const { ok, error } = runGit(["update-ref", "-d", ref], cwd);
  if (!ok) {
    // Best-effort — a stale checkpoint ref is harmless
    logWarning("safety", `Could not clean up checkpoint ref for ${unitId}: ${error ?? "unknown error"}`, {
      unitId,
    });
  }
}
