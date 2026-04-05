/**
 * HX Slice Parallel Conflict — File overlap conflict detection for parallel slices.
 *
 * Detects file-level conflicts between slices that are candidates for parallel
 * execution within a milestone. Uses task plan file lists from the DB to build
 * per-slice file sets, then performs pairwise set intersection.
 */

import { isDbAvailable, getSliceTasks } from "./hx-db.js";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SliceFilePair {
  sid1: string;
  sid2: string;
  files: string[];
}

export interface SliceConflictResult {
  /** Pairs of slices with overlapping files. Empty when no conflicts found. */
  conflicts: SliceFilePair[];
  /** All slices that are involved in at least one conflict. */
  conflictingSlices: string[];
  /** All slices that have no file conflicts. */
  cleanSlices: string[];
}

// ─── File Set Construction ────────────────────────────────────────────────────

/**
 * Build a per-slice map of files likely touched, drawn from task plan data in
 * the DB. Files are deduplicated within each slice.
 *
 * Returns an empty array for any slice whose tasks list no files (or when the
 * DB is unavailable).
 */
export function buildSliceFileSets(
  milestoneId: string,
  sliceIds: string[],
): Map<string, string[]> {
  const result = new Map<string, string[]>();

  if (!isDbAvailable()) {
    for (const sid of sliceIds) {
      result.set(sid, []);
    }
    return result;
  }

  for (const sid of sliceIds) {
    const seen = new Set<string>();
    const tasks = getSliceTasks(milestoneId, sid);
    for (const task of tasks) {
      if (Array.isArray(task.files)) {
        for (const f of task.files) {
          seen.add(f);
        }
      }
    }
    result.set(sid, [...seen].sort());
  }

  return result;
}

// ─── Overlap Detection ────────────────────────────────────────────────────────

/**
 * Compute pairwise file set intersection for all slices in the provided map.
 * Returns only pairs that share at least one file.
 */
function computeFilePairOverlaps(fileSets: Map<string, string[]>): SliceFilePair[] {
  const overlaps: SliceFilePair[] = [];
  const ids = [...fileSets.keys()];

  for (let i = 0; i < ids.length; i++) {
    const files1 = new Set(fileSets.get(ids[i])!);
    for (let j = i + 1; j < ids.length; j++) {
      const files2 = fileSets.get(ids[j])!;
      const shared = files2.filter(f => files1.has(f));
      if (shared.length > 0) {
        overlaps.push({ sid1: ids[i]!, sid2: ids[j]!, files: shared.sort() });
      }
    }
  }

  return overlaps;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Detect file-level conflicts between a set of slices within a milestone.
 *
 * For each pair of slices in `sliceIds`, computes the intersection of their
 * task file lists. Reports which pairs conflict and which slices are clean.
 *
 * @param _basePath - Project base path (retained for API symmetry; DB path is used)
 * @param milestoneId - Parent milestone ID
 * @param sliceIds - Slice IDs to compare (typically the eligible parallel candidates)
 * @returns SliceConflictResult with conflict pairs, conflicting slice IDs, and clean slice IDs
 */
export async function detectSliceConflicts(
  _basePath: string,
  milestoneId: string,
  sliceIds: string[],
): Promise<SliceConflictResult> {
  if (sliceIds.length < 2) {
    return {
      conflicts: [],
      conflictingSlices: [],
      cleanSlices: [...sliceIds],
    };
  }

  const fileSets = buildSliceFileSets(milestoneId, sliceIds);
  const conflicts = computeFilePairOverlaps(fileSets);

  const conflictingSet = new Set<string>();
  for (const pair of conflicts) {
    conflictingSet.add(pair.sid1);
    conflictingSet.add(pair.sid2);
  }

  const conflictingSlices = [...conflictingSet].sort();
  const cleanSlices = sliceIds.filter(sid => !conflictingSet.has(sid)).sort();

  return { conflicts, conflictingSlices, cleanSlices };
}
