/**
 * Tests for phase-anchor.ts
 *
 * Covers: writePhaseAnchor path construction, readPhaseAnchor round-trip,
 * null return for missing anchor, and formatAnchorForPrompt output.
 */

import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, realpathSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { existsSync, readFileSync } from "node:fs";

import {
  writePhaseAnchor,
  readPhaseAnchor,
  formatAnchorForPrompt,
  type PhaseAnchor,
} from "../phase-anchor.ts";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Create a temp directory with a .hx/ subdir, return base path + cleanup fn. */
function makeTempBase(): { base: string; cleanup: () => void } {
  const tmpDir = realpathSync(mkdtempSync(join(tmpdir(), "hx-anchor-test-")));
  mkdirSync(join(tmpDir, ".hx"), { recursive: true });
  return {
    base: tmpDir,
    cleanup: () => rmSync(tmpDir, { recursive: true, force: true }),
  };
}

const sampleAnchor: PhaseAnchor = {
  phase: "discuss",
  milestoneId: "M001",
  generatedAt: "2025-01-01T00:00:00.000Z",
  intent: "Research the codebase and identify the key integration points",
  decisions: ["Use TypeScript strict mode", "Prefer fs/promises over sync fs"],
  blockers: ["Need to confirm native module ABI compatibility"],
  nextSteps: ["Write S01 plan", "Verify native module build"],
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("phase-anchor", () => {
  test("writePhaseAnchor creates anchor file at correct path", () => {
    const { base, cleanup } = makeTempBase();
    try {
      writePhaseAnchor(base, "M001", sampleAnchor);
      const expectedPath = join(
        base,
        ".hx",
        "milestones",
        "M001",
        "anchors",
        "discuss.json"
      );
      assert.ok(
        existsSync(expectedPath),
        `anchor file should exist at ${expectedPath}`
      );
    } finally {
      cleanup();
    }
  });

  test("readPhaseAnchor returns the written anchor", () => {
    const { base, cleanup } = makeTempBase();
    try {
      writePhaseAnchor(base, "M001", sampleAnchor);
      const read = readPhaseAnchor(base, "M001", "discuss");
      assert.ok(read !== null, "readPhaseAnchor should return the anchor");
      assert.equal(read.phase, sampleAnchor.phase);
      assert.equal(read.milestoneId, sampleAnchor.milestoneId);
      assert.equal(read.intent, sampleAnchor.intent);
      assert.deepEqual(read.decisions, sampleAnchor.decisions);
      assert.deepEqual(read.blockers, sampleAnchor.blockers);
      assert.deepEqual(read.nextSteps, sampleAnchor.nextSteps);
    } finally {
      cleanup();
    }
  });

  test("readPhaseAnchor returns null when no anchor exists", () => {
    const { base, cleanup } = makeTempBase();
    try {
      const result = readPhaseAnchor(base, "M001", "research-milestone");
      assert.equal(result, null, "should return null for missing anchor");
    } finally {
      cleanup();
    }
  });

  test("formatAnchorForPrompt produces non-empty string with phase name and intent", () => {
    const formatted = formatAnchorForPrompt(sampleAnchor);
    assert.ok(
      typeof formatted === "string" && formatted.length > 0,
      "formatted output should be a non-empty string"
    );
    assert.ok(
      formatted.includes(sampleAnchor.phase),
      "formatted output should include the phase name"
    );
    assert.ok(
      formatted.includes(sampleAnchor.intent),
      "formatted output should include the intent"
    );
  });
});
