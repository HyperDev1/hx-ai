/**
 * Tests for LSP legacy alias: kotlin-language-server -> kotlin-lsp.
 * These are source-analysis tests that verify the alias wiring in config.ts.
 */

import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = readFileSync(join(__dirname, "lsp", "config.ts"), "utf-8");

describe("lsp-legacy-alias", () => {
  it("LEGACY_ALIASES constant is defined", () => {
    assert.ok(
      SRC.includes("LEGACY_ALIASES"),
      "Expected LEGACY_ALIASES constant in config.ts",
    );
  });

  it("kotlin-language-server maps to kotlin-lsp", () => {
    assert.ok(
      SRC.includes("'kotlin-language-server': 'kotlin-lsp'") ||
      SRC.includes('"kotlin-language-server": "kotlin-lsp"'),
      "Expected kotlin-language-server -> kotlin-lsp mapping in LEGACY_ALIASES",
    );
  });

  it("mergeServers uses effectiveName", () => {
    assert.ok(
      SRC.includes("effectiveName"),
      "Expected effectiveName variable in mergeServers",
    );
  });

  it("effectiveName uses LEGACY_ALIASES fallback", () => {
    const hasAliasLookup =
      SRC.includes("LEGACY_ALIASES[") &&
      SRC.includes("?? name");
    assert.ok(hasAliasLookup, "Expected LEGACY_ALIASES lookup with ?? name fallback in mergeServers");
  });

  it("merged server is stored under effectiveName key", () => {
    const hasEffectiveNameKey =
      SRC.includes("merged[effectiveName]") ||
      SRC.includes("normalizeServerConfig(effectiveName,");
    assert.ok(hasEffectiveNameKey, "Expected effectiveName used as merge key");
  });
});
