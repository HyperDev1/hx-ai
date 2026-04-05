/**
 * cold-resume-db-reopen.test.ts
 *
 * Verifies that openProjectDbIfPresent is exported from auto-start.ts
 * and that the resume path in auto.ts calls it before rebuildState.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const autoStartSource = readFileSync(
  join(import.meta.dirname, "..", "auto-start.ts"),
  "utf-8",
);

const autoSource = readFileSync(
  join(import.meta.dirname, "..", "auto.ts"),
  "utf-8",
);

test("openProjectDbIfPresent is exported from auto-start.ts (#62f11b9c3)", () => {
  assert.ok(
    autoStartSource.includes("export async function openProjectDbIfPresent("),
    "auto-start.ts must export openProjectDbIfPresent",
  );
});

test("auto.ts imports openProjectDbIfPresent from auto-start.js", () => {
  assert.ok(
    autoSource.includes("openProjectDbIfPresent") &&
      autoSource.includes("auto-start.js"),
    "auto.ts must import openProjectDbIfPresent from auto-start.js",
  );
});

test("auto.ts resume path calls openProjectDbIfPresent then rebuildState in order", () => {
  // Find the resume block: identified by 's.paused = false' (the flag reset at resume)
  // and the subsequent restoreHookState call which leads into the try block
  const resumeMarker = "restoreHookState(s.basePath);";
  const resumeIdx = autoSource.lastIndexOf(resumeMarker);
  assert.ok(resumeIdx > -1, "auto.ts must have a restoreHookState call in the resume block");

  // Extract the section from the resume block onward
  const resumeSection = autoSource.slice(resumeIdx, resumeIdx + 500);

  const openIdx = resumeSection.indexOf("await openProjectDbIfPresent");
  const rebuildIdx = resumeSection.indexOf("await rebuildState");

  assert.ok(openIdx > -1, "auto.ts resume block must call openProjectDbIfPresent");
  assert.ok(rebuildIdx > -1, "auto.ts resume block must call rebuildState");
  assert.ok(
    openIdx < rebuildIdx,
    "openProjectDbIfPresent must be called before rebuildState in the resume block",
  );
});
