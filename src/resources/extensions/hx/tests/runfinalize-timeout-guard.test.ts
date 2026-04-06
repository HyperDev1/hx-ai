/**
 * runfinalize-timeout-guard.test.ts
 *
 * Verifies that runFinalize in auto/phases.ts has a try/finally guard
 * ensuring clearUnitTimeout is called even when an exception escapes (#e772de0d2).
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const SOURCE = readFileSync(
  join(import.meta.dirname, "..", "auto", "phases.ts"),
  "utf-8",
);

test("phases.ts runFinalize has try/finally guard (#e772de0d2)", () => {
  const runFinalizeIdx = SOURCE.indexOf("export async function runFinalize(");
  assert.ok(runFinalizeIdx > -1, "runFinalize must exist in phases.ts");

  // Extract from function start to end (find closing brace after the function body)
  const fnSection = SOURCE.slice(runFinalizeIdx, runFinalizeIdx + 5000);
  assert.ok(
    fnSection.includes("} finally {"),
    "runFinalize must have a finally block",
  );
});

test("phases.ts runFinalize finally block calls clearUnitTimeout", () => {
  const runFinalizeIdx = SOURCE.indexOf("export async function runFinalize(");
  const fnSection = SOURCE.slice(runFinalizeIdx, runFinalizeIdx + 5000);
  const finallyIdx = fnSection.indexOf("} finally {");
  assert.ok(finallyIdx > -1, "finally block must exist");
  const finallyBlock = fnSection.slice(finallyIdx, finallyIdx + 100);
  assert.ok(
    finallyBlock.includes("clearUnitTimeout"),
    "finally block must call clearUnitTimeout()",
  );
});

test("phases.ts runFinalize has try block wrapping the verification body", () => {
  const runFinalizeIdx = SOURCE.indexOf("export async function runFinalize(");
  const fnSection = SOURCE.slice(runFinalizeIdx, runFinalizeIdx + 5000);
  // The try block should appear before the finally
  const tryIdx = fnSection.indexOf("\n  try {");
  const finallyIdx = fnSection.indexOf("} finally {");
  assert.ok(tryIdx > -1, "try block must exist in runFinalize");
  assert.ok(finallyIdx > tryIdx, "finally must come after try");
});
