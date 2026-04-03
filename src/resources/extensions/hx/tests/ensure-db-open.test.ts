import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
// ensureDbOpen — Tests that the lazy DB opener creates + migrates the database
// when .hx/ exists with Markdown content but no hx.db file.
//
// This covers the bug where interactive (non-auto) sessions got
// "HX database is not available" because ensureDbOpen only opened
// existing DB files but never created them.

import * as path from 'node:path';
import * as os from 'node:os';
import * as fs from 'node:fs';
import { closeDatabase, isDbAvailable, getDecisionById } from '../hx-db.ts';

function makeTmpDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hx-ensure-db-'));
  return dir;
}

function cleanupDir(dir: string): void {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch { /* swallow */ }
}

// ═══════════════════════════════════════════════════════════════════════════
// ensureDbOpen creates DB + migrates when .hx/ has Markdown
// ═══════════════════════════════════════════════════════════════════════════

describe('ensure-db-open', () => {
  test('ensureDbOpen: creates DB from Markdown', async () => {
    const tmpDir = makeTmpDir();
    const hxDir = path.join(tmpDir, ".hx");
    fs.mkdirSync(hxDir, { recursive: true });

    // Write a minimal DECISIONS.md so migration has content
    const decisionsContent = `# Decisions

  | # | When | Scope | Decision | Choice | Rationale | Revisable |
  |---|------|-------|----------|--------|-----------|-----------|
  | D001 | M001 | architecture | Use SQLite | SQLite | Sync API | Yes |
  `;
    fs.writeFileSync(path.join(hxDir, 'DECISIONS.md'), decisionsContent);

    // Verify no DB file exists yet
    const dbPath = path.join(hxDir, 'hx.db');
    assert.ok(!fs.existsSync(dbPath), 'DB file should not exist before ensureDbOpen');

    // Close any previously open DB
    try { closeDatabase(); } catch { /* ok */ }

    // Override process.cwd to point at tmpDir for ensureDbOpen
    const origCwd = process.cwd;
    process.cwd = () => tmpDir;

    try {
      // Dynamic import to get the freshest version
      const { ensureDbOpen } = await import('../bootstrap/dynamic-tools.ts');

      const result = await ensureDbOpen();

      assert.ok(result === true, 'ensureDbOpen should return true when .hx/ has Markdown');
      assert.ok(fs.existsSync(dbPath), 'DB file should be created after ensureDbOpen');
      assert.ok(isDbAvailable(), 'DB should be available after ensureDbOpen');

      // Verify that Markdown migration actually ran
      const decision = getDecisionById('D001');
      assert.ok(decision !== null, 'D001 should be migrated from DECISIONS.md');
      if (decision) {
        assert.deepStrictEqual(decision.scope, 'architecture', 'Migrated decision scope should match');
        assert.deepStrictEqual(decision.choice, 'SQLite', 'Migrated decision choice should match');
      }
    } finally {
      process.cwd = origCwd;
      closeDatabase();
      cleanupDir(tmpDir);
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ensureDbOpen returns false when no .hx/ exists
  // ═══════════════════════════════════════════════════════════════════════════

  test('ensureDbOpen: no .hx/ returns false', async () => {
    const tmpDir = makeTmpDir();
    // No .hx/ directory at all

    try { closeDatabase(); } catch { /* ok */ }
    const origCwd = process.cwd;
    process.cwd = () => tmpDir;

    try {
      const { ensureDbOpen } = await import('../bootstrap/dynamic-tools.ts');
      const result = await ensureDbOpen();
      assert.ok(result === false, 'ensureDbOpen should return false when no .hx/ exists');
      assert.ok(!isDbAvailable(), 'DB should not be available');
    } finally {
      process.cwd = origCwd;
      cleanupDir(tmpDir);
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ensureDbOpen opens existing DB without re-migration
  // ═══════════════════════════════════════════════════════════════════════════

  test('ensureDbOpen: opens existing DB', async () => {
    const tmpDir = makeTmpDir();
    const hxDir = path.join(tmpDir, ".hx");
    fs.mkdirSync(hxDir, { recursive: true });

    // Create a DB file first
    const dbPath = path.join(hxDir, 'hx.db');
    const { openDatabase } = await import('../hx-db.ts');
    openDatabase(dbPath);
    closeDatabase();

    assert.ok(fs.existsSync(dbPath), 'DB file should exist from manual create');

    const origCwd = process.cwd;
    process.cwd = () => tmpDir;

    try {
      const { ensureDbOpen } = await import('../bootstrap/dynamic-tools.ts');
      const result = await ensureDbOpen();
      assert.ok(result === true, 'ensureDbOpen should open existing DB');
      assert.ok(isDbAvailable(), 'DB should be available');
    } finally {
      process.cwd = origCwd;
      closeDatabase();
      cleanupDir(tmpDir);
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ensureDbOpen returns false for empty .hx/ (no Markdown, no DB)
  // ═══════════════════════════════════════════════════════════════════════════

  test('ensureDbOpen: empty .hx/ creates empty DB (#2510)', async () => {
    const tmpDir = makeTmpDir();
    const hxDir = path.join(tmpDir, ".hx");
    fs.mkdirSync(hxDir, { recursive: true });
    // .hx/ exists but no DECISIONS.md, REQUIREMENTS.md, or milestones/

    try { closeDatabase(); } catch { /* ok */ }
    const origCwd = process.cwd;
    process.cwd = () => tmpDir;

    try {
      const { ensureDbOpen } = await import('../bootstrap/dynamic-tools.ts');
      const result = await ensureDbOpen();
      assert.ok(result === true, 'ensureDbOpen should create empty DB for fresh .hx/');
      assert.ok(fs.existsSync(path.join(hxDir, 'hx.db')), 'DB file should be created');
      assert.ok(isDbAvailable(), 'DB should be available');
    } finally {
      process.cwd = origCwd;
      closeDatabase();
      cleanupDir(tmpDir);
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════

});
