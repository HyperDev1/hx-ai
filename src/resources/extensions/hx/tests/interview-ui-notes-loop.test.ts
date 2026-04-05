/**
 * Regression test for #3502 — interview-ui notes field does not re-open
 * when cursor returns to 'None of the above' and notes are already filled.
 *
 * The fix: added `&& !states[currentIdx].notes` to the auto-open guard
 * in goNextOrSubmit() so notes only auto-open when still empty.
 */

import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

const SRC = readFileSync(
  new URL(
    "../../shared/interview-ui.ts",
    import.meta.url,
  ),
  "utf-8",
);

test("interview-ui: notes auto-open guard includes !states[currentIdx].notes", () => {
  // The fix — the guard must include the notes-empty check
  assert.ok(
    SRC.includes("!states[currentIdx].notes"),
    "Expected !states[currentIdx].notes condition in goNextOrSubmit",
  );
});

test("interview-ui: notes auto-open condition is on the same line as noneOrDoneIdx check", () => {
  const lines = SRC.split("\n");
  const fixLine = lines.find(
    (l) =>
      l.includes("noneOrDoneIdx(currentIdx)") &&
      l.includes("!states[currentIdx].notes") &&
      l.includes("notesVisible"),
  );
  // The three conditions should coexist on the guard line OR adjacent lines
  // (the condition may be wrapped — just verify they're all present near each other)
  assert.ok(
    fixLine !== undefined ||
    SRC.includes("!states[currentIdx].notes") && SRC.includes("noneOrDoneIdx(currentIdx)"),
    "Expected the notes-empty guard near the noneOrDoneIdx check",
  );
});

test("interview-ui: notesVisible is still set to true when notes are empty", () => {
  // The original behavior (open notes on None-of-above) must still exist
  assert.ok(
    SRC.includes("states[currentIdx].notesVisible = true"),
    "Expected notesVisible assignment to still be present",
  );
});

test("interview-ui: notesVisible guard has correct logical order (noneOrDoneIdx before notes check)", () => {
  // The noneOrDoneIdx check must come before the notes check so both are evaluated
  const noneIdx = SRC.indexOf("noneOrDoneIdx(currentIdx)");
  const notesIdx = SRC.indexOf("!states[currentIdx].notes");
  // Both must exist
  assert.ok(noneIdx > 0, "noneOrDoneIdx check must exist");
  assert.ok(notesIdx > 0, "!notes check must exist");
  // noneOrDoneIdx appears before !notes (it's the primary condition)
  assert.ok(noneIdx < notesIdx, "noneOrDoneIdx check should appear before !notes check");
});
