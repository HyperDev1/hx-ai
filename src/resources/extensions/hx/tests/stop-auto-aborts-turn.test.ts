/**
 * stop-auto-aborts-turn.test.ts — Regression test for the bug where
 * `/hx stop` disables auto-mode but doesn't abort the in-flight LLM turn.
 *
 * stopAuto must call ctx.abort() to cancel the currently streaming agent
 * turn. Without this, the agent keeps generating and executing tool calls
 * even after auto-mode state is torn down.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const autoSrcPath = join(import.meta.dirname, "..", "auto.ts");
const autoSrc = readFileSync(autoSrcPath, "utf-8");

test("stopAuto should call ctx.abort() to cancel the in-flight LLM turn", () => {
  // Find the stopAuto function
  const stopAutoIdx = autoSrc.indexOf("export async function stopAuto(");
  assert.ok(stopAutoIdx !== -1, "stopAuto function exists in auto.ts");

  // Extract a reasonable block (from function start to Step 1)
  const step1Idx = autoSrc.indexOf("Step 1: Timers and locks", stopAutoIdx);
  assert.ok(step1Idx !== -1, "Step 1 comment exists after stopAuto");
  const preStep1Block = autoSrc.slice(stopAutoIdx, step1Idx);

  // ctx.abort() should be called before Step 1 to cancel the agent immediately
  assert.ok(
    preStep1Block.includes("ctx?.abort()") || preStep1Block.includes("ctx.abort()"),
    "stopAuto should call ctx?.abort() before cleanup steps to cancel the in-flight LLM turn",
  );
});

test("stopAuto abort call should be wrapped in try/catch for safety", () => {
  const stopAutoIdx = autoSrc.indexOf("export async function stopAuto(");
  const step1Idx = autoSrc.indexOf("Step 1: Timers and locks", stopAutoIdx);
  const preStep1Block = autoSrc.slice(stopAutoIdx, step1Idx);

  // The abort call should be in a try/catch to prevent errors from blocking cleanup
  const abortIdx = preStep1Block.indexOf("abort()");
  assert.ok(abortIdx !== -1, "abort() call exists");

  // Check that there's a try block before the abort
  const beforeAbort = preStep1Block.slice(0, abortIdx);
  assert.ok(
    beforeAbort.includes("try"),
    "abort() should be wrapped in try/catch for safety",
  );
});
