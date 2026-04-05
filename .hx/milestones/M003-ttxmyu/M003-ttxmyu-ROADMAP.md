# M003-ttxmyu: Upstream v2.60.0–v2.63.0 Port + v2.59.0 Feature Backfill

## Vision
Port all ~82 actionable upstream gsd-2 commits between v2.59.0 and v2.63.0 into hx-ai with GSD→HX naming adaptation, including the v2.59.0 feature commits deferred from M002-yle1ri. Covers capability-aware model routing, slice-level parallelism, context optimization, workflow-logger centralization, MCP server reader tools, and ~46 additional bugfixes across 6 slices.

## Slice Overview
| ID | Slice | Risk | Depends | Done | After this |
|----|-------|------|---------|------|------------|
| S01 | Capability-Aware Model Routing + DB Reconciliation | high | — | ✅ | After this: routing log shows selectionMethod: 'capability-score' or 'tier-only'; capability-router tests pass; tsc clean baseline for S02–S06 |
| S02 | Slice-Level Parallelism | high | S01 | ⬜ | After this: slice parallel orchestrator files exist with HX naming; 3 test files pass; state.ts handles HX_SLICE_LOCK in both paths |
| S03 | Context Optimization (Masking + Phase Anchors) | medium | S01 | ⬜ | After this: context-masker.ts and phase-anchor.ts exist; tests pass; phase-anchor.json written in auto-mode session |
| S04 | Workflow-Logger Centralization + Auto-mode Hardening | medium | S01 | ⬜ | After this: workflow-logger-audit, silent-catch-diagnostics, tool-call-loop-guard, auto-wrapup-inflight-guard tests pass; no empty catch blocks in modified files |
| S05 | MCP Server Readers + Misc Features | low | S01 | ⬜ | After this: mcp-server readers module exists with 6 readers; server.ts registers them; /btw skill available; commands-codebase.ts present |
| S06 | Remaining Bugfixes, Security + Final Verification | low | S01 | ⬜ | After this: all 82 upstream commits accounted for; tsc clean; 0 new test failures; 0 GSD regressions — milestone complete |
