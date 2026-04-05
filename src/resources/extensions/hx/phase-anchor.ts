/**
 * Phase anchors — compact handoff records written at research/plan phase
 * boundaries so downstream agents can load decisions without re-reading
 * full milestone history.
 *
 * Each anchor is a small JSON file stored under:
 *   .hx/milestones/<milestoneId>/anchors/<phase>.json
 */

import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { hxRoot } from "./paths.js";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PhaseAnchor {
  /** The auto-mode phase that produced this anchor (e.g. "research-milestone"). */
  phase: string;
  /** Milestone ID this anchor belongs to. */
  milestoneId: string;
  /** ISO-8601 timestamp of when the anchor was written. */
  generatedAt: string;
  /** One-sentence description of what the agent was trying to accomplish. */
  intent: string;
  /** Key decisions made during this phase, to avoid re-litigating them. */
  decisions: string[];
  /** Known blockers or open questions carried forward. */
  blockers: string[];
  /** Recommended next steps for the downstream agent. */
  nextSteps: string[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function anchorPath(
  basePath: string,
  milestoneId: string,
  phase: string
): string {
  return join(hxRoot(basePath), "milestones", milestoneId, "anchors", `${phase}.json`);
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Write a phase anchor to disk.
 *
 * Creates parent directories as needed. Overwrites any existing anchor for the
 * same milestone + phase combination (idempotent).
 */
export function writePhaseAnchor(
  basePath: string,
  milestoneId: string,
  anchor: PhaseAnchor
): void {
  const filePath = anchorPath(basePath, milestoneId, anchor.phase);
  mkdirSync(join(hxRoot(basePath), "milestones", milestoneId, "anchors"), {
    recursive: true,
  });
  writeFileSync(filePath, JSON.stringify(anchor, null, 2), "utf-8");
}

/**
 * Read a phase anchor from disk.
 *
 * Returns `null` when no anchor exists for the given milestone + phase.
 */
export function readPhaseAnchor(
  basePath: string,
  milestoneId: string,
  phase: string
): PhaseAnchor | null {
  const filePath = anchorPath(basePath, milestoneId, phase);
  if (!existsSync(filePath)) return null;
  try {
    return JSON.parse(readFileSync(filePath, "utf-8")) as PhaseAnchor;
  } catch {
    return null;
  }
}

/**
 * Format a phase anchor as a markdown block suitable for prompt injection.
 *
 * The output is intentionally compact — a few lines that give the downstream
 * agent situational awareness without flooding the context window.
 */
export function formatAnchorForPrompt(anchor: PhaseAnchor): string {
  const lines: string[] = [
    `## Phase Anchor: ${anchor.phase} (${anchor.milestoneId})`,
    `**Intent:** ${anchor.intent}`,
    `**Generated:** ${anchor.generatedAt}`,
  ];

  if (anchor.decisions.length > 0) {
    lines.push("", "**Key decisions:**");
    for (const d of anchor.decisions) {
      lines.push(`- ${d}`);
    }
  }

  if (anchor.blockers.length > 0) {
    lines.push("", "**Blockers / open questions:**");
    for (const b of anchor.blockers) {
      lines.push(`- ${b}`);
    }
  }

  if (anchor.nextSteps.length > 0) {
    lines.push("", "**Next steps:**");
    for (const s of anchor.nextSteps) {
      lines.push(`- ${s}`);
    }
  }

  return lines.join("\n");
}
