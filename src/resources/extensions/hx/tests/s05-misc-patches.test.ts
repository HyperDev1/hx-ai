/**
 * s05-misc-patches.test.ts
 *
 * Static-analysis regression tests for M004-erchk5/S05 upstream patches.
 * Verifies that each commit's change is present in source by reading
 * the relevant source file and asserting on key tokens.
 */

import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "../../../../..");

function read(relPath: string): string {
  return readFileSync(join(root, relPath), "utf-8");
}

// ── MCP Bearer Token Auth (7870f6e2a) ────────────────────────────────────────

describe("MCP bearer token auth", () => {
  const src = read("src/resources/extensions/mcp-client/index.ts");

  test("McpServerConfig has bearer_token field", () => {
    assert.ok(src.includes("bearer_token"), "McpServerConfig should have bearer_token field");
  });

  test("getOrConnect resolves bearer token env vars", () => {
    assert.ok(
      src.includes("resolvedToken"),
      "getOrConnect should resolve bearer_token to resolvedToken",
    );
  });

  test("getOrConnect passes Authorization header to StreamableHTTPClientTransport", () => {
    assert.ok(
      src.includes("Authorization") && src.includes("Bearer"),
      "getOrConnect should pass Bearer token as Authorization header",
    );
  });

  test("StreamableHTTPClientTransport receives requestInit", () => {
    assert.ok(
      src.includes("requestInit"),
      "StreamableHTTPClientTransport should receive requestInit option",
    );
  });
});

// ── Gemini OAuth Detection (7f2c7dbab) ───────────────────────────────────────

describe("Gemini OAuth detection", () => {
  const src = read("packages/pi-ai/src/env-api-keys.ts");

  test("google-gemini-cli provider block exists", () => {
    assert.ok(
      src.includes("google-gemini-cli"),
      "env-api-keys.ts should have a google-gemini-cli provider block",
    );
  });

  test("GEMINI_CLI_API_KEY env var is checked", () => {
    assert.ok(
      src.includes("GEMINI_CLI_API_KEY"),
      "env-api-keys.ts should check GEMINI_CLI_API_KEY env var",
    );
  });
});

// ── git add -u symlink (bda7ff773) ───────────────────────────────────────────

describe("git add -u symlink staging", () => {
  const bridgeSrc = read("src/resources/extensions/hx/native-git-bridge.ts");
  const worktreeSrc = read("src/resources/extensions/hx/auto-worktree.ts");

  test("nativeAddTracked export exists in native-git-bridge.ts", () => {
    assert.ok(
      bridgeSrc.includes("nativeAddTracked"),
      "native-git-bridge.ts should export nativeAddTracked",
    );
  });

  test("nativeAddTracked uses git add -u", () => {
    assert.ok(
      bridgeSrc.includes('"add", "-u"') || bridgeSrc.includes("'add', '-u'") || bridgeSrc.includes('["add", "-u"]'),
      "nativeAddTracked should call git add -u",
    );
  });

  test("auto-worktree imports nativeAddTracked", () => {
    assert.ok(
      worktreeSrc.includes("nativeAddTracked"),
      "auto-worktree.ts should import and use nativeAddTracked",
    );
  });

  test("auto-worktree uses nativeAddTracked when .hx is a symlink", () => {
    assert.ok(
      worktreeSrc.includes("isSymbolicLink"),
      "auto-worktree.ts should detect symlink via isSymbolicLink",
    );
  });
});

// ── Bundled ext conflict detection (dbe1ffd40) ───────────────────────────────

describe("Bundled ext conflict detection", () => {
  const src = read("src/resource-loader.ts");

  test("conflict detection warning block exists", () => {
    assert.ok(
      src.includes("conflicts with bundled extension directory"),
      "resource-loader.ts should warn about extension name conflicts",
    );
  });
});

// ── U+2705 checkmark in roadmap parser (199382887) ───────────────────────────

describe("U+2705 checkmark in mcp-server roadmap parser", () => {
  const src = read("packages/mcp-server/src/readers/state.ts");

  test("parseRoadmapSliceStatus handles checkmark prefix", () => {
    assert.ok(
      src.includes("\\u2713") || src.includes("\\u2714") || src.includes("\\u2705") ||
      src.includes("\u2713") || src.includes("\u2714") || src.includes("\u2705"),
      "parseRoadmapSliceStatus should handle U+2705 and related checkmark glyphs",
    );
  });

  test("checkmark match returns complete status", () => {
    assert.ok(
      src.includes("'complete'"),
      "checkmark match path should return status: complete",
    );
  });
});

// ── CmuxClient stdio isolation (8b80e391b) ───────────────────────────────────

describe("CmuxClient stdio isolation", () => {
  const src = read("src/resources/extensions/cmux/index.ts");

  test("runSync has input empty string to prevent stdin inheritance", () => {
    assert.ok(
      src.includes('input: ""') || src.includes("input: ''"),
      "CmuxClient runSync should have input: '' to prevent stdin inheritance",
    );
  });
});

// ── Doctor --fix flag (83c1e960c) ─────────────────────────────────────────────

describe("Doctor --fix flag parse", () => {
  const src = read("src/resources/extensions/hx/commands-handlers.ts");

  test("--fix flag is stripped from args", () => {
    assert.ok(
      src.includes("--fix"),
      "handleDoctor should strip --fix flag from args",
    );
  });

  test("fixFlag variable is set from --fix presence", () => {
    assert.ok(
      src.includes("fixFlag"),
      "handleDoctor should have fixFlag variable",
    );
  });
});

// ── Update-check cache bypass (9cc59bd7d) ────────────────────────────────────

describe("Update-check cache bypass", () => {
  const src = read("src/update-check.ts");

  test("fetch uses cache: no-store to bypass npm CDN cache", () => {
    assert.ok(
      src.includes("no-store"),
      "update-check.ts fetch should use cache: 'no-store'",
    );
  });
});

// ── Headless resource sync (2047585c0) ───────────────────────────────────────

describe("Headless resource sync", () => {
  const src = read("src/cli.ts");

  test("initResources is called before runHeadless", () => {
    const headlessIdx = src.indexOf("runHeadless");
    const initIdx = src.lastIndexOf("initResources", headlessIdx);
    assert.ok(
      initIdx !== -1 && initIdx < headlessIdx,
      "initResources should be called before runHeadless in the headless branch",
    );
  });
});

// ── Welcome screen 200-col cap removal (340e3ea4a) ───────────────────────────

describe("Welcome screen 200-col cap removal", () => {
  const src = read("src/welcome-screen.ts");

  test("termWidth has no 200 column cap", () => {
    assert.ok(
      !src.includes("Math.min") || !src.includes("200"),
      "welcome-screen.ts should not have Math.min(..., 200) column cap",
    );
  });

  test("termWidth uses stderr.columns directly", () => {
    assert.ok(
      src.includes("stderr.columns"),
      "termWidth should still use process.stderr.columns",
    );
  });
});
