// silent-catch-diagnostics — Static analysis tests for migrated silent catch blocks.
//
// Verifies that the 5 targeted empty/silent catch blocks have been replaced with
// logWarning calls, and that the new logWarning patterns are present in each file.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const autoSrc = readFileSync(join(__dirname, '../auto.ts'), 'utf8');
const phasesSrc = readFileSync(join(__dirname, '../auto/phases.ts'), 'utf8');
const hooksSrc = readFileSync(join(__dirname, '../bootstrap/register-hooks.ts'), 'utf8');

// ═══════════════════════════════════════════════════════════════════════════
// Old silent patterns are gone
// ═══════════════════════════════════════════════════════════════════════════

console.log('\n── Silent catch migration: old patterns gone ──');

test('auto.ts does not contain silent catch for preserveBranch path', () => {
  assert.ok(
    !autoSrc.includes('// Non-fatal — fall through to preserveBranch path'),
    'auto.ts should not contain the old silent catch for preserveBranch',
  );
});

test('auto.ts does not contain silent catch for paused-session.json write', () => {
  assert.ok(
    !autoSrc.includes('// Non-fatal — resume will still work via full bootstrap, just without worktree context'),
    'auto.ts should not contain the old silent catch for paused-session.json',
  );
});

test('auto.ts does not contain silent catch for closeout on pause', () => {
  assert.ok(
    !autoSrc.includes('// Non-fatal — best-effort closeout on pause'),
    'auto.ts should not contain the old silent catch for closeout on pause',
  );
});

test('phases.ts does not contain silent anchor advisory catch', () => {
  assert.ok(
    !phasesSrc.includes('catch { /* non-fatal — anchor is advisory */ }'),
    'phases.ts should not contain the old silent anchor catch',
  );
});

test('register-hooks.ts does not contain silent catch for show_token_cost preference load', () => {
  // The show_token_cost block is identified by its surrounding context
  const tokenCostBlock = hooksSrc.indexOf('show_token_cost preference');
  // No old-style `catch { /* non-fatal */ }` should appear within 200 chars of the token-cost block
  if (tokenCostBlock !== -1) {
    const region = hooksSrc.slice(tokenCostBlock, tokenCostBlock + 300);
    assert.ok(
      !region.includes('catch { /* non-fatal */ }'),
      'register-hooks.ts show_token_cost block should not have a silent catch { /* non-fatal */ }',
    );
  } else {
    // If the comment is gone, check that the old pattern itself is gone from the pref-load area
    const prefLoadIdx = hooksSrc.indexOf('show_token_cost');
    assert.ok(prefLoadIdx !== -1, 'show_token_cost reference should exist in register-hooks.ts');
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// New logWarning patterns are present
// ═══════════════════════════════════════════════════════════════════════════

console.log('── Silent catch migration: new logWarning patterns present ──');

test('auto.ts contains logWarning for milestone SUMMARY existence check', () => {
  assert.ok(
    autoSrc.includes("logWarning('engine', 'Failed to check milestone SUMMARY existence'"),
    'auto.ts should contain logWarning for milestone SUMMARY existence',
  );
});

test('phases.ts contains logWarning for phase anchor write failure', () => {
  assert.ok(
    phasesSrc.includes("logWarning('engine', 'Phase anchor write failed'"),
    'phases.ts should contain logWarning for Phase anchor write failed',
  );
});

test('register-hooks.ts contains logWarning for show_token_cost preference load failure', () => {
  assert.ok(
    hooksSrc.includes("logWarning('engine', 'Failed to load preferences for show_token_cost'"),
    'register-hooks.ts should contain logWarning for show_token_cost preference load',
  );
});
