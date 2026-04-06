/**
 * HX MCP Server — read project roadmap.
 *
 * Parses ROADMAP.md files for all milestones, extracting structured
 * slice/risk/demo information from the markdown tables.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  findMilestoneIds,
  resolveMilestoneDir,
  resolveMilestoneFile,
  resolveRootFile,
} from './paths.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SliceEntry {
  id: string;
  title: string;
  risk: string;
  depends: string[];
  demo: string;
  complete: boolean;
}

export interface MilestoneRoadmap {
  id: string;
  title: string;
  vision: string;
  status: 'active' | 'complete' | 'pending';
  successCriteria: string[];
  slices: SliceEntry[];
  raw: string;
}

export interface RoadmapResult {
  projectTitle: string | null;
  milestones: MilestoneRoadmap[];
  totalSlices: number;
  completedSlices: number;
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

/** Extract the vision/description paragraph that follows an H2 heading. */
function extractVision(markdown: string): string {
  const m = markdown.match(/##\s+Vision\s*\n+([\s\S]*?)(?=\n##|\n---|\n\n\n|$)/i) ??
    markdown.match(/\*\*Vision\*\*[:\s]*([\s\S]*?)(?=\n##|\n---|\n\n\n|$)/i);
  return m ? m[1].trim() : '';
}

/** Extract success criteria bullet items. */
function extractSuccessCriteria(markdown: string): string[] {
  const sectionMatch = markdown.match(/##\s+Success Criteria\s*\n+([\s\S]*?)(?=\n##|\n---|\n\n\n|$)/i);
  if (!sectionMatch) return [];
  return sectionMatch[1]
    .split('\n')
    .map((l) => l.replace(/^\s*[-*]\s*/, '').trim())
    .filter((l) => l.length > 0);
}

/**
 * Parse a roadmap slice line.
 *
 * Expected format (from ROADMAP.md):
 *   `- [ ] **S01: Title** \`risk:low\` \`depends:[]\``
 *   optional trailing demo text after the backtick blocks
 */
function parseSliceLine(line: string): SliceEntry | null {
  // Match checkbox + id + title
  const headerMatch = line.match(/^\s*-\s*\[([ x])\]\s*\*\*(\w+):\s*(.+?)\*\*/i);
  if (!headerMatch) return null;

  const complete = headerMatch[1].toLowerCase() === 'x';
  const id = headerMatch[2];
  const title = headerMatch[3].trim();

  // risk tag
  const riskMatch = line.match(/`risk:([^`]+)`/i);
  const risk = riskMatch ? riskMatch[1].trim() : 'unknown';

  // depends tag — `depends:[S01,S02]` or `depends:[]`
  const dependsMatch = line.match(/`depends:\[([^\]]*)\]`/i);
  const depends = dependsMatch
    ? dependsMatch[1]
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
    : [];

  // Demo text — everything after all backtick blocks, or a `demo:` tag
  const demoTagMatch = line.match(/`demo:([^`]+)`/i);
  let demo = demoTagMatch ? demoTagMatch[1].trim() : '';
  if (!demo) {
    // Fall back: strip all known backtick blocks and **bold** parts, use remainder
    const remainder = line
      .replace(/^\s*-\s*\[[ x]\]\s*/i, '')
      .replace(/\*\*[^*]+\*\*/g, '')
      .replace(/`[^`]+`/g, '')
      .trim();
    if (remainder) demo = remainder;
  }

  return { id, title, risk, depends, complete, demo };
}

// ---------------------------------------------------------------------------
// readRoadmap
// ---------------------------------------------------------------------------

/**
 * Read and parse all milestone ROADMAP.md files.
 */
export function readRoadmap(projectDir: string): RoadmapResult {
  // Project-level title from .hx/PROJECT.md
  const projectMd = readFileSafe(resolveRootFile(projectDir, 'PROJECT.md'));
  const projectTitle = projectMd ? extractTitle(projectMd) : null;

  const milestoneIds = findMilestoneIds(projectDir);
  const milestones: MilestoneRoadmap[] = [];
  let totalSlices = 0;
  let completedSlices = 0;

  for (const milestoneId of milestoneIds) {
    const roadmapPath = resolveMilestoneFile(projectDir, milestoneId, 'ROADMAP.md');
    const raw = readFileSafe(roadmapPath);
    if (!raw) continue;

    const title = extractTitle(raw);
    const vision = extractVision(raw);
    const successCriteria = extractSuccessCriteria(raw);

    // Parse slice entries
    const slices: SliceEntry[] = [];
    for (const line of raw.split('\n')) {
      const entry = parseSliceLine(line);
      if (entry) {
        slices.push(entry);
        totalSlices++;
        if (entry.complete) completedSlices++;
      }
    }

    // Milestone status
    const summaryPath = resolveMilestoneFile(projectDir, milestoneId, 'SUMMARY.md');
    let status: 'active' | 'complete' | 'pending';
    if (existsSync(summaryPath)) {
      status = 'complete';
    } else if (slices.some((s) => s.complete) || existsSync(join(resolveMilestoneDir(projectDir, milestoneId), 'slices'))) {
      status = 'active';
    } else {
      status = 'pending';
    }

    milestones.push({
      id: milestoneId,
      title,
      vision,
      status,
      successCriteria,
      slices,
      raw,
    });
  }

  return {
    projectTitle,
    milestones,
    totalSlices,
    completedSlices,
  };
}
