/**
 * HX MCP Server — read session metrics history.
 *
 * Reads the metrics.json file from the .hx/activity/ directory
 * to return cost and performance history.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { resolveRootFile } from './paths.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MetricEntry {
  timestamp: number;
  milestoneId: string | null;
  sliceId: string | null;
  taskId: string | null;
  durationMs: number;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  cost: number;
  toolCalls: number;
  verdict?: string;
}

export interface MetricsSummary {
  totalSessions: number;
  totalCost: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCacheReadTokens: number;
  totalCacheWriteTokens: number;
  totalToolCalls: number;
  totalDurationMs: number;
  averageCostPerSession: number;
  averageDurationMs: number;
}

export interface HistoryResult {
  entries: MetricEntry[];
  summary: MetricsSummary;
  sourceFile: string | null;
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

function safeNum(v: unknown): number {
  return typeof v === 'number' && isFinite(v) ? v : 0;
}

// ---------------------------------------------------------------------------
// readHistory
// ---------------------------------------------------------------------------

/**
 * Read session metrics history from .hx/activity/metrics.json.
 * Returns an empty result if no metrics file exists.
 */
export function readHistory(projectDir: string): HistoryResult {
  const activityDir = resolveRootFile(projectDir, 'activity');
  const metricsPath = join(activityDir, 'metrics.json');

  const empty: HistoryResult = {
    entries: [],
    summary: {
      totalSessions: 0,
      totalCost: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCacheReadTokens: 0,
      totalCacheWriteTokens: 0,
      totalToolCalls: 0,
      totalDurationMs: 0,
      averageCostPerSession: 0,
      averageDurationMs: 0,
    },
    sourceFile: null,
  };

  if (!existsSync(metricsPath)) {
    // Try finding any metrics-related file in the activity directory
    if (!existsSync(activityDir)) return empty;
    try {
      const files = readdirSync(activityDir).filter(
        (f) => f.includes('metrics') && f.endsWith('.json'),
      );
      if (files.length === 0) return empty;
      // Use the most recently named file (alphabetical last)
      const file = files.sort().at(-1)!;
      const path = join(activityDir, file);
      const raw = readFileSafe(path);
      if (!raw) return empty;
      return parseMetricsFile(raw, path);
    } catch {
      return empty;
    }
  }

  const raw = readFileSafe(metricsPath);
  if (!raw) return empty;
  return parseMetricsFile(raw, metricsPath);
}

function parseMetricsFile(raw: string, sourceFile: string): HistoryResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      entries: [],
      summary: {
        totalSessions: 0,
        totalCost: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalCacheReadTokens: 0,
        totalCacheWriteTokens: 0,
        totalToolCalls: 0,
        totalDurationMs: 0,
        averageCostPerSession: 0,
        averageDurationMs: 0,
      },
      sourceFile,
    };
  }

  const rawEntries = Array.isArray(parsed) ? parsed : (parsed as Record<string, unknown>).entries;
  if (!Array.isArray(rawEntries)) {
    return {
      entries: [],
      summary: {
        totalSessions: 0,
        totalCost: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalCacheReadTokens: 0,
        totalCacheWriteTokens: 0,
        totalToolCalls: 0,
        totalDurationMs: 0,
        averageCostPerSession: 0,
        averageDurationMs: 0,
      },
      sourceFile,
    };
  }

  const entries: MetricEntry[] = rawEntries.map((e: unknown) => {
    const entry = e as Record<string, unknown>;
    return {
      timestamp: safeNum(entry.timestamp),
      milestoneId: typeof entry.milestoneId === 'string' ? entry.milestoneId : null,
      sliceId: typeof entry.sliceId === 'string' ? entry.sliceId : null,
      taskId: typeof entry.taskId === 'string' ? entry.taskId : null,
      durationMs: safeNum(entry.durationMs),
      inputTokens: safeNum(entry.inputTokens),
      outputTokens: safeNum(entry.outputTokens),
      cacheReadTokens: safeNum(entry.cacheReadTokens),
      cacheWriteTokens: safeNum(entry.cacheWriteTokens),
      cost: safeNum(entry.cost),
      toolCalls: safeNum(entry.toolCalls),
      verdict: typeof entry.verdict === 'string' ? entry.verdict : undefined,
    };
  });

  const totalSessions = entries.length;
  const totalCost = entries.reduce((a, e) => a + e.cost, 0);
  const totalInputTokens = entries.reduce((a, e) => a + e.inputTokens, 0);
  const totalOutputTokens = entries.reduce((a, e) => a + e.outputTokens, 0);
  const totalCacheReadTokens = entries.reduce((a, e) => a + e.cacheReadTokens, 0);
  const totalCacheWriteTokens = entries.reduce((a, e) => a + e.cacheWriteTokens, 0);
  const totalToolCalls = entries.reduce((a, e) => a + e.toolCalls, 0);
  const totalDurationMs = entries.reduce((a, e) => a + e.durationMs, 0);

  return {
    entries,
    summary: {
      totalSessions,
      totalCost,
      totalInputTokens,
      totalOutputTokens,
      totalCacheReadTokens,
      totalCacheWriteTokens,
      totalToolCalls,
      totalDurationMs,
      averageCostPerSession: totalSessions > 0 ? totalCost / totalSessions : 0,
      averageDurationMs: totalSessions > 0 ? totalDurationMs / totalSessions : 0,
    },
    sourceFile,
  };
}
