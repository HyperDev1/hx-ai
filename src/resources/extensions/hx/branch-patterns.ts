/**
 * HX branch naming patterns — single source of truth.
 *
 * hx/<worktree>/<milestone>/<slice>  → SLICE_BRANCH_RE
 * hx/quick/<id>-<slug>               → QUICK_BRANCH_RE
 * hx/<workflow>/<...>                 → WORKFLOW_BRANCH_RE (non-milestone hx/ branches)
 */

/** Matches hx/ slice branches: hx/[worktree/]M001[-hash]/S01 */
export const SLICE_BRANCH_RE = /^hx\/(?:([a-zA-Z0-9_-]+)\/)?(M\d+(?:-[a-z0-9]{6})?)\/(S\d+)$/;

/** Matches hx/quick/ task branches */
export const QUICK_BRANCH_RE = /^hx\/quick\//;

/** Matches hx/ workflow branches (non-milestone, e.g. hx/workflow-name/...) */
export const WORKFLOW_BRANCH_RE = /^hx\/(?!M\d)[\w-]+\//;
