/**
 * HX branch naming patterns — single source of truth.
 *
 * hx/<worktree>/<milestone>/<slice>  → SLICE_BRANCH_RE
 * hx/quick/<id>-<slug>               → QUICK_BRANCH_RE
 * hx/<workflow>/<...>                 → WORKFLOW_BRANCH_RE (non-milestone hx/ branches)
 *
 * Branch name construction helpers:
 *   slugify(text)                     → URL-safe lowercase slug, max 40 chars
 *   quickBranchName(num, slug)        → hx/quick/<num>-<slug>
 *   workflowBranchName(templateId, slug) → hx/<templateId>/<slug>
 */

/** Matches hx/ slice branches: hx/[worktree/]M001[-hash]/S01 */
export const SLICE_BRANCH_RE = /^hx\/(?:([a-zA-Z0-9_-]+)\/)?(M\d+(?:-[a-z0-9]{6})?)\/(S\d+)$/;

/** Matches hx/quick/ task branches */
export const QUICK_BRANCH_RE = /^hx\/quick\//;

/** Matches hx/ workflow branches (non-milestone, e.g. hx/workflow-name/...) */
export const WORKFLOW_BRANCH_RE = /^hx\/(?!M\d)[\w-]+\//;

// ─── Branch Name Construction ────────────────────────────────────────────────

/**
 * Convert free-form text into a URL-safe branch name segment.
 * Lowercase, hyphens only, max 40 chars, no leading/trailing hyphens.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40)
    .replace(/-$/, "");
}

/**
 * Build a quick-task branch name: `hx/quick/<num>-<slug>`
 */
export function quickBranchName(taskNum: number, slug: string): string {
  return `hx/quick/${taskNum}-${slug}`;
}

/**
 * Build a workflow-template branch name: `hx/<templateId>/<slug>`
 */
export function workflowBranchName(templateId: string, slug: string): string {
  return `hx/${templateId}/${slug}`;
}
