# S02 Research: Slice-Level Parallelism

## Summary

S02 ports the upstream slice-level parallelism subsystem into hx-ai. This is a **new subsystem** (no existing slice-parallel code in hx-ai) that mirrors the existing milestone-level parallel infrastructure at the intra-milestone slice level.

**Key finding:** S01 already laid the DB foundation — `slice_locks` table (schema v15) and four accessor functions (`acquireSliceLock`, `releaseSliceLock`, `getSliceLock`, `cleanExpiredSliceLocks`) are available in `hx-db.ts`. S02 builds the orchestration layer on top of these.

**Baseline:** tsc clean, 4132/0/5 tests.

---

## What Exists (Don't Rebuild)

| File | Lines | Role | S02 Relevance |
|---|---|---|---|
| `src/resources/extensions/hx/parallel-orchestrator.ts` | ~550 | Milestone-level parallel worker lifecycle | Pattern to follow exactly for slice orchestrator |
| `src/resources/extensions/hx/parallel-eligibility.ts` | ~160 | Milestone eligibility analysis | Pattern for `slice-parallel-eligibility.ts` |
| `src/resources/extensions/hx/parallel-merge.ts` | 157 | Milestone worktree merge | Pattern for `slice-parallel-conflict.ts` |
| `src/resources/extensions/hx/hx-db.ts` | 1820+ | DB — `slice_locks` table + 4 accessors added in S01 | Ready to use: `acquireSliceLock`, `releaseSliceLock`, `getSliceLock`, `cleanExpiredSliceLocks` |
| `src/resources/extensions/hx/dispatch-guard.ts` | ~110 | Prevents out-of-order dispatch; handles `HX_MILESTONE_LOCK` | Needs `HX_SLICE_LOCK` added (see Gap Analysis) |
| `src/resources/extensions/hx/state.ts` | 1300+ | State derivation: `deriveStateFromDb()` (line ~328) and `_deriveStateImpl()` (line ~833) | Both paths need `HX_SLICE_LOCK` isolation |
| `src/resources/extensions/hx/unit-id.ts` | 14 | `parseUnitId("MID/SID/TID")` → `{milestone, slice, task}` | Use to parse HX_SLICE_LOCK |

### Slice lock functions already in hx-db.ts (from S01):

```typescript
// All take (db: DbAdapter, milestoneId: string, sliceId: string, ...)
acquireSliceLock(db, mid, sid, workerPid, ttlMs): boolean  // INSERT OR IGNORE
releaseSliceLock(db, mid, sid, workerPid): void            // DELETE WHERE pid matches
getSliceLock(db, mid, sid): { ... } | null                 // SELECT row
cleanExpiredSliceLocks(db): number                         // DELETE expired, returns count
```

The `slice_locks` table has: `milestone_id`, `slice_id`, `worker_pid`, `acquired_at`, `expires_at` with composite PK `(milestone_id, slice_id)`.

---

## Gap Analysis: What Needs to Be Built

### 1. `state.ts` — HX_SLICE_LOCK isolation (TWO sites)

**Env var format:** `HX_SLICE_LOCK = "MID/SID"` (e.g. `"M003-ttxmyu/S02"`)
Parse via: `parseUnitId(process.env.HX_SLICE_LOCK)` → `{milestone, slice}`.

**DB path (`deriveStateFromDb`, ~line 615–630):**

Currently picks `activeSlice` as the first incomplete slice whose deps are satisfied:
```typescript
for (const s of activeMilestoneSlices) {
  if (isClosedStatus(s.status)) continue;
  if (s.depends.every(dep => doneSliceIds.has(dep))) {
    activeSlice = { id: s.id, title: s.title };
    activeSliceRow = s;
    break;  // ← first eligible
  }
}
```

With `HX_SLICE_LOCK = "MID/SID"`, if `milestone === activeMilestone.id`, add filter:
```typescript
const sliceLock = process.env.HX_SLICE_LOCK;
const [sliceLockMid, sliceLockSid] = sliceLock ? sliceLock.split("/") : [null, null];
// In the loop:
if (sliceLockMid === activeMilestone.id && sliceLockSid && s.id !== sliceLockSid) continue;
```
This restricts the worker to ONLY see its assigned slice as the eligible one.

**Legacy path (`_deriveStateImpl`, ~line 1265–1280):**
Same pattern applied to the `for (const s of activeRoadmap.slices)` loop.

### 2. `dispatch-guard.ts` — HX_SLICE_LOCK awareness

Currently handles `HX_MILESTONE_LOCK`: when set, limits cross-milestone dep checks to just the locked milestone.

Analogously, when `HX_SLICE_LOCK = "MID/SID"` is set:
- Extract `sliceLockMid` and `sliceLockSid` from the env var
- When checking intra-milestone slice ordering: if this is a slice-locked worker handling `sliceLockSid`, skip cross-slice ordering checks for OTHER slices in the same milestone (the orchestrator already ensured no dep conflicts)
- But still enforce `targetSlice.depends` checks — a locked slice's own declared deps must still be satisfied

The dispatch guard already has `milestoneLock` isolation at ~line 34-44. Add analogous `sliceLock` handling at the intra-milestone check block (~line 73–104).

### 3. `slice-parallel-eligibility.ts` (new file, ~120 lines)

Analyzes which slices within the ACTIVE milestone can run in parallel.

```typescript
export interface SliceEligibilityResult {
  milestoneId: string;
  sliceId: string;
  title: string;
  eligible: boolean;
  reason: string;
}

export interface SliceParallelCandidates {
  milestoneId: string;
  eligible: SliceEligibilityResult[];
  ineligible: SliceEligibilityResult[];
  fileOverlaps: Array<{ sid1: string; sid2: string; files: string[] }>;
}

export async function analyzeSliceParallelEligibility(
  basePath: string,
  milestoneId: string,
): Promise<SliceParallelCandidates>

export function formatSliceEligibilityReport(candidates: SliceParallelCandidates): string
```

**Logic:** 
1. Get all slices for the milestone via `getMilestoneSlices(milestoneId)` (already in hx-db.ts)
2. Build `doneSliceIds` set from closed slices
3. A slice is eligible if: not complete AND all declared deps are in doneSliceIds
4. Multiple eligible slices → parallel candidates
5. Detect file overlaps via task file lists from `getSliceTasks(milestoneId, sliceId)` (already in hx-db.ts)

### 4. `slice-parallel-conflict.ts` (new file, ~100 lines)

Detects file conflicts between slices that would run in parallel.

```typescript
export interface SliceConflictResult {
  hasConflicts: boolean;
  conflicts: Array<{ sid1: string; sid2: string; files: string[] }>;
}

export async function detectSliceConflicts(
  basePath: string,
  milestoneId: string,
  sliceIds: string[],
): Promise<SliceConflictResult>

export function buildSliceFileSets(
  milestoneId: string,
  sliceIds: string[],
): Map<string, string[]>
```

Mirrors `parallel-merge.ts` but for slice-level conflict detection. Uses `getSliceTasks()` to get task file lists, then set intersection to find overlaps.

### 5. `slice-parallel-orchestrator.ts` (new file, ~300 lines)

Manages slice worker lifecycle within a milestone. Mirrors `parallel-orchestrator.ts`.

Key differences from milestone orchestrator:
- Workers are scoped to slices within a single milestone (not separate milestones)
- Uses `HX_SLICE_LOCK = "MID/SID"` instead of `HX_MILESTONE_LOCK = "MID"`
- Uses `acquireSliceLock`/`releaseSliceLock` from hx-db.ts instead of worktree-based isolation
- Workers run in the SAME worktree (no per-slice worktree creation needed — slices share a milestone's filesystem context)
- Simpler than milestone orchestrator: no worktree creation, no budget splitting across milestones

```typescript
export interface SliceWorkerInfo {
  milestoneId: string;
  sliceId: string;
  pid: number;
  process: ChildProcess | null;
  startedAt: number;
  state: "running" | "stopped" | "error";
}

export async function startSliceParallel(
  basePath: string,
  milestoneId: string,
  sliceIds: string[],
): Promise<{ started: string[]; errors: Array<{ sid: string; error: string }> }>

export async function stopSliceParallel(basePath: string, sliceId?: string): Promise<void>

export function getSliceWorkerStatuses(): SliceWorkerInfo[]
```

**Locking:** Before spawning a worker for slice SID, calls `acquireSliceLock(db, mid, sid, pid, ttlMs)`. If lock acquisition fails (returns false), the slice is already claimed by another worker — skip it.

**Worker spawn:** Same pattern as milestone orchestrator — spawns `hx headless --json auto` with `HX_SLICE_LOCK=MID/SID` env var.

---

## Integration Points (Minimal for S02)

The S02 success criteria does NOT require auto-triggering from phases.ts. The wiring is:

1. **state.ts** — `HX_SLICE_LOCK` isolation (both paths) — the foundational piece
2. **dispatch-guard.ts** — `HX_SLICE_LOCK` awareness — prevents cross-slice blocking when slice is locked
3. **3 new source files** — functional orchestration subsystem with HX naming

The phases.ts/auto.ts auto-triggering hook is deferred (not part of S02 success criteria, not mentioned in the success demo). The slice orchestrator can be triggered manually or from a future command handler.

---

## Implementation Order (Task Breakdown)

### T01: state.ts + dispatch-guard.ts HX_SLICE_LOCK isolation (~45 min)

**Files:** `src/resources/extensions/hx/state.ts`, `src/resources/extensions/hx/dispatch-guard.ts`

**state.ts DB path** — `deriveStateFromDb()`:
- Read `HX_SLICE_LOCK`, parse with `parseUnitId`
- In the `for (const s of activeMilestoneSlices)` loop (~line 619): if lock matches active milestone, skip slices that don't match the locked slice ID
- Add comment: "Slice worker isolation: when HX_SLICE_LOCK is set..."

**state.ts legacy path** — `_deriveStateImpl()`:
- Same pattern in the `for (const s of activeRoadmap.slices)` loop (~line 1268)

**dispatch-guard.ts**:
- After reading `milestoneLock` (~line 34), also read `sliceLock = process.env.HX_SLICE_LOCK`
- Parse to get `sliceLockMid` and `sliceLockSid`
- In the intra-milestone slice ordering check: when `sliceLock` matches `mid`, skip positional ordering for non-locked slices (only check target slice's own declared deps)

**Verify:** `grep -n "HX_SLICE_LOCK" state.ts dispatch-guard.ts` finds 4+ hits; `npx tsc --noEmit` clean.

### T02: slice-parallel-eligibility.ts + test (~60 min)

**Files:**
- `src/resources/extensions/hx/slice-parallel-eligibility.ts` (new)
- `src/resources/extensions/hx/tests/slice-parallel-eligibility.test.ts` (new)

Implement `analyzeSliceParallelEligibility()` using `getMilestoneSlices()` + `getSliceTasks()` from hx-db.ts. Test cases: single eligible slice (no parallelism), two independent slices (both eligible), two dependent slices (second blocked), file overlap detection.

### T03: slice-parallel-conflict.ts + test (~45 min)

**Files:**
- `src/resources/extensions/hx/slice-parallel-conflict.ts` (new)
- `src/resources/extensions/hx/tests/slice-parallel-conflict.test.ts` (new)

Implement `detectSliceConflicts()` + `buildSliceFileSets()`. Test cases: no overlap (empty), partial overlap (reported), full overlap (all files).

### T04: slice-parallel-orchestrator.ts + test (~90 min)

**Files:**
- `src/resources/extensions/hx/slice-parallel-orchestrator.ts` (new)
- `src/resources/extensions/hx/tests/slice-parallel-orchestrator.test.ts` (new)

Implement `startSliceParallel()`, `stopSliceParallel()`, `getSliceWorkerStatuses()`. Uses `acquireSliceLock`/`releaseSliceLock` from hx-db.ts. Test cases: lock acquisition success/failure, worker state tracking, stop/cleanup, HX_SLICE_LOCK env var set correctly on workers.

---

## Verification Commands

```bash
# After each task:
npx tsc --noEmit

# After all tasks:
npm run test:unit  # expect 4132 + new tests, 0 failed

# GSD grep
grep -rn '\bGSD\b\|\bgsd\b' \
  src/resources/extensions/hx/slice-parallel-orchestrator.ts \
  src/resources/extensions/hx/slice-parallel-eligibility.ts \
  src/resources/extensions/hx/slice-parallel-conflict.ts \
  src/resources/extensions/hx/state.ts \
  src/resources/extensions/hx/dispatch-guard.ts
# expected: 0 hits

# HX_SLICE_LOCK appears in both state.ts paths
grep -n "HX_SLICE_LOCK" \
  src/resources/extensions/hx/state.ts \
  src/resources/extensions/hx/dispatch-guard.ts \
  src/resources/extensions/hx/slice-parallel-orchestrator.ts
# expected: ≥5 hits
```

---

## Patterns to Follow

- **HX_MILESTONE_LOCK in state.ts** (lines 328–335 and 838–845): exact template for HX_SLICE_LOCK isolation
- **dispatch-guard.ts milestoneLock** (lines 34–44): exact template for sliceLock handling
- **parallel-orchestrator.ts**: full worker lifecycle template; slice orchestrator is a simplified version (no worktree creation)
- **parallel-eligibility.ts**: exact template for slice eligibility analysis (adapt milestone → slice)
- **parallel-merge.ts**: conflict/file-overlap detection pattern
- **acquireSliceLock INSERT OR IGNORE**: atomic lock; returns bool indicating success
- **Tests in derive-state-db.test.ts**: pattern for testing HX_SLICE_LOCK isolation (mock DB setup, set env var, call deriveStateFromDb, assert activeSlice)
- **Tests in dispatch-guard.test.ts** (line 220–268): exact pattern for HX_SLICE_LOCK test in dispatch-guard.test.ts

## Critical Constraints

- **HX_SLICE_LOCK format:** `"MID/SID"` — split on `/` to get `[mid, sid]`. Do NOT use a different separator.
- **No new DB schema:** All DB work was done in S01. S02 only adds new TypeScript files and modifies state.ts/dispatch-guard.ts.
- **Tests go in flat `tests/`:** `compile-tests.mjs` SKIP_DIRS excludes `integration/` — all 3 test files go in `src/resources/extensions/hx/tests/*.test.ts` (flat, no subdirectory).
- **GSD-free:** All new identifiers use `hx`/`HX` naming. Env var is `HX_SLICE_LOCK` (not `GSD_SLICE_LOCK`).
- **No phases.ts/auto.ts changes required for S02:** The auto-trigger hook is out of scope for this slice's success criteria.
- **slice-parallel-orchestrator.ts worker isolation:** Workers must NOT create new worktrees — slice workers operate within the milestone's existing worktree context. The isolation is achieved purely via `HX_SLICE_LOCK` env var + DB lock.

## GSD Naming Reminder

The upstream equivalent env var is `GSD_SLICE_LOCK`. Every occurrence of `GSD_SLICE_LOCK` in ported code becomes `HX_SLICE_LOCK`. The upstream files are named `slice-parallel-orchestrator.ts` etc. (these are already HX-neutral names — no rename needed).
