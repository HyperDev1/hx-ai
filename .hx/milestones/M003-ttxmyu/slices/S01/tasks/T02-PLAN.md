---
estimated_steps: 46
estimated_files: 1
skills_used: []
---

# T02: model-router.ts: ModelCapabilities scoring layer

Add capability-aware scoring on top of the existing tier-based router. This is a pure additive change — existing behavior is unchanged when capability_routing is false (the default).

Steps:
1. Read model-router.ts in full to understand current structure.
2. Add the following types and constants after the existing `MODEL_COST_PER_1K_INPUT` block:

   **Interface:**
   ```typescript
   export interface ModelCapabilities {
     contextWindow: number;       // tokens
     supportsVision: boolean;
     supportsCode: boolean;
     reasoningDepth: "shallow" | "medium" | "deep";
     supportsTools: boolean;
   }
   ```

   **Profiles map** covering all 17 models in MODEL_CAPABILITY_TIER. Unknown models are handled by the existing fallthrough logic. Example entries:
   - claude-opus-4-6: { contextWindow: 200000, supportsVision: true, supportsCode: true, reasoningDepth: "deep", supportsTools: true }
   - claude-haiku-4-5: { contextWindow: 200000, supportsVision: true, supportsCode: true, reasoningDepth: "shallow", supportsTools: true }
   - gpt-4o-mini: { contextWindow: 128000, supportsVision: true, supportsCode: true, reasoningDepth: "shallow", supportsTools: true }
   - o1/o3: { contextWindow: 128000, supportsVision: false, supportsCode: true, reasoningDepth: "deep", supportsTools: false }
   - gemini-2.0-flash: { contextWindow: 1000000, supportsVision: true, supportsCode: true, reasoningDepth: "shallow", supportsTools: true }
   - deepseek-chat: { contextWindow: 65536, supportsVision: false, supportsCode: true, reasoningDepth: "medium", supportsTools: true }

   **BASE_REQUIREMENTS map** — default requirements per UNIT_TYPE_TIERS unit type (11 entries + hook/* fallthrough):
   ```typescript
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
   ```

3. Add three scoring functions (internal, not exported):
   - `computeTaskRequirements(unitType, metadata?)`: merges BASE_REQUIREMENTS[unitType] with metadata signals (e.g. visionRequired → supportsVision: true, requiresReasoning → reasoningDepth: "deep", toolUsage → supportsTools: true)
   - `scoreModel(modelId, requirements)`: returns 0–1 score; for each requirement field present, check if model meets it; score = matched/total. Returns 1.0 for models with no profile (unknown models pass through).
   - `scoreEligibleModels(modelIds, requirements)`: maps each id through scoreModel, returns sorted array of `{id, score}`

4. Update `DynamicRoutingConfig` — add `capability_routing?: boolean`.

5. Update `RoutingDecision` — add `selectionMethod: "capability-score" | "tier-only"`.

6. Update `resolveModelForComplexity`: at the point where `findModelForTier` is called, if `routingConfig.capability_routing` is true, instead call `scoreEligibleModels` on the tier-filtered candidates and pick the highest-scoring one. Set `selectionMethod` accordingly on the returned decision.

7. Update `defaultRoutingConfig` to include `capability_routing: false`.

8. Run `npx tsc --noEmit` and `npm run test:unit 2>&1 | tail -5` — both must pass.

## Inputs

- ``src/resources/extensions/hx/model-router.ts``
- ``src/resources/extensions/hx/complexity-classifier.ts``

## Expected Output

- ``src/resources/extensions/hx/model-router.ts``

## Verification

npx tsc --noEmit && grep -n 'selectionMethod' src/resources/extensions/hx/model-router.ts && grep -n 'capability_routing' src/resources/extensions/hx/model-router.ts && npm run test:unit 2>&1 | tail -5
