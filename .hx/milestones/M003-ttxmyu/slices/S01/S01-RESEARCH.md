# S01 Research: Capability-Aware Model Routing + DB Reconciliation

## Summary

S01 adds **capability-scoring** on top of the existing tier-based model router, reconciles the upstream `gsd-db.ts` refactor into `hx-db.ts`, and ports `TaskMetadata` additions to `complexity-classifier.ts`. The existing codebase is substantially more complete than the CONTEXT estimated — the 504-line upstream model-router.ts delta against our 281-line `model-router.ts` is the core gap. Everything else (routing-history, complexity classifier, auto-model-selection wiring) is already present and correct.

**Starting baseline:** `tsc --noEmit` exits 0; `npm run test:unit` passes 4113/0/5.

---

## Codebase Landscape

### Files that exist and are relevant

| File | Lines | Role |
|---|---|---|
| `src/resources/extensions/hx/model-router.ts` | 281 | Tier-based routing only. Missing capability scoring. |
| `src/resources/extensions/hx/auto-model-selection.ts` | 230 | Wiring layer — calls `resolveModelForComplexity`, logs routing. Missing `taskMetadata` passthrough + `selectionMethod` log field. |
| `src/resources/extensions/hx/complexity-classifier.ts` | ~280 | Has `TaskMetadata` interface. May need additions for capability score inputs (e.g. `toolUsage`, `visionRequired` fields). |
| `src/resources/extensions/hx/routing-history.ts` | ~200 | Adaptive learning from outcomes. JSON file, not DB. Already wired. |
| `src/resources/extensions/hx/hx-db.ts` | 2169 | Schema v14. Has `slice_dependencies` table added in v14 but NO `slice_lock` table (needed by S02). DB reconciliation = add schema migrations for anything gsd-db.ts added. |
| `src/resources/extensions/hx/preferences-types.ts` | ~293 | `HXPreferences.dynamic_routing` field is `DynamicRoutingConfig`. `DynamicRoutingConfig` lives in `model-router.ts`. Needs `capability_routing` flag added. |
| `src/resources/extensions/hx/bootstrap/register-hooks.ts` | — | `model_select` hook is registered; it calls `syncServiceTierStatus`. The `before_model_select` mentioned in R011 is NOT a pi SDK hook — it's a conceptual label for internal auto-mode pre-dispatch logic. |
| `src/resources/extensions/hx/auto/phases.ts` | — | Calls `deps.selectAndApplyModel(...)`. No `taskMetadata` passed currently. |
| `src/resources/extensions/hx/auto/loop-deps.ts` | — | Types `selectAndApplyModel` signature. Needs `taskMetadata?` optional param added. |

### Tests that exist and will need additions

| Test file | What it covers |
|---|---|
| `tests/model-router.test.ts` | 207 lines, full tier-based routing coverage. Needs capability-score test cases added (new file or additions). |
| `tests/routing-history.test.ts` | Full adaptive history coverage. Not affected. |
| `tests/auto-model-selection.test.ts` | 139 lines. Tests `resolvePreferredModelConfig`. Not directly affected by capability scoring. |

---

## Gap Analysis: What Needs to Be Built

### 1. `model-router.ts` — capability scoring additions (~220 lines to add)

**What exists:** Tier-based `MODEL_CAPABILITY_TIER`, `resolveModelForComplexity`, `escalateTier`, `defaultRoutingConfig`.

**What's missing:**

```typescript
// New interface
interface ModelCapabilities {
  contextWindow: number;      // tokens
  supportsVision: boolean;
  supportsCode: boolean;
  reasoningDepth: "shallow" | "medium" | "deep";
  // ~3-4 more capability dimensions
}

// New profile map (9 known models: the existing 12 models in MODEL_CAPABILITY_TIER minus ~3)
const MODEL_CAPABILITY_PROFILES: Record<string, ModelCapabilities>

// New requirements baseline (11 unit types from UNIT_TYPE_TIERS + hooks)
const BASE_REQUIREMENTS: Record<string, Partial<ModelCapabilities>>

// New scoring functions
function computeTaskRequirements(unitType: string, metadata?: TaskMetadata): Partial<ModelCapabilities>
function scoreModel(modelId: string, requirements: Partial<ModelCapabilities>): number
function scoreEligibleModels(modelIds: string[], requirements: Partial<ModelCapabilities>): Array<{id: string; score: number}>

// RoutingDecision gets a new field
interface RoutingDecision {
  // existing fields...
  selectionMethod: "capability-score" | "tier-only";
}

// DynamicRoutingConfig gets a new flag
interface DynamicRoutingConfig {
  // existing fields...
  capability_routing?: boolean;  // when true, use capability scoring; default: false (tier-only)
}
```

**Architectural decision:** Capability scoring is an **opt-in enhancement** gated by `capability_routing: true` in preferences. When disabled, existing tier-based routing runs unchanged (`selectionMethod: "tier-only"`). When enabled, `scoreEligibleModels` replaces the cheap-cost sort in `findModelForTier`, and `selectionMethod: "capability-score"` is logged.

### 2. `auto-model-selection.ts` — taskMetadata passthrough + selectionMethod log

**What's missing:**
- `selectAndApplyModel` accepts an optional `metadata?: TaskMetadata` parameter
- When `routingResult.selectionMethod === "capability-score"`, the notify message changes from `Dynamic routing [L]: model` to `Dynamic routing [L] (capability-score): model`
- `metadata` is passed through to `classifyUnitComplexity` (it already accepts an optional `metadata` 5th param)

**Impact on `loop-deps.ts`:** The `selectAndApplyModel` signature in `LoopDeps` needs `taskMetadata?` added.

**Impact on `auto/phases.ts`:** The call site at line 1005 needs to pass task metadata. The metadata can be extracted from the task plan (which is already done inside `classifyUnitComplexity` via `extractTaskMetadata`), so the passthrough may be optional — but for capability scoring, richer metadata from the DB (e.g. estimated lines from task planning DB record) could be passed in.

### 3. `complexity-classifier.ts` — TaskMetadata additions

The existing `TaskMetadata` interface already has: `fileCount`, `dependencyCount`, `isNewFile`, `tags`, `estimatedLines`, `codeBlockCount`, `complexityKeywords`.

**Likely additions for capability scoring:**
- `toolUsage?: string[]` — which tools the task plan references (bash, browser, etc.)
- `visionRequired?: boolean` — whether screenshots/images are mentioned
- `requiresReasoning?: boolean` — whether the task explicitly involves multi-step deduction

These feed `computeTaskRequirements` to produce better capability requirements.

### 4. `hx-db.ts` — DB Reconciliation

**Current state:** Schema v14 with `slice_dependencies` table.

**What gsd-db.ts upstream likely added (to reconcile into hx-db.ts):**
- Based on context, gsd-db.ts refactored the DB layer and likely added functions/tables needed for slice-level parallelism (S02). The most probable additions:
  - `slice_lock` table: `(milestone_id, slice_id, worker_pid, acquired_at, expires_at)` — for HX_SLICE_LOCK coordination
  - OR: DB-stored routing scores table
  - OR: Additional reconciliation query changes for worktree DB merge

**Investigation required in T01:** Diff what S02 needs from DB vs what currently exists. If `slice_lock` table is needed, add it as schema v15 with migration. If gsd-db.ts only restructured existing functions without new tables, reconciliation may be a no-op (D016 already decided: single hx-db.ts, no duplicate).

**Critical note:** S02 R012 description explicitly mentions "state.ts slice lock handling in DB-backed and legacy paths" — this implies DB lock storage, so schema v15 with `slice_locks` table is the likely requirement for S01 DB reconciliation.

---

## Integration Points

- `src/resources/extensions/hx/preferences-types.ts` — `DynamicRoutingConfig` is imported from `model-router.ts`, so adding `capability_routing` to `DynamicRoutingConfig` automatically updates the preferences type.
- `src/resources/extensions/hx/preferences-models.ts` — `resolveDynamicRoutingConfig()` merges with defaults; `defaultRoutingConfig()` needs `capability_routing: false` as default.
- `src/resources/extensions/hx/auto/loop-deps.ts` — `selectAndApplyModel` type signature change (add optional `taskMetadata?`)
- `src/resources/extensions/hx/auto/phases.ts` — call site update (pass metadata if available)

---

## Verification Commands

```bash
# After each task:
npx tsc --noEmit        # must exit 0

# After T02 (tests):
npm run test:unit 2>&1 | tail -5   # must still be 4113+/0/5

# Routing log check (manual):
# grep "capability-score" in verbose auto-mode output
```

---

## Task Decomposition Recommendation

**T01 — DB Reconciliation + Schema v15**
- Investigate what hx-db.ts needs from gsd-db.ts by checking what S02 needs (slice_lock table)
- Add `slice_locks` table as schema v15 migration in `hx-db.ts`
- Add accessor functions: `acquireSliceLock`, `releaseSliceLock`, `getSliceLock`, `cleanExpiredSliceLocks`
- Files: `hx-db.ts`
- Verify: `tsc --noEmit`; schema migration test

**T02 — Capability Scoring in model-router.ts**
- Add `ModelCapabilities` interface, `MODEL_CAPABILITY_PROFILES` (9 models), `BASE_REQUIREMENTS` (11 unit types)
- Add `computeTaskRequirements`, `scoreModel`, `scoreEligibleModels` functions
- Add `capability_routing` flag to `DynamicRoutingConfig`
- Add `selectionMethod: "capability-score" | "tier-only"` to `RoutingDecision`
- Update `resolveModelForComplexity` to use capability scoring when `capability_routing: true`
- Update `defaultRoutingConfig` to add `capability_routing: false`
- Files: `model-router.ts`
- Verify: `tsc --noEmit`; existing model-router tests still pass

**T03 — TaskMetadata additions + selectAndApplyModel wiring**
- Add `toolUsage?`, `visionRequired?`, `requiresReasoning?` to `TaskMetadata` in `complexity-classifier.ts`
- Update `extractTaskMetadata` to populate new fields
- Add `taskMetadata?` param to `selectAndApplyModel` in `auto-model-selection.ts` and `loop-deps.ts`
- Update `selectionMethod` log in notify
- Update call site in `phases.ts`
- Files: `complexity-classifier.ts`, `auto-model-selection.ts`, `auto/loop-deps.ts`, `auto/phases.ts`
- Verify: `tsc --noEmit`; all routing tests pass

**T04 — Capability-router tests**
- Write `tests/capability-router.test.ts` covering:
  - `scoreModel` returns higher score for models matching requirements
  - `scoreEligibleModels` ranks models correctly
  - `computeTaskRequirements` returns vision=true for vision unit types
  - `resolveModelForComplexity` uses capability scoring when `capability_routing: true`
  - `selectionMethod: "capability-score"` in result when capability routing active
  - `selectionMethod: "tier-only"` when capability routing disabled
- Files: `tests/capability-router.test.ts`
- Verify: `npm run test:unit` — new tests pass, 0 regressions

---

## Risks and Constraints

**R1 — DB reconciliation scope is uncertain.** The "gsd-db.ts" upstream refactor may be additive (new tables for S02) or structural (new query patterns). T01 must establish ground truth. If the upstream gsd-db.ts only restructured existing queries (no new tables), T01 becomes a verification-only task. If it adds `slice_locks`, T01 adds schema v15.

**R2 — capability_routing flag must default to false.** Changing the default would alter behavior for all existing users. Capability scoring is opt-in. The `defaultRoutingConfig()` function must return `capability_routing: false`.

**R3 — MODEL_CAPABILITY_PROFILES coverage is bounded.** The profiles cover only known models (the 15 in `MODEL_CAPABILITY_TIER` / `MODEL_COST_PER_1K_INPUT`). Unknown models fall through to tier-only routing — same behavior as `isKnownModel()` guard already in place.

**R4 — TaskMetadata passthrough is optional for correctness.** The `extractTaskMetadata` call inside `classifyUnitComplexity` already reads the task plan from disk. The explicit passthrough from `phases.ts` is an optimization (DB-sourced metadata can be richer), not a correctness requirement. T03 can use a minimal passthrough initially.

**R5 — "before_model_select" is NOT a pi SDK hook.** The `pi.on("model_select", ...)` hook fires after model selection, not before. The capability scorer runs inside `selectAndApplyModel` (before `pi.setModel`), so no new hook registration is needed.

---

## No Don't-Hand-Roll / External Libraries Needed

All scoring logic is pure math over static config tables. No external dependencies. Routing history already exists as a JSON file. The DB reconciliation uses the existing `hx-db.ts` migration pattern (schema versioning, `ensureColumn`, `migrateSchema`).
