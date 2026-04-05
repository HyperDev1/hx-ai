/**
 * HX MCP Server — read project knowledge base.
 *
 * Reads KNOWLEDGE.md from .hx/ and returns structured entries.
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolveRootFile } from './paths.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface KnowledgeEntry {
  /** Entry ID (e.g. "K001") if present in the heading */
  id: string | null;
  /** Heading text without ID prefix */
  title: string;
  /** Full content block under this heading */
  content: string;
  /** Tags extracted from backtick spans in the heading, if any */
  tags: string[];
}

export interface KnowledgeResult {
  exists: boolean;
  raw: string | null;
  entries: KnowledgeEntry[];
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

/** Extract knowledge entry ID from heading text: "K001 — Title" → "K001" */
function extractEntryId(heading: string): { id: string | null; title: string } {
  const m = heading.match(/^(K\d+)\s*[—–-]\s*(.+)$/i);
  if (m) return { id: m[1], title: m[2].trim() };
  return { id: null, title: heading };
}

/** Extract backtick-tagged terms from a heading or content line. */
function extractTags(text: string): string[] {
  const tags: string[] = [];
  const re = /`([^`]+)`/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    tags.push(m[1].trim());
  }
  return tags;
}

/**
 * Parse KNOWLEDGE.md into structured entries.
 * Each H2 heading starts a new knowledge entry.
 */
function parseKnowledgeMarkdown(raw: string): KnowledgeEntry[] {
  const lines = raw.split('\n');
  const entries: KnowledgeEntry[] = [];
  let currentEntry: KnowledgeEntry | null = null;
  const contentLines: string[] = [];

  function flushEntry() {
    if (!currentEntry) return;
    currentEntry.content = contentLines.join('\n').trim();
    entries.push(currentEntry);
    contentLines.length = 0;
  }

  for (const line of lines) {
    const h2Match = line.match(/^##\s+(.+)$/);
    if (h2Match) {
      flushEntry();
      const rawTitle = h2Match[1].trim();
      const { id, title } = extractEntryId(rawTitle);
      const tags = extractTags(rawTitle);
      currentEntry = { id, title, content: '', tags };
    } else if (currentEntry) {
      contentLines.push(line);
    }
  }

  flushEntry();
  return entries;
}

// ---------------------------------------------------------------------------
// readKnowledge
// ---------------------------------------------------------------------------

/**
 * Read and parse KNOWLEDGE.md from .hx/.
 */
export function readKnowledge(projectDir: string): KnowledgeResult {
  const knowledgePath = resolveRootFile(projectDir, 'KNOWLEDGE.md');

  if (!existsSync(knowledgePath)) {
    return { exists: false, raw: null, entries: [], totalEntries: 0 };
  }

  const raw = readFileSafe(knowledgePath);
  if (!raw) {
    return { exists: true, raw: null, entries: [], totalEntries: 0 };
  }

  const entries = parseKnowledgeMarkdown(raw);
  return {
    exists: true,
    raw,
    entries,
    totalEntries: entries.length,
  };
}
