# S03 Research: Requirements Seed + Slice Context Injection + DB Guard

## Summary

S03 has three requirements (R024, R025, R026). Two are **already fully implemented** from the upstream port applied during an earlier phase. The remaining work is entirely R026: the `hx_milestone_status` read-only tool, DB bash-access guard blocks in 5 high-risk prompt files, and 14 regression tests.

### What's Already Done

**R024 — Requirements DB auto-seed (DONE)**

`src/resources/extensions/hx/db-writer.ts`, function `updateRequirementInDb` (~L370–430), contains "Cluster 20" logic: when `getRequirementById(id)` returns null, it reads `.hx/REQUIREMENTS.md`, calls `parseRequirementsSections()`, inserts every parsed requirement via `upsertRequirement()` (INSERT OR IGNORE semantics), then retries the lookup. If the ID still isn't found (not in REQUIREMENTS.md either), it throws `HXError(HX_STALE_STATE, "Requirement <id> not found")`. The existing `updateRequirementInDb — not found` test in `db-writer.test.ts` still passes because the tmpDir has no REQUIREMENTS.md, so the seed path hits `existsSync → false` and skips.

**R025 — Slice context injection to 5 builders (DONE)**

All 5 target builders in `src/resources/extensions/hx/auto-prompts.ts` already inject `sliceContextInline` via `inlineFileOptional(resolveSliceFile(base, mid, sid, "CONTEXT"), ..., "Slice Context (from discussion)")`:

| Builder | Line range |
|---|---|
| `buildResearchSlicePrompt` | L992–995 |
| `buildPlanSlicePrompt` | L1047–1050 |
| `buildCompleteSlicePrompt` | L1273–1276 |
| `buildReplanSlicePrompt` | L1529–1532 |
| `buildReassessRoadmapPrompt` | L1651–1654 |

Note: `buildExecuteTaskPrompt` does NOT have it — consistent with upstream R025 spec ("researcher, planner, completer, replanner, reassessor" — execute-task is not in the 5).

### What Remains (R026)

Three items needed:

1. **Global DB bash-access anti-pattern in `system.md`** — add a `## Database Access` section warning the agent never to query `hx.db` directly via bash (WAL single-writer discipline). Use the new `hx_milestone_status` tool instead.

2. **DB safety blocks in 5 high-risk prompt files** — no current `hx_milestone_status` references in any of these files:
   - `prompts/complete-slice.md`
   - `prompts/complete-milestone.md`
   - `prompts/validate-milestone.md`
   - `prompts/plan-milestone.md`
   - `prompts/plan-slice.md`

3. **New `bootstrap/query-tools.ts` with `hx_milestone_status` tool** — not yet created. Also requires wiring into `register-extension.ts`.

## Implementation Landscape

### hx_milestone_status Tool

**File to create:** `src/resources/extensions/hx/bootstrap/query-tools.ts`

**Registration:** Add `import { registerQueryTools } from "./query-tools.js"` and `registerQueryTools(pi)` to `register-extension.ts` (after `registerDbTools(pi)`).

**Tool contract:** Read-only — returns milestone/slice/task status summary from the DB without requiring bash access to `hx.db`.

**Parameters:** `milestoneId: string` (required), optional `sliceId?: string`

**Response shape:** When `milestoneId` only: list of slices with their status. When `milestoneId + sliceId`: list of tasks with their status + completion counts. When `milestoneId` is "active": resolve the active milestone ID first.

**Backing DB functions already available in `hx-db.ts`:**
- `getActiveMilestoneIdFromDb()` → `{ id, status } | null`
- `getMilestone(id)` → `MilestoneRow | null`
- `getMilestoneSlices(milestoneId)` → `SliceRow[]`
- `getSliceTasks(milestoneId, sliceId)` → `TaskRow[]`
- `getSliceStatusSummary(milestoneId)` → `Array<{ id, status }>`
- `getSliceTaskCounts(milestoneId, sliceId)` → `{ total, done, pending }`

**Pattern to follow:** `journal-tools.ts` is the cleanest model — simple read-only tool, no alias needed, uses `ensureDbOpen()` from `dynamic-tools.js`, returns JSON text.

**Registration pattern:**
```typescript
import { Type } from "@sinclair/typebox";
import type { ExtensionAPI } from "@hyperlab/hx-coding-agent";
import { ensureDbOpen } from "./dynamic-tools.js";

export function registerQueryTools(pi: ExtensionAPI): void {
  pi.registerTool({
    name: "hx_milestone_status",
    // ...
  });
}
```

### DB Guard Prompt Blocks

Add a compact safety block to each of the 5 prompts. Pattern: identify the most prominent `## Guidelines` or `## Steps` section and insert a `> ⚠️ Database access` callout before the steps. Content should:
- Name `hx_milestone_status` as the sanctioned path
- Explicitly forbid `sqlite3 .hx/hx.db` or `bash` queries
- Mention WAL single-writer discipline

For `system.md`: add a `## Database Access Safety` subsection in the Hard Rules area.

### 14 New Tests

Breakdown:
1. **Requirement seed tests** (3 tests in `db-writer.test.ts`):
   - `updateRequirementInDb — seeds from REQUIREMENTS.md when DB is empty`: write REQUIREMENTS.md with R001, call `updateRequirementInDb('R001', {status:'validated'})`, confirm succeeds and R001 exists in DB
   - `updateRequirementInDb — seeds all requirements from REQUIREMENTS.md, not just the target`: after seed, confirm R002 also exists if REQUIREMENTS.md had R002
   - `updateRequirementInDb — not found still throws when ID absent from both DB and REQUIREMENTS.md`: existing test behavior preserved

2. **hx_milestone_status tool tests** (new test file `tests/milestone-status.test.ts`, ~11 tests):
   - Returns slice list for a milestone ID
   - Returns task counts for milestone+slice
   - Returns active milestone when milestoneId="active"
   - Returns empty/error when milestone not found
   - Returns structured JSON (not raw sqlite)
   - Tool unavailable when DB not open → graceful error
   - sliceId param narrows to task list
   - Each slice has id+status fields
   - Task entries have id+status+title fields
   - Completed slice shows status='complete'
   - Error shape matches other hx_ tools

The existing `updateRequirementInDb — not found` test behavior is unchanged (seed path skips when REQUIREMENTS.md absent → still throws). No existing tests need modification.

## Verification Commands

```bash
# After implementation:
npx tsc --noEmit
node scripts/compile-tests.mjs
node --test dist-test/src/resources/extensions/hx/tests/db-writer.test.js  # seed tests
node --test dist-test/src/resources/extensions/hx/tests/milestone-status.test.js  # new tool tests
npm run test:unit  # baseline ≥ 4312 pass + 14 new = ≥ 4326 pass / 3 pre-existing fail / 5 skip
grep -rn '\bgsd\b|\bGSD\b' src/resources/extensions/hx/bootstrap/query-tools.ts  # → 0
```

## Natural Task Decomposition

**T01 — Requirements seed regression tests + DB guard prompts**
- Add 3 seed tests to `db-writer.test.ts` (R024 already done in source, tests are missing)
- Add DB guard blocks to `system.md` and 5 high-risk prompts (R026 layer 1 + 2)
- No source code changes needed — purely tests + prompt files
- Verify: seed tests pass; grep system.md for the guard block

**T02 — `hx_milestone_status` tool + tests**
- Create `bootstrap/query-tools.ts` with `hx_milestone_status`
- Wire into `register-extension.ts`
- Create `tests/milestone-status.test.ts` with ~11 tests
- Compile and run tests
- Verify: tsc clean; 11 milestone-status tests pass; tool callable

## Key Files

| File | Action | What |
|---|---|---|
| `src/resources/extensions/hx/bootstrap/query-tools.ts` | Create | `hx_milestone_status` tool |
| `src/resources/extensions/hx/bootstrap/register-extension.ts` | Modify | Import + call `registerQueryTools(pi)` |
| `src/resources/extensions/hx/prompts/system.md` | Modify | DB bash-access anti-pattern block |
| `src/resources/extensions/hx/prompts/complete-slice.md` | Modify | DB safety block |
| `src/resources/extensions/hx/prompts/complete-milestone.md` | Modify | DB safety block |
| `src/resources/extensions/hx/prompts/validate-milestone.md` | Modify | DB safety block |
| `src/resources/extensions/hx/prompts/plan-milestone.md` | Modify | DB safety block |
| `src/resources/extensions/hx/prompts/plan-slice.md` | Modify | DB safety block |
| `src/resources/extensions/hx/tests/db-writer.test.ts` | Modify | 3 seed tests |
| `src/resources/extensions/hx/tests/milestone-status.test.ts` | Create | ~11 `hx_milestone_status` tests |

## Forward Intelligence

- R024 and R025 are already done — do NOT re-implement. The `db-writer.ts` seed code is labeled "Cluster 20" at L377. The 5 slice context builder injections exist. Any redundant implementation would break existing tests.
- The existing `updateRequirementInDb — not found` test passes because tmpDir has no REQUIREMENTS.md. New seed tests must create `.hx/REQUIREMENTS.md` in tmpDir to exercise the seed path.
- `hx_milestone_status` does not need an alias — it's a new tool with a clear canonical name. Don't register `hx_get_milestone_status` aliases.
- The tool should return plain JSON text (like `hx_journal_query`), not a markdown table — agents parse JSON better.
- `ensureDbOpen()` is imported from `dynamic-tools.js` — don't open the DB directly.
- The `initSchema` / `migrateSchema` gap (K-note) means any new table in a migration needs to also appear in `initSchema`. `hx_milestone_status` uses only existing tables — no schema changes needed.
- Test baseline is **4312 pass / 3 pre-existing fail / 5 skip** (from S02). After S03, expect ≥ 4326 pass.
- All 3 prompt files (`complete-slice.md`, `complete-milestone.md`, `validate-milestone.md`) currently have zero mentions of `hx.db`, WAL, or `hx_milestone_status`. The guard blocks are additive only.
