/**
 * Tests for slice-parallel-conflict.ts
 *
 * Covers:
 * 1. No overlap — returns empty conflicts, all slices clean
 * 2. Partial overlap — conflicting pair reported, non-overlapping slice remains clean
 * 3. Full overlap — all files shared, both slices in conflictingSlices
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
  detectSliceConflicts,
  buildSliceFileSets,
} from "../slice-parallel-conflict.ts";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeTmpBase(): string {
  const base = mkdtempSync(join(tmpdir(), "hx-slice-conflict-test-"));
  mkdirSync(join(base, ".hx"), { recursive: true });
  return base;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("slice-parallel-conflict: detectSliceConflicts", () => {
  let base: string;

  beforeEach(() => {
    base = makeTmpBase();
    openDatabase(":memory:");
    insertMilestone({ id: "M001", title: "Test Milestone", status: "active" });

    // Insert three slices — S01, S02, S03
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
    insertSlice({
      id: "S03",
      milestoneId: "M001",
      title: "Slice Three",
      status: "pending",
      risk: "low",
      depends: [],
    });
  });

  afterEach(() => {
    closeDatabase();
    rmSync(base, { recursive: true, force: true });
  });

  test("no overlap — empty conflicts, all slices clean", async () => {
    // S01 touches only module-a files; S02 touches only module-b files
    insertTask({
      id: "T01",
      sliceId: "S01",
      milestoneId: "M001",
      title: "Task A",
      status: "pending",
      planning: {
        files: ["src/module-a/index.ts", "src/module-a/utils.ts"],
      },
    });
    insertTask({
      id: "T01",
      sliceId: "S02",
      milestoneId: "M001",
      title: "Task B",
      status: "pending",
      planning: {
        files: ["src/module-b/index.ts", "src/module-b/utils.ts"],
      },
    });

    const result = await detectSliceConflicts(base, "M001", ["S01", "S02"]);

    assert.equal(result.conflicts.length, 0, "no conflicts expected");
    assert.equal(result.conflictingSlices.length, 0, "no conflicting slices");
    assert.deepEqual(result.cleanSlices.sort(), ["S01", "S02"], "both slices clean");
  });

  test("partial overlap — conflicting pair reported, non-overlapping slice clean", async () => {
    // S01 and S02 share src/shared/utils.ts; S03 is entirely separate
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
    insertTask({
      id: "T01",
      sliceId: "S03",
      milestoneId: "M001",
      title: "Task in S03",
      status: "pending",
      planning: {
        files: ["src/module-c/index.ts"],
      },
    });

    const result = await detectSliceConflicts(base, "M001", ["S01", "S02", "S03"]);

    assert.equal(result.conflicts.length, 1, "exactly one conflict pair");
    const conflict = result.conflicts[0]!;
    assert.equal(conflict.sid1, "S01");
    assert.equal(conflict.sid2, "S02");
    assert.deepEqual(conflict.files, ["src/shared/utils.ts"]);

    assert.deepEqual(result.conflictingSlices, ["S01", "S02"], "S01 and S02 are conflicting");
    assert.deepEqual(result.cleanSlices, ["S03"], "S03 is clean");
  });

  test("full overlap — all files shared, both slices in conflictingSlices", async () => {
    // S01 and S02 touch exactly the same two files
    const sharedFiles = ["src/core/engine.ts", "src/core/types.ts"];

    insertTask({
      id: "T01",
      sliceId: "S01",
      milestoneId: "M001",
      title: "Full overlap task S01",
      status: "pending",
      planning: {
        files: sharedFiles,
      },
    });
    insertTask({
      id: "T01",
      sliceId: "S02",
      milestoneId: "M001",
      title: "Full overlap task S02",
      status: "pending",
      planning: {
        files: sharedFiles,
      },
    });

    const result = await detectSliceConflicts(base, "M001", ["S01", "S02"]);

    assert.equal(result.conflicts.length, 1, "one conflict pair");
    const conflict = result.conflicts[0]!;
    assert.deepEqual(conflict.files.sort(), [...sharedFiles].sort(), "all files listed in conflict");

    assert.deepEqual(result.conflictingSlices, ["S01", "S02"], "both slices conflicting");
    assert.equal(result.cleanSlices.length, 0, "no clean slices");
  });
});

// ─── buildSliceFileSets ───────────────────────────────────────────────────────

describe("slice-parallel-conflict: buildSliceFileSets", () => {
  let base: string;

  beforeEach(() => {
    base = makeTmpBase();
    openDatabase(":memory:");
    insertMilestone({ id: "M001", title: "Test Milestone", status: "active" });
    insertSlice({
      id: "S01",
      milestoneId: "M001",
      title: "Slice One",
      status: "active",
      risk: "low",
      depends: [],
    });
  });

  afterEach(() => {
    closeDatabase();
    rmSync(base, { recursive: true, force: true });
  });

  test("deduplicates files across multiple tasks in same slice", () => {
    // Two tasks both reference src/shared/utils.ts — should appear only once
    insertTask({
      id: "T01",
      sliceId: "S01",
      milestoneId: "M001",
      title: "Task One",
      status: "pending",
      planning: {
        files: ["src/shared/utils.ts", "src/module-a/index.ts"],
      },
    });
    insertTask({
      id: "T02",
      sliceId: "S01",
      milestoneId: "M001",
      title: "Task Two",
      status: "pending",
      planning: {
        files: ["src/shared/utils.ts", "src/module-a/helpers.ts"],
      },
    });

    const fileSets = buildSliceFileSets("M001", ["S01"]);
    const files = fileSets.get("S01")!;

    assert.ok(files.includes("src/shared/utils.ts"), "shared file present");
    assert.ok(files.includes("src/module-a/index.ts"), "task 1 unique file present");
    assert.ok(files.includes("src/module-a/helpers.ts"), "task 2 unique file present");

    // Deduplication check — count occurrences of the shared file
    const count = files.filter(f => f === "src/shared/utils.ts").length;
    assert.equal(count, 1, "shared file deduplicated to single occurrence");
    assert.equal(files.length, 3, "exactly 3 unique files");
  });
});
