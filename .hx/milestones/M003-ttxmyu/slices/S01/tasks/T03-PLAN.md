---
estimated_steps: 21
estimated_files: 4
skills_used: []
---

# T03: TaskMetadata additions + selectAndApplyModel wiring

Wire the capability scoring inputs through the stack: add new fields to TaskMetadata, update extractTaskMetadata, add taskMetadata? param to selectAndApplyModel, update loop-deps.ts type, update phases.ts call site, update selectionMethod log in notify.

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

## Inputs

- ``src/resources/extensions/hx/complexity-classifier.ts``
- ``src/resources/extensions/hx/auto-model-selection.ts``
- ``src/resources/extensions/hx/auto/loop-deps.ts``
- ``src/resources/extensions/hx/auto/phases.ts``
- ``src/resources/extensions/hx/model-router.ts``

## Expected Output

- ``src/resources/extensions/hx/complexity-classifier.ts``
- ``src/resources/extensions/hx/auto-model-selection.ts``
- ``src/resources/extensions/hx/auto/loop-deps.ts``
- ``src/resources/extensions/hx/auto/phases.ts``

## Verification

npx tsc --noEmit && grep -n 'toolUsage\|visionRequired\|requiresReasoning' src/resources/extensions/hx/complexity-classifier.ts && grep -n 'selectionMethod' src/resources/extensions/hx/auto-model-selection.ts && npm run test:unit 2>&1 | tail -5
