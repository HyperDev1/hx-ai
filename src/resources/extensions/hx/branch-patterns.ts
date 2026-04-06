/**
 * HX branch naming patterns — single source of truth.
 *
 * hx/<worktree>/<milestone>/<slice>  → SLICE_BRANCH_RE
 * hx/quick/<id>-<slug>               → QUICK_BRANCH_RE
 * hx/<workflow>/<...>                 → WORKFLOW_BRANCH_RE (non-milestone hx/ branches)
 *
 * Branch name construction helpers:
 *   slugify(text)                     → URL-safe lowercase slug, max 40 chars
 *   generateSmartSlug(description)    → LLM-generated concise English slug
 *   quickBranchName(num, slug)        → hx/quick/<num>-<slug>
 *   workflowBranchName(templateId, slug) → hx/<templateId>/<slug>
 */

import type { ExtensionContext } from "@hyperlab/hx-coding-agent";
import type { Api, AssistantMessage, Model } from "@hyperlab/hx-ai";

/** Matches hx/ slice branches: hx/[worktree/]M001[-hash]/S01 */
export const SLICE_BRANCH_RE = /^hx\/(?:([a-zA-Z0-9_-]+)\/)?(M\d+(?:-[a-z0-9]{6})?)\/(S\d+)$/;

/** Matches hx/quick/ task branches */
export const QUICK_BRANCH_RE = /^hx\/quick\//;

/** Matches hx/ workflow branches (non-milestone, e.g. hx/workflow-name/...) */
export const WORKFLOW_BRANCH_RE = /^hx\/(?!M\d)[\w-]+\//;

// ─── Deprecated model filter (shared with memory-extractor) ──────────────────

const DEPRECATED_MODEL_IDS = new Set([
  "claude-3-5-haiku-20241022",
  "claude-3-5-haiku-latest",
  "claude-3-haiku-20240307",
  "claude-3-opus-20240229",
  "claude-3-sonnet-20240229",
  "claude-instant-1.2",
]);

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
 * Generate a concise, meaningful English branch slug from a free-form description
 * using the cheapest available LLM model (Haiku preferred).
 *
 * Falls back to plain slugify() if no model is available or the LLM call fails.
 *
 * @param description User's free-form task description (any language)
 * @param ctx Extension context with model registry access
 * @returns 3-5 word hyphenated English slug, max 40 chars
 */
export async function generateSmartSlug(description: string, ctx: ExtensionContext): Promise<string> {
  const fallback = slugify(description);
  if (!description.trim()) return fallback;

  try {
    const available = ctx.modelRegistry?.getAvailable?.();
    if (!available || available.length === 0) {
      process.stderr.write(`[hx] Smart slug: no models available, using fallback\n`);
      return fallback;
    }

    const nonDeprecated = available.filter((m: Model<Api>) => !DEPRECATED_MODEL_IDS.has(m.id));
    const candidates = nonDeprecated.length > 0 ? nonDeprecated : available;
    let model = candidates.find((m: Model<Api>) => m.id.toLowerCase().includes("haiku"));
    if (!model) {
      model = [...candidates].sort((a: Model<Api>, b: Model<Api>) => a.cost.input - b.cost.input)[0];
    }
    if (!model) {
      process.stderr.write(`[hx] Smart slug: no suitable model found, using fallback\n`);
      return fallback;
    }

    process.stderr.write(`[hx] Smart slug: using model ${model.id} for "${description.slice(0, 50)}"\n`);

    // Resolve API key through model registry — handles both OAuth tokens and env var API keys
    const apiKey = await ctx.modelRegistry.getApiKey(model as Model<Api>);
    if (!apiKey) {
      process.stderr.write(`[hx] Smart slug: no auth for ${model.provider}, using fallback\n`);
      return fallback;
    }

    const { completeSimple } = await import("@hyperlab/hx-ai");
    const result: AssistantMessage = await completeSimple(model as Model<Api>, {
      systemPrompt:
        "You generate concise git branch name slugs. Output ONLY 3-5 lowercase English words separated by hyphens. No explanation, no quotes, no prefix. Max 40 characters total. Examples:\n" +
        "Input: 'yukarıdaki bug'ı fixle ayrıca branch naming'i milestone dışındaki branch oluşturan tüm işlemlere uygulayabiliriz'\n" +
        "Output: deprecated-model-branch-naming\n\n" +
        "Input: 'fix login button not responding on mobile'\n" +
        "Output: fix-login-button-mobile\n\n" +
        "Input: 'analytics sayfasında MAU subquery filter eksik'\n" +
        "Output: mau-subquery-missing-filter",
      messages: [{ role: "user" as const, content: description, timestamp: Date.now() }],
    }, {
      maxTokens: 30,
      temperature: 0,
      apiKey,
    });

    const text = result.content
      .filter((c): c is { type: "text"; text: string } => c.type === "text")
      .map((c) => c.text)
      .join("")
      .trim();

    process.stderr.write(`[hx] Smart slug: LLM returned "${text}"\n`);

    // Validate: must be lowercase, hyphens, alphanumeric only
    const cleaned = text
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40)
      .replace(/-$/, "");

    return cleaned.length >= 3 ? cleaned : fallback;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    process.stderr.write(`[hx] Smart slug generation failed: ${msg}\n`);
    return fallback;
  }
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
