// auto-wrapup-inflight-guard — Tests for the auto-wrapup inflight state guard.
//
// Verifies that the guard correctly tracks whether a wrapup message has been
// sent and the triggered turn is still inflight, and that all reset paths work.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  setWrapupInflight,
  clearWrapupInflight,
  isWrapupInflight,
  resetWrapupGuard,
} from '../bootstrap/auto-wrapup-guard.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ═══════════════════════════════════════════════════════════════════════════
// Initial state
// ═══════════════════════════════════════════════════════════════════════════

console.log('\n── Wrapup guard: initial state ──');

test('isWrapupInflight() returns false initially', () => {
  resetWrapupGuard();
  assert.strictEqual(isWrapupInflight(), false);
});

// ═══════════════════════════════════════════════════════════════════════════
// setWrapupInflight
// ═══════════════════════════════════════════════════════════════════════════

console.log('── Wrapup guard: setWrapupInflight ──');

test('isWrapupInflight() returns true after setWrapupInflight()', () => {
  resetWrapupGuard();
  setWrapupInflight();
  assert.strictEqual(isWrapupInflight(), true);
});

// ═══════════════════════════════════════════════════════════════════════════
// clearWrapupInflight
// ═══════════════════════════════════════════════════════════════════════════

console.log('── Wrapup guard: clearWrapupInflight ──');

test('isWrapupInflight() returns false after setWrapupInflight() then clearWrapupInflight()', () => {
  resetWrapupGuard();
  setWrapupInflight();
  assert.strictEqual(isWrapupInflight(), true, 'should be true before clear');
  clearWrapupInflight();
  assert.strictEqual(isWrapupInflight(), false, 'should be false after clear');
});

// ═══════════════════════════════════════════════════════════════════════════
// resetWrapupGuard
// ═══════════════════════════════════════════════════════════════════════════

console.log('── Wrapup guard: resetWrapupGuard ──');

test('resetWrapupGuard() clears inflight state after setWrapupInflight()', () => {
  resetWrapupGuard();
  setWrapupInflight();
  assert.strictEqual(isWrapupInflight(), true, 'should be true before reset');
  resetWrapupGuard();
  assert.strictEqual(isWrapupInflight(), false, 'should be false after reset');
});

// ═══════════════════════════════════════════════════════════════════════════
// Static wiring checks
// ═══════════════════════════════════════════════════════════════════════════

console.log('── Wrapup guard: static source wiring checks ──');

test('auto-timers.ts calls setWrapupInflight() before hx-auto-wrapup sendMessage', () => {
  const src = readFileSync(join(__dirname, '../auto-timers.ts'), 'utf8');
  assert.ok(
    src.includes('setWrapupInflight()'),
    'auto-timers.ts should call setWrapupInflight()',
  );
  // Verify it appears before the customType: 'hx-auto-wrapup' line in at least one block
  const wrapupIdx = src.indexOf("customType: \"hx-auto-wrapup\"");
  const setInflightIdx = src.lastIndexOf('setWrapupInflight()', wrapupIdx);
  assert.ok(
    setInflightIdx !== -1,
    'setWrapupInflight() should appear before the first hx-auto-wrapup sendMessage',
  );
});

test('auto.ts calls clearWrapupInflight() inside clearUnitTimeout()', () => {
  const src = readFileSync(join(__dirname, '../auto.ts'), 'utf8');
  assert.ok(
    src.includes('clearWrapupInflight()'),
    'auto.ts should call clearWrapupInflight()',
  );
  // Verify clearWrapupInflight() appears within the clearUnitTimeout function body
  const fnStart = src.indexOf('function clearUnitTimeout()');
  assert.ok(fnStart !== -1, 'clearUnitTimeout function should exist in auto.ts');
  // Find the closing brace of clearUnitTimeout by scanning for clearWrapupInflight in that region
  const regionEnd = src.indexOf('\nfunction ', fnStart + 1);
  const fnBody = src.slice(fnStart, regionEnd === -1 ? fnStart + 2000 : regionEnd);
  assert.ok(
    fnBody.includes('clearWrapupInflight()'),
    'clearWrapupInflight() should be inside clearUnitTimeout()',
  );
});
