# S02: Slice-Level Parallelism

**Goal:** Port slice-parallel-orchestrator.ts, slice-parallel-conflict.ts, slice-parallel-eligibility.ts; adapt GSD_SLICE_LOCK → HX_SLICE_LOCK; update state.ts slice lock handling in DB-backed and legacy paths; wire into auto.ts/phases.ts dispatch
**Demo:** After this: After this: slice parallel orchestrator files exist with HX naming; 3 test files pass; state.ts handles HX_SLICE_LOCK in both paths

## Tasks
