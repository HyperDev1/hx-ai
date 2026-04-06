/**
 * Unit tests for KNOWLEDGE.md integration.
 *
 * Tests:
 * - KNOWLEDGE is registered in HX_ROOT_FILES
 * - resolveHxRootFile resolves KNOWLEDGE paths correctly
 * - inlineHxRootFile works with the KNOWLEDGE key
 * - before_agent_start hook includes/omits knowledge block appropriately
 * - loadKnowledgeBlock merges global and project knowledge correctly
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { HX_ROOT_FILES, resolveHxRootFile } from '../paths.ts';
import { inlineHxRootFile } from '../auto-prompts.ts';
import { appendKnowledge } from '../files.ts';
import { loadKnowledgeBlock } from '../bootstrap/system-context.ts';

// ─── KNOWLEDGE is registered in HX_ROOT_FILES ─────────────────────────────

test('knowledge: KNOWLEDGE key exists in HX_ROOT_FILES', () => {
  assert.ok('KNOWLEDGE' in HX_ROOT_FILES, 'HX_ROOT_FILES should have KNOWLEDGE key');
  assert.strictEqual(HX_ROOT_FILES.KNOWLEDGE, 'KNOWLEDGE.md');
});

// ─── resolveHxRootFile resolves KNOWLEDGE.md ───────────────────────────────

test('knowledge: resolveHxRootFile returns canonical path when KNOWLEDGE.md exists', () => {
  const tmp = realpathSync(mkdtempSync(join(tmpdir(), 'hx-knowledge-')));
  const hxDir = join(tmp, '.hx');
  mkdirSync(hxDir, { recursive: true });
  writeFileSync(join(hxDir, 'KNOWLEDGE.md'), '# Project Knowledge\n');

  const resolved = resolveHxRootFile(tmp, 'KNOWLEDGE');
  assert.strictEqual(resolved, join(hxDir, 'KNOWLEDGE.md'));

  rmSync(tmp, { recursive: true, force: true });
});

test('knowledge: resolveHxRootFile resolves when legacy knowledge.md exists', () => {
  const tmp = realpathSync(mkdtempSync(join(tmpdir(), 'hx-knowledge-')));
  const hxDir = join(tmp, '.hx');
  mkdirSync(hxDir, { recursive: true });
  writeFileSync(join(hxDir, 'knowledge.md'), '# Project Knowledge\n');

  const resolved = resolveHxRootFile(tmp, 'KNOWLEDGE');
  // On case-insensitive filesystems (macOS), canonical path matches;
  // on case-sensitive (Linux), legacy path matches. Either is valid.
  const canonical = join(hxDir, 'KNOWLEDGE.md');
  const legacy = join(hxDir, 'knowledge.md');
  assert.ok(
    resolved === canonical || resolved === legacy,
    `resolved path should be canonical or legacy, got: ${resolved}`,
  );

  rmSync(tmp, { recursive: true, force: true });
});

test('knowledge: resolveHxRootFile returns canonical path when file does not exist', () => {
  const tmp = realpathSync(mkdtempSync(join(tmpdir(), 'hx-knowledge-')));
  const hxDir = join(tmp, '.hx');
  mkdirSync(hxDir, { recursive: true });

  const resolved = resolveHxRootFile(tmp, 'KNOWLEDGE');
  assert.strictEqual(resolved, join(hxDir, 'KNOWLEDGE.md'));

  rmSync(tmp, { recursive: true, force: true });
});

// ─── inlineHxRootFile works with knowledge.md ─────────────────────────────

test('knowledge: inlineHxRootFile returns content when KNOWLEDGE.md exists', async () => {
  const tmp = mkdtempSync(join(tmpdir(), 'hx-knowledge-'));
  const hxDir = join(tmp, '.hx');
  mkdirSync(hxDir, { recursive: true });
  writeFileSync(join(hxDir, 'KNOWLEDGE.md'), '# Project Knowledge\n\n## Rules\n\nK001: Use real DB');

  const result = await inlineHxRootFile(tmp, 'knowledge.md', 'Project Knowledge');
  assert.ok(result !== null, 'should return content');
  assert.ok(result!.includes('Project Knowledge'), 'should include label');
  assert.ok(result!.includes('K001'), 'should include knowledge content');

  rmSync(tmp, { recursive: true, force: true });
});

test('knowledge: inlineHxRootFile returns null when KNOWLEDGE.md does not exist', async () => {
  const tmp = mkdtempSync(join(tmpdir(), 'hx-knowledge-'));
  const hxDir = join(tmp, '.hx');
  mkdirSync(hxDir, { recursive: true });

  const result = await inlineHxRootFile(tmp, 'knowledge.md', 'Project Knowledge');
  assert.strictEqual(result, null, 'should return null when file does not exist');

  rmSync(tmp, { recursive: true, force: true });
});

// ─── appendKnowledge creates file and appends entries ──────────────────────

test('knowledge: appendKnowledge creates KNOWLEDGE.md with rule when file does not exist', async () => {
  const tmp = mkdtempSync(join(tmpdir(), 'hx-knowledge-'));
  const hxDir = join(tmp, '.hx');
  mkdirSync(hxDir, { recursive: true });

  await appendKnowledge(tmp, 'rule', 'Use real DB for integration tests', 'M001/S01');

  const content = readFileSync(join(hxDir, 'KNOWLEDGE.md'), 'utf-8');
  assert.ok(content.includes('# Project Knowledge'), 'should have header');
  assert.ok(content.includes('K001'), 'should have K001 id');
  assert.ok(content.includes('Use real DB for integration tests'), 'should have rule text');
  assert.ok(content.includes('M001/S01'), 'should have scope');

  rmSync(tmp, { recursive: true, force: true });
});

test('knowledge: appendKnowledge appends to existing KNOWLEDGE.md with auto-incrementing ID', async () => {
  const tmp = mkdtempSync(join(tmpdir(), 'hx-knowledge-'));
  const hxDir = join(tmp, '.hx');
  mkdirSync(hxDir, { recursive: true });

  // Create initial file with one rule
  await appendKnowledge(tmp, 'rule', 'First rule', 'M001');
  // Add second rule
  await appendKnowledge(tmp, 'rule', 'Second rule', 'M001/S02');

  const content = readFileSync(join(hxDir, 'KNOWLEDGE.md'), 'utf-8');
  assert.ok(content.includes('K001'), 'should have K001');
  assert.ok(content.includes('K002'), 'should have K002');
  assert.ok(content.includes('First rule'), 'should have first rule');
  assert.ok(content.includes('Second rule'), 'should have second rule');

  rmSync(tmp, { recursive: true, force: true });
});

test('knowledge: appendKnowledge handles pattern type', async () => {
  const tmp = mkdtempSync(join(tmpdir(), 'hx-knowledge-'));
  const hxDir = join(tmp, '.hx');
  mkdirSync(hxDir, { recursive: true });

  await appendKnowledge(tmp, 'pattern', 'Middleware chain for auth', 'M001');

  const content = readFileSync(join(hxDir, 'KNOWLEDGE.md'), 'utf-8');
  assert.ok(content.includes('P001'), 'should have P001 id');
  assert.ok(content.includes('Middleware chain for auth'), 'should have pattern text');

  rmSync(tmp, { recursive: true, force: true });
});

test('knowledge: appendKnowledge handles lesson type', async () => {
  const tmp = mkdtempSync(join(tmpdir(), 'hx-knowledge-'));
  const hxDir = join(tmp, '.hx');
  mkdirSync(hxDir, { recursive: true });

  await appendKnowledge(tmp, 'lesson', 'API timeout on large payloads', 'M002');

  const content = readFileSync(join(hxDir, 'KNOWLEDGE.md'), 'utf-8');
  assert.ok(content.includes('L001'), 'should have L001 id');
  assert.ok(content.includes('API timeout on large payloads'), 'should have lesson text');

  rmSync(tmp, { recursive: true, force: true });
});

// ─── loadKnowledgeBlock — global + project merge ────────────────────────────

test('loadKnowledgeBlock: returns empty block when neither file exists', () => {
  const tmp = realpathSync(mkdtempSync(join(tmpdir(), 'hx-kb-')));
  const hxHome = join(tmp, 'home');
  const cwd = join(tmp, 'project');
  mkdirSync(join(cwd, '.hx'), { recursive: true });
  mkdirSync(join(hxHome, 'agent'), { recursive: true });

  const result = loadKnowledgeBlock(hxHome, cwd);
  assert.strictEqual(result.block, '');
  assert.strictEqual(result.globalSizeKb, 0);

  rmSync(tmp, { recursive: true, force: true });
});

test('loadKnowledgeBlock: uses project knowledge alone when no global file', () => {
  const tmp = realpathSync(mkdtempSync(join(tmpdir(), 'hx-kb-')));
  const hxHome = join(tmp, 'home');
  const cwd = join(tmp, 'project');
  mkdirSync(join(cwd, '.hx'), { recursive: true });
  mkdirSync(join(hxHome, 'agent'), { recursive: true });
  writeFileSync(join(cwd, '.hx', 'KNOWLEDGE.md'), 'K001: Use real DB');

  const result = loadKnowledgeBlock(hxHome, cwd);
  assert.ok(result.block.includes('[KNOWLEDGE — Rules, patterns, and lessons learned]'));
  assert.ok(result.block.includes('## Project Knowledge'));
  assert.ok(result.block.includes('K001: Use real DB'));
  assert.ok(!result.block.includes('## Global Knowledge'));
  assert.strictEqual(result.globalSizeKb, 0);

  rmSync(tmp, { recursive: true, force: true });
});

test('loadKnowledgeBlock: uses global knowledge alone when no project file', () => {
  const tmp = realpathSync(mkdtempSync(join(tmpdir(), 'hx-kb-')));
  const hxHome = join(tmp, 'home');
  const cwd = join(tmp, 'project');
  mkdirSync(join(cwd, '.hx'), { recursive: true });
  mkdirSync(join(hxHome, 'agent'), { recursive: true });
  writeFileSync(join(hxHome, 'agent', 'KNOWLEDGE.md'), 'G001: Respond in English');

  const result = loadKnowledgeBlock(hxHome, cwd);
  assert.ok(result.block.includes('[KNOWLEDGE — Rules, patterns, and lessons learned]'));
  assert.ok(result.block.includes('## Global Knowledge'));
  assert.ok(result.block.includes('G001: Respond in English'));
  assert.ok(!result.block.includes('## Project Knowledge'));
  assert.ok(result.globalSizeKb > 0);

  rmSync(tmp, { recursive: true, force: true });
});

test('loadKnowledgeBlock: merges global before project when both exist', () => {
  const tmp = realpathSync(mkdtempSync(join(tmpdir(), 'hx-kb-')));
  const hxHome = join(tmp, 'home');
  const cwd = join(tmp, 'project');
  mkdirSync(join(cwd, '.hx'), { recursive: true });
  mkdirSync(join(hxHome, 'agent'), { recursive: true });
  writeFileSync(join(hxHome, 'agent', 'KNOWLEDGE.md'), 'G001: Global rule');
  writeFileSync(join(cwd, '.hx', 'KNOWLEDGE.md'), 'K001: Project rule');

  const result = loadKnowledgeBlock(hxHome, cwd);
  assert.ok(result.block.includes('## Global Knowledge'));
  assert.ok(result.block.includes('## Project Knowledge'));
  assert.ok(result.block.includes('G001: Global rule'));
  assert.ok(result.block.includes('K001: Project rule'));
  // Global section appears before project section
  assert.ok(result.block.indexOf('## Global Knowledge') < result.block.indexOf('## Project Knowledge'));

  rmSync(tmp, { recursive: true, force: true });
});

test('loadKnowledgeBlock: reports globalSizeKb above 4KB threshold', () => {
  const tmp = realpathSync(mkdtempSync(join(tmpdir(), 'hx-kb-')));
  const hxHome = join(tmp, 'home');
  const cwd = join(tmp, 'project');
  mkdirSync(join(cwd, '.hx'), { recursive: true });
  mkdirSync(join(hxHome, 'agent'), { recursive: true });
  // Write > 4KB of content
  writeFileSync(join(hxHome, 'agent', 'KNOWLEDGE.md'), 'x'.repeat(5000));

  const result = loadKnowledgeBlock(hxHome, cwd);
  assert.ok(result.globalSizeKb > 4, `expected > 4KB, got ${result.globalSizeKb}`);

  rmSync(tmp, { recursive: true, force: true });
});
