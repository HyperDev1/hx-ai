// Tests that handlePlanMilestone refuses to re-plan when any completed
// slices would be dropped from the new slice list (Cluster 11, #fea1b7431).

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import {
  openDatabase,
  closeDatabase,
  insertMilestone,
  insertSlice,
  updateSliceStatus,
} from '../hx-db.ts';
import { handlePlanMilestone } from '../tools/plan-milestone.ts';

function makeTmpBase(): string {
  const base = mkdtempSync(join(tmpdir(), 'hx-insert-slice-'));
  mkdirSync(join(base, '.hx', 'milestones', 'M001'), { recursive: true });
  // Stub ROADMAP.md so the renderer can find it
  writeFileSync(
    join(base, '.hx', 'milestones', 'M001', 'M001-ROADMAP.md'),
    '# M001: Test\n',
  );
  return base;
}

function cleanup(base: string): void {
  try { closeDatabase(); } catch { /* noop */ }
  try { rmSync(base, { recursive: true, force: true }); } catch { /* noop */ }
}

function validSlices(ids: string[]) {
  return ids.map((sid) => ({
    sliceId: sid,
    title: `Slice ${sid}`,
    risk: 'low',
    depends: [],
    demo: `Demo for ${sid}`,
    goal: `Goal for ${sid}`,
    successCriteria: `Success for ${sid}`,
    proofLevel: 'manual',
    integrationClosure: `Closure for ${sid}`,
    observabilityImpact: `Observability for ${sid}`,
  }));
}

function validPlanParams(sliceIds: string[]) {
  return {
    milestoneId: 'M001',
    title: 'Test Milestone',
    vision: 'Test vision.',
    successCriteria: ['Tests pass'],
    keyRisks: [{ risk: 'No risk', whyItMatters: 'Low impact' }],
    proofStrategy: [{ riskOrUnknown: 'nothing', retireIn: 'S01', whatWillBeProven: 'it works' }],
    verificationContract: 'contract',
    verificationIntegration: 'integration',
    verificationOperational: 'operational',
    verificationUat: 'uat',
    definitionOfDone: ['Done'],
    requirementCoverage: 'R001',
    boundaryMapMarkdown: '| From | To | Produces | Consumes |\n|------|----|----------|----------|\n| S01 | terminal | out | in |',
    slices: validSlices(sliceIds),
  };
}

test('handlePlanMilestone: initial plan with slices S01+S02 succeeds', async () => {
  const base = makeTmpBase();
  openDatabase(join(base, '.hx', 'hx.db'));
  try {
    const result = await handlePlanMilestone(validPlanParams(['S01', 'S02']), base);
    assert.ok(!('error' in result), `Unexpected error: ${'error' in result ? (result as any).error : ''}`);
    assert.strictEqual((result as any).milestoneId, 'M001');
  } finally {
    cleanup(base);
  }
});

test('handlePlanMilestone: re-plan that drops a completed slice returns error', async () => {
  const base = makeTmpBase();
  openDatabase(join(base, '.hx', 'hx.db'));
  try {
    // Initial plan with S01 + S02
    await handlePlanMilestone(validPlanParams(['S01', 'S02']), base);

    // Mark S01 as complete
    updateSliceStatus('M001', 'S01', 'complete');

    // Re-plan with only S02 (S01 would be dropped — should be rejected)
    const result = await handlePlanMilestone(validPlanParams(['S02']), base);
    assert.ok('error' in result, 'Expected an error when dropping completed S01');
    assert.ok(
      (result as any).error.includes('S01'),
      `Error should mention S01, got: ${(result as any).error}`,
    );
  } finally {
    cleanup(base);
  }
});

test('handlePlanMilestone: re-plan that keeps all completed slices succeeds', async () => {
  const base = makeTmpBase();
  openDatabase(join(base, '.hx', 'hx.db'));
  try {
    // Initial plan
    await handlePlanMilestone(validPlanParams(['S01', 'S02']), base);

    // Mark S01 complete
    updateSliceStatus('M001', 'S01', 'complete');

    // Re-plan keeping S01 + S02 + adding S03 — should succeed
    const result = await handlePlanMilestone(validPlanParams(['S01', 'S02', 'S03']), base);
    assert.ok(!('error' in result), `Unexpected error: ${'error' in result ? (result as any).error : ''}`);
  } finally {
    cleanup(base);
  }
});

test('handlePlanMilestone: re-plan when no completed slices exist is always allowed', async () => {
  const base = makeTmpBase();
  openDatabase(join(base, '.hx', 'hx.db'));
  try {
    // Initial plan
    await handlePlanMilestone(validPlanParams(['S01', 'S02']), base);

    // Re-plan with different slices — S01+S02 are pending, so dropping them is fine
    const result = await handlePlanMilestone(validPlanParams(['S03', 'S04']), base);
    assert.ok(!('error' in result), `Unexpected error: ${'error' in result ? (result as any).error : ''}`);
  } finally {
    cleanup(base);
  }
});

test('handlePlanMilestone: re-plan that drops only "done" slice (alias) also returns error', async () => {
  const base = makeTmpBase();
  openDatabase(join(base, '.hx', 'hx.db'));
  try {
    await handlePlanMilestone(validPlanParams(['S01', 'S02']), base);

    // Use legacy "done" status alias
    updateSliceStatus('M001', 'S01', 'done');

    const result = await handlePlanMilestone(validPlanParams(['S02']), base);
    assert.ok('error' in result, 'Expected error when dropping a "done" slice');
    assert.ok((result as any).error.includes('S01'));
  } finally {
    cleanup(base);
  }
});
