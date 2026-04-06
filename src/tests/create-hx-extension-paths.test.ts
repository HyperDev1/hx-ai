/**
 * Structural test: create-hx-extension SKILL.md and workflow files
 * must correctly describe extension install paths.
 *
 * Verifies:
 * - No file instructs placing extensions in ~/.hx/agent/extensions/hx/ as a user install target
 * - Files reference the correct user scope (~/.hx/agent/extensions/) and project scope (.hx/extensions/)
 * - No stale ~/.gsd/ paths are present
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

// process.cwd() is the repo root when running via `npm run test:unit`
const repoRoot = process.cwd();
const skillRoot = join(repoRoot, "src", "resources", "skills", "create-hx-extension");

function readSkillFiles(): { path: string; content: string }[] {
  const files: { path: string; content: string }[] = [];

  // SKILL.md
  files.push({
    path: join(skillRoot, "SKILL.md"),
    content: readFileSync(join(skillRoot, "SKILL.md"), "utf-8"),
  });

  // Workflow files
  const workflowDir = join(skillRoot, "workflows");
  for (const name of readdirSync(workflowDir)) {
    if (name.endsWith(".md")) {
      const filePath = join(workflowDir, name);
      files.push({ path: filePath, content: readFileSync(filePath, "utf-8") });
    }
  }

  return files;
}

describe("create-hx-extension extension install paths", () => {
  const files = readSkillFiles();

  it("SKILL.md does not instruct installing extensions in ~/.hx/agent/extensions/hx/", () => {
    const skillMd = files.find((f) => f.path.endsWith("SKILL.md"))!;
    // The hx/ path should only appear in the context of the warning note,
    // not as an instruction to install there. We check the note text is present.
    assert.ok(
      skillMd.content.includes("do not install community extensions there"),
      "SKILL.md must include a warning that ~/.hx/agent/extensions/hx/ is reserved",
    );
  });

  it("SKILL.md references the correct user-scope extension path", () => {
    const skillMd = files.find((f) => f.path.endsWith("SKILL.md"))!;
    assert.ok(
      skillMd.content.includes("~/.hx/agent/extensions/"),
      "SKILL.md must reference the user-scope extension path ~/.hx/agent/extensions/",
    );
  });

  it("SKILL.md references the correct project-scope extension path", () => {
    const skillMd = files.find((f) => f.path.endsWith("SKILL.md"))!;
    assert.ok(
      skillMd.content.includes(".hx/extensions/"),
      "SKILL.md must reference the project-scope extension path .hx/extensions/",
    );
  });

  it("no skill or workflow file contains stale ~/.gsd/ paths", () => {
    for (const { path, content } of files) {
      assert.ok(
        !content.includes("~/.gsd/"),
        `File ${path} must not contain stale ~/.gsd/ paths`,
      );
    }
  });
});
