/**
 * sanitize-complete-milestone.ts
 *
 * Input sanitization for the hx_complete_milestone tool parameters.
 * Coerces all fields to their expected types so downstream handlers
 * never crash on malformed LLM output.
 */

import type { CompleteMilestoneParams } from "../tools/complete-milestone.js";

function toTrimmedString(v: unknown): string {
  if (typeof v === "string") return v.trim();
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function toBoolean(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") return v.toLowerCase() === "true";
  if (typeof v === "number") return v !== 0;
  return false;
}

function toStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(toTrimmedString).filter(Boolean);
  if (typeof v === "string" && v.trim()) return [v.trim()];
  return [];
}

/**
 * Coerce params of unknown shape into a well-typed CompleteMilestoneParams.
 * Missing fields fall back to safe defaults so handleCompleteMilestone
 * can validate them and return a user-facing error rather than crashing.
 */
export function sanitizeCompleteMilestoneParams(params: unknown): CompleteMilestoneParams {
  const p = (params !== null && typeof params === "object") ? (params as Record<string, unknown>) : {};

  return {
    milestoneId: toTrimmedString(p["milestoneId"]),
    title: toTrimmedString(p["title"]),
    oneLiner: toTrimmedString(p["oneLiner"]),
    narrative: toTrimmedString(p["narrative"]),
    successCriteriaResults: toTrimmedString(p["successCriteriaResults"]),
    definitionOfDoneResults: toTrimmedString(p["definitionOfDoneResults"]),
    requirementOutcomes: toTrimmedString(p["requirementOutcomes"]),
    keyDecisions: toStringArray(p["keyDecisions"]),
    keyFiles: toStringArray(p["keyFiles"]),
    lessonsLearned: toStringArray(p["lessonsLearned"]),
    followUps: toTrimmedString(p["followUps"]),
    deviations: toTrimmedString(p["deviations"]),
    verificationPassed: toBoolean(p["verificationPassed"]),
    actorName: p["actorName"] !== undefined ? toTrimmedString(p["actorName"]) : undefined,
    triggerReason: p["triggerReason"] !== undefined ? toTrimmedString(p["triggerReason"]) : undefined,
  };
}
