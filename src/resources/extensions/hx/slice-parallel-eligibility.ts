/**
 * HX Slice Parallel Eligibility — Slice-level parallelism analysis.
 *
 * Analyzes which slices within a milestone can safely run in parallel by
 * checking dependency satisfaction and file overlap across task plans.
 */

import { isDbAvailable, getMilestoneSlices, getSliceTasks } from "./hx-db.js";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SliceEligibilityResult {
  sliceId: string;
  title: string;
  eligible: boolean;
  reason: string;
}

export interface SliceParallelCandidates {
  eligible: SliceEligibilityResult[];
  ineligible: SliceEligibilityResult[];
  fileOverlaps: Array<{ sid1: string; sid2: string; files: string[] }>;
}

// ─── File Collection ─────────────────────────────────────────────────────────

/**
 * Collect all `filesLikelyTouched` across every task plan in a slice.
 * Returns a deduplicated list of file paths.
 */
function collectSliceTouchedFiles(
  milestoneId: string,
  sliceId: string,
): string[] {
  const files = new Set<string>();

  if (isDbAvailable()) {
    const tasks = getSliceTasks(milestoneId, sliceId);
    for (const task of tasks) {
      if (Array.isArray(task.files)) {
        for (const f of task.files) {
          files.add(f);
        }
      }
    }
  }
  // When DB unavailable, return empty file set — parallel eligibility cannot be determined

  return [...files];
}

// ─── Overlap Detection ──────────────────────────────────────────────────────

/**
 * Compare file sets across slices and return pairs with overlapping files.
 */
function detectSliceFileOverlaps(
  fileSets: Map<string, string[]>,
): Array<{ sid1: string; sid2: string; files: string[] }> {
  const overlaps: Array<{ sid1: string; sid2: string; files: string[] }> = [];
  const ids = [...fileSets.keys()];

  for (let i = 0; i < ids.length; i++) {
    const files1 = new Set(fileSets.get(ids[i])!);
    for (let j = i + 1; j < ids.length; j++) {
      const files2 = fileSets.get(ids[j])!;
      const shared = files2.filter(f => files1.has(f));
      if (shared.length > 0) {
        overlaps.push({ sid1: ids[i], sid2: ids[j], files: shared.sort() });
      }
    }
  }

  return overlaps;
}

// ─── Analysis ────────────────────────────────────────────────────────────────

/**
 * Analyze slices within a milestone for parallel execution eligibility.
 *
 * A slice is eligible if:
 * 1. It is not complete or parked
 * 2. Its dependencies (`depends`) are all complete
 * 3. It does not have file overlap with other eligible slices
 *    (overlaps are flagged as warnings but do not disqualify)
 */
export function analyzeSliceParallelEligibility(
  _basePath: string,
  milestoneId: string,
): SliceParallelCandidates {
  if (!isDbAvailable()) {
    return { eligible: [], ineligible: [], fileOverlaps: [] };
  }

  const slices = getMilestoneSlices(milestoneId);

  // Build a lookup for quick status checks
  const sliceMap = new Map<string, { title: string; status: string; depends: string[] }>();
  for (const s of slices) {
    sliceMap.set(s.id, { title: s.title, status: s.status, depends: s.depends });
  }

  const eligible: SliceEligibilityResult[] = [];
  const ineligible: SliceEligibilityResult[] = [];

  for (const s of slices) {
    const title = s.title || s.id;
    const status = s.status;

    // Rule 1: skip complete and parked slices
    if (status === "complete" || status === "parked") {
      ineligible.push({
        sliceId: s.id,
        title,
        eligible: false,
        reason: status === "parked" ? "Slice is parked." : "Already complete.",
      });
      continue;
    }

    // Rule 2: check dependency satisfaction
    const unsatisfied = s.depends.filter(dep => {
      const depEntry = sliceMap.get(dep);
      return !depEntry || depEntry.status !== "complete";
    });

    if (unsatisfied.length > 0) {
      ineligible.push({
        sliceId: s.id,
        title,
        eligible: false,
        reason: `Blocked by incomplete dependencies: ${unsatisfied.join(", ")}.`,
      });
      continue;
    }

    eligible.push({
      sliceId: s.id,
      title,
      eligible: true,
      reason: "All dependencies satisfied.",
    });
  }

  // Rule 3: check file overlap among eligible slices
  const fileSets = new Map<string, string[]>();
  for (const result of eligible) {
    const files = collectSliceTouchedFiles(milestoneId, result.sliceId);
    fileSets.set(result.sliceId, files);
  }

  const fileOverlaps = detectSliceFileOverlaps(fileSets);

  // Annotate eligible slices that have file overlaps
  const overlappingIds = new Set<string>();
  for (const overlap of fileOverlaps) {
    overlappingIds.add(overlap.sid1);
    overlappingIds.add(overlap.sid2);
  }

  for (const result of eligible) {
    if (overlappingIds.has(result.sliceId)) {
      result.reason = "All dependencies satisfied. WARNING: has file overlap with another eligible slice.";
    }
  }

  return { eligible, ineligible, fileOverlaps };
}

// ─── Formatting ──────────────────────────────────────────────────────────────

/**
 * Produce a human-readable report of slice parallel eligibility analysis.
 */
export function formatSliceEligibilityReport(candidates: SliceParallelCandidates): string {
  const lines: string[] = [];

  lines.push("# Slice Parallel Eligibility Report");
  lines.push("");

  // Eligible slices
  lines.push(`## Eligible for Parallel Execution (${candidates.eligible.length})`);
  lines.push("");
  if (candidates.eligible.length === 0) {
    lines.push("No slices are currently eligible for parallel execution.");
  } else {
    for (const e of candidates.eligible) {
      lines.push(`- **${e.sliceId}** — ${e.title}`);
      lines.push(`  ${e.reason}`);
    }
  }
  lines.push("");

  // Ineligible slices
  lines.push(`## Ineligible (${candidates.ineligible.length})`);
  lines.push("");
  if (candidates.ineligible.length === 0) {
    lines.push("All slices are eligible.");
  } else {
    for (const e of candidates.ineligible) {
      lines.push(`- **${e.sliceId}** — ${e.title}`);
      lines.push(`  ${e.reason}`);
    }
  }
  lines.push("");

  // File overlap warnings
  if (candidates.fileOverlaps.length > 0) {
    lines.push(`## File Overlap Warnings (${candidates.fileOverlaps.length})`);
    lines.push("");
    for (const overlap of candidates.fileOverlaps) {
      lines.push(`- **${overlap.sid1}** <-> **${overlap.sid2}** — ${overlap.files.length} shared file(s):`);
      for (const f of overlap.files) {
        lines.push(`  - \`${f}\``);
      }
    }
    lines.push("");
  }

  return lines.join("\n");
}
