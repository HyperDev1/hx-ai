// HX Extension — File Change Validator
// Validates file changes made during a unit by comparing the git diff.
// Filters out .hx/ internal paths and flags unexpected or suspicious changes.

import { execSync } from "node:child_process";
import { logWarning, logError } from "../workflow-logger.js";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface FileChangeValidationResult {
  valid: boolean;
  changedFiles: string[];
  suspiciousFiles: string[];
  errors: string[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Returns true for paths that should be excluded from validation
 * (internal HX bookkeeping paths).
 */
function isInternalPath(f: string): boolean {
  return (
    f.startsWith(".hx/") ||
    f.startsWith(".hx\\") ||
    f === ".hx"
  );
}

/**
 * Returns true for files that are suspicious — i.e., files outside the
 * project source that an auto-mode agent shouldn't be modifying.
 */
function isSuspiciousPath(f: string): boolean {
  // Lock files modified without package.json changing alongside them
  if (f === "package-lock.json" || f === "yarn.lock" || f === "pnpm-lock.yaml") {
    return true;
  }
  // Hidden directories other than .hx itself
  if (/^\.[a-zA-Z]/.test(f) && !f.startsWith(".hx")) {
    return true;
  }
  return false;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Validate file changes made during the current unit.
 * Uses `git diff HEAD~1 HEAD` to enumerate files changed in the last commit,
 * or `git diff HEAD` for uncommitted changes.
 *
 * @param cwd - Working directory (project root)
 * @param expectedFiles - Files the agent declared it would modify (from task plan)
 */
export function validateFileChanges(
  cwd: string,
  expectedFiles?: string[],
): FileChangeValidationResult {
  const errors: string[] = [];
  let changedFiles: string[] = [];

  try {
    // Try to get committed changes first; fall back to staged/unstaged
    let diffOutput: string;
    try {
      diffOutput = execSync("git diff --name-only HEAD~1 HEAD", {
        cwd,
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      });
    } catch {
      // No prior commit — fall back to staged+unstaged
      diffOutput = execSync("git diff --name-only HEAD", {
        cwd,
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      });
    }

    changedFiles = diffOutput
      .split("\n")
      .map((f) => f.trim())
      .filter((f) => f.length > 0 && !isInternalPath(f));
  } catch (err) {
    const msg = `Failed to read git diff: ${(err as Error).message}`;
    errors.push(msg);
    logError("safety", msg);
    return { valid: false, changedFiles: [], suspiciousFiles: [], errors };
  }

  // Flag suspicious files
  const suspiciousFiles = changedFiles.filter(isSuspiciousPath);

  if (suspiciousFiles.length > 0) {
    for (const f of suspiciousFiles) {
      logWarning("safety", `Suspicious file change detected: ${f}`, { file: f });
    }
  }

  // If expected files were provided, warn about significant deviations
  if (expectedFiles && expectedFiles.length > 0) {
    const expectedSet = new Set(expectedFiles);
    const unexpected = changedFiles.filter(
      (f) => !expectedSet.has(f) && !isSuspiciousPath(f),
    );
    if (unexpected.length > 3) {
      logWarning("safety", `Unit modified ${unexpected.length} unexpected files`, {
        sample: unexpected.slice(0, 5).join(", "),
      });
    }
  }

  const valid = errors.length === 0 && suspiciousFiles.length === 0;
  return { valid, changedFiles, suspiciousFiles, errors };
}
