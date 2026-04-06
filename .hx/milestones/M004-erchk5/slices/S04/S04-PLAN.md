# S04: Auto-mode Loop Stability (13 bugfix cluster)

**Goal:** Port 13 auto-mode loop stability fixes: artifact rendering corruption (a5cab49ee), cold resume DB reopen + U+2714 (62f11b9c3), deferred slice dispatch prevention (93295f7b5), plan-milestone completed-slice preservation (8b43b56f8), dashboard model label stale (f18305c50), tool validation loop cap (198b567a2), complete-slice context exhaustion (5beb9f61c), enrichment optional params (bcde8367b), complete-slice.md filesystem guard (aa0ebd3c0), runFinalize timeout guard (e772de0d2), remote-questions manifest (4d1ac2d1c), preferences silent parse warning (3f4812fe0), worktree teardown validation (f3342a1a6), external-state worktree DB path (baa9ec7bc). All GSD→HX naming.
**Demo:** After this: After this: 13 stability bugs fixed; tsc clean; test count maintained ≥4298

## Tasks
