// HX Extension — Dynamic Model Router
// Maps complexity tiers to models, enforcing downgrade-only semantics.
// The user's configured model is always the ceiling.

import type { ComplexityTier, ClassificationResult, TaskMetadata } from "./complexity-classifier.js";
import { tierOrdinal } from "./complexity-classifier.js";
import type { ResolvedModelConfig } from "./preferences.js";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DynamicRoutingConfig {
  enabled?: boolean;
  tier_models?: {
    light?: string;
    standard?: string;
    heavy?: string;
  };
  escalate_on_failure?: boolean;   // default: true
  budget_pressure?: boolean;       // default: true
  cross_provider?: boolean;        // default: true
  hooks?: boolean;                 // default: true
  capability_routing?: boolean;    // default: false
}

export interface RoutingDecision {
  /** The model ID to use (may be downgraded from configured) */
  modelId: string;
  /** Fallback chain: [selected_model, ...configured_fallbacks, configured_primary] */
  fallbacks: string[];
  /** The complexity tier that drove this decision */
  tier: ComplexityTier;
  /** True if the model was downgraded from the configured primary */
  wasDowngraded: boolean;
  /** Human-readable reason for this decision */
  reason: string;
  /** How the model was selected */
  selectionMethod: "capability-score" | "tier-only";
}

// ─── Known Model Tiers ───────────────────────────────────────────────────────
// Maps known model IDs to their capability tier. Used when tier_models is not
// explicitly configured to pick the best available model for each tier.

const MODEL_CAPABILITY_TIER: Record<string, ComplexityTier> = {
  // Light-tier models (cheapest)
  "claude-haiku-4-5": "light",
  "claude-3-5-haiku-latest": "light",
  "claude-3-haiku-20240307": "light",
  "gpt-4o-mini": "light",
  "gemini-2.0-flash": "light",
  "gemini-flash-2.0": "light",

  // Standard-tier models
  "claude-sonnet-4-6": "standard",
  "claude-sonnet-4-5-20250514": "standard",
  "claude-3-5-sonnet-latest": "standard",
  "gpt-4o": "standard",
  "gemini-2.5-pro": "standard",
  "deepseek-chat": "standard",

  // Heavy-tier models (most capable)
  "claude-opus-4-6": "heavy",
  "claude-3-opus-latest": "heavy",
  "gpt-4-turbo": "heavy",
  "o1": "heavy",
  "o3": "heavy",
};

// ─── Cost Table (per 1K input tokens, approximate USD) ───────────────────────
// Used for cross-provider cost comparison when multiple providers offer
// the same capability tier.

const MODEL_COST_PER_1K_INPUT: Record<string, number> = {
  "claude-haiku-4-5": 0.0008,
  "claude-3-5-haiku-latest": 0.0008,
  "claude-sonnet-4-6": 0.003,
  "claude-sonnet-4-5-20250514": 0.003,
  "claude-opus-4-6": 0.015,
  "gpt-4o-mini": 0.00015,
  "gpt-4o": 0.0025,
  "gemini-2.0-flash": 0.0001,
  "gemini-2.5-pro": 0.00125,
  "deepseek-chat": 0.00014,
};

// ─── Model Capabilities ───────────────────────────────────────────────────────

export interface ModelCapabilities {
  contextWindow: number;       // tokens
  supportsVision: boolean;
  supportsCode: boolean;
  reasoningDepth: "shallow" | "medium" | "deep";
  supportsTools: boolean;
}

// Per-model capability profiles for known models in MODEL_CAPABILITY_TIER.
// Unknown models fall through to the existing tier logic; scoreModel returns
// 1.0 for any model not listed here.

const MODEL_CAPABILITY_PROFILES: Record<string, ModelCapabilities> = {
  // Heavy-tier
  "claude-opus-4-6":       { contextWindow: 200000, supportsVision: true,  supportsCode: true,  reasoningDepth: "deep",    supportsTools: true  },
  "claude-3-opus-latest":  { contextWindow: 200000, supportsVision: true,  supportsCode: true,  reasoningDepth: "deep",    supportsTools: true  },
  "gpt-4-turbo":           { contextWindow: 128000, supportsVision: true,  supportsCode: true,  reasoningDepth: "deep",    supportsTools: true  },
  "o1":                    { contextWindow: 128000, supportsVision: false, supportsCode: true,  reasoningDepth: "deep",    supportsTools: false },
  "o3":                    { contextWindow: 128000, supportsVision: false, supportsCode: true,  reasoningDepth: "deep",    supportsTools: false },

  // Standard-tier
  "claude-sonnet-4-6":           { contextWindow: 200000, supportsVision: true,  supportsCode: true, reasoningDepth: "medium", supportsTools: true },
  "claude-sonnet-4-5-20250514":  { contextWindow: 200000, supportsVision: true,  supportsCode: true, reasoningDepth: "medium", supportsTools: true },
  "claude-3-5-sonnet-latest":    { contextWindow: 200000, supportsVision: true,  supportsCode: true, reasoningDepth: "medium", supportsTools: true },
  "gpt-4o":                      { contextWindow: 128000, supportsVision: true,  supportsCode: true, reasoningDepth: "medium", supportsTools: true },
  "gemini-2.5-pro":              { contextWindow: 1000000, supportsVision: true, supportsCode: true, reasoningDepth: "medium", supportsTools: true },
  "deepseek-chat":               { contextWindow: 65536,  supportsVision: false, supportsCode: true, reasoningDepth: "medium", supportsTools: true },

  // Light-tier
  "claude-haiku-4-5":         { contextWindow: 200000, supportsVision: true,  supportsCode: true, reasoningDepth: "shallow", supportsTools: true },
  "claude-3-5-haiku-latest":  { contextWindow: 200000, supportsVision: true,  supportsCode: true, reasoningDepth: "shallow", supportsTools: true },
  "claude-3-haiku-20240307":  { contextWindow: 200000, supportsVision: true,  supportsCode: true, reasoningDepth: "shallow", supportsTools: true },
  "gpt-4o-mini":              { contextWindow: 128000, supportsVision: true,  supportsCode: true, reasoningDepth: "shallow", supportsTools: true },
  "gemini-2.0-flash":         { contextWindow: 1000000, supportsVision: true, supportsCode: true, reasoningDepth: "shallow", supportsTools: true },
  "gemini-flash-2.0":         { contextWindow: 1000000, supportsVision: true, supportsCode: true, reasoningDepth: "shallow", supportsTools: true },
};

// Default capability requirements per unit type (mirrors UNIT_TYPE_TIERS).
// hook/* falls through to an empty requirements set (any model is fine).

const BASE_REQUIREMENTS: Record<string, Partial<ModelCapabilities>> = {
  "execute-task":     { supportsCode: true, supportsTools: true },
  "plan-slice":       { supportsCode: true },
  "plan-milestone":   { supportsCode: true },
  "replan-slice":     { supportsCode: true, reasoningDepth: "deep" },
  "reassess-roadmap": { supportsCode: true, reasoningDepth: "deep" },
  "research-slice":   {},
  "research-milestone": {},
  "discuss-slice":    {},
  "discuss-milestone": {},
  "complete-slice":   {},
  "run-uat":          {},
};

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Resolve the model to use for a given complexity tier.
 *
 * Downgrade-only: the returned model is always equal to or cheaper than
 * the user's configured primary model. Never upgrades beyond configuration.
 *
 * @param classification  The complexity classification result
 * @param phaseConfig     The user's configured model for this phase (ceiling)
 * @param routingConfig   Dynamic routing configuration
 * @param availableModelIds  List of available model IDs (from registry)
 * @param unitType        Optional unit type (e.g. "execute-task") for capability scoring
 * @param metadata        Optional task metadata for capability scoring
 */
export function resolveModelForComplexity(
  classification: ClassificationResult,
  phaseConfig: ResolvedModelConfig | undefined,
  routingConfig: DynamicRoutingConfig,
  availableModelIds: string[],
  unitType?: string,
  metadata?: TaskMetadata,
): RoutingDecision {
  // If no phase config or routing disabled, pass through
  if (!phaseConfig || !routingConfig.enabled) {
    return {
      modelId: phaseConfig?.primary ?? "",
      fallbacks: phaseConfig?.fallbacks ?? [],
      tier: classification.tier,
      wasDowngraded: false,
      reason: "dynamic routing disabled or no phase config",
      selectionMethod: "tier-only",
    };
  }

  const configuredPrimary = phaseConfig.primary;
  const configuredTier = getModelTier(configuredPrimary);
  const requestedTier = classification.tier;

  // If the configured model is unknown (not in MODEL_CAPABILITY_TIER),
  // honor the user's explicit choice — don't downgrade based on a guess.
  // Unknown models default to "heavy" in getModelTier, which makes every
  // standard/light unit get downgraded to tier_models, silently ignoring
  // the user's configuration. (#2192)
  if (!isKnownModel(configuredPrimary)) {
    return {
      modelId: configuredPrimary,
      fallbacks: phaseConfig.fallbacks,
      tier: requestedTier,
      wasDowngraded: false,
      reason: `configured model "${configuredPrimary}" is not in the known tier map — honoring explicit config`,
      selectionMethod: "tier-only",
    };
  }

  // Downgrade-only: if requested tier >= configured tier, no change
  if (tierOrdinal(requestedTier) >= tierOrdinal(configuredTier)) {
    return {
      modelId: configuredPrimary,
      fallbacks: phaseConfig.fallbacks,
      tier: requestedTier,
      wasDowngraded: false,
      reason: `tier ${requestedTier} >= configured ${configuredTier}`,
      selectionMethod: "tier-only",
    };
  }

  // Find the best model for the requested tier, optionally using capability scoring
  let targetModelId: string | null;
  let selectionMethod: "capability-score" | "tier-only" = "tier-only";

  if (routingConfig.capability_routing && unitType) {
    // Capability-aware selection: score tier candidates against task requirements
    const tierCandidates = availableModelIds.filter(id => getModelTier(id) === requestedTier);
    const requirements = computeTaskRequirements(unitType, metadata);
    const scored = scoreEligibleModels(tierCandidates, requirements);
    targetModelId = scored.length > 0 ? scored[0].id : null;
    selectionMethod = "capability-score";
  } else {
    targetModelId = findModelForTier(
      requestedTier,
      routingConfig,
      availableModelIds,
      routingConfig.cross_provider !== false,
    );
  }

  if (!targetModelId) {
    // No suitable model found — use configured primary
    return {
      modelId: configuredPrimary,
      fallbacks: phaseConfig.fallbacks,
      tier: requestedTier,
      wasDowngraded: false,
      reason: `no ${requestedTier}-tier model available`,
      selectionMethod,
    };
  }

  // Build fallback chain: [downgraded_model, ...configured_fallbacks, configured_primary]
  const fallbacks = [
    ...phaseConfig.fallbacks.filter(f => f !== targetModelId),
    configuredPrimary,
  ].filter(f => f !== targetModelId);

  return {
    modelId: targetModelId,
    fallbacks,
    tier: requestedTier,
    wasDowngraded: true,
    reason: classification.reason,
    selectionMethod,
  };
}

/**
 * Escalate to the next tier after a failure.
 * Returns the new tier, or null if already at heavy (max).
 */
export function escalateTier(currentTier: ComplexityTier): ComplexityTier | null {
  switch (currentTier) {
    case "light": return "standard";
    case "standard": return "heavy";
    case "heavy": return null;
  }
}

/**
 * Get the default routing config (all features enabled).
 */
export function defaultRoutingConfig(): DynamicRoutingConfig {
  return {
    enabled: false,
    escalate_on_failure: true,
    budget_pressure: true,
    cross_provider: true,
    hooks: true,
    capability_routing: false,
  };
}

// ─── Internal ────────────────────────────────────────────────────────────────

function getModelTier(modelId: string): ComplexityTier {
  // Strip provider prefix if present
  const bareId = modelId.includes("/") ? modelId.split("/").pop()! : modelId;

  // Check exact match first
  if (MODEL_CAPABILITY_TIER[bareId]) return MODEL_CAPABILITY_TIER[bareId];

  // Check if any known model ID is a prefix/suffix match
  for (const [knownId, tier] of Object.entries(MODEL_CAPABILITY_TIER)) {
    if (bareId.includes(knownId) || knownId.includes(bareId)) return tier;
  }

  // Unknown models are assumed heavy (safest assumption)
  return "heavy";
}

/** Check if a model ID has a known capability tier mapping. (#2192) */
function isKnownModel(modelId: string): boolean {
  const bareId = modelId.includes("/") ? modelId.split("/").pop()! : modelId;
  if (MODEL_CAPABILITY_TIER[bareId]) return true;
  for (const knownId of Object.keys(MODEL_CAPABILITY_TIER)) {
    if (bareId.includes(knownId) || knownId.includes(bareId)) return true;
  }
  return false;
}

function findModelForTier(
  tier: ComplexityTier,
  config: DynamicRoutingConfig,
  availableModelIds: string[],
  crossProvider: boolean,
): string | null {
  // 1. Check explicit tier_models config
  const explicitModel = config.tier_models?.[tier];
  if (explicitModel && availableModelIds.includes(explicitModel)) {
    return explicitModel;
  }
  // Also check with provider prefix stripped
  if (explicitModel) {
    const match = availableModelIds.find(id => {
      const bareAvail = id.includes("/") ? id.split("/").pop()! : id;
      const bareExplicit = explicitModel.includes("/") ? explicitModel.split("/").pop()! : explicitModel;
      return bareAvail === bareExplicit;
    });
    if (match) return match;
  }

  // 2. Auto-detect: find the cheapest available model in the requested tier
  const candidates = availableModelIds
    .filter(id => {
      const modelTier = getModelTier(id);
      return modelTier === tier;
    })
    .sort((a, b) => {
      if (!crossProvider) return 0;
      const costA = getModelCost(a);
      const costB = getModelCost(b);
      return costA - costB;
    });

  return candidates[0] ?? null;
}

function getModelCost(modelId: string): number {
  const bareId = modelId.includes("/") ? modelId.split("/").pop()! : modelId;

  if (MODEL_COST_PER_1K_INPUT[bareId] !== undefined) {
    return MODEL_COST_PER_1K_INPUT[bareId];
  }

  // Check partial matches
  for (const [knownId, cost] of Object.entries(MODEL_COST_PER_1K_INPUT)) {
    if (bareId.includes(knownId) || knownId.includes(bareId)) return cost;
  }

  // Unknown cost — assume expensive to avoid routing to unknown cheap models
  return 999;
}

// ─── Capability Scoring ───────────────────────────────────────────────────────

/**
 * Merge the base requirements for a unit type with signals from task metadata.
 * The resulting Partial<ModelCapabilities> is used to score candidate models.
 */
function computeTaskRequirements(
  unitType: string,
  metadata?: TaskMetadata,
): Partial<ModelCapabilities> {
  // hook/* → no specific requirements
  const base = unitType.startsWith("hook/")
    ? {}
    : (BASE_REQUIREMENTS[unitType] ?? {});

  const req: Partial<ModelCapabilities> = { ...base };

  if (metadata) {
    // Vision required if any tag signals images/screenshots
    if (metadata.tags?.some(t => /^(vision|image|screenshot|photo)$/i.test(t))) {
      req.supportsVision = true;
    }

    // Deep reasoning required for high-complexity tasks
    if (
      metadata.complexityKeywords?.some(k =>
        /^(architecture|concurrency|compatibility|migration)$/i.test(k),
      )
    ) {
      req.reasoningDepth = "deep";
    }

    // Tool usage required if the plan references tool calls / integrations
    if (metadata.complexityKeywords?.some(k => /^(integration|api|tool)$/i.test(k))) {
      req.supportsTools = true;
    }
  }

  return req;
}

/**
 * Score a single model against a requirements set.
 * Returns 0–1; unknown models (no profile) get 1.0 so they pass through.
 */
function scoreModel(modelId: string, requirements: Partial<ModelCapabilities>): number {
  const bareId = modelId.includes("/") ? modelId.split("/").pop()! : modelId;

  // Resolve profile — try exact, then partial match
  let profile = MODEL_CAPABILITY_PROFILES[bareId];
  if (!profile) {
    for (const [knownId, p] of Object.entries(MODEL_CAPABILITY_PROFILES)) {
      if (bareId.includes(knownId) || knownId.includes(bareId)) {
        profile = p;
        break;
      }
    }
  }

  // Unknown model: pass through with perfect score
  if (!profile) return 1.0;

  const fields = Object.keys(requirements) as (keyof ModelCapabilities)[];
  if (fields.length === 0) return 1.0;

  let matched = 0;
  for (const field of fields) {
    const required = requirements[field];
    if (required === undefined) continue;

    const actual = profile[field];
    if (field === "reasoningDepth") {
      const depthOrder = { shallow: 0, medium: 1, deep: 2 };
      const reqDepth = depthOrder[required as "shallow" | "medium" | "deep"] ?? 0;
      const actDepth = depthOrder[actual as "shallow" | "medium" | "deep"] ?? 0;
      if (actDepth >= reqDepth) matched++;
    } else if (field === "contextWindow") {
      if ((actual as number) >= (required as number)) matched++;
    } else {
      if (actual === required) matched++;
    }
  }

  return matched / fields.length;
}

/**
 * Score all candidate model IDs against requirements and return them sorted
 * descending by score (highest-scoring model first).
 */
function scoreEligibleModels(
  modelIds: string[],
  requirements: Partial<ModelCapabilities>,
): Array<{ id: string; score: number }> {
  return modelIds
    .map(id => ({ id, score: scoreModel(id, requirements) }))
    .sort((a, b) => b.score - a.score);
}
