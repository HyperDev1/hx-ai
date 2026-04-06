// HX Extension — Content Validator
// Validates the content of HX artifacts (task/slice plan files) written during
// a unit. Ensures the auto-loop produced structurally sound artifacts before
// marking a unit complete.

import { readFileSync, existsSync } from "node:fs";
import { logWarning } from "../workflow-logger.js";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ContentValidationResult {
  valid: boolean;
  path: string;
  findings: string[];
}

export interface ContentValidationSummary {
  allValid: boolean;
  results: ContentValidationResult[];
}

// ─── Validators ──────────────────────────────────────────────────────────────

/**
 * Validate a task plan file (T##-PLAN.md).
 * Checks for required sections: title heading, Steps/Description, Verify.
 */
function validateTaskPlan(content: string, path: string): ContentValidationResult {
  const findings: string[] = [];

  if (!content.includes("# T")) {
    findings.push("Missing task heading (# T##: ...)");
  }
  if (!/##\s+(Steps|Description|Implementation)/i.test(content)) {
    findings.push("Missing Steps/Description/Implementation section");
  }
  if (!/##\s+Verify/i.test(content) && !content.includes("verify:")) {
    findings.push("Missing Verify section or verify: field");
  }
  if (content.length < 200) {
    findings.push(`Task plan appears too short (${content.length} chars) — may be a stub`);
  }

  return { valid: findings.length === 0, path, findings };
}

/**
 * Validate a slice plan file (S##-PLAN.md).
 * Checks for required sections: title, Tasks list, Verification.
 */
function validateSlicePlan(content: string, path: string): ContentValidationResult {
  const findings: string[] = [];

  if (!content.includes("# S")) {
    findings.push("Missing slice heading (# S##: ...)");
  }
  if (!/##\s+Tasks/i.test(content)) {
    findings.push("Missing Tasks section");
  }
  if (!/##\s+Verif/i.test(content)) {
    findings.push("Missing Verification section");
  }
  if (content.length < 300) {
    findings.push(`Slice plan appears too short (${content.length} chars) — may be a stub`);
  }

  return { valid: findings.length === 0, path, findings };
}

/**
 * Validate a milestone roadmap file (M##-ROADMAP.md).
 * Checks for required sections: title, Success Criteria, Slices.
 */
function validateRoadmap(content: string, path: string): ContentValidationResult {
  const findings: string[] = [];

  if (!content.includes("# M")) {
    findings.push("Missing milestone heading (# M##: ...)");
  }
  if (!/##\s+Success Criteria/i.test(content)) {
    findings.push("Missing Success Criteria section");
  }
  if (!/##\s+Slices/i.test(content) && !/- \[ \]/i.test(content)) {
    findings.push("Missing Slices section or slice checklist");
  }

  return { valid: findings.length === 0, path, findings };
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Validate the content of an HX artifact file.
 * Selects the appropriate validator based on filename pattern.
 *
 * @param filePath - Absolute or cwd-relative path to the artifact file
 */
export function validateContent(filePath: string): ContentValidationResult {
  if (!existsSync(filePath)) {
    return {
      valid: false,
      path: filePath,
      findings: [`File does not exist: ${filePath}`],
    };
  }

  let content: string;
  try {
    content = readFileSync(filePath, "utf-8");
  } catch (err) {
    return {
      valid: false,
      path: filePath,
      findings: [`Cannot read file: ${(err as Error).message}`],
    };
  }

  const filename = filePath.split(/[/\\]/).pop() ?? "";

  let result: ContentValidationResult;

  if (/^T\d+-PLAN\.md$/i.test(filename)) {
    result = validateTaskPlan(content, filePath);
  } else if (/^S\d+-PLAN\.md$/i.test(filename)) {
    result = validateSlicePlan(content, filePath);
  } else if (/^M[\w-]+-ROADMAP\.md$/i.test(filename)) {
    result = validateRoadmap(content, filePath);
  } else {
    // Unknown artifact type — skip structural validation, just check it's non-empty
    result = {
      valid: content.trim().length > 0,
      path: filePath,
      findings: content.trim().length === 0 ? ["File is empty"] : [],
    };
  }

  if (!result.valid) {
    for (const finding of result.findings) {
      logWarning("safety", `Content validation failed for ${filename}: ${finding}`, {
        file: filePath,
      });
    }
  }

  return result;
}

/**
 * Validate multiple artifact files and return a summary.
 */
export function validateContents(filePaths: string[]): ContentValidationSummary {
  const results = filePaths.map(validateContent);
  return {
    allValid: results.every((r) => r.valid),
    results,
  };
}
