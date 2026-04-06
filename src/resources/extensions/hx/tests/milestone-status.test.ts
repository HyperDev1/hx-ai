import { describe, test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  openDatabase,
  closeDatabase,
  insertMilestone,
  insertSlice,
  insertTask,
  updateMilestoneStatus,
  getActiveMilestoneIdFromDb,
  getMilestone,
  getMilestoneSlices,
  getSliceTasks,
  getSliceStatusSummary,
  getSliceTaskCounts,
} from '../hx-db.ts';

// ═══════════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════════

function seedMilestone(id: string, status = 'active', title = 'Test Milestone'): void {
  insertMilestone({ id, title, status });
}

function seedSlice(milestoneId: string, sliceId: string, status = 'pending', title = 'Test Slice'): void {
  insertSlice({ id: sliceId, milestoneId, title, status });
}

function seedTask(milestoneId: string, sliceId: string, taskId: string, status = 'pending', title = 'Test Task'): void {
  insertTask({ id: taskId, sliceId, milestoneId, title, status });
}

// ═══════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════

describe('hx_milestone_status DB functions', () => {
  beforeEach(() => {
    openDatabase(':memory:');
  });

  afterEach(() => {
    closeDatabase();
  });

  // ── Test 1: getActiveMilestoneIdFromDb returns null with empty DB ──────
  test('getActiveMilestoneIdFromDb returns null when no milestones exist', () => {
    const result = getActiveMilestoneIdFromDb();
    assert.equal(result, null);
  });

  // ── Test 2: getActiveMilestoneIdFromDb returns active milestone ────────
  test('getActiveMilestoneIdFromDb returns active milestone after inserting one', () => {
    seedMilestone('M001', 'active', 'First Milestone');
    const result = getActiveMilestoneIdFromDb();
    assert.notEqual(result, null);
    assert.equal(result!.id, 'M001');
    assert.equal(result!.status, 'active');
  });

  // ── Test 3: getMilestoneSlices returns slices for a milestone ──────────
  test('getMilestoneSlices returns slices for a milestone', () => {
    seedMilestone('M001');
    seedSlice('M001', 'S01', 'pending', 'Slice One');
    seedSlice('M001', 'S02', 'complete', 'Slice Two');

    const slices = getMilestoneSlices('M001');
    assert.equal(slices.length, 2);
    const ids = slices.map((s) => s.id);
    assert.ok(ids.includes('S01'));
    assert.ok(ids.includes('S02'));
  });

  // ── Test 4: getSliceTasks returns tasks for a milestone+slice ──────────
  test('getSliceTasks returns tasks for a milestone+slice', () => {
    seedMilestone('M001');
    seedSlice('M001', 'S01');
    seedTask('M001', 'S01', 'T01', 'pending', 'Task One');
    seedTask('M001', 'S01', 'T02', 'complete', 'Task Two');

    const tasks = getSliceTasks('M001', 'S01');
    assert.equal(tasks.length, 2);
    const ids = tasks.map((t) => t.id);
    assert.ok(ids.includes('T01'));
    assert.ok(ids.includes('T02'));
  });

  // ── Test 5: getSliceStatusSummary returns id+status array ─────────────
  test('getSliceStatusSummary returns id and status for each slice', () => {
    seedMilestone('M001');
    seedSlice('M001', 'S01', 'pending');
    seedSlice('M001', 'S02', 'complete');

    const summary = getSliceStatusSummary('M001');
    assert.equal(summary.length, 2);
    for (const item of summary) {
      assert.ok(typeof item.id === 'string');
      assert.ok(typeof item.status === 'string');
    }
  });

  // ── Test 6: getSliceTaskCounts returns total/done/pending ─────────────
  test('getSliceTaskCounts returns correct total/done/pending counts', () => {
    seedMilestone('M001');
    seedSlice('M001', 'S01');
    seedTask('M001', 'S01', 'T01', 'pending');
    seedTask('M001', 'S01', 'T02', 'complete');
    seedTask('M001', 'S01', 'T03', 'complete');

    const counts = getSliceTaskCounts('M001', 'S01');
    assert.equal(counts.total, 3);
    assert.equal(counts.done, 2);
    assert.equal(counts.pending, 1);
  });

  // ── Test 7: getMilestone returns null for unknown ID ───────────────────
  test('getMilestone returns null for unknown milestone ID', () => {
    const result = getMilestone('MXXX');
    assert.equal(result, null);
  });

  // ── Test 8: getActiveMilestoneIdFromDb returns null when milestone is complete
  test('getActiveMilestoneIdFromDb returns null when only milestone is complete', () => {
    seedMilestone('M001', 'complete');
    const result = getActiveMilestoneIdFromDb();
    assert.equal(result, null);
  });

  // ── Test 9: getSliceStatusSummary with mixed statuses ──────────────────
  test('getSliceStatusSummary correctly reports mixed statuses', () => {
    seedMilestone('M001');
    seedSlice('M001', 'S01', 'complete');
    seedSlice('M001', 'S02', 'active');
    seedSlice('M001', 'S03', 'pending');

    const summary = getSliceStatusSummary('M001');
    assert.equal(summary.length, 3);

    const byId = Object.fromEntries(summary.map((s) => [s.id, s.status]));
    assert.equal(byId['S01'], 'complete');
    assert.equal(byId['S02'], 'active');
    assert.equal(byId['S03'], 'pending');
  });

  // ── Test 10: getSliceTaskCounts with all-complete tasks ────────────────
  test('getSliceTaskCounts reports done=total when all tasks are complete', () => {
    seedMilestone('M001');
    seedSlice('M001', 'S01');
    seedTask('M001', 'S01', 'T01', 'complete');
    seedTask('M001', 'S01', 'T02', 'complete');

    const counts = getSliceTaskCounts('M001', 'S01');
    assert.equal(counts.total, 2);
    assert.equal(counts.done, 2);
    assert.equal(counts.pending, 0);
  });

  // ── Test 11: getSliceTasks with empty slice returns empty array ─────────
  test('getSliceTasks returns empty array for slice with no tasks', () => {
    seedMilestone('M001');
    seedSlice('M001', 'S01');

    const tasks = getSliceTasks('M001', 'S01');
    assert.deepEqual(tasks, []);
  });
});
