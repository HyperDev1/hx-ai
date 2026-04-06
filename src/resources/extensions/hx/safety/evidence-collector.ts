// HX Extension — Evidence Collector
// Module-level evidence accumulator for the safety harness.
// Records tool calls and results so post-unit validation can cross-reference
// what the agent claimed vs what shell commands actually executed.

import { logWarning } from "../workflow-logger.js";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ToolCallRecord {
  toolCallId: string;
  toolName: string;
  input: Record<string, unknown>;
  timestamp: number;
}

export interface ToolResultRecord {
  toolCallId: string;
  toolName: string;
  result: unknown;
  isError: boolean;
  timestamp: number;
}

export interface BashExecution {
  toolCallId: string;
  command: string;
  output: string;
  isError: boolean;
  timestamp: number;
}

// ─── Module-level state ──────────────────────────────────────────────────────

const _toolCalls: ToolCallRecord[] = [];
const _toolResults: ToolResultRecord[] = [];
const _bashExecutions: BashExecution[] = [];

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Reset all evidence for a new unit. Call at the start of each auto-loop unit.
 */
export function resetEvidence(): void {
  _toolCalls.length = 0;
  _toolResults.length = 0;
  _bashExecutions.length = 0;
}

/**
 * Record a tool call event. Called for every tool invocation.
 */
export function recordToolCall(toolName: string, input: unknown): void {
  const toolCallId = `${toolName}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const record: ToolCallRecord = {
    toolCallId,
    toolName,
    input: (input && typeof input === "object" ? input : { raw: input }) as Record<string, unknown>,
    timestamp: Date.now(),
  };
  _toolCalls.push(record);

  // Extract bash executions inline for quick access
  if (toolName === "bash" || toolName === "Bash") {
    const cmd = (input as Record<string, unknown>)?.command;
    if (typeof cmd === "string") {
      _bashExecutions.push({
        toolCallId,
        command: cmd,
        output: "",
        isError: false,
        timestamp: Date.now(),
      });
    }
  }
}

/**
 * Record a tool result event. Called after each tool completes.
 */
export function recordToolResult(
  toolCallId: string,
  toolName: string,
  result: unknown,
  isError: boolean,
): void {
  _toolResults.push({
    toolCallId,
    toolName,
    result,
    isError,
    timestamp: Date.now(),
  });

  // Update bash execution output if this was a bash call
  if (toolName === "bash" || toolName === "Bash") {
    const exec = _bashExecutions.find((e) => e.toolCallId === toolCallId);
    if (exec) {
      const content = result as { content?: Array<{ text?: string }> } | string;
      if (typeof content === "string") {
        exec.output = content;
      } else if (content?.content) {
        exec.output = content.content.map((c) => c.text ?? "").join("\n");
      }
      exec.isError = isError;
    }
  }
}

/**
 * Get all recorded tool calls for the current unit.
 */
export function getToolCalls(): readonly ToolCallRecord[] {
  return _toolCalls;
}

/**
 * Get all recorded tool results for the current unit.
 */
export function getToolResults(): readonly ToolResultRecord[] {
  return _toolResults;
}

/**
 * Get all bash executions recorded for the current unit.
 */
export function getBashExecutions(): readonly BashExecution[] {
  return _bashExecutions;
}

/**
 * Returns true if there were zero bash executions this unit.
 * Useful for detecting units that claimed file changes without running any commands.
 */
export function hadZeroBashExecutions(): boolean {
  if (_bashExecutions.length === 0) {
    logWarning("safety", "Unit completed with zero bash executions — evidence cross-reference may flag this");
    return true;
  }
  return false;
}

/**
 * Summarize evidence for post-unit logging.
 */
export function summarizeEvidence(): string {
  const calls = _toolCalls.length;
  const bash = _bashExecutions.length;
  const errors = _toolResults.filter((r) => r.isError).length;
  return `tool_calls=${calls} bash_executions=${bash} errors=${errors}`;
}
