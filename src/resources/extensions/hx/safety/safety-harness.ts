// HX Extension — Safety Harness
// Central configuration and feature-flag module for the LLM safety harness.
// Re-exports all safety module APIs and resolves effective config from user preferences.

// ─── Re-exports ───────────────────────────────────────────────────────────────

export {
  resetEvidence,
  recordToolCall,
  recordToolResult,
  getToolCalls,
  getToolResults,
  getBashExecutions,
  hadZeroBashExecutions,
  summarizeEvidence,
} from "./evidence-collector.js";

export type {
  ToolCallRecord,
  ToolResultRecord,
  BashExecution,
} from "./evidence-collector.js";

export { classifyCommand, destructiveWarning } from "./destructive-guard.js";

export type { CommandClassification } from "./destructive-guard.js";

export { validateFileChanges } from "./file-change-validator.js";

export type { FileChangeValidationResult } from "./file-change-validator.js";

export { crossReferenceEvidence } from "./evidence-cross-ref.js";

export type { CrossReferenceResult } from "./evidence-cross-ref.js";

export {
  createCheckpoint,
  rollbackToCheckpoint,
  cleanupCheckpoint,
  CHECKPOINT_PREFIX,
} from "./git-checkpoint.js";

export type { CheckpointResult, RollbackResult } from "./git-checkpoint.js";

export { validateContent, validateContents } from "./content-validator.js";

export type { ContentValidationResult, ContentValidationSummary } from "./content-validator.js";

// ─── Configuration ───────────────────────────────────────────────────────────

export interface SafetyHarnessConfig {
  /** Master switch — if false, all harness features are disabled */
  enabled: boolean;
  /** Record tool calls and results for post-unit cross-reference */
  evidenceCollection: boolean;
  /** Validate file changes after each unit via git diff */
  fileChangeValidation: boolean;
  /** Cross-reference evidence against claimed outputs */
  evidenceCrossReference: boolean;
  /** Emit warnings for destructive shell commands */
  destructiveCommandWarnings: boolean;
  /** Validate content of written HX artifacts */
  contentValidation: boolean;
  /** Create git checkpoint refs before execute-task units */
  checkpoints: boolean;
  /** Auto-rollback to checkpoint when post-unit validation fails */
  autoRollback: boolean;
  /** Cap applied to timeout scale multiplier (default: 6) */
  timeoutScaleCap: number;
}

export const DEFAULTS: SafetyHarnessConfig = {
  enabled: true,
  evidenceCollection: true,
  fileChangeValidation: true,
  evidenceCrossReference: true,
  destructiveCommandWarnings: true,
  contentValidation: true,
  checkpoints: true,
  autoRollback: false, // conservative default — needs explicit opt-in
  timeoutScaleCap: 6,
};

// ─── Config resolver ──────────────────────────────────────────────────────────

/**
 * Partial shape of the safety_harness block from HXPreferences.
 * Declared inline to avoid a circular import through preferences.ts.
 */
interface SafetyHarnessPrefs {
  enabled?: boolean;
  evidence_collection?: boolean;
  file_change_validation?: boolean;
  evidence_cross_reference?: boolean;
  destructive_command_warnings?: boolean;
  content_validation?: boolean;
  checkpoints?: boolean;
  auto_rollback?: boolean;
  timeout_scale_cap?: number;
}

/**
 * Resolve the effective safety harness configuration by merging user preferences
 * on top of the hardcoded defaults.
 *
 * @param prefs - The `safety_harness` block from HXPreferences (may be undefined)
 */
export function resolveSafetyHarnessConfig(
  prefs?: SafetyHarnessPrefs,
): SafetyHarnessConfig {
  if (!prefs) return { ...DEFAULTS };

  return {
    enabled: prefs.enabled ?? DEFAULTS.enabled,
    evidenceCollection: prefs.evidence_collection ?? DEFAULTS.evidenceCollection,
    fileChangeValidation: prefs.file_change_validation ?? DEFAULTS.fileChangeValidation,
    evidenceCrossReference: prefs.evidence_cross_reference ?? DEFAULTS.evidenceCrossReference,
    destructiveCommandWarnings:
      prefs.destructive_command_warnings ?? DEFAULTS.destructiveCommandWarnings,
    contentValidation: prefs.content_validation ?? DEFAULTS.contentValidation,
    checkpoints: prefs.checkpoints ?? DEFAULTS.checkpoints,
    autoRollback: prefs.auto_rollback ?? DEFAULTS.autoRollback,
    timeoutScaleCap: prefs.timeout_scale_cap ?? DEFAULTS.timeoutScaleCap,
  };
}

/**
 * Returns true if the safety harness is enabled in the given preferences.
 * Convenience wrapper for callers that only need the master switch.
 */
export function isHarnessEnabled(prefs?: SafetyHarnessPrefs): boolean {
  return prefs?.enabled !== false;
}
