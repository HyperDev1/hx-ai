/**
 * Tests for knowledge duplicate detection and appendKnowledge improvements.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { findSimilarKnowledge, appendKnowledge, searchKnowledge } from "../files.ts";

function makeTempDir(prefix: string): string {
  const dir = join(
    tmpdir(),
    `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  mkdirSync(dir, { recursive: true });
  return dir;
}

const SAMPLE_KNOWLEDGE = `# Project Knowledge

Append-only register of project-specific rules, patterns, and lessons learned.

## Rules

| # | Scope | Rule | Why | Added |
|---|-------|------|-----|-------|
| K001 | global | Always use prepared statements for DB queries | Prevents SQL injection | manual |
| K002 | M001 | Use PostgreSQL instead of SQLite | Better concurrency support | manual |

## Patterns

| # | Pattern | Where | Notes |
|---|---------|-------|-------|
| P001 | Service classes with dependency injection | src/services/ | global |
| P002 | Error handling via middleware wrapper | src/middleware/ | M001/S01 |

## Lessons Learned

| # | What Happened | Root Cause | Fix | Scope |
|---|--------------|------------|-----|-------|
| L001 | Docker build cache invalidated on every push | package.json COPY after source COPY | Reorder COPY commands | global |
`;

// ─── findSimilarKnowledge ─────────────────────────────────────────────────

test("knowledge: findSimilarKnowledge detects exact match (case-insensitive)", () => {
  const match = findSimilarKnowledge(SAMPLE_KNOWLEDGE, "rule", "always use prepared statements for db queries");
  assert.ok(match, "should find a match");
  assert.strictEqual(match!.id, "K001");
  assert.ok(match!.text.includes("prepared statements"));
});

test("knowledge: findSimilarKnowledge detects substring match (entry contains existing)", () => {
  const match = findSimilarKnowledge(SAMPLE_KNOWLEDGE, "rule", "We must always use prepared statements for DB queries in all modules");
  assert.ok(match, "should find a match");
  assert.strictEqual(match!.id, "K001");
});

test("knowledge: findSimilarKnowledge detects substring match (existing contains entry)", () => {
  const match = findSimilarKnowledge(SAMPLE_KNOWLEDGE, "pattern", "Service classes with dependency injection in all services");
  assert.ok(match, "should find a match");
  assert.strictEqual(match!.id, "P001");
});

test("knowledge: findSimilarKnowledge returns null when no match", () => {
  const match = findSimilarKnowledge(SAMPLE_KNOWLEDGE, "rule", "Use Tailwind CSS for styling");
  assert.strictEqual(match, null);
});

test("knowledge: findSimilarKnowledge only searches within the correct section", () => {
  // "prepared statements" exists in Rules, should not match when searching Patterns
  const match = findSimilarKnowledge(SAMPLE_KNOWLEDGE, "pattern", "prepared statements for DB queries");
  assert.strictEqual(match, null, "should not find rule content when searching patterns");
});

test("knowledge: findSimilarKnowledge ignores short substrings (< 10 chars)", () => {
  // "Use" is a substring of many entries but too short to be meaningful
  const match = findSimilarKnowledge(SAMPLE_KNOWLEDGE, "rule", "Use pnpm");
  assert.strictEqual(match, null, "short substring should not match");
});

test("knowledge: findSimilarKnowledge works for lessons", () => {
  const match = findSimilarKnowledge(SAMPLE_KNOWLEDGE, "lesson", "Docker build cache invalidated on every push");
  assert.ok(match, "should find lesson match");
  assert.strictEqual(match!.id, "L001");
});

// ─── appendKnowledge with duplicate detection ─────────────────────────────

test("knowledge: appendKnowledge returns duplicate info when entry exists", async () => {
  const tmp = makeTempDir("know-dup");
  try {
    mkdirSync(join(tmp, ".gsd"), { recursive: true });
    writeFileSync(join(tmp, ".gsd", "KNOWLEDGE.md"), SAMPLE_KNOWLEDGE, "utf-8");

    const result = await appendKnowledge(tmp, "rule", "Always use prepared statements for DB queries", "global");
    assert.strictEqual(result.added, false, "should not add duplicate");
    assert.ok(result.duplicateOf, "should have duplicateOf info");
    assert.strictEqual(result.duplicateOf!.id, "K001");
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test("knowledge: appendKnowledge adds entry when no duplicate", async () => {
  const tmp = makeTempDir("know-new");
  try {
    mkdirSync(join(tmp, ".gsd"), { recursive: true });
    writeFileSync(join(tmp, ".gsd", "KNOWLEDGE.md"), SAMPLE_KNOWLEDGE, "utf-8");

    const result = await appendKnowledge(tmp, "rule", "Never commit .env files", "global");
    assert.strictEqual(result.added, true);
    assert.strictEqual(result.id, "K003", "should be K003 (next after K002)");

    const content = readFileSync(join(tmp, ".gsd", "KNOWLEDGE.md"), "utf-8");
    assert.ok(content.includes("Never commit .env files"), "entry should be in file");
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test("knowledge: appendKnowledge creates file from scratch with fields", async () => {
  const tmp = makeTempDir("know-create");
  try {
    const result = await appendKnowledge(tmp, "rule", "Use TypeScript strict mode", "global", { why: "Catches null errors early" });
    assert.strictEqual(result.added, true);
    assert.strictEqual(result.id, "K001");

    const content = readFileSync(join(tmp, ".gsd", "KNOWLEDGE.md"), "utf-8");
    assert.ok(content.includes("Use TypeScript strict mode"), "entry should be in file");
    assert.ok(content.includes("Catches null errors early"), "why field should be in file");
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test("knowledge: appendKnowledge passes fields to existing file", async () => {
  const tmp = makeTempDir("know-fields");
  try {
    mkdirSync(join(tmp, ".gsd"), { recursive: true });
    writeFileSync(join(tmp, ".gsd", "KNOWLEDGE.md"), SAMPLE_KNOWLEDGE, "utf-8");

    const result = await appendKnowledge(tmp, "lesson", "Build failed after upgrade", "M001", {
      rootCause: "Breaking change in v5",
      fix: "Pin dependency to v4",
    });
    assert.strictEqual(result.added, true);

    const content = readFileSync(join(tmp, ".gsd", "KNOWLEDGE.md"), "utf-8");
    assert.ok(content.includes("Build failed after upgrade"));
    assert.ok(content.includes("Breaking change in v5"), "rootCause should be in file");
    assert.ok(content.includes("Pin dependency to v4"), "fix should be in file");
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test("knowledge: appendKnowledge pattern with where field", async () => {
  const tmp = makeTempDir("know-pattern");
  try {
    mkdirSync(join(tmp, ".gsd"), { recursive: true });
    writeFileSync(join(tmp, ".gsd", "KNOWLEDGE.md"), SAMPLE_KNOWLEDGE, "utf-8");

    const result = await appendKnowledge(tmp, "pattern", "Repository pattern for data access", "global", {
      where: "src/repositories/",
    });
    assert.strictEqual(result.added, true);
    assert.strictEqual(result.id, "P003");

    const content = readFileSync(join(tmp, ".gsd", "KNOWLEDGE.md"), "utf-8");
    assert.ok(content.includes("Repository pattern for data access"));
    assert.ok(content.includes("src/repositories/"), "where field should be in file");
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

// ─── searchKnowledge ──────────────────────────────────────────────────────

test("knowledge: searchKnowledge finds matches across all sections", () => {
  const results = searchKnowledge(SAMPLE_KNOWLEDGE, "prepared statements");
  assert.strictEqual(results.length, 1);
  assert.strictEqual(results[0].id, "K001");
  assert.strictEqual(results[0].type, "rule");
});

test("knowledge: searchKnowledge is case-insensitive", () => {
  const results = searchKnowledge(SAMPLE_KNOWLEDGE, "postgresql");
  assert.strictEqual(results.length, 1);
  assert.strictEqual(results[0].id, "K002");
});

test("knowledge: searchKnowledge returns results from multiple sections", () => {
  // "injection" appears in rules (K001 has "injection" in it? No — let's use a broader term)
  const results = searchKnowledge(SAMPLE_KNOWLEDGE, "middleware");
  assert.strictEqual(results.length, 1);
  assert.strictEqual(results[0].type, "pattern");
  assert.strictEqual(results[0].id, "P002");
});

test("knowledge: searchKnowledge returns empty array when no match", () => {
  const results = searchKnowledge(SAMPLE_KNOWLEDGE, "GraphQL");
  assert.strictEqual(results.length, 0);
});

test("knowledge: searchKnowledge returns empty array for empty query", () => {
  const results = searchKnowledge(SAMPLE_KNOWLEDGE, "");
  assert.strictEqual(results.length, 0);
});

test("knowledge: searchKnowledge finds lessons", () => {
  const results = searchKnowledge(SAMPLE_KNOWLEDGE, "Docker");
  assert.strictEqual(results.length, 1);
  assert.strictEqual(results[0].id, "L001");
  assert.strictEqual(results[0].type, "lesson");
});
