// Tests for status-guards (isDeferredStatus, isInactiveStatus) and
// extractDeferredSliceRef from db-writer.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isDeferredStatus, isInactiveStatus, isClosedStatus } from '../status-guards.js';
import { extractDeferredSliceRef } from '../db-writer.js';

// ─── isDeferredStatus ─────────────────────────────────────────────────────

test('isDeferredStatus: returns true for "deferred"', () => {
  assert.ok(isDeferredStatus('deferred'));
});

test('isDeferredStatus: returns false for "pending"', () => {
  assert.ok(!isDeferredStatus('pending'));
});

test('isDeferredStatus: returns false for "complete"', () => {
  assert.ok(!isDeferredStatus('complete'));
});

test('isDeferredStatus: returns false for "done"', () => {
  assert.ok(!isDeferredStatus('done'));
});

test('isDeferredStatus: returns false for empty string', () => {
  assert.ok(!isDeferredStatus(''));
});

// ─── isInactiveStatus ─────────────────────────────────────────────────────

test('isInactiveStatus: returns true for "complete"', () => {
  assert.ok(isInactiveStatus('complete'));
});

test('isInactiveStatus: returns true for "done"', () => {
  assert.ok(isInactiveStatus('done'));
});

test('isInactiveStatus: returns true for "deferred"', () => {
  assert.ok(isInactiveStatus('deferred'));
});

test('isInactiveStatus: returns false for "pending"', () => {
  assert.ok(!isInactiveStatus('pending'));
});

test('isInactiveStatus: returns false for "active"', () => {
  assert.ok(!isInactiveStatus('active'));
});

test('isInactiveStatus: returns false for empty string', () => {
  assert.ok(!isInactiveStatus(''));
});

test('isInactiveStatus covers all isClosedStatus cases', () => {
  for (const s of ['complete', 'done']) {
    assert.ok(isInactiveStatus(s), `isInactiveStatus should be true for "${s}"`);
    assert.ok(isClosedStatus(s), `isClosedStatus should be true for "${s}"`);
  }
});

// ─── extractDeferredSliceRef ──────────────────────────────────────────────

test('extractDeferredSliceRef: M/S slash pattern', () => {
  const result = extractDeferredSliceRef('Decision to defer M002/S03 to next milestone');
  assert.deepEqual(result, { milestoneId: 'M002', sliceId: 'S03' });
});

test('extractDeferredSliceRef: M with rand6/S slash pattern', () => {
  const result = extractDeferredSliceRef('deferring M003-ttxmyu/S06 due to scope');
  assert.deepEqual(result, { milestoneId: 'M003-ttxmyu', sliceId: 'S06' });
});

test('extractDeferredSliceRef: verb pattern "defer S03 from M002"', () => {
  const result = extractDeferredSliceRef('defer S03 from M002 until later');
  assert.deepEqual(result, { milestoneId: 'M002', sliceId: 'S03' });
});

test('extractDeferredSliceRef: verb pattern "deferring S01 in M001"', () => {
  const result = extractDeferredSliceRef('deferring S01 in M001 for now');
  assert.deepEqual(result, { milestoneId: 'M001', sliceId: 'S01' });
});

test('extractDeferredSliceRef: returns null when no slice ref found', () => {
  const result = extractDeferredSliceRef('This decision does not involve deferring anything');
  assert.strictEqual(result, null);
});

test('extractDeferredSliceRef: returns null for empty string', () => {
  assert.strictEqual(extractDeferredSliceRef(''), null);
});

test('extractDeferredSliceRef: returns null when only milestone, no slice', () => {
  const result = extractDeferredSliceRef('deferring M002 to next quarter');
  assert.strictEqual(result, null);
});
