// HX Extension — Evidence Cross-Reference
// Cross-references what the agent claimed to do against observable evidence
// (bash executions, tool results). Flags gaps where claimed changes have
// no supporting evidence.

import { getBashExecutions, getToolCalls, hadZeroBashExecutions } from "./evidence-collector.js";
import { logWarning } from "../workflow-logger.js";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CrossReferenceResult {
  /** True when evidence is consistent with claimed actions */
  consistent: boolean;
  /** Human-readable findings */
  findings: string[];
  /** True when the unit produced zero bash executions (suspicious for code tasks) */
  zeroBashExecutions: boolean;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Cross-reference accumulated evidence against the unit's claimed outputs.
 *
 * @param unitType - The type of unit executed (e.g. "execute-task")
 * @param claimedFileWrites - File paths the agent reported writing/modifying
 */
export function crossReferenceEvidence(
  unitType: string,
  claimedFileWrites?: string[],
): CrossReferenceResult {
  const findings: string[] = [];
  const toolCalls = getToolCalls();
  const bashExecutions = getBashExecutions();
  const zeroBashExecutions = hadZeroBashExecutions();

  // Only run the zero-bash check for execute-task units
  // (plan/scout/review units legitimately do no bash work)
  if (unitType === "execute-task" && zeroBashExecutions) {
    findings.push("execute-task unit completed with zero bash executions");
  }

  // Check for file writes with no corresponding tool evidence
  if (claimedFileWrites && claimedFileWrites.length > 0) {
    const writeToolNames = new Set(["write", "Write", "edit", "Edit"]);
    const writeToolCalls = toolCalls.filter((c) => writeToolNames.has(c.toolName));

    if (writeToolCalls.length === 0 && claimedFileWrites.length > 0) {
      findings.push(
        `Unit claimed ${claimedFileWrites.length} file write(s) but no write/edit tool calls were recorded`,
      );
      logWarning("safety", "File writes claimed but no write/edit tool calls in evidence", {
        claimed: claimedFileWrites.slice(0, 5).join(", "),
      });
    }
  }

  // Warn if tool call count is anomalously low for an execute task
  if (unitType === "execute-task" && toolCalls.length < 3) {
    findings.push(`execute-task unit made only ${toolCalls.length} tool call(s) — may be incomplete`);
    logWarning("safety", "Very low tool call count for execute-task unit", {
      count: String(toolCalls.length),
    });
  }

  // Check for bash executions that produced errors without correction attempts
  const failedBash = bashExecutions.filter((e) => e.isError);
  const successBash = bashExecutions.filter((e) => !e.isError);
  if (failedBash.length > 0 && successBash.length === 0 && bashExecutions.length > 0) {
    findings.push(
      `All ${failedBash.length} bash execution(s) failed with no successful recoveries`,
    );
    logWarning("safety", "All bash executions failed", {
      count: String(failedBash.length),
      firstCmd: failedBash[0].command.slice(0, 80),
    });
  }

  const consistent = findings.length === 0;
  return { consistent, findings, zeroBashExecutions };
}
