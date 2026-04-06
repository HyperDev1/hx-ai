/**
 * complete-slice-context-exhaustion.test.ts
 *
 * Verifies that buildCompleteSlicePrompt caps per-task summary size to
 * prevent context exhaustion when a slice has many verbose task summaries (#5beb9f61c).
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const SOURCE = readFileSync(
  join(import.meta.dirname, "..", "auto-prompts.ts"),
  "utf-8",
);

test("auto-prompts defines MAX_TASK_SUMMARY_CHARS constant (#5beb9f61c)", () => {
  assert.ok(
    SOURCE.includes("MAX_TASK_SUMMARY_CHARS"),
    "auto-prompts.ts must define MAX_TASK_SUMMARY_CHARS",
  );
});

test("auto-prompts truncates task summaries that exceed the cap", () => {
  assert.ok(
    SOURCE.includes("content.length > MAX_TASK_SUMMARY_CHARS"),
    "auto-prompts.ts must check content.length > MAX_TASK_SUMMARY_CHARS",
  );
});

test("auto-prompts appends truncation notice on long summaries", () => {
  assert.ok(
    SOURCE.includes("summary truncated to prevent context exhaustion"),
    "truncation notice must include 'summary truncated to prevent context exhaustion'",
  );
});

test("buildCompleteSlicePrompt uses let content (mutable for truncation)", () => {
  // The content variable in the task summary loop must be reassignable
  const buildFnIdx = SOURCE.indexOf("export async function buildCompleteSlicePrompt(");
  assert.ok(buildFnIdx > -1, "buildCompleteSlicePrompt must exist");
  const fnSection = SOURCE.slice(buildFnIdx, buildFnIdx + 3000);
  assert.ok(
    fnSection.includes("let content"),
    "buildCompleteSlicePrompt loop must use 'let content' for truncation",
  );
});
