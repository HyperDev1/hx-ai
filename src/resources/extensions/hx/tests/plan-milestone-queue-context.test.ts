import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { buildPlanMilestonePrompt } from "../auto-prompts.ts";

function createBase(): string {
  const base = mkdtempSync(join(tmpdir(), "gsd-plan-queue-"));
  mkdirSync(join(base, ".hx", "milestones", "M010"), { recursive: true });
  return base;
}

function cleanup(base: string): void {
  rmSync(base, { recursive: true, force: true });
}

describe("plan-milestone queue context", () => {
  test("includes queue brief when planning milestone without roadmap context", async () => {
    const base = createBase();
    try {
      writeFileSync(
        join(base, ".hx", "QUEUE.md"),
        [
          "# Queue",
          "",
          "### M010: Analytics Dashboard — Interactivity, Intelligence & Demo Readiness",
          "**Vision:** Ship a polished analytics dashboard with drilldowns and AI assistance.",
          "",
          "## Scope",
          "- Interactivity",
          "- Intelligence",
          "- Demo readiness",
          "",
        ].join("\n"),
      );

      const prompt = await buildPlanMilestonePrompt("M010", "M010", base);

      assert.match(prompt, /Source: `\.hx\/QUEUE\.md`/);
      assert.match(prompt, /Analytics Dashboard — Interactivity, Intelligence & Demo Readiness/);
      assert.match(prompt, /Ship a polished analytics dashboard/);
    } finally {
      cleanup(base);
    }
  });
});
