/**
 * remote-questions-manifest.test.ts
 *
 * Verifies that RemotePrompt and RemotePromptRecordBase context fields
 * include milestoneId, sliceId, unitId for auto-mode manifest tracking (#4d1ac2d1c).
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const SOURCE = readFileSync(
  join(import.meta.dirname, "..", "..", "remote-questions", "types.ts"),
  "utf-8",
);

test("RemotePrompt context has milestoneId field (#4d1ac2d1c)", () => {
  assert.ok(
    SOURCE.includes("milestoneId?: string"),
    "types.ts must include milestoneId?: string in context",
  );
});

test("RemotePrompt context has sliceId field", () => {
  assert.ok(
    SOURCE.includes("sliceId?: string"),
    "types.ts must include sliceId?: string in context",
  );
});

test("RemotePrompt context has unitId field", () => {
  assert.ok(
    SOURCE.includes("unitId?: string"),
    "types.ts must include unitId?: string in context",
  );
});

test("manifest tracking fields appear in both RemotePrompt and RemotePromptRecordBase", () => {
  // milestoneId should appear at least twice (once per interface)
  const count = (SOURCE.match(/milestoneId\?: string/g) ?? []).length;
  assert.ok(count >= 2, `milestoneId?: string should appear in both interfaces, found ${count}`);
});
