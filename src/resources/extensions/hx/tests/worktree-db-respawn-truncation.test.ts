// Tests that syncProjectRootToWorktree deletes hx.db-wal and hx.db-shm
// companion files alongside hx.db, preventing orphaned WAL state on next open.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, existsSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { syncProjectRootToWorktree } from '../auto-worktree.js';

function makeDir(): string {
  return mkdtempSync(join(tmpdir(), 'hx-wt-db-test-'));
}

test('syncProjectRootToWorktree: deletes hx.db-wal and hx.db-shm when hx.db exists', () => {
  const projectRoot = makeDir();
  const wtPath = makeDir();

  const milestoneId = 'M001';

  // Set up .hx dirs
  const prHx = join(projectRoot, '.hx');
  const wtHx = join(wtPath, '.hx');
  mkdirSync(prHx, { recursive: true });
  mkdirSync(join(prHx, 'milestones', milestoneId), { recursive: true });
  mkdirSync(wtHx, { recursive: true });

  // Create hx.db and companion WAL/SHM files in the worktree
  const wtDb = join(wtHx, 'hx.db');
  const wtDbWal = join(wtHx, 'hx.db-wal');
  const wtDbShm = join(wtHx, 'hx.db-shm');
  writeFileSync(wtDb, 'mock-db-content');
  writeFileSync(wtDbWal, 'mock-wal-content');
  writeFileSync(wtDbShm, 'mock-shm-content');

  assert.ok(existsSync(wtDb), 'hx.db should exist before sync');
  assert.ok(existsSync(wtDbWal), 'hx.db-wal should exist before sync');
  assert.ok(existsSync(wtDbShm), 'hx.db-shm should exist before sync');

  // Run the sync — should delete all three
  syncProjectRootToWorktree(projectRoot, wtPath, milestoneId);

  assert.ok(!existsSync(wtDb), 'hx.db should be deleted after sync');
  assert.ok(!existsSync(wtDbWal), 'hx.db-wal should be deleted after sync');
  assert.ok(!existsSync(wtDbShm), 'hx.db-shm should be deleted after sync');
});

test('syncProjectRootToWorktree: deletes hx.db-wal and hx.db-shm when hx.db is absent', () => {
  const projectRoot = makeDir();
  const wtPath = makeDir();

  const milestoneId = 'M001';

  const prHx = join(projectRoot, '.hx');
  const wtHx = join(wtPath, '.hx');
  mkdirSync(prHx, { recursive: true });
  mkdirSync(join(prHx, 'milestones', milestoneId), { recursive: true });
  mkdirSync(wtHx, { recursive: true });

  // Create only WAL/SHM — no main hx.db
  const wtDb = join(wtHx, 'hx.db');
  const wtDbWal = join(wtHx, 'hx.db-wal');
  const wtDbShm = join(wtHx, 'hx.db-shm');
  writeFileSync(wtDbWal, 'mock-wal-content');
  writeFileSync(wtDbShm, 'mock-shm-content');

  assert.ok(!existsSync(wtDb), 'hx.db should not exist');
  assert.ok(existsSync(wtDbWal), 'hx.db-wal should exist before sync');
  assert.ok(existsSync(wtDbShm), 'hx.db-shm should exist before sync');

  syncProjectRootToWorktree(projectRoot, wtPath, milestoneId);

  assert.ok(!existsSync(wtDbWal), 'hx.db-wal should be deleted even without hx.db');
  assert.ok(!existsSync(wtDbShm), 'hx.db-shm should be deleted even without hx.db');
});

test('syncProjectRootToWorktree: no-op when no db files present', () => {
  const projectRoot = makeDir();
  const wtPath = makeDir();

  const milestoneId = 'M001';

  const prHx = join(projectRoot, '.hx');
  const wtHx = join(wtPath, '.hx');
  mkdirSync(prHx, { recursive: true });
  mkdirSync(join(prHx, 'milestones', milestoneId), { recursive: true });
  mkdirSync(wtHx, { recursive: true });

  // No db files — should not throw
  assert.doesNotThrow(() => {
    syncProjectRootToWorktree(projectRoot, wtPath, milestoneId);
  });
});
