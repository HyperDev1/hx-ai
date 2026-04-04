/**
 * Integration tests for doctor false-positive fixes:
 *  1. isDoctorArtifactOnly guard in doctor-git-checks.ts
 *  2. !allTasksDone guard in blocker-discovered check in doctor.ts
 *  3. parsers-legacy.ts second-pass task scanner (knownIds dedup)
 *
 * Source lives in tests/integration/ — relative imports go two levels up.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { rmSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
// From tests/integration/ → need to go up 7 levels to reach repo root
const SRC_ROOT = join(__dirname, "../../../../../../..");

// ── Source-read assertions ────────────────────────────────────────────────────

test("doctor-git-checks.ts: isDoctorArtifactOnly is defined", () => {
  const src = readFileSync(
    join(SRC_ROOT, "src/resources/extensions/hx/doctor-git-checks.ts"),
    "utf8",
  );
  assert.ok(
    src.includes("isDoctorArtifactOnly"),
    "Expected isDoctorArtifactOnly function to be defined in doctor-git-checks.ts",
  );
});

test("doctor-git-checks.ts: isDoctorArtifactOnly guard appears before worktree_directory_orphaned push", () => {
  const src = readFileSync(
    join(SRC_ROOT, "src/resources/extensions/hx/doctor-git-checks.ts"),
    "utf8",
  );
  const guardIdx = src.indexOf("isDoctorArtifactOnly(fullPath)");
  const pushIdx = src.indexOf('"worktree_directory_orphaned"');
  assert.ok(guardIdx !== -1, "Expected isDoctorArtifactOnly guard to exist");
  assert.ok(pushIdx !== -1, "Expected worktree_directory_orphaned push to exist");
  assert.ok(
    guardIdx < pushIdx,
    "Expected isDoctorArtifactOnly guard to appear BEFORE the worktree_directory_orphaned issue push",
  );
});

test("doctor.ts: blocker check includes !allTasksDone condition", () => {
  const src = readFileSync(
    join(SRC_ROOT, "src/resources/extensions/hx/doctor.ts"),
    "utf8",
  );
  assert.ok(
    src.includes("!allTasksDone"),
    "Expected !allTasksDone to be present in the blocker check condition in doctor.ts",
  );
  const blockerIdx = src.indexOf("blocker_discovered_no_replan");
  const allTasksIdx = src.lastIndexOf("!allTasksDone", blockerIdx);
  assert.ok(
    allTasksIdx !== -1 && blockerIdx - allTasksIdx < 700,
    "Expected !allTasksDone to appear in close proximity to blocker_discovered_no_replan",
  );
});

test("parsers-legacy.ts: second-pass scan with knownIds Set is present", () => {
  const src = readFileSync(
    join(SRC_ROOT, "src/resources/extensions/hx/parsers-legacy.ts"),
    "utf8",
  );
  assert.ok(
    src.includes("knownIds"),
    "Expected knownIds Set to be present in parsers-legacy.ts second-pass scan",
  );
});

// ── Integration: isDoctorArtifactOnly runtime behavior ────────────────────────

test("isDoctorArtifactOnly: returns true for directory with only doctor-history.jsonl", async () => {
  const { isDoctorArtifactOnly } = await import(
    "../../doctor-git-checks.js"
  ) as { isDoctorArtifactOnly: (dirPath: string) => boolean };

  const tmpDir = mkdtempSync(join(tmpdir(), "hx-doctor-artifact-test-"));
  try {
    writeFileSync(join(tmpDir, "doctor-history.jsonl"), '{"ts":1}\n');
    const result = isDoctorArtifactOnly(tmpDir);
    assert.strictEqual(result, true, "Expected isDoctorArtifactOnly to return true for artifact-only dir");
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("isDoctorArtifactOnly: returns false for directory with real content", async () => {
  const { isDoctorArtifactOnly } = await import(
    "../../doctor-git-checks.js"
  ) as { isDoctorArtifactOnly: (dirPath: string) => boolean };

  const tmpDir = mkdtempSync(join(tmpdir(), "hx-doctor-artifact-test-real-"));
  try {
    writeFileSync(join(tmpDir, "doctor-history.jsonl"), '{"ts":1}\n');
    writeFileSync(join(tmpDir, "ROADMAP.md"), "# Roadmap\n");
    const result = isDoctorArtifactOnly(tmpDir);
    assert.strictEqual(result, false, "Expected isDoctorArtifactOnly to return false when real files exist");
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("isDoctorArtifactOnly: returns true for empty directory", async () => {
  const { isDoctorArtifactOnly } = await import(
    "../../doctor-git-checks.js"
  ) as { isDoctorArtifactOnly: (dirPath: string) => boolean };

  const tmpDir = mkdtempSync(join(tmpdir(), "hx-doctor-artifact-empty-"));
  try {
    const result = isDoctorArtifactOnly(tmpDir);
    assert.strictEqual(result, true, "Expected isDoctorArtifactOnly to return true for empty dir");
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
});

// ── Integration: parsers-legacy second-pass extraction ───────────────────────

test("parsers-legacy: second-pass extracts task after detail heading", async () => {
  const { parsePlan } = await import(
    "../../parsers-legacy.js"
  ) as { parsePlan: (content: string) => { tasks: Array<{ id: string; done: boolean }> } };

  const mockPlan = `# S01: My Slice

**Goal:** Test second-pass parsing.

## Tasks

- [x] **T01: First task**

## T02 Details

This section has a task checkbox that is outside the Tasks section.

- [x] **T02: Second task**

## Files Likely Touched

- src/foo.ts
`;

  const result = parsePlan(mockPlan);
  const ids = result.tasks.map(t => t.id);

  assert.ok(ids.includes("T01"), `Expected T01 in parsed tasks, got: ${ids.join(", ")}`);
  assert.ok(ids.includes("T02"), `Expected T02 in parsed tasks (second-pass), got: ${ids.join(", ")}`);
  assert.strictEqual(ids.filter(id => id === "T01").length, 1, "T01 should appear exactly once (no duplicates)");
  assert.strictEqual(ids.filter(id => id === "T02").length, 1, "T02 should appear exactly once (no duplicates)");
});

test("parsers-legacy: second-pass does not create duplicates for normal plan", async () => {
  const { parsePlan } = await import(
    "../../parsers-legacy.js"
  ) as { parsePlan: (content: string) => { tasks: Array<{ id: string; done: boolean }> } };

  const mockPlan = `# S01: Normal Slice

**Goal:** Test no-duplicate behavior.

## Tasks

- [x] **T01: First task**
- [ ] **T02: Second task**

## Files Likely Touched

- src/bar.ts
`;

  const result = parsePlan(mockPlan);
  const ids = result.tasks.map(t => t.id);

  assert.strictEqual(ids.filter(id => id === "T01").length, 1, "T01 should appear exactly once");
  assert.strictEqual(ids.filter(id => id === "T02").length, 1, "T02 should appear exactly once");
  assert.strictEqual(result.tasks.length, 2, "Should have exactly 2 tasks total");
});
