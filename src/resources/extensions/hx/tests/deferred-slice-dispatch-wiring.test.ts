/**
 * deferred-slice-dispatch-wiring.test.ts
 *
 * Verifies that state.ts uses isInactiveStatus at the critical dispatch sites —
 * the allSlicesDone milestone completion check and the activeSlice selection loop.
 * Supplements deferred-slice-dispatch.test.ts which only tests status-guards in isolation.
 * Fix: commit 93295f7b5.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const SOURCE = readFileSync(
  join(import.meta.dirname, "..", "state.ts"),
  "utf-8",
);

test("state.ts imports isInactiveStatus from status-guards (#93295f7b5)", () => {
  assert.ok(
    SOURCE.includes("isInactiveStatus"),
    "state.ts must import isInactiveStatus from status-guards.js",
  );
  assert.ok(
    SOURCE.includes("import") && SOURCE.includes("status-guards"),
    "import must reference status-guards",
  );
});

test("state.ts allSlicesDone check uses isInactiveStatus", () => {
  assert.ok(
    SOURCE.includes("activeMilestoneSlices.every(s => isInactiveStatus(s.status))"),
    "allSlicesDone must use isInactiveStatus so deferred slices count as done",
  );
});

test("state.ts activeSlice loop skip uses isInactiveStatus", () => {
  assert.ok(
    SOURCE.includes("if (isInactiveStatus(s.status)) continue;"),
    "activeSlice loop must skip deferred slices via isInactiveStatus",
  );
});

test("state.ts sliceProgress.done uses isInactiveStatus", () => {
  assert.ok(
    SOURCE.includes("filter(s => isInactiveStatus(s.status)).length"),
    "sliceProgress.done must count deferred slices as done via isInactiveStatus",
  );
});

test("state.ts doneSliceIds uses isInactiveStatus", () => {
  assert.ok(
    SOURCE.includes("filter(s => isInactiveStatus(s.status)).map(s => s.id)"),
    "doneSliceIds must include deferred slices via isInactiveStatus",
  );
});
