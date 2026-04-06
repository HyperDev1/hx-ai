# S01: Capability-Aware Model Routing + DB Reconciliation

**Goal:** Port capability-aware model routing from upstream: add ModelCapabilities scoring layer to model-router.ts, wire TaskMetadata passthrough in auto-model-selection.ts, add slice_locks schema v15 to hx-db.ts for S02, and prove with capability-router tests.
**Demo:** After this: After this: routing log shows selectionMethod: 'capability-score' or 'tier-only'; capability-router tests pass; tsc clean baseline for S02–S06

## Tasks
- [x] **T01: Added slice_locks table as schema v15 in hx-db.ts with four accessor functions for S02 distributed lock coordination** — Add the slice_locks table as schema v15 in hx-db.ts. This table is required by S02 (slice-level parallelism) for DB-backed lock coordination. Add four accessor functions: acquireSliceLock, releaseSliceLock, getSliceLock, and cleanExpiredSliceLocks.

Steps:
1. Read hx-db.ts lines 158–168 to confirm SCHEMA_VERSION = 14 and the pattern used for prior migrations.
2. Bump SCHEMA_VERSION from 14 to 15.
3. Add a `currentVersion < 15` migration block immediately after the v14 block (after line ~755). The block creates:
   ```sql
   CREATE TABLE IF NOT EXISTS slice_locks (
     milestone_id TEXT NOT NULL,
     slice_id TEXT NOT NULL,
     worker_pid INTEGER NOT NULL,
     acquired_at TEXT NOT NULL,
     expires_at TEXT NOT NULL,
     PRIMARY KEY (milestone_id, slice_id)
   )
   ```
   Then inserts `schema_version` row for version 15.
4. Add four exported functions after the existing slice_dependencies accessors (~line 1730):
   - `acquireSliceLock(db, milestoneId, sliceId, workerPid, ttlMs)`: INSERT OR IGNORE; returns boolean (true if acquired)
   - `releaseSliceLock(db, milestoneId, sliceId, workerPid)`: DELETE WHERE pid matches
   - `getSliceLock(db, milestoneId, sliceId)`: returns lock row or null
   - `cleanExpiredSliceLocks(db)`: DELETE WHERE expires_at < now
5. Run `npx tsc --noEmit` — must exit 0.
  - Estimate: 45m
  - Files: src/resources/extensions/hx/hx-db.ts
  - Verify: npx tsc --noEmit && grep -n 'SCHEMA_VERSION = 15' src/resources/extensions/hx/hx-db.ts && grep -n 'slice_locks' src/resources/extensions/hx/hx-db.ts | wc -l | awk '{if($1>=4) print "OK"; else print "FAIL: expected >=4 slice_locks references"}'
- [x] **T02: Added ModelCapabilities scoring layer to model-router.ts: profiles for 17 models, BASE_REQUIREMENTS, scoreModel/scoreEligibleModels, capability_routing flag, and selectionMethod on RoutingDecision** — Add capability-aware scoring on top of the existing tier-based router. This is a pure additive change — existing behavior is unchanged when capability_routing is false (the default).

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
  - Estimate: 75m
  - Files: src/resources/extensions/hx/model-router.ts
  - Verify: npx tsc --noEmit && grep -n 'selectionMethod' src/resources/extensions/hx/model-router.ts && grep -n 'capability_routing' src/resources/extensions/hx/model-router.ts && npm run test:unit 2>&1 | tail -5
- [x] **T03: Wired TaskMetadata capability fields (toolUsage/visionRequired/requiresReasoning) through selectAndApplyModel stack with capability-score routing log suffix** — Wire the capability scoring inputs through the stack: add new fields to TaskMetadata, update extractTaskMetadata, add taskMetadata? param to selectAndApplyModel, update loop-deps.ts type, update phases.ts call site, update selectionMethod log in notify.

Steps:
1. Read complexity-classifier.ts. Add three optional fields to TaskMetadata interface:
   ```typescript
   toolUsage?: string[];          // tool names referenced in plan (bash, browser, etc.)
   visionRequired?: boolean;      // plan mentions screenshot/image/vision
   requiresReasoning?: boolean;   // plan mentions multi-step deduction/analysis
   ```
   In extractTaskMetadata, populate them:
   - toolUsage: scan for \bbash\b, \bbrowser\b, \blsp\b, \bmac_\b patterns in content; collect matches
   - visionRequired: content.match(/\b(screenshot|image|vision|visual)\b/i) !== null
   - requiresReasoning: content.match(/\b(reason|deduc|infer|analyz|diagnos)\b/i) !== null

2. Read auto-model-selection.ts. In selectAndApplyModel:
   a. Add optional `metadata?: TaskMetadata` parameter (after retryContext)
   b. Import TaskMetadata from complexity-classifier.js
   c. Pass metadata to classifyUnitComplexity call (it already has a 5th optional param)
   d. After the `if (routingResult.wasDowngraded)` block, check routingResult.selectionMethod — if it is 'capability-score', change the notify message from `Dynamic routing [${tierLabel}]:` to `Dynamic routing [${tierLabel}] (capability-score):`

3. Read loop-deps.ts. Update the selectAndApplyModel type signature to add `metadata?: TaskMetadata` after retryContext param. Import or inline TaskMetadata type as needed.

4. Read phases.ts around line 1005. The call `deps.selectAndApplyModel(...)` currently passes 9 args. Add `undefined` as the 10th arg (metadata) to match the updated signature — this is a no-op for now but satisfies TypeScript. The executor may choose to wire richer metadata from the DB record if straightforward.

5. Run `npx tsc --noEmit` — must exit 0.
6. Run `npm run test:unit 2>&1 | tail -5` — must still pass.
  - Estimate: 60m
  - Files: src/resources/extensions/hx/complexity-classifier.ts, src/resources/extensions/hx/auto-model-selection.ts, src/resources/extensions/hx/auto/loop-deps.ts, src/resources/extensions/hx/auto/phases.ts
  - Verify: npx tsc --noEmit && grep -n 'toolUsage\|visionRequired\|requiresReasoning' src/resources/extensions/hx/complexity-classifier.ts && grep -n 'selectionMethod' src/resources/extensions/hx/auto-model-selection.ts && npm run test:unit 2>&1 | tail -5
- [x] **T04: Wrote capability-router.test.ts with 19 tests covering all capability-routing branches; full suite passes 4132 tests, tsc clean, 0 GSD hits** — Write `src/resources/extensions/hx/tests/capability-router.test.ts` covering the new capability scoring layer, then run the full slice verification.

Note: this project's tests live in src/resources/extensions/hx/tests/ as .test.ts files. They are compiled by scripts/compile-tests.mjs into dist-test/ and run with `npm run test:unit`. New .test.ts files placed in this directory are auto-compiled.

Steps:
1. Read src/resources/extensions/hx/tests/model-router.test.ts for the test file pattern (node:test + node:assert/strict, imports from ../model-router.js).
2. Create src/resources/extensions/hx/tests/capability-router.test.ts with at minimum these test cases:
   a. `scoreModel` returns higher score for models that match all requirements vs models that don't — requires exporting scoreModel or testing indirectly through resolveModelForComplexity
   b. `resolveModelForComplexity` with `capability_routing: true` returns `selectionMethod: "capability-score"`
   c. `resolveModelForComplexity` with `capability_routing: false` returns `selectionMethod: "tier-only"`
   d. `resolveModelForComplexity` with `capability_routing: true` and visionRequired=true in metadata picks a vision-capable model over a non-vision model at the same tier (if available)
   e. `defaultRoutingConfig()` returns `capability_routing: false`
   f. `computeTaskRequirements` for 'replan-slice' returns `reasoningDepth: "deep"` (or test through resolveModelForComplexity behavior)
   g. Existing tier-based routing tests still pass (selectionMethod: tier-only in all legacy scenarios)

   Note: If scoreModel/computeTaskRequirements are internal (not exported), test them indirectly through resolveModelForComplexity with capability_routing: true. Alternatively, export them from model-router.ts for testability.

3. Compile and run: `node scripts/compile-tests.mjs 2>&1 | tail -5 && npm run test:unit 2>&1 | tail -10`
4. Run final slice verification:
   - `npx tsc --noEmit` — exits 0
   - `npm run test:unit 2>&1 | tail -5` — 0 new failures
   - `grep -r 'GSD' src/resources/extensions/hx/model-router.ts src/resources/extensions/hx/hx-db.ts src/resources/extensions/hx/complexity-classifier.ts src/resources/extensions/hx/auto-model-selection.ts src/resources/extensions/hx/tests/capability-router.test.ts` — 0 hits
  - Estimate: 45m
  - Files: src/resources/extensions/hx/tests/capability-router.test.ts
  - Verify: npx tsc --noEmit && node scripts/compile-tests.mjs 2>&1 | tail -3 && npm run test:unit 2>&1 | grep -E 'pass|fail|skip' | tail -3 && grep -rn 'GSD' src/resources/extensions/hx/model-router.ts src/resources/extensions/hx/hx-db.ts src/resources/extensions/hx/tests/capability-router.test.ts 2>/dev/null | grep -v '^Binary' || echo 'GSD check: 0 hits'
