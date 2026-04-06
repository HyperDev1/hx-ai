/**
 * HX MCP Server — filesystem path helpers.
 *
 * Resolves .hx/ directory layout: milestones, slices, tasks.
 */

import { existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

// ---------------------------------------------------------------------------
// Root resolution
// ---------------------------------------------------------------------------

/**
 * Resolve the .hx/ root directory for a given project directory.
 * Throws if .hx/ does not exist.
 */
export function resolveHxRoot(projectDir: string): string {
  const root = join(resolve(projectDir), '.hx');
  if (!existsSync(root)) {
    throw new Error(`.hx/ directory not found in ${resolve(projectDir)}`);
  }
  return root;
}

/**
 * Resolve an arbitrary file inside the .hx/ root.
 */
export function resolveRootFile(projectDir: string, ...segments: string[]): string {
  return join(resolveHxRoot(projectDir), ...segments);
}

// ---------------------------------------------------------------------------
// Milestones
// ---------------------------------------------------------------------------

/**
 * Absolute path to .hx/milestones/
 */
export function milestonesDir(projectDir: string): string {
  return resolveRootFile(projectDir, 'milestones');
}

/**
 * Return milestone IDs (directory names under .hx/milestones/).
 * Returns [] when the directory is absent or empty.
 */
export function findMilestoneIds(projectDir: string): string[] {
  const dir = milestonesDir(projectDir);
  if (!existsSync(dir)) return [];
  try {
    return readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort();
  } catch {
    return [];
  }
}

/**
 * Absolute path to .hx/milestones/<milestoneId>/
 */
export function resolveMilestoneDir(projectDir: string, milestoneId: string): string {
  return join(milestonesDir(projectDir), milestoneId);
}

/**
 * Absolute path to .hx/milestones/<milestoneId>/<milestoneId>-<suffix>
 * e.g. resolveMilestoneFile(dir, 'M001', 'ROADMAP.md')
 *   → .hx/milestones/M001/M001-ROADMAP.md
 */
export function resolveMilestoneFile(projectDir: string, milestoneId: string, suffix: string): string {
  return join(resolveMilestoneDir(projectDir, milestoneId), `${milestoneId}-${suffix}`);
}

// ---------------------------------------------------------------------------
// Slices
// ---------------------------------------------------------------------------

/**
 * Return slice IDs (directory names under .hx/milestones/<milestoneId>/slices/).
 */
export function findSliceIds(projectDir: string, milestoneId: string): string[] {
  const dir = join(resolveMilestoneDir(projectDir, milestoneId), 'slices');
  if (!existsSync(dir)) return [];
  try {
    return readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort();
  } catch {
    return [];
  }
}

/**
 * Absolute path to .hx/milestones/<milestoneId>/slices/<sliceId>/
 */
export function resolveSliceDir(projectDir: string, milestoneId: string, sliceId: string): string {
  return join(resolveMilestoneDir(projectDir, milestoneId), 'slices', sliceId);
}

/**
 * Absolute path to a file inside a slice directory.
 * e.g. resolveSliceFile(dir, 'M001', 'S01', 'PLAN.md')
 *   → .hx/milestones/M001/slices/S01/S01-PLAN.md
 */
export function resolveSliceFile(
  projectDir: string,
  milestoneId: string,
  sliceId: string,
  suffix: string,
): string {
  return join(resolveSliceDir(projectDir, milestoneId, sliceId), `${sliceId}-${suffix}`);
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

/**
 * Return absolute paths to all T##-PLAN.md files under a slice's tasks/ directory.
 */
export function findTaskFiles(projectDir: string, milestoneId: string, sliceId: string): string[] {
  const dir = join(resolveSliceDir(projectDir, milestoneId, sliceId), 'tasks');
  if (!existsSync(dir)) return [];
  try {
    return readdirSync(dir)
      .filter((name) => /^T\d+-PLAN\.md$/.test(name))
      .sort()
      .map((name) => join(dir, name));
  } catch {
    return [];
  }
}
