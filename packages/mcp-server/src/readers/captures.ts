/**
 * HX MCP Server — read project captures log.
 *
 * Reads CAPTURES.md from .hx/ and returns structured entries.
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolveRootFile } from './paths.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CaptureEntry {
  /** Heading text (H2 or H3 section title) */
  title: string;
  /** Depth of the heading (2 or 3) */
  depth: 2 | 3;
  /** Full content block under this heading */
  content: string;
  /** ISO date string if parseable from the heading, otherwise null */
  date: string | null;
}

export interface CapturesResult {
  exists: boolean;
  raw: string | null;
  entries: CaptureEntry[];
  totalEntries: number;
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

/** Try to extract a date from a heading like "## 2024-01-15 — Some title" */
function extractDate(heading: string): string | null {
  const m = heading.match(/(\d{4}-\d{2}-\d{2})/);
  if (!m) return null;
  // Validate it's an actual date
  const d = new Date(m[1]);
  return isNaN(d.getTime()) ? null : m[1];
}

/**
 * Parse CAPTURES.md into structured entries.
 * Each H2/H3 heading starts a new capture entry.
 */
function parseCapturesMarkdown(raw: string): CaptureEntry[] {
  const lines = raw.split('\n');
  const entries: CaptureEntry[] = [];
  let currentEntry: CaptureEntry | null = null;
  const contentLines: string[] = [];

  function flushEntry() {
    if (!currentEntry) return;
    currentEntry.content = contentLines.join('\n').trim();
    entries.push(currentEntry);
    contentLines.length = 0;
  }

  for (const line of lines) {
    const h2Match = line.match(/^##\s+(.+)$/);
    const h3Match = line.match(/^###\s+(.+)$/);

    if (h2Match || h3Match) {
      flushEntry();
      const depth = h2Match ? 2 : 3;
      const title = (h2Match ?? h3Match)![1].trim();
      currentEntry = { title, depth: depth as 2 | 3, content: '', date: extractDate(title) };
    } else if (currentEntry) {
      contentLines.push(line);
    }
    // Lines before the first heading are ignored
  }

  flushEntry();
  return entries;
}

// ---------------------------------------------------------------------------
// readCaptures
// ---------------------------------------------------------------------------

/**
 * Read and parse CAPTURES.md from .hx/.
 */
export function readCaptures(projectDir: string): CapturesResult {
  const capturesPath = resolveRootFile(projectDir, 'CAPTURES.md');

  if (!existsSync(capturesPath)) {
    return { exists: false, raw: null, entries: [], totalEntries: 0 };
  }

  const raw = readFileSafe(capturesPath);
  if (!raw) {
    return { exists: true, raw: null, entries: [], totalEntries: 0 };
  }

  const entries = parseCapturesMarkdown(raw);
  return {
    exists: true,
    raw,
    entries,
    totalEntries: entries.length,
  };
}
