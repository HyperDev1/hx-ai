---
estimated_steps: 23
estimated_files: 5
skills_used: []
---

# T02: Guided-flow session isolation and routing fixes

Port all 4 guided-flow commits into `src/resources/extensions/hx/guided-flow.ts` (1643-line file).

Commit cf6f7d4ef — session isolation (pervasive):
1. Replace `let pendingAutoStart: { ctx, pi, basePath, milestoneId, step? } | null = null` with `interface PendingAutoStartEntry { ctx, pi, basePath, milestoneId, step?: boolean }` and `const pendingAutoStartMap = new Map<string, PendingAutoStartEntry>()`.
2. Add internal `_getPendingAutoStart(basePath?: string)` that returns `pendingAutoStartMap.get(basePath ?? "")` or first entry.
3. Export `setPendingAutoStart(basePath: string, entry: PendingAutoStartEntry)` and `clearPendingAutoStart(basePath?: string)`.
4. Change `getDiscussionMilestoneId()` to `getDiscussionMilestoneId(basePath?: string)` with keyed lookup via `_getPendingAutoStart(basePath)`.
5. Replace every `pendingAutoStart = { ... }` with `pendingAutoStartMap.set(basePath, { ... })`.
6. Replace every `pendingAutoStart = null` with `pendingAutoStartMap.delete(basePath ?? "")`.
7. Replace `if (pendingAutoStart)` guards with `if (pendingAutoStartMap.has(basePath ?? ""))`.

Commit 71c5fc933 — dynamic routing in dispatchWorkflow():
1. In `dispatchWorkflow()`: remove import of `resolveModelWithFallbacksForUnit` from `./preferences-models.js`. Add/confirm import of `selectAndApplyModel` from `./auto-model-selection.js`.
2. Replace the `const modelConfig = resolveModelWithFallbacksForUnit(unitType)` + manual model loop with `await selectAndApplyModel(ctx, pi, unitType, "", process.cwd(), prefs, false, null)`.

Commit bc04b9517 — route allDiscussed and zero-slices to queued milestone discussion:
1. In `showDiscuss()`, at the `if (pendingSlices.length === 0)` block (~L631): instead of just notifying and returning, check for pending milestones and route to `showDiscussQueuedMilestone`.
2. At the `if (allDiscussed)` block (~L650): similarly add pending milestone check before returning.

Commit 9c943f4a3 — roadmap fallback when DB open but empty:
1. In `showDiscuss()`, after `normSlices = getMilestoneSlices(mid).map(...)`, add: `if (normSlices.length === 0 && roadmapContent) { normSlices = parseRoadmapSlices(roadmapContent).map(s => ({ id: s.id, done: s.done, title: s.title })); }`
2. If `parseRoadmapSlices` is not already imported, add `import { parseRoadmapSlices } from "./roadmap-slices.js"`.

Tests:
- NEW: `src/resources/extensions/hx/tests/guided-flow-session-isolation.test.ts` (97 lines): imports `setPendingAutoStart`, `clearPendingAutoStart`, `getDiscussionMilestoneId` from `../guided-flow.ts`. Tests that separate basePaths get isolated state.
- NEW: `src/resources/extensions/hx/tests/guided-flow-dynamic-routing.test.ts` (135 lines): structural assertion that `dispatchWorkflow` source uses `selectAndApplyModel`.
- APPEND: `src/resources/extensions/hx/tests/discuss-queued-milestones.test.ts` — append tests 12 and 13 (44 lines from upstream diff, adapt `.gsd`→`.hx`).
- NEW: `src/resources/extensions/hx/tests/discuss-empty-db-fallback.test.ts` (127 lines): pure unit test of `parseRoadmapSlices` fallback logic, adapt `.gsd`→`.hx` paths.

## Inputs

- `src/resources/extensions/hx/guided-flow.ts`
- `src/resources/extensions/hx/auto-model-selection.ts`
- `src/resources/extensions/hx/roadmap-slices.ts`
- `src/resources/extensions/hx/tests/discuss-queued-milestones.test.ts`

## Expected Output

- `src/resources/extensions/hx/guided-flow.ts`
- `src/resources/extensions/hx/tests/guided-flow-session-isolation.test.ts`
- `src/resources/extensions/hx/tests/guided-flow-dynamic-routing.test.ts`
- `src/resources/extensions/hx/tests/discuss-queued-milestones.test.ts`
- `src/resources/extensions/hx/tests/discuss-empty-db-fallback.test.ts`

## Verification

npx tsc --noEmit && node --test dist-test/src/resources/extensions/hx/tests/guided-flow-session-isolation.test.js dist-test/src/resources/extensions/hx/tests/guided-flow-dynamic-routing.test.js dist-test/src/resources/extensions/hx/tests/discuss-queued-milestones.test.js dist-test/src/resources/extensions/hx/tests/discuss-empty-db-fallback.test.js
