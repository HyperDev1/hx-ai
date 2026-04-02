/**
 * GSD External State Migration
 *
 * Migrates legacy in-project `.hx/` directories to the external
 * `~/.gsd/projects/<hash>/` state directory. After migration, a
 * symlink replaces the original directory so all paths remain valid.
 */

import { execFileSync } from "node:child_process";
import { existsSync, lstatSync, mkdirSync, readdirSync, realpathSync, renameSync, cpSync, rmSync, symlinkSync } from "node:fs";
import { join } from "node:path";
import { externalHxRoot } from "./repo-identity.js";
import { getErrorMessage } from "./error-utils.js";
import { hasGitTrackedGsdFiles } from "./gitignore.js";
import { GIT_NO_PROMPT_ENV } from "./git-constants.js";

export interface MigrationResult {
  migrated: boolean;
  error?: string;
}

/**
 * Migrate a legacy in-project `.hx/` directory to external storage.
 *
 * Algorithm:
 * 1. If `<project>/.hx` is a symlink or doesn't exist -> skip
 * 2. If `<project>/.hx` is a real directory:
 *    a. Compute external path from repoIdentity
 *    b. mkdir -p external dir
 *    c. Rename `.gsd` -> `.hx.migrating` (atomic on same FS, acts as lock)
 *    d. Copy contents to external dir (skip `worktrees/` subdirectory)
 *    e. Create symlink `.hx -> external path`
 *    f. Remove `.hx.migrating`
 * 3. On failure: rename `.hx.migrating` back to `.gsd` (rollback)
 */
export function migrateToExternalState(basePath: string): MigrationResult {
  const localGsd = join(basePath, ".hx");

  // Skip if doesn't exist
  if (!existsSync(localGsd)) {
    return { migrated: false };
  }

  // Skip if already a symlink
  try {
    const stat = lstatSync(localGsd);
    if (stat.isSymbolicLink()) {
      return { migrated: false };
    }
    if (!stat.isDirectory()) {
      return { migrated: false, error: ".hx exists but is not a directory or symlink" };
    }
  } catch (err) {
    return { migrated: false, error: `Cannot stat .hx: ${getErrorMessage(err)}` };
  }

  // Skip if .hx/ contains git-tracked files — the project intentionally
  // keeps .hx/ in version control and migration would destroy that.
  if (hasGitTrackedGsdFiles(basePath)) {
    return { migrated: false };
  }

  // Skip if .hx/worktrees/ has active worktree directories (#1337).
  // On Windows, active git worktrees hold OS-level directory handles that
  // prevent rename/delete. Attempting migration causes EBUSY and data loss.
  const worktreesDir = join(localGsd, "worktrees");
  if (existsSync(worktreesDir)) {
    try {
      const entries = readdirSync(worktreesDir, { withFileTypes: true });
      if (entries.some(e => e.isDirectory())) {
        return { migrated: false };
      }
    } catch {
      // Can't read worktrees dir — skip migration to be safe
      return { migrated: false };
    }
  }

  const externalPath = externalHxRoot(basePath);
  const migratingPath = join(basePath, ".hx.migrating");

  try {
    // mkdir -p the external dir
    mkdirSync(externalPath, { recursive: true });

    // Rename .gsd -> .hx.migrating (atomic lock).
    // On Windows, NTFS may reject rename with EPERM if file descriptors are
    // open (VS Code watchers, antivirus on-access scan). Fall back to
    // copy+delete (#1292).
    try {
      renameSync(localGsd, migratingPath);
    } catch (renameErr: any) {
      if (renameErr?.code === "EPERM" || renameErr?.code === "EBUSY") {
        try {
          cpSync(localGsd, migratingPath, { recursive: true, force: true });
          rmSync(localGsd, { recursive: true, force: true });
        } catch (copyErr) {
          return { migrated: false, error: `Migration rename/copy failed: ${copyErr instanceof Error ? copyErr.message : String(copyErr)}` };
        }
      } else {
        throw renameErr;
      }
    }

    // Copy contents to external dir, skipping worktrees/
    const entries = readdirSync(migratingPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === "worktrees") continue; // worktrees stay local

      const src = join(migratingPath, entry.name);
      const dst = join(externalPath, entry.name);

      try {
        if (entry.isDirectory()) {
          cpSync(src, dst, { recursive: true, force: true });
        } else {
          cpSync(src, dst, { force: true });
        }
      } catch {
        // Non-fatal: continue with other files
      }
    }

    // Create symlink .hx -> external path
    symlinkSync(externalPath, localGsd, "junction");

    // Verify the symlink resolves correctly before removing the backup (#1377).
    // On Windows, junction creation can silently succeed but resolve to the wrong
    // target, or the external dir may not be accessible. If verification fails,
    // restore from the backup.
    try {
      const resolved = realpathSync(localGsd);
      const resolvedExternal = realpathSync(externalPath);
      if (resolved !== resolvedExternal) {
        // Symlink points to wrong target — restore backup
        try { rmSync(localGsd, { force: true }); } catch { /* may not exist */ }
        renameSync(migratingPath, localGsd);
        return { migrated: false, error: `Migration verification failed: symlink resolves to ${resolved}, expected ${resolvedExternal}` };
      }
      // Verify we can read through the symlink
      readdirSync(localGsd);
    } catch (verifyErr) {
      // Symlink broken or unreadable — restore backup
      try { rmSync(localGsd, { force: true }); } catch { /* may not exist */ }
      try { renameSync(migratingPath, localGsd); } catch { /* best-effort restore */ }
      return { migrated: false, error: `Migration verification failed: ${getErrorMessage(verifyErr)}` };
    }

    // Clean the git index — any .gsd/* files tracked before migration now
    // sit behind the symlink and git can't follow it, causing them to show
    // as deleted. Remove them from the index so the working tree stays clean.
    // --ignore-unmatch makes this a no-op on fresh projects with no tracked .hx/.
    try {
      execFileSync("git", ["rm", "-r", "--cached", "--ignore-unmatch", ".hx"], {
        cwd: basePath,
        stdio: ["ignore", "pipe", "ignore"],
        env: GIT_NO_PROMPT_ENV,
        timeout: 10_000,
      });
    } catch {
      // Non-fatal — git may be unavailable or nothing was tracked
    }

    // Remove .hx.migrating only after symlink is verified and index is clean
    rmSync(migratingPath, { recursive: true, force: true });

    return { migrated: true };
  } catch (err) {
    // Rollback: rename .hx.migrating back to .gsd
    try {
      if (existsSync(migratingPath) && !existsSync(localGsd)) {
        renameSync(migratingPath, localGsd);
      }
    } catch {
      // Rollback failed -- leave .hx.migrating for doctor to detect
    }

    return {
      migrated: false,
      error: `Migration failed: ${getErrorMessage(err)}`,
    };
  }
}

/**
 * Recover from a failed migration (`.hx.migrating` exists).
 * Moves `.hx.migrating` back to `.gsd` if `.gsd` doesn't exist.
 */
export function recoverFailedMigration(basePath: string): boolean {
  const localGsd = join(basePath, ".hx");
  const migratingPath = join(basePath, ".hx.migrating");

  if (!existsSync(migratingPath)) return false;
  if (existsSync(localGsd)) return false; // both exist -- ambiguous, don't touch

  try {
    renameSync(migratingPath, localGsd);
    return true;
  } catch {
    return false;
  }
}
