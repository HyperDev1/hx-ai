/**
 * Structural test: MCP server name trim + case-insensitive lookup.
 *
 * Reads the source of mcp-client/index.ts and asserts that
 * getServerConfig uses .trim() and .toLowerCase() for name matching.
 * No I/O or network access required.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcPath = join(__dirname, "..", "index.ts");
const src = readFileSync(srcPath, "utf-8");

describe("MCP server name spaces — getServerConfig", () => {
  it("uses .trim() to normalize the input name", () => {
    assert.ok(
      src.includes(".trim()"),
      "getServerConfig must call .trim() to strip whitespace from the server name",
    );
  });

  it("uses .toLowerCase() for case-insensitive comparison", () => {
    assert.ok(
      src.includes(".toLowerCase()"),
      "getServerConfig must call .toLowerCase() for case-insensitive matching",
    );
  });

  it("uses config.name as canonical cache key in connections.set", () => {
    assert.ok(
      src.includes("connections.set(config.name"),
      "getOrConnect must use config.name (canonical name) as the connections cache key",
    );
  });

  it("checks getServerConfig before connections.get to support canonical key lookups", () => {
    const getServerConfigPos = src.indexOf("const config = getServerConfig(name)");
    const connectionsGetPos = src.indexOf("connections.get(config.name)");
    assert.ok(
      getServerConfigPos !== -1 && connectionsGetPos !== -1,
      "Both getServerConfig and connections.get(config.name) must be present",
    );
    assert.ok(
      getServerConfigPos < connectionsGetPos,
      "getServerConfig must be called before connections.get so config.name is available",
    );
  });

  it("avoids shadowing the name parameter in URL.replace lambda", () => {
    // The old code used `(_, name) =>` which shadows the outer `name` param.
    // The fix renames it to `varName`.
    assert.ok(
      src.includes("(_, varName)") || !src.includes('(_, name) => process.env[name]'),
      "URL.replace lambda should not shadow the outer name parameter",
    );
  });
});
