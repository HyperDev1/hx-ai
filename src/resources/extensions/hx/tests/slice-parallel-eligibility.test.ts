/**
 * Tests for slice-parallel-eligibility.ts
 *
 * Covers:
 * 1. Single eligible slice (no deps, active)
 * 2. Two independent slices both eligible
 * 3. Dependent slices — only the slice whose deps are complete is eligible
 * 4. File overlap detection between two eligible slices
 */

import { describe, test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  openDatabase,
  closeDatabase,
  insertMilestone,
  insertSlice,
  insertTask,
} from "../hx-db.ts";

import {
  analyzeSliceParallelEligibility,
  formatSliceEligibilityReport,
  type SliceParallelCandidates,
} from "../slice-parallel-eligibility.ts";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeTmpBase(): string {
  const base = mkdtempSync(join(tmpdir(), "hx-slice-eligib-test-"));
  mkdirSync(join(base, ".hx"), { recursive: true });
  return base;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("slice-parallel-eligibility: analyzeSliceParallelEligibility", () => {
  let base: string;

  beforeEach(() => {
    base = makeTmpBase();
    openDatabase(":memory:");
    insertMilestone({ id: "M001", title: "Test Milestone", status: "active" });
  });

  afterEach(() => {
    closeDatabase();
    rmSync(base, { recursive: true, force: true });
  });

  test("single eligible slice — no deps, active status", () => {
    insertSlice({
      id: "S01",
      milestoneId: "M001",
      title: "Only Slice",
      status: "active",
      risk: "low",
      depends: [],
    });

    const result = analyzeSliceParallelEligibility(base, "M001");

    assert.equal(result.eligible.length, 1, "exactly one eligible slice");
    assert.equal(result.ineligible.length, 0, "no ineligible slices");
    assert.equal(result.fileOverlaps.length, 0, "no file overlaps");
    assert.equal(result.eligible[0]!.sliceId, "S01");
    assert.equal(result.eligible[0]!.eligible, true);
    assert.match(result.eligible[0]!.reason, /All dependencies satisfied/);
  });

  test("two independent slices — both eligible", () => {
    insertSlice({
      id: "S01",
      milestoneId: "M001",
      title: "First Slice",
      status: "active",
      risk: "low",
      depends: [],
    });
    insertSlice({
      id: "S02",
      milestoneId: "M001",
      title: "Second Slice",
      status: "pending",
      risk: "low",
      depends: [],
    });

    const result = analyzeSliceParallelEligibility(base, "M001");

    assert.equal(result.eligible.length, 2, "both slices eligible");
    assert.equal(result.ineligible.length, 0, "no ineligible slices");
    assert.equal(result.fileOverlaps.length, 0, "no file overlaps");
    const ids = result.eligible.map(e => e.sliceId).sort();
    assert.deepEqual(ids, ["S01", "S02"]);
  });

  test("dependent slices — only slice with satisfied deps is eligible", () => {
    // S01 is complete, S02 depends on S01 (satisfied), S03 depends on S02 (not complete yet)
    insertSlice({
      id: "S01",
      milestoneId: "M001",
      title: "Done Slice",
      status: "complete",
      risk: "low",
      depends: [],
    });
    insertSlice({
      id: "S02",
      milestoneId: "M001",
      title: "Ready Slice",
      status: "active",
      risk: "low",
      depends: ["S01"],
    });
    insertSlice({
      id: "S03",
      milestoneId: "M001",
      title: "Blocked Slice",
      status: "pending",
      risk: "low",
      depends: ["S02"],
    });

    const result = analyzeSliceParallelEligibility(base, "M001");

    // S01 is complete → ineligible (already complete)
    // S02 depends on S01 (complete) → eligible
    // S03 depends on S02 (not complete) → ineligible (blocked)
    assert.equal(result.eligible.length, 1, "only one slice eligible");
    assert.equal(result.eligible[0]!.sliceId, "S02");

    assert.equal(result.ineligible.length, 2, "two ineligible slices");
    const ineligIds = result.ineligible.map(e => e.sliceId).sort();
    assert.deepEqual(ineligIds, ["S01", "S03"]);

    // Check S01 reason
    const s01 = result.ineligible.find(e => e.sliceId === "S01")!;
    assert.match(s01.reason, /Already complete/);

    // Check S03 reason
    const s03 = result.ineligible.find(e => e.sliceId === "S03")!;
    assert.match(s03.reason, /Blocked by incomplete dependencies/);
    assert.match(s03.reason, /S02/);
  });

  test("file overlap detection — two eligible slices sharing a file", () => {
    insertSlice({
      id: "S01",
      milestoneId: "M001",
      title: "Slice One",
      status: "active",
      risk: "low",
      depends: [],
    });
    insertSlice({
      id: "S02",
      milestoneId: "M001",
      title: "Slice Two",
      status: "pending",
      risk: "low",
      depends: [],
    });

    // Add tasks with overlapping files
    insertTask({
      id: "T01",
      sliceId: "S01",
      milestoneId: "M001",
      title: "Task in S01",
      status: "pending",
      planning: {
        files: ["src/shared/utils.ts", "src/module-a/index.ts"],
      },
    });
    insertTask({
      id: "T01",
      sliceId: "S02",
      milestoneId: "M001",
      title: "Task in S02",
      status: "pending",
      planning: {
        files: ["src/shared/utils.ts", "src/module-b/index.ts"],
      },
    });

    const result = analyzeSliceParallelEligibility(base, "M001");

    assert.equal(result.eligible.length, 2, "both slices eligible (overlaps are warnings only)");
    assert.equal(result.fileOverlaps.length, 1, "one file overlap detected");
    assert.deepEqual(result.fileOverlaps[0]!.files, ["src/shared/utils.ts"]);

    // Both eligible slices should have a WARNING annotation
    for (const e of result.eligible) {
      assert.match(e.reason, /WARNING.*file overlap/, `${e.sliceId} should have file overlap warning`);
    }
  });
});

// ─── Formatting ──────────────────────────────────────────────────────────────

describe("slice-parallel-eligibility: formatSliceEligibilityReport", () => {
  test("empty candidates produces correct section headers", () => {
    const candidates: SliceParallelCandidates = {
      eligible: [],
      ineligible: [],
      fileOverlaps: [],
    };

    const report = formatSliceEligibilityReport(candidates);

    assert.match(report, /# Slice Parallel Eligibility Report/);
    assert.match(report, /## Eligible for Parallel Execution \(0\)/);
    assert.match(report, /## Ineligible \(0\)/);
    assert.ok(!report.includes("## File Overlap Warnings"), "no overlap section when no overlaps");
  });

  test("eligible slices appear in report with reason", () => {
    const candidates: SliceParallelCandidates = {
      eligible: [
        { sliceId: "S01", title: "First Slice", eligible: true, reason: "All dependencies satisfied." },
        { sliceId: "S02", title: "Second Slice", eligible: true, reason: "All dependencies satisfied." },
      ],
      ineligible: [],
      fileOverlaps: [],
    };

    const report = formatSliceEligibilityReport(candidates);

    assert.match(report, /## Eligible for Parallel Execution \(2\)/);
    assert.match(report, /\*\*S01\*\*/);
    assert.match(report, /\*\*S02\*\*/);
    assert.match(report, /All dependencies satisfied/);
  });

  test("file overlaps section appears when overlaps exist", () => {
    const candidates: SliceParallelCandidates = {
      eligible: [
        { sliceId: "S01", title: "Slice One", eligible: true, reason: "All dependencies satisfied. WARNING: has file overlap with another eligible slice." },
        { sliceId: "S02", title: "Slice Two", eligible: true, reason: "All dependencies satisfied. WARNING: has file overlap with another eligible slice." },
      ],
      ineligible: [],
      fileOverlaps: [{ sid1: "S01", sid2: "S02", files: ["src/shared/utils.ts"] }],
    };

    const report = formatSliceEligibilityReport(candidates);

    assert.match(report, /## File Overlap Warnings \(1\)/);
    assert.match(report, /\*\*S01\*\*.*\*\*S02\*\*/);
    assert.match(report, /src\/shared\/utils\.ts/);
  });
});
