/**
 * plan-milestone-completed-slice-preservation.test.ts
 *
 * Verifies that plan-milestone.ts calls updateSliceFields after insertSlice
 * to update metadata for existing rows (INSERT OR IGNORE preserves status
 * but skips title/risk/depends/demo on conflict — #8b43b56f8).
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const SOURCE = readFileSync(
  join(import.meta.dirname, "..", "tools", "plan-milestone.ts"),
  "utf-8",
);

test("plan-milestone imports updateSliceFields from hx-db (#8b43b56f8)", () => {
  assert.ok(
    SOURCE.includes("updateSliceFields"),
    "plan-milestone.ts must import updateSliceFields from hx-db.js",
  );
});

test("plan-milestone calls updateSliceFields after insertSlice", () => {
  const insertIdx = SOURCE.indexOf("insertSlice({");
  const updateIdx = SOURCE.indexOf("updateSliceFields(params.milestoneId");
  assert.ok(insertIdx > -1, "insertSlice({ call must exist");
  assert.ok(updateIdx > -1, "updateSliceFields call must exist");
  assert.ok(
    updateIdx > insertIdx,
    "updateSliceFields must be called after insertSlice",
  );
});

test("plan-milestone updateSliceFields passes title, risk, depends, demo", () => {
  const updateBlock = SOURCE.slice(SOURCE.indexOf("updateSliceFields(params.milestoneId"));
  const closingBrace = updateBlock.indexOf("});");
  const block = updateBlock.slice(0, closingBrace + 3);
  assert.ok(block.includes("title:"), "updateSliceFields must pass title");
  assert.ok(block.includes("risk:"), "updateSliceFields must pass risk");
  assert.ok(block.includes("depends:"), "updateSliceFields must pass depends");
  assert.ok(block.includes("demo:"), "updateSliceFields must pass demo");
});
