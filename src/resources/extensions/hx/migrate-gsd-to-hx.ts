/**
 * GSD → HX Migration
 *
 * Renames `.gsd/` directories to `.hx/` when upgrading from the GSD binary
 * to the HX binary. Handles both real directories and symlinks.
 *
 * Called automatically on startup when `.gsd/` exists but `.hx/` does not.
 */

import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, renameSync, symlinkSync, readlinkSync, writeFileSync, copyFileSync, unlinkSync } from "node:fs";
import { join, dirname } from "node:path";
import { homedir } from "node:os";
import { getErrorMessage } from "./error-utils.js";

export interface GsdToHxMigrationResult {
  migrated: boolean;
  error?: string;
}

/**
 * Migrate a project's `.gsd/` directory to `.hx/`.
 *
 * - If `.hx/` already exists → no-op
 * - If `.gsd/` is a real directory → rename to `.hx/`
 * - If `.gsd/` is a symlink → create `.hx/` symlink to same target, remove `.gsd/`
 * - Updates `.gitignore` entries from `.gsd` to `.hx`
 */
export function migrateProjectGsdToHx(basePath: string): GsdToHxMigrationResult {
  const gsdPath = join(basePath, ".gsd");
  const hxPath = join(basePath, ".hx");

  // Already migrated or no .gsd/ to migrate
  if (existsSync(hxPath)) return { migrated: false };
  if (!existsSync(gsdPath)) return { migrated: false };

  try {
    const stat = lstatSync(gsdPath);

    if (stat.isSymbolicLink()) {
      // .gsd/ is a symlink — create .hx/ pointing to the same target
      const target = readlinkSync(gsdPath);
      symlinkSync(target, hxPath);
      // Remove old symlink via rename to a temp name then unlink
      const tempPath = gsdPath + ".migrated";
      renameSync(gsdPath, tempPath);
      try {
        unlinkSync(tempPath);
      } catch {
        // Best-effort cleanup — the .gsd.migrated symlink is harmless
      }
    } else if (stat.isDirectory()) {
      // Simple atomic rename on same filesystem
      renameSync(gsdPath, hxPath);
    } else {
      return { migrated: false, error: ".gsd is not a directory or symlink" };
    }

    // Update .gitignore
    updateGitignoreGsdToHx(basePath);

    return { migrated: true };
  } catch (err) {
    return { migrated: false, error: getErrorMessage(err) };
  }
}

/**
 * Update `.gitignore` entries from `.gsd` to `.hx`.
 */
function updateGitignoreGsdToHx(basePath: string): void {
  const gitignorePath = join(basePath, ".gitignore");
  if (!existsSync(gitignorePath)) return;

  try {
    const content = readFileSync(gitignorePath, "utf-8");
    // Replace .gsd entries with .hx (whole-line patterns)
    const updated = content.replace(/^\.gsd\b/gm, ".hx");
    if (updated !== content) {
      writeFileSync(gitignorePath, updated);
    }
  } catch {
    // Best-effort — .gitignore update is non-critical
  }
}

/**
 * Sync global GSD state to HX directories.
 *
 * Copies auth.json, settings.json, and PREFERENCES.md from `~/.gsd/agent/`
 * to `~/.hx/agent/` if they don't already exist in the target.
 * Never overwrites existing HX files (they may be fresher).
 */
export function migrateGlobalGsdToHx(): GsdToHxMigrationResult {
  const gsdHome = process.env.GSD_HOME || join(homedir(), ".gsd");
  const hxHome = process.env.HX_HOME || join(homedir(), ".hx");

  const gsdAgent = join(gsdHome, "agent");
  const hxAgent = join(hxHome, "agent");

  if (!existsSync(gsdAgent)) return { migrated: false };

  try {
    // Ensure ~/.hx/agent/ exists
    if (!existsSync(hxAgent)) {
      mkdirSync(hxAgent, { recursive: true });
    }

    const filesToSync = ["auth.json", "settings.json"];
    let anyMigrated = false;

    for (const file of filesToSync) {
      const src = join(gsdAgent, file);
      const dst = join(hxAgent, file);
      if (existsSync(src) && !existsSync(dst)) {
        copyFileSync(src, dst);
        anyMigrated = true;
      }
    }

    // Also sync PREFERENCES.md from ~/.gsd/ root to ~/.hx/ root
    const gsdPrefs = join(gsdHome, "PREFERENCES.md");
    const hxPrefs = join(hxHome, "PREFERENCES.md");
    if (existsSync(gsdPrefs) && !existsSync(hxPrefs)) {
      // Ensure ~/.hx/ exists
      if (!existsSync(hxHome)) {
        mkdirSync(hxHome, { recursive: true });
      }
      copyFileSync(gsdPrefs, hxPrefs);
      anyMigrated = true;
    }

    return { migrated: anyMigrated };
  } catch (err) {
    return { migrated: false, error: getErrorMessage(err) };
  }
}
