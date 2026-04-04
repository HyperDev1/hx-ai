---
estimated_steps: 19
estimated_files: 11
skills_used: []
---

# T03: DB/dispatch micro-fixes (5 small focused patches)

Port 5 small independent commits: 0a6d1e52d, 4c12ba34a, b7236743c, ca6071ad3, a26f187e0.

Commit 0a6d1e52d — preserve milestone title in upsertMilestonePlanning:
1. `hx-db.ts` line ~1168: Change signature to `upsertMilestonePlanning(milestoneId: string, planning: Partial<MilestonePlanningRecord>, title?: string): void`. In the SQL UPDATE, add `title = COALESCE(:title, title),` after `SET`. In `.run()`, add `":title": title ?? null,`.
2. `tools/plan-milestone.ts`: Change `upsertMilestonePlanning(params.milestoneId, {...})` to `upsertMilestonePlanning(params.milestoneId, {...}, params.title)`.

Commit 4c12ba34a — invalidate stale milestone validation on roadmap reassessment:
1. `tools/reassess-roadmap.ts`: Add `import { existsSync, unlinkSync } from "node:fs"` if not present. After the `for (const removedId of params.sliceChanges.removed)` loop in the DB transaction, add a `hasStructuralChanges` block calling `deleteAssessmentByScope(params.milestoneId, "milestone-validation")` (already in hx-db.ts at L2011 — just import it). After the render block, add VALIDATION.md file deletion: `join(basePath, ".hx", "milestones", params.milestoneId, "VALIDATION.md")`.

Commit b7236743c — widen completing-milestone gate:
1. `auto-dispatch.ts`: Add exported `isVerificationNotApplicable(value: string): boolean` helper that returns true for empty string, "none", "n/a", "not applicable" (case-insensitive). Replace the gate condition at ~L675 from `milestone.verification_operational.toLowerCase() !== "none"` to `!isVerificationNotApplicable(milestone.verification_operational)`.

Commit ca6071ad3 — align run-uat artifact path to ASSESSMENT:
1. `auto-artifact-paths.ts` in `resolveExpectedArtifactPath`, case `"run-uat"`: change `buildSliceFileName(sid!, "UAT")` to `buildSliceFileName(sid!, "ASSESSMENT")`.
2. `auto-artifact-paths.ts` in `diagnoseExpectedArtifact`, case `"run-uat"`: change `relSliceFile(base, mid, sid!, "UAT")` to `relSliceFile(base, mid, sid!, "ASSESSMENT")`.
3. `auto-prompts.ts`: Change `relSliceFile(base, mid, sliceId, "UAT")` in the `uatResultPath` assignment to `relSliceFile(base, mid, sliceId, "ASSESSMENT")`.

Commit a26f187e0 — roadmap H3 header parser:
1. `roadmap-slices.ts` in `parseProseSliceHeaders()` at L224: Broaden `headerPattern` regex to also accept optional leading whitespace, numeric prefixes like `1.`, parenthetical numbering like `(3)`, and square brackets like `[S01]`. New regex should be something like: `/^\s*(?:\d+\.\s+|\(\d+\)\s+)?#{1,4}\s+\*{0,2}(?:✓\s+)?(?:Slice\s+)?(S\d+)\*{0,2}[:\s.—–-]*\s*(.+)/gm` or adapt to match the upstream diff exactly.

Tests:
- NEW: `src/resources/extensions/hx/tests/plan-milestone-title.test.ts` (70 lines, adapt `.gsd`→`.hx`, `gsd-db`→`hx-db`, `GSD_STALE_STATE`→`HX_STALE_STATE`)
- APPEND: `src/resources/extensions/hx/tests/reassess-handler.test.ts` — append the `#2957` test block (117 lines, adapt hx paths, `HX_STALE_STATE`)
- NEW: `src/resources/extensions/hx/tests/verification-operational-gate.test.ts` (82 lines, import `isVerificationNotApplicable` from `../auto-dispatch.ts`)
- APPEND: `src/resources/extensions/hx/tests/roadmap-slices.test.ts` — append 97-line test block for new format variants

## Inputs

- `src/resources/extensions/hx/hx-db.ts`
- `src/resources/extensions/hx/tools/plan-milestone.ts`
- `src/resources/extensions/hx/tools/reassess-roadmap.ts`
- `src/resources/extensions/hx/auto-dispatch.ts`
- `src/resources/extensions/hx/auto-artifact-paths.ts`
- `src/resources/extensions/hx/auto-prompts.ts`
- `src/resources/extensions/hx/roadmap-slices.ts`
- `src/resources/extensions/hx/tests/reassess-handler.test.ts`
- `src/resources/extensions/hx/tests/roadmap-slices.test.ts`

## Expected Output

- `src/resources/extensions/hx/hx-db.ts`
- `src/resources/extensions/hx/tools/plan-milestone.ts`
- `src/resources/extensions/hx/tools/reassess-roadmap.ts`
- `src/resources/extensions/hx/auto-dispatch.ts`
- `src/resources/extensions/hx/auto-artifact-paths.ts`
- `src/resources/extensions/hx/auto-prompts.ts`
- `src/resources/extensions/hx/roadmap-slices.ts`
- `src/resources/extensions/hx/tests/plan-milestone-title.test.ts`
- `src/resources/extensions/hx/tests/reassess-handler.test.ts`
- `src/resources/extensions/hx/tests/verification-operational-gate.test.ts`
- `src/resources/extensions/hx/tests/roadmap-slices.test.ts`

## Verification

npx tsc --noEmit && node --test dist-test/src/resources/extensions/hx/tests/plan-milestone-title.test.js dist-test/src/resources/extensions/hx/tests/reassess-handler.test.js dist-test/src/resources/extensions/hx/tests/verification-operational-gate.test.js dist-test/src/resources/extensions/hx/tests/roadmap-slices.test.js
