/**
 * enrichment-optional-params.test.ts
 *
 * Verifies that verificationEvidence is Type.Optional in hx_task_complete
 * and that the execute handler null-coalesces it to [] (#bcde8367b).
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const SOURCE = readFileSync(
  join(import.meta.dirname, "..", "bootstrap", "db-tools.ts"),
  "utf-8",
);

test("hx_task_complete: verificationEvidence is Type.Optional (#bcde8367b)", () => {
  // Find the hx_task_complete parameters block
  const taskCompleteIdx = SOURCE.indexOf("name: \"hx_task_complete\"");
  assert.ok(taskCompleteIdx > -1, "hx_task_complete tool must exist");
  const paramsSection = SOURCE.slice(taskCompleteIdx, taskCompleteIdx + 3000);
  assert.ok(
    paramsSection.includes("verificationEvidence: Type.Optional("),
    "verificationEvidence must be Type.Optional in hx_task_complete schema",
  );
});

test("hx_task_complete execute handler null-coalesces verificationEvidence", () => {
  assert.ok(
    SOURCE.includes("params.verificationEvidence ?? []"),
    "execute handler must use params.verificationEvidence ?? [] to handle absent field",
  );
});
