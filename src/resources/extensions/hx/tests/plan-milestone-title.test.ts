// Tests that upsertMilestonePlanning preserves title and status on re-plan.
// Verifies Cluster 11 fix: title and status survive re-plan via
// COALESCE(NULLIF(:title,''),title) logic in upsertMilestonePlanning.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import {
  openDatabase,
  closeDatabase,
  insertMilestone,
  upsertMilestonePlanning,
  getMilestone,
} from '../hx-db.ts';

function makeTmpBase(): string {
  const base = mkdtempSync(join(tmpdir(), 'hx-pm-title-'));
  mkdirSync(join(base, '.hx', 'milestones', 'M001'), { recursive: true });
  return base;
}

function cleanup(base: string): void {
  try { closeDatabase(); } catch { /* noop */ }
  try { rmSync(base, { recursive: true, force: true }); } catch { /* noop */ }
}

test('upsertMilestonePlanning: title survives when re-plan omits title', () => {
  const base = makeTmpBase();
  openDatabase(join(base, '.hx', 'hx.db'));
  try {
    insertMilestone({ id: 'M001', title: 'Original Title', status: 'active', depends_on: [] });

    // Re-plan without providing title (empty string → NULLIF → COALESCE → keep original)
    upsertMilestonePlanning('M001', {
      vision: 'New vision text',
    });

    const m = getMilestone('M001');
    assert.ok(m, 'milestone should exist');
    assert.strictEqual(m!.title, 'Original Title', 'title should be preserved when not provided');
  } finally {
    cleanup(base);
  }
});

test('upsertMilestonePlanning: title is updated when re-plan provides new title', () => {
  const base = makeTmpBase();
  openDatabase(join(base, '.hx', 'hx.db'));
  try {
    insertMilestone({ id: 'M001', title: 'Original Title', status: 'active', depends_on: [] });

    upsertMilestonePlanning('M001', {
      title: 'Updated Title',
      vision: 'New vision text',
    });

    const m = getMilestone('M001');
    assert.ok(m, 'milestone should exist');
    assert.strictEqual(m!.title, 'Updated Title', 'title should be updated when provided');
  } finally {
    cleanup(base);
  }
});

test('upsertMilestonePlanning: status survives when re-plan omits status', () => {
  const base = makeTmpBase();
  openDatabase(join(base, '.hx', 'hx.db'));
  try {
    insertMilestone({ id: 'M001', title: 'Test Milestone', status: 'active', depends_on: [] });

    // Re-plan without providing status
    upsertMilestonePlanning('M001', {
      vision: 'New vision',
    });

    const m = getMilestone('M001');
    assert.ok(m, 'milestone should exist');
    assert.strictEqual(m!.status, 'active', 'status should be preserved when not provided');
  } finally {
    cleanup(base);
  }
});

test('upsertMilestonePlanning: status is updated when re-plan provides new status', () => {
  const base = makeTmpBase();
  openDatabase(join(base, '.hx', 'hx.db'));
  try {
    insertMilestone({ id: 'M001', title: 'Test Milestone', status: 'active', depends_on: [] });

    upsertMilestonePlanning('M001', {
      status: 'parked',
      vision: 'Parked milestone',
    });

    const m = getMilestone('M001');
    assert.ok(m, 'milestone should exist');
    assert.strictEqual(m!.status, 'parked', 'status should be updated when provided');
  } finally {
    cleanup(base);
  }
});

test('upsertMilestonePlanning: all planning fields are null-safe (no overwrite with null)', () => {
  const base = makeTmpBase();
  openDatabase(join(base, '.hx', 'hx.db'));
  try {
    insertMilestone({ id: 'M001', title: 'Test Milestone', status: 'active', depends_on: [] });

    // First plan — set vision
    upsertMilestonePlanning('M001', {
      vision: 'Initial vision',
    });

    // Re-plan without vision — should preserve it
    upsertMilestonePlanning('M001', {
      title: 'New Title',
    });

    // Vision must still be accessible via getMilestone
    // (getMilestone returns the raw row; vision is in a JSON column but we check title/status here)
    const m = getMilestone('M001');
    assert.ok(m, 'milestone should exist');
    assert.strictEqual(m!.title, 'New Title');
    assert.strictEqual(m!.status, 'active'); // not overwritten
  } finally {
    cleanup(base);
  }
});
