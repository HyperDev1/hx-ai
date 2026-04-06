/**
 * Test: Discord invite link canonicalization.
 *
 * Ensures that README.md and the Pi packages docs use the canonical
 * https://discord.gg/hx URL rather than the older discord.com/invite/... forms.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = process.cwd();

const VALID_INVITE = "https://discord.gg/hx";
const OLD_INVITE_PATTERN = /discord\.com\/invite\//;
const STALE_INVITE = "3cU7Bz4UPx"; // Old invite code that should not appear

describe("Discord invite link canonicalization", () => {
  it("README.md contains the canonical discord.gg/hx link", () => {
    const content = readFileSync(join(repoRoot, "README.md"), "utf-8");
    assert.ok(
      content.includes(VALID_INVITE),
      `README.md must contain ${VALID_INVITE}`,
    );
  });

  it("README.md does not contain legacy discord.com/invite/ links", () => {
    const content = readFileSync(join(repoRoot, "README.md"), "utf-8");
    assert.ok(
      !OLD_INVITE_PATTERN.test(content),
      "README.md must not contain legacy discord.com/invite/ URLs",
    );
  });

  it("15-pi-packages-the-ecosystem.md does not contain the old invite code", () => {
    const content = readFileSync(
      join(repoRoot, "docs", "what-is-pi", "15-pi-packages-the-ecosystem.md"),
      "utf-8",
    );
    assert.ok(
      !content.includes(STALE_INVITE),
      `docs file must not contain the stale invite code ${STALE_INVITE}`,
    );
  });

  it("15-pi-packages-the-ecosystem.md does not contain discord.com/invite/ links", () => {
    const content = readFileSync(
      join(repoRoot, "docs", "what-is-pi", "15-pi-packages-the-ecosystem.md"),
      "utf-8",
    );
    assert.ok(
      !OLD_INVITE_PATTERN.test(content),
      "docs file must not contain legacy discord.com/invite/ URLs",
    );
  });
});
