import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { parseDotenv, loadEnvFile, validateEnv } from "../env.ts";
import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

// ─── parseDotenv ─────────────────────────────────────────────────────────────

describe("parseDotenv", () => {
  test("parses simple KEY=value pairs", () => {
    const result = parseDotenv("FOO=bar\nBAZ=qux");
    assert.equal(result.FOO, "bar");
    assert.equal(result.BAZ, "qux");
  });

  test("skips comments and blank lines", () => {
    const result = parseDotenv("# comment\n\nFOO=bar\n  # another comment\n");
    assert.deepEqual(Object.keys(result), ["FOO"]);
    assert.equal(result.FOO, "bar");
  });

  test("handles double-quoted values with escapes", () => {
    const result = parseDotenv('KEY="hello\\nworld"');
    assert.equal(result.KEY, "hello\nworld");
  });

  test("handles single-quoted values (literal)", () => {
    const result = parseDotenv("KEY='hello\\nworld'");
    assert.equal(result.KEY, "hello\\nworld");
  });

  test("strips inline comments from unquoted values", () => {
    const result = parseDotenv("KEY=value # this is a comment");
    assert.equal(result.KEY, "value");
  });

  test("preserves # inside quoted values", () => {
    const result = parseDotenv('KEY="value # not a comment"');
    assert.equal(result.KEY, "value # not a comment");
  });

  test("handles export prefix", () => {
    const result = parseDotenv("export FOO=bar");
    assert.equal(result.FOO, "bar");
  });

  test("handles empty values", () => {
    const result = parseDotenv("KEY=");
    assert.equal(result.KEY, "");
  });

  test("handles values with equals signs", () => {
    const result = parseDotenv("KEY=a=b=c");
    assert.equal(result.KEY, "a=b=c");
  });

  test("trims whitespace around keys", () => {
    const result = parseDotenv("  KEY  =  value  ");
    assert.equal(result.KEY, "value");
  });

  test("skips lines without equals sign", () => {
    const result = parseDotenv("not_a_var\nKEY=val");
    assert.deepEqual(Object.keys(result), ["KEY"]);
  });

  test("handles escaped quotes in double-quoted values", () => {
    const result = parseDotenv('KEY="say \\"hello\\""');
    assert.equal(result.KEY, 'say "hello"');
  });
});

// ─── loadEnvFile ─────────────────────────────────────────────────────────────

describe("loadEnvFile", () => {
  const testDir = join(tmpdir(), `hx-env-test-${Date.now()}`);

  beforeEach(() => {
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
    // Clean up test env vars
    delete process.env.HX_TEST_ENV_A;
    delete process.env.HX_TEST_ENV_B;
    delete process.env.HX_TEST_ENV_EXISTING;
  });

  test("loads .env file into process.env", () => {
    writeFileSync(join(testDir, ".env"), "HX_TEST_ENV_A=hello\nHX_TEST_ENV_B=world\n");
    const result = loadEnvFile(testDir);
    assert.equal(result.loaded, 2);
    assert.equal(result.path, join(testDir, ".env"));
    assert.equal(process.env.HX_TEST_ENV_A, "hello");
    assert.equal(process.env.HX_TEST_ENV_B, "world");
  });

  test("does not overwrite existing env vars", () => {
    process.env.HX_TEST_ENV_EXISTING = "original";
    writeFileSync(join(testDir, ".env"), "HX_TEST_ENV_EXISTING=overwritten\n");
    const result = loadEnvFile(testDir);
    assert.equal(result.loaded, 0);
    assert.deepEqual(result.skipped, ["HX_TEST_ENV_EXISTING"]);
    assert.equal(process.env.HX_TEST_ENV_EXISTING, "original");
  });

  test("returns null path when .env does not exist", () => {
    const result = loadEnvFile(join(testDir, "nonexistent"));
    assert.equal(result.loaded, 0);
    assert.equal(result.path, null);
  });

  test("supports custom file name", () => {
    writeFileSync(join(testDir, ".env.local"), "HX_TEST_ENV_A=local\n");
    const result = loadEnvFile(testDir, ".env.local");
    assert.equal(result.loaded, 1);
    assert.equal(process.env.HX_TEST_ENV_A, "local");
  });
});

// ─── validateEnv ─────────────────────────────────────────────────────────────

describe("validateEnv", () => {
  const savedEnv: Record<string, string | undefined> = {};
  const providerKeys = [
    "ANTHROPIC_API_KEY",
    "OPENAI_API_KEY",
    "GEMINI_API_KEY",
    "GROQ_API_KEY",
    "OLLAMA_API_KEY",
    "CUSTOM_OPENAI_API_KEY",
  ];

  beforeEach(() => {
    // Save and clear provider keys
    for (const key of providerKeys) {
      savedEnv[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    // Restore
    for (const key of providerKeys) {
      if (savedEnv[key] !== undefined) {
        process.env[key] = savedEnv[key];
      } else {
        delete process.env[key];
      }
    }
  });

  test("reports no provider when none is set", () => {
    const result = validateEnv();
    assert.equal(result.hasProvider, false);
    assert.equal(result.availableProviders.length, 0);
  });

  test("reports provider when one is set", () => {
    process.env.ANTHROPIC_API_KEY = "sk-ant-test";
    const result = validateEnv();
    assert.equal(result.hasProvider, true);
    assert.deepEqual(result.availableProviders, ["ANTHROPIC_API_KEY"]);
  });

  test("reports multiple providers", () => {
    process.env.ANTHROPIC_API_KEY = "sk-ant-test";
    process.env.OPENAI_API_KEY = "sk-test";
    const result = validateEnv();
    assert.equal(result.hasProvider, true);
    assert.equal(result.availableProviders.length, 2);
  });
});
