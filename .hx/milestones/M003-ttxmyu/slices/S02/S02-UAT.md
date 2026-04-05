# S02: Slice-Level Parallelism — UAT

**Milestone:** M003-ttxmyu
**Written:** 2026-04-05T15:36:45.705Z

## UAT Type
UAT mode: runtime-executable

## Overview
Verify that the slice-level parallelism subsystem built in S02 functions correctly: HX_SLICE_LOCK isolation in state.ts and dispatch-guard.ts, plus the three new modules (eligibility, conflict, orchestrator).

## Preconditions
- Working directory: `/Users/beratcan/Desktop/GithubProjects/hx-ai`
- Node.js available, `npm run test:unit` functional
- `npx tsc` available

---

## Test Cases

### TC01: TypeScript compilation clean
**Verify:** No type errors introduced by S02 changes.

```bash
npx tsc --noEmit
```
**Expected:** Exit code 0, no output.

---

### TC02: Full test suite passes with S02 tests included
**Verify:** All tests pass, count ≥ 4155 (baseline was 4136 before S02).

```bash
npm run test:unit 2>&1 | tail -3
```
**Expected:** `✔ 4155 passed, 0 failed` (or higher if other tests have been added).

---

### TC03: HX_SLICE_LOCK present in state.ts and dispatch-guard.ts
**Verify:** At least 4 occurrences of HX_SLICE_LOCK across both files.

```bash
grep -n 'HX_SLICE_LOCK' src/resources/extensions/hx/state.ts src/resources/extensions/hx/dispatch-guard.ts | wc -l
```
**Expected:** Output ≥ 4.

---

### TC04: No GSD references in new source files
**Verify:** The three new parallelism modules are GSD-free.

```bash
grep -rn '\bGSD\b\|\bgsd\b' \
  src/resources/extensions/hx/slice-parallel-eligibility.ts \
  src/resources/extensions/hx/slice-parallel-conflict.ts \
  src/resources/extensions/hx/slice-parallel-orchestrator.ts \
  | wc -l
```
**Expected:** Output `0`.

---

### TC05: slice-parallel-eligibility tests pass
**Verify:** 9 eligibility tests pass (4 DB-backed scenarios + 3 formatting tests + baseline).

```bash
node --test dist-test/src/resources/extensions/hx/tests/slice-parallel-eligibility.test.js 2>&1 | tail -5
```
**Expected:** `✔ 9 passed, 0 failed` (or similar pass line with 0 failures).

---

### TC06: slice-parallel-conflict tests pass
**Verify:** Conflict detection tests pass (no-overlap, partial overlap, full overlap, dedup).

```bash
node --test dist-test/src/resources/extensions/hx/tests/slice-parallel-conflict.test.js 2>&1 | tail -5
```
**Expected:** `✔ 4 passed, 0 failed` (or ≥4 passed, 0 failed).

---

### TC07: slice-parallel-orchestrator tests pass
**Verify:** Orchestrator tests pass (lock acquisition, nested-spawn guard, status, stop lifecycle).

```bash
node --test dist-test/src/resources/extensions/hx/tests/slice-parallel-orchestrator.test.js 2>&1 | tail -5
```
**Expected:** `✔ 4 passed, 0 failed`.

---

### TC08: HX_SLICE_LOCK count in orchestrator
**Verify:** Orchestrator references HX_SLICE_LOCK in at least 1 place (env var passed to child process).

```bash
grep -c 'HX_SLICE_LOCK' src/resources/extensions/hx/slice-parallel-orchestrator.ts
```
**Expected:** ≥ 1.

---

### TC09: slice_locks table in initSchema
**Verify:** hx-db.ts initSchema includes slice_locks (fix for :memory: DB test correctness).

```bash
grep -n 'slice_locks' src/resources/extensions/hx/hx-db.ts | head -5
```
**Expected:** At least 2 matches (one in initSchema CREATE TABLE, one in the v15 migration).

---

### TC10: HX_SLICE_LOCK derive-state tests
**Verify:** State derivation HX_SLICE_LOCK tests pass in isolation.

```bash
node --test dist-test/src/resources/extensions/hx/tests/derive-state-db.test.js 2>&1 | grep -E 'HX_SLICE_LOCK|passed|failed' | tail -5
```
**Expected:** HX_SLICE_LOCK tests mentioned with 0 failures.

---

### TC11: HX_PARALLEL_DEPTH guard present in orchestrator
**Verify:** Orchestrator uses HX_PARALLEL_DEPTH to prevent nested slice spawning.

```bash
grep -n 'HX_PARALLEL_DEPTH' src/resources/extensions/hx/slice-parallel-orchestrator.ts
```
**Expected:** At least 1 line showing the env var read and guard condition.

---

## Edge Cases

**EC01: dispatch-guard still enforces declared deps for locked workers**
A slice worker identified by HX_SLICE_LOCK should skip positional ordering but NOT skip declared dependency checks. Verify by reading dispatch-guard.ts and confirming the `continue` statement is inside the positional else branch only, not before the dependency check block.

```bash
grep -A5 -B5 'HX_SLICE_LOCK' src/resources/extensions/hx/dispatch-guard.ts
```
**Expected:** `continue` appears inside the positional check branch; the dependency enforcement block comes after (is not skipped).

**EC02: eligibility marks file-overlapping slices as warned but eligible**
In the eligibility report, slices that share files with other candidates should appear with a WARNING annotation, not be excluded.
Confirmed by TC05 (9 tests pass, including the overlap-warning scenario).

**EC03: fresh :memory: DB includes slice_locks table**
Tests that use `openDatabase(':memory:')` and then call orchestrator/lock functions must find the slice_locks table without running migrations.
Confirmed by TC07 (4 orchestrator tests pass using in-memory DB).

