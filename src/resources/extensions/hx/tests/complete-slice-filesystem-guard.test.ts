/**
 * complete-slice-filesystem-guard.test.ts
 *
 * Verifies that the complete-slice prompt contains a filesystem guard
 * instruction preventing direct file writes (#aa0ebd3c0).
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const PROMPT = readFileSync(
  join(import.meta.dirname, "..", "prompts", "complete-slice.md"),
  "utf-8",
);

test("complete-slice.md contains Filesystem guard instruction (#aa0ebd3c0)", () => {
  assert.ok(
    PROMPT.includes("Filesystem guard"),
    "complete-slice.md must contain 'Filesystem guard' instruction",
  );
});

test("complete-slice.md guard warns against direct file writes", () => {
  assert.ok(
    PROMPT.includes("Do NOT write"),
    "complete-slice.md guard must say 'Do NOT write'",
  );
});

test("complete-slice.md guard references hx_complete_slice tool", () => {
  const guardIdx = PROMPT.indexOf("Filesystem guard");
  assert.ok(guardIdx > -1, "guard must exist");
  const guardSection = PROMPT.slice(guardIdx, guardIdx + 400);
  assert.ok(
    guardSection.includes("hx_complete_slice"),
    "filesystem guard must reference hx_complete_slice tool",
  );
});
