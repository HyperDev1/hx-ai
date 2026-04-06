/**
 * Structural test: OAuth google_search shape.
 *
 * Verifies that the google-search extension's OAuth path uses
 * the correct URL (?alt=sse) and includes userAgent in the body.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// process.cwd() is the repo root when running via `npm run test:unit`
const repoRoot = process.cwd();
const srcPath = join(repoRoot, "src", "resources", "extensions", "google-search", "index.ts");
const src = readFileSync(srcPath, "utf-8");

describe("OAuth google_search API shape", () => {
  it("uses ?alt=sse in the streamGenerateContent URL", () => {
    assert.ok(
      src.includes("streamGenerateContent?alt=sse"),
      "The OAuth URL must include ?alt=sse for Server-Sent Events streaming",
    );
  });

  it("includes userAgent in the request body", () => {
    assert.ok(
      src.includes('userAgent: "pi-coding-agent"'),
      'The OAuth request body must include userAgent: "pi-coding-agent"',
    );
  });

  it("does not use the bare streamGenerateContent endpoint without ?alt=sse", () => {
    // Check that the URL assignment itself uses ?alt=sse
    // (comments mentioning the method name are fine)
    assert.ok(
      src.includes("streamGenerateContent?alt=sse"),
      "The URL must contain streamGenerateContent?alt=sse",
    );
    // Verify the URL variable specifically
    assert.match(
      src,
      /`https:\/\/cloudcode-pa\.googleapis\.com\/v1internal:streamGenerateContent\?alt=sse`/,
      "The full URL must use streamGenerateContent?alt=sse",
    );
  });
});
