---
estimated_steps: 18
estimated_files: 1
skills_used: []
---

# T04: capability-router tests + slice verification

Write `src/resources/extensions/hx/tests/capability-router.test.ts` covering the new capability scoring layer, then run the full slice verification.

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

## Inputs

- ``src/resources/extensions/hx/model-router.ts``
- ``src/resources/extensions/hx/complexity-classifier.ts``
- ``src/resources/extensions/hx/tests/model-router.test.ts``

## Expected Output

- ``src/resources/extensions/hx/tests/capability-router.test.ts``

## Verification

npx tsc --noEmit && node scripts/compile-tests.mjs 2>&1 | tail -3 && npm run test:unit 2>&1 | grep -E 'pass|fail|skip' | tail -3 && grep -rn 'GSD' src/resources/extensions/hx/model-router.ts src/resources/extensions/hx/hx-db.ts src/resources/extensions/hx/tests/capability-router.test.ts 2>/dev/null | grep -v '^Binary' || echo 'GSD check: 0 hits'
