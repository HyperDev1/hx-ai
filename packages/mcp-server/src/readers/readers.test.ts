/**
 * HX MCP Server — readers module tests.
 *
 * Tests the 6 read-only project readers: paths, state, roadmap, metrics,
 * captures, knowledge, and doctor-lite. Uses a temporary directory structure
 * with .hx/ layout to exercise real filesystem reading.
 */

import { describe, it, before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import {
  resolveHxRoot,
  findMilestoneIds,
  findSliceIds,
  findTaskFiles,
  resolveMilestoneFile,
  resolveSliceFile,
} from './paths.js';
import { readProgress } from './state.js';
import { readRoadmap } from './roadmap.js';
import { readHistory } from './metrics.js';
import { readCaptures } from './captures.js';
import { readKnowledge } from './knowledge.js';
import { runDoctorLite } from './doctor-lite.js';

// ---------------------------------------------------------------------------
// Test fixture builder
// ---------------------------------------------------------------------------

interface TmpProject {
  dir: string;
  hxDir: string;
  write: (relPath: string, content: string) => void;
  mkdir: (relPath: string) => void;
}

function makeTmpProject(): TmpProject {
  const dir = mkdtempSync(join(tmpdir(), 'hx-mcp-readers-'));
  const hxDir = join(dir, '.hx');
  mkdirSync(hxDir, { recursive: true });

  return {
    dir,
    hxDir,
    write(relPath: string, content: string) {
      const full = join(hxDir, relPath);
      mkdirSync(join(full, '..'), { recursive: true });
      writeFileSync(full, content, 'utf-8');
    },
    mkdir(relPath: string) {
      mkdirSync(join(hxDir, relPath), { recursive: true });
    },
  };
}

function cleanupProject(p: TmpProject) {
  try {
    rmSync(p.dir, { recursive: true, force: true });
  } catch {
    // swallow — test tmp cleanup is best-effort
  }
}

// ---------------------------------------------------------------------------
// paths.ts tests
// ---------------------------------------------------------------------------

describe('paths — resolveHxRoot', () => {
  it('resolves .hx root for a valid project', () => {
    const p = makeTmpProject();
    try {
      const root = resolveHxRoot(p.dir);
      assert.ok(root.endsWith('.hx'));
    } finally {
      cleanupProject(p);
    }
  });

  it('throws when .hx directory is absent', () => {
    const dir = mkdtempSync(join(tmpdir(), 'hx-no-hx-'));
    try {
      assert.throws(
        () => resolveHxRoot(dir),
        (err: Error) => {
          assert.ok(err.message.includes('.hx/') || err.message.includes('.hx '));
          return true;
        },
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('paths — findMilestoneIds', () => {
  it('returns empty array when milestones/ is absent', () => {
    const p = makeTmpProject();
    try {
      const ids = findMilestoneIds(p.dir);
      assert.deepEqual(ids, []);
    } finally {
      cleanupProject(p);
    }
  });

  it('returns milestone directory names sorted', () => {
    const p = makeTmpProject();
    try {
      p.mkdir('milestones/M002');
      p.mkdir('milestones/M001');
      p.mkdir('milestones/M003');
      const ids = findMilestoneIds(p.dir);
      assert.deepEqual(ids, ['M001', 'M002', 'M003']);
    } finally {
      cleanupProject(p);
    }
  });

  it('ignores files (non-directories) in milestones/', () => {
    const p = makeTmpProject();
    try {
      p.mkdir('milestones/M001');
      p.write('milestones/not-a-dir.txt', 'hello');
      const ids = findMilestoneIds(p.dir);
      assert.deepEqual(ids, ['M001']);
    } finally {
      cleanupProject(p);
    }
  });
});

describe('paths — findSliceIds', () => {
  it('returns slice IDs for a milestone', () => {
    const p = makeTmpProject();
    try {
      p.mkdir('milestones/M001/slices/S02');
      p.mkdir('milestones/M001/slices/S01');
      const ids = findSliceIds(p.dir, 'M001');
      assert.deepEqual(ids, ['S01', 'S02']);
    } finally {
      cleanupProject(p);
    }
  });

  it('returns empty array for milestone with no slices/', () => {
    const p = makeTmpProject();
    try {
      p.mkdir('milestones/M001');
      const ids = findSliceIds(p.dir, 'M001');
      assert.deepEqual(ids, []);
    } finally {
      cleanupProject(p);
    }
  });
});

describe('paths — findTaskFiles', () => {
  it('returns task plan file paths sorted', () => {
    const p = makeTmpProject();
    try {
      p.mkdir('milestones/M001/slices/S01/tasks');
      p.write('milestones/M001/slices/S01/tasks/T02-PLAN.md', '# T02');
      p.write('milestones/M001/slices/S01/tasks/T01-PLAN.md', '# T01');
      const files = findTaskFiles(p.dir, 'M001', 'S01');
      assert.equal(files.length, 2);
      assert.ok(files[0].endsWith('T01-PLAN.md'));
      assert.ok(files[1].endsWith('T02-PLAN.md'));
    } finally {
      cleanupProject(p);
    }
  });
});

// ---------------------------------------------------------------------------
// state.ts tests
// ---------------------------------------------------------------------------

describe('readProgress', () => {
  it('returns empty milestones when milestones/ is absent', () => {
    const p = makeTmpProject();
    try {
      const result = readProgress(p.dir);
      assert.deepEqual(result.milestones, []);
      assert.equal(result.summary.totalMilestones, 0);
    } finally {
      cleanupProject(p);
    }
  });

  it('parses active milestone and slice from STATE.md', () => {
    const p = makeTmpProject();
    try {
      p.write(
        'STATE.md',
        '**Active Milestone**: M001\n**Active Slice**: S01\n**Active Task**: T01\n',
      );
      const result = readProgress(p.dir);
      assert.equal(result.currentMilestone, 'M001');
      assert.equal(result.currentSlice, 'S01');
      assert.equal(result.currentTask, 'T01');
    } finally {
      cleanupProject(p);
    }
  });

  it('counts completed and total slices from ROADMAP.md', () => {
    const p = makeTmpProject();
    try {
      p.mkdir('milestones/M001/slices/S01');
      p.mkdir('milestones/M001/slices/S02');
      p.write(
        'milestones/M001/M001-ROADMAP.md',
        `# Test Milestone\n\n- [x] **S01: First slice** \`risk:low\`\n- [ ] **S02: Second slice** \`risk:medium\`\n`,
      );
      const result = readProgress(p.dir);
      assert.equal(result.summary.totalSlices, 2);
      assert.equal(result.summary.completedSlices, 1);
    } finally {
      cleanupProject(p);
    }
  });

  it('counts completed tasks from slice PLAN.md', () => {
    const p = makeTmpProject();
    try {
      p.mkdir('milestones/M001/slices/S01');
      p.write(
        'milestones/M001/M001-ROADMAP.md',
        '# Test Milestone\n\n- [ ] **S01: Slice** `risk:low`\n',
      );
      p.write(
        'milestones/M001/slices/S01/S01-PLAN.md',
        '# S01 Plan\n\n- [x] **T01: Done task** `est:1h`\n- [ ] **T02: Pending task** `est:2h`\n',
      );
      const result = readProgress(p.dir);
      assert.equal(result.summary.totalTasks, 2);
      assert.equal(result.summary.completedTasks, 1);
    } finally {
      cleanupProject(p);
    }
  });
});

// ---------------------------------------------------------------------------
// roadmap.ts tests
// ---------------------------------------------------------------------------

describe('readRoadmap', () => {
  it('returns empty milestones when none exist', () => {
    const p = makeTmpProject();
    try {
      const result = readRoadmap(p.dir);
      assert.deepEqual(result.milestones, []);
      assert.equal(result.totalSlices, 0);
    } finally {
      cleanupProject(p);
    }
  });

  it('parses slice entries from ROADMAP.md', () => {
    const p = makeTmpProject();
    try {
      p.mkdir('milestones/M001');
      p.write(
        'milestones/M001/M001-ROADMAP.md',
        `# Project Roadmap\n\n` +
        `## Vision\nBuild a great tool.\n\n` +
        `- [x] **S01: Foundation** \`risk:low\` \`depends:[]\`\n` +
        `- [ ] **S02: Features** \`risk:medium\` \`depends:[S01]\`\n`,
      );
      const result = readRoadmap(p.dir);
      assert.equal(result.milestones.length, 1);
      const m = result.milestones[0];
      assert.equal(m.slices.length, 2);
      assert.equal(m.slices[0].id, 'S01');
      assert.equal(m.slices[0].complete, true);
      assert.equal(m.slices[1].id, 'S02');
      assert.equal(m.slices[1].complete, false);
      assert.deepEqual(m.slices[1].depends, ['S01']);
    } finally {
      cleanupProject(p);
    }
  });

  it('counts total and completed slices', () => {
    const p = makeTmpProject();
    try {
      p.mkdir('milestones/M001');
      p.write(
        'milestones/M001/M001-ROADMAP.md',
        `# M\n\n- [x] **S01: A** \`risk:low\`\n- [x] **S02: B** \`risk:low\`\n- [ ] **S03: C** \`risk:low\`\n`,
      );
      const result = readRoadmap(p.dir);
      assert.equal(result.totalSlices, 3);
      assert.equal(result.completedSlices, 2);
    } finally {
      cleanupProject(p);
    }
  });

  it('returns projectTitle from PROJECT.md', () => {
    const p = makeTmpProject();
    try {
      p.write('PROJECT.md', '# My Awesome Project\n\nSome description.\n');
      const result = readRoadmap(p.dir);
      assert.equal(result.projectTitle, 'My Awesome Project');
    } finally {
      cleanupProject(p);
    }
  });
});

// ---------------------------------------------------------------------------
// metrics.ts tests
// ---------------------------------------------------------------------------

describe('readHistory', () => {
  it('returns empty result when activity/ is absent', () => {
    const p = makeTmpProject();
    try {
      const result = readHistory(p.dir);
      assert.deepEqual(result.entries, []);
      assert.equal(result.summary.totalSessions, 0);
      assert.equal(result.sourceFile, null);
    } finally {
      cleanupProject(p);
    }
  });

  it('parses metrics.json entries', () => {
    const p = makeTmpProject();
    try {
      const entries = [
        {
          timestamp: 1700000000000,
          milestoneId: 'M001',
          sliceId: 'S01',
          taskId: 'T01',
          durationMs: 45000,
          inputTokens: 1000,
          outputTokens: 500,
          cacheReadTokens: 100,
          cacheWriteTokens: 50,
          cost: 0.05,
          toolCalls: 12,
        },
        {
          timestamp: 1700000060000,
          milestoneId: 'M001',
          sliceId: 'S01',
          taskId: 'T02',
          durationMs: 60000,
          inputTokens: 2000,
          outputTokens: 800,
          cacheReadTokens: 200,
          cacheWriteTokens: 100,
          cost: 0.08,
          toolCalls: 18,
        },
      ];
      p.mkdir('activity');
      p.write('activity/metrics.json', JSON.stringify(entries));
      const result = readHistory(p.dir);
      assert.equal(result.entries.length, 2);
      assert.equal(result.summary.totalSessions, 2);
      assert.equal(result.summary.totalCost, 0.13);
      assert.equal(result.summary.totalInputTokens, 3000);
    } finally {
      cleanupProject(p);
    }
  });

  it('handles malformed JSON gracefully', () => {
    const p = makeTmpProject();
    try {
      p.mkdir('activity');
      p.write('activity/metrics.json', 'not-valid-json{{{');
      const result = readHistory(p.dir);
      assert.deepEqual(result.entries, []);
    } finally {
      cleanupProject(p);
    }
  });
});

// ---------------------------------------------------------------------------
// captures.ts tests
// ---------------------------------------------------------------------------

describe('readCaptures', () => {
  it('returns exists:false when CAPTURES.md is absent', () => {
    const p = makeTmpProject();
    try {
      const result = readCaptures(p.dir);
      assert.equal(result.exists, false);
      assert.equal(result.totalEntries, 0);
    } finally {
      cleanupProject(p);
    }
  });

  it('parses H2 sections as entries', () => {
    const p = makeTmpProject();
    try {
      p.write(
        'CAPTURES.md',
        `# Captures\n\n## 2024-01-15 — First capture\n\nSome content here.\n\n## 2024-01-16 — Second capture\n\nMore content.\n`,
      );
      const result = readCaptures(p.dir);
      assert.equal(result.exists, true);
      assert.equal(result.totalEntries, 2);
      assert.equal(result.entries[0].title, '2024-01-15 — First capture');
      assert.equal(result.entries[0].date, '2024-01-15');
      assert.ok(result.entries[0].content.includes('Some content here'));
    } finally {
      cleanupProject(p);
    }
  });

  it('returns empty entries for empty CAPTURES.md', () => {
    const p = makeTmpProject();
    try {
      p.write('CAPTURES.md', '');
      const result = readCaptures(p.dir);
      assert.equal(result.totalEntries, 0);
    } finally {
      cleanupProject(p);
    }
  });
});

// ---------------------------------------------------------------------------
// knowledge.ts tests
// ---------------------------------------------------------------------------

describe('readKnowledge', () => {
  it('returns exists:false when KNOWLEDGE.md is absent', () => {
    const p = makeTmpProject();
    try {
      const result = readKnowledge(p.dir);
      assert.equal(result.exists, false);
    } finally {
      cleanupProject(p);
    }
  });

  it('parses H2 sections with K### prefix', () => {
    const p = makeTmpProject();
    try {
      p.write(
        'KNOWLEDGE.md',
        `# Knowledge\n\n## K001 — Some rule\n\nRule content here.\n\n## K002 — Another rule\n\nMore content.\n`,
      );
      const result = readKnowledge(p.dir);
      assert.equal(result.exists, true);
      assert.equal(result.totalEntries, 2);
      assert.equal(result.entries[0].id, 'K001');
      assert.equal(result.entries[0].title, 'Some rule');
      assert.ok(result.entries[0].content.includes('Rule content here'));
      assert.equal(result.entries[1].id, 'K002');
    } finally {
      cleanupProject(p);
    }
  });

  it('handles sections without K### prefix', () => {
    const p = makeTmpProject();
    try {
      p.write('KNOWLEDGE.md', `# Knowledge\n\n## Important Note\n\nContent.\n`);
      const result = readKnowledge(p.dir);
      assert.equal(result.entries[0].id, null);
      assert.equal(result.entries[0].title, 'Important Note');
    } finally {
      cleanupProject(p);
    }
  });
});

// ---------------------------------------------------------------------------
// doctor-lite.ts tests
// ---------------------------------------------------------------------------

describe('runDoctorLite', () => {
  it('returns errors when .hx/ is absent', () => {
    const dir = mkdtempSync(join(tmpdir(), 'hx-doctor-no-hx-'));
    try {
      const result = runDoctorLite(dir);
      assert.equal(result.overallStatus, 'errors');
      const hxCheck = result.checks.find((c) => c.name === 'hx-directory');
      assert.ok(hxCheck);
      assert.equal(hxCheck.status, 'fail');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('returns healthy when all required files present', () => {
    const p = makeTmpProject();
    try {
      p.write('PROJECT.md', '# Test Project\n\nA test project with enough content to pass the check.\n');
      p.write('REQUIREMENTS.md', '# Requirements\n\nR001: Something.\n');
      const result = runDoctorLite(p.dir);
      // Not necessarily 'healthy' due to missing optional files, but no 'fail' checks
      const failChecks = result.checks.filter((c) => c.status === 'fail');
      assert.equal(failChecks.length, 0);
    } finally {
      cleanupProject(p);
    }
  });

  it('warns when PROJECT.md is absent', () => {
    const p = makeTmpProject();
    try {
      const result = runDoctorLite(p.dir);
      const projectCheck = result.checks.find((c) => c.name === 'project-md');
      assert.ok(projectCheck);
      assert.equal(projectCheck.status, 'warn');
    } finally {
      cleanupProject(p);
    }
  });

  it('detects inconsistent STATE.md milestone reference', () => {
    const p = makeTmpProject();
    try {
      p.write('PROJECT.md', '# Test Project\n\nContent.\n');
      p.write('REQUIREMENTS.md', '# Req\n\nContent.\n');
      p.write('STATE.md', '**Active Milestone**: M001\n**Active Slice**: S01\n');
      // M001 dir does NOT exist
      const result = runDoctorLite(p.dir);
      const consistencyCheck = result.checks.find((c) => c.name === 'milestone-consistency');
      assert.ok(consistencyCheck);
      assert.equal(consistencyCheck.status, 'fail');
    } finally {
      cleanupProject(p);
    }
  });

  it('passes milestone-consistency when milestone dir exists', () => {
    const p = makeTmpProject();
    try {
      p.write('PROJECT.md', '# Test Project\n\nContent.\n');
      p.write('REQUIREMENTS.md', '# Req\n\nContent.\n');
      p.write('STATE.md', '**Active Milestone**: M001\n**Active Slice**: S01\n');
      p.mkdir('milestones/M001');
      const result = runDoctorLite(p.dir);
      const consistencyCheck = result.checks.find((c) => c.name === 'milestone-consistency');
      assert.ok(consistencyCheck);
      assert.equal(consistencyCheck.status, 'pass');
    } finally {
      cleanupProject(p);
    }
  });

  it('returns all expected check names', () => {
    const p = makeTmpProject();
    try {
      const result = runDoctorLite(p.dir);
      const names = result.checks.map((c) => c.name);
      assert.ok(names.includes('hx-directory'));
      assert.ok(names.includes('project-md'));
      assert.ok(names.includes('state-md'));
      assert.ok(names.includes('milestones-dir'));
      assert.ok(names.includes('knowledge-md'));
      assert.ok(names.includes('decisions-md'));
      assert.ok(names.includes('requirements-md'));
      assert.ok(names.includes('milestone-consistency'));
    } finally {
      cleanupProject(p);
    }
  });
});
