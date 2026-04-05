/**
 * dashboard-model-label-ordering.test.ts
 *
 * Verifies that the dispatched model ID takes precedence over the stale
 * cmdCtx.model when building the dashboard model display string.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const sessionSource = readFileSync(
  join(import.meta.dirname, "..", "auto", "session.ts"),
  "utf-8",
);

const dashboardSource = readFileSync(
  join(import.meta.dirname, "..", "auto-dashboard.ts"),
  "utf-8",
);

const autoSource = readFileSync(
  join(import.meta.dirname, "..", "auto.ts"),
  "utf-8",
);

const phasesSource = readFileSync(
  join(import.meta.dirname, "..", "auto", "phases.ts"),
  "utf-8",
);

test("AutoSession declares currentDispatchedModelId property (#f18305c50)", () => {
  assert.ok(
    sessionSource.includes("currentDispatchedModelId"),
    "auto/session.ts must declare currentDispatchedModelId",
  );
});

test("AutoSession reset() clears currentDispatchedModelId", () => {
  // The reset() method block should include a line that nullifies the property
  const resetIdx = sessionSource.indexOf("reset(): void {");
  assert.ok(resetIdx > -1, "reset() method must exist in AutoSession");

  const resetSection = sessionSource.slice(resetIdx, resetIdx + 2000);
  assert.ok(
    resetSection.includes("currentDispatchedModelId = null"),
    "reset() must clear currentDispatchedModelId to null",
  );
});

test("WidgetStateAccessors interface includes getCurrentDispatchedModelId", () => {
  assert.ok(
    dashboardSource.includes("getCurrentDispatchedModelId()"),
    "WidgetStateAccessors must declare getCurrentDispatchedModelId()",
  );
});

test("auto.ts wires getCurrentDispatchedModelId into widgetStateAccessors", () => {
  assert.ok(
    autoSource.includes("getCurrentDispatchedModelId"),
    "auto.ts must wire getCurrentDispatchedModelId into widgetStateAccessors",
  );
});

test("auto-dashboard.ts uses getCurrentDispatchedModelId to build model display", () => {
  assert.ok(
    dashboardSource.includes("getCurrentDispatchedModelId"),
    "auto-dashboard.ts must call getCurrentDispatchedModelId when rendering model",
  );
});

test("phases.ts sets currentDispatchedModelId after selectAndApplyModel", () => {
  assert.ok(
    phasesSource.includes("currentDispatchedModelId"),
    "auto/phases.ts must set currentDispatchedModelId after selectAndApplyModel",
  );
});

test("phases.ts resets currentDispatchedModelId at unit start", () => {
  const unitStartIdx = phasesSource.indexOf("s.currentUnit = { type: unitType");
  assert.ok(unitStartIdx > -1, "phases.ts must set s.currentUnit at unit start");

  const unitStartSection = phasesSource.slice(unitStartIdx, unitStartIdx + 200);
  assert.ok(
    unitStartSection.includes("currentDispatchedModelId = null"),
    "phases.ts must reset currentDispatchedModelId to null at unit start",
  );
});
