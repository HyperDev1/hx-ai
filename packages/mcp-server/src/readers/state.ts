/**
 * HX MCP Server — read project execution progress.
 *
 * Reads STATE.md, milestone ROADMAP.md files, and slice PLAN.md files
 * to build a structured progress snapshot.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  findMilestoneIds,
  findSliceIds,
  resolveMilestoneFile,
  resolveRootFile,
  resolveSliceFile,
} from './paths.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TaskProgress {
  id: string;
  title: string;
  status: 'pending' | 'complete';
}

export interface SliceProgress {
  id: string;
  title: string;
  status: 'pending' | 'active' | 'complete';
  tasks: TaskProgress[];
}

export interface MilestoneProgress {
  id: string;
  title: string;
  status: 'pending' | 'active' | 'complete';
  slices: SliceProgress[];
}

export interface ProgressResult {
  stateRaw: string | null;
  currentMilestone: string | null;
  currentSlice: string | null;
  currentTask: string | null;
  milestones: MilestoneProgress[];
  summary: {
    totalMilestones: number;
    completedMilestones: number;
    totalSlices: number;
    completedSlices: number;
    totalTasks: number;
    completedTasks: number;
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readFileSafe(path: string): string | null {
  try {
    return readFileSync(path, 'utf-8');
  } catch {
    return null;
  }
}

/** Extract the first H1 heading from a markdown file. */
function extractTitle(markdown: string): string {
  const m = markdown.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : '';
}

/** Check if a roadmap or plan checkbox is ticked: `[x]`. */
function isChecked(line: string): boolean {
  return /^\s*-\s*\[x\]/i.test(line);
}

/**
 * Parse slice status from a ROADMAP.md entry.
 * Lines look like: `- [x] **S01: Title** ...`
 */
function parseRoadmapSliceStatus(line: string): { id: string; title: string; status: 'pending' | 'complete' } | null {
  const m = line.match(/^\s*-\s*\[([ x])\]\s*\*\*(\w+):\s*(.+?)\*\*/i);
  if (!m) return null;
  return {
    id: m[2],
    title: m[3].trim(),
    status: m[1].toLowerCase() === 'x' ? 'complete' : 'pending',
  };
}

/**
 * Parse task status from a PLAN.md entry.
 * Lines look like: `- [x] **T01: Title** ...`
 */
function parsePlanTaskStatus(line: string): { id: string; title: string; status: 'pending' | 'complete' } | null {
  const m = line.match(/^\s*-\s*\[([ x])\]\s*\*\*(\w+):\s*(.+?)\*\*/i);
  if (!m) return null;
  return {
    id: m[2],
    title: m[3].trim(),
    status: m[1].toLowerCase() === 'x' ? 'complete' : 'pending',
  };
}

/** Extract current unit IDs from STATE.md text using simple regex. */
function parseStateFile(raw: string): { milestone: string | null; slice: string | null; task: string | null } {
  const milestoneMatch = raw.match(/\*\*Active Milestone\*\*[:\s]+([A-Z0-9-]+)/i) ??
    raw.match(/milestone[:\s]+([A-Z0-9-]+)/i);
  const sliceMatch = raw.match(/\*\*Active Slice\*\*[:\s]+([A-Z0-9-]+)/i) ??
    raw.match(/slice[:\s]+([A-Z0-9-]+)/i);
  const taskMatch = raw.match(/\*\*Active Task\*\*[:\s]+([A-Z0-9-]+)/i) ??
    raw.match(/task[:\s]+([A-Z0-9-]+)/i);

  return {
    milestone: milestoneMatch ? milestoneMatch[1].trim() : null,
    slice: sliceMatch ? sliceMatch[1].trim() : null,
    task: taskMatch ? taskMatch[1].trim() : null,
  };
}

// ---------------------------------------------------------------------------
// readProgress
// ---------------------------------------------------------------------------

/**
 * Read structured execution progress from the .hx/ directory.
 */
export function readProgress(projectDir: string): ProgressResult {
  // STATE.md
  const statePath = resolveRootFile(projectDir, 'STATE.md');
  const stateRaw = readFileSafe(statePath);

  let currentMilestone: string | null = null;
  let currentSlice: string | null = null;
  let currentTask: string | null = null;

  if (stateRaw) {
    const parsed = parseStateFile(stateRaw);
    currentMilestone = parsed.milestone;
    currentSlice = parsed.slice;
    currentTask = parsed.task;
  }

  // Milestones
  const milestoneIds = findMilestoneIds(projectDir);
  const milestones: MilestoneProgress[] = [];

  let totalSlices = 0;
  let completedSlices = 0;
  let totalTasks = 0;
  let completedTasks = 0;

  for (const milestoneId of milestoneIds) {
    // Milestone title from ROADMAP.md or CONTEXT.md
    const roadmapPath = resolveMilestoneFile(projectDir, milestoneId, 'ROADMAP.md');
    const roadmapRaw = readFileSafe(roadmapPath);
    const milestoneTitle = roadmapRaw ? extractTitle(roadmapRaw) : milestoneId;

    // Slice list from ROADMAP.md
    const roadmapSlices: Array<{ id: string; title: string; status: 'pending' | 'complete' }> = [];
    if (roadmapRaw) {
      for (const line of roadmapRaw.split('\n')) {
        const entry = parseRoadmapSliceStatus(line);
        if (entry) roadmapSlices.push(entry);
      }
    }

    // If no roadmap slices, fall back to scanning filesystem slice dirs
    const sliceIds = findSliceIds(projectDir, milestoneId);
    const sliceSet = new Set(roadmapSlices.map((s) => s.id));
    for (const sid of sliceIds) {
      if (!sliceSet.has(sid)) {
        roadmapSlices.push({ id: sid, title: sid, status: 'pending' });
      }
    }

    const sliceProgressList: SliceProgress[] = [];
    let allSlicesDone = roadmapSlices.length > 0;

    for (const rs of roadmapSlices) {
      totalSlices++;
      if (rs.status === 'complete') completedSlices++;
      else allSlicesDone = false;

      // Tasks from slice PLAN.md
      const planPath = resolveSliceFile(projectDir, milestoneId, rs.id, 'PLAN.md');
      const planRaw = readFileSafe(planPath);
      const tasks: TaskProgress[] = [];

      if (planRaw) {
        for (const line of planRaw.split('\n')) {
          const entry = parsePlanTaskStatus(line);
          if (entry) {
            totalTasks++;
            if (entry.status === 'complete') completedTasks++;
            tasks.push({ id: entry.id, title: entry.title, status: entry.status });
          }
        }
      }

      // Determine slice active/pending/complete
      let sliceStatus: 'pending' | 'active' | 'complete';
      if (rs.status === 'complete') {
        sliceStatus = 'complete';
      } else if (rs.id === currentSlice) {
        sliceStatus = 'active';
      } else if (tasks.some((t) => t.status === 'complete')) {
        sliceStatus = 'active';
      } else {
        sliceStatus = 'pending';
      }

      sliceProgressList.push({
        id: rs.id,
        title: rs.title,
        status: sliceStatus,
        tasks,
      });
    }

    // Milestone status
    let milestoneStatus: 'pending' | 'active' | 'complete';
    const summaryPath = resolveMilestoneFile(projectDir, milestoneId, 'SUMMARY.md');
    if (existsSync(summaryPath)) {
      milestoneStatus = 'complete';
    } else if (milestoneId === currentMilestone || sliceProgressList.some((s) => s.status === 'active')) {
      milestoneStatus = 'active';
    } else {
      milestoneStatus = 'pending';
    }

    milestones.push({
      id: milestoneId,
      title: milestoneTitle,
      status: milestoneStatus,
      slices: sliceProgressList,
    });
  }

  const completedMilestones = milestones.filter((m) => m.status === 'complete').length;

  return {
    stateRaw,
    currentMilestone,
    currentSlice,
    currentTask,
    milestones,
    summary: {
      totalMilestones: milestones.length,
      completedMilestones,
      totalSlices,
      completedSlices,
      totalTasks,
      completedTasks,
    },
  };
}
