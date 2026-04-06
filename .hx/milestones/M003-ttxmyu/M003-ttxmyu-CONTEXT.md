# M003-ttxmyu: Upstream v2.60.0–v2.63.0 Port + v2.59.0 Feature Backfill

**Gathered:** 2026-04-05
**Status:** Ready for planning

## Project Description

HX is a fork of gsd-2. M002-yle1ri completed all 95 bugfix ports from v2.59.0. This milestone ports the remaining upstream delta: the v2.59.0 feature commits that were deferred (R015), plus all ~82 actionable commits from v2.59.0 through v2.63.0 (fixes, features, and refactors). Every change is adapted for hx/HX naming.

## Why This Milestone

Upstream has shipped significant new capability since the v2.59.0 bugfix baseline: capability-aware model routing, slice-level parallelism, context optimization, workflow-logger centralization, MCP server reader tools, and ~46 additional bugfixes. Running on a stale fork means missing stability improvements and drifting further from upstream with each release.

## User-Visible Outcome

### When this milestone is complete, the user can:

- `hx auto` uses capability-aware model routing — routing log shows `selectionMethod: capability-score` with per-model scoring
- `hx auto` dispatches independent slices in parallel across separate worktrees (slice-level parallelism)
- Auto-mode sessions apply context masking and write phase-anchor.json at boundary transitions
- `hx-mcp-server` exposes 6 new read-only query tools: roadmap, progress, history, captures, knowledge, doctor-lite
- `/btw` skill is available for ephemeral side questions from conversation context
- `/hx codebase` supports `--collapse-threshold`, preferences integration, and auto-init

### Entry point / environment

- Entry point: `hx-dev` CLI (staging), `hx-local` (local build)
- Environment: local dev
- Live dependencies: none beyond existing (SQLite, git, node)

## Completion Class

- Contract complete means: tsc --noEmit exits 0, npm run test:unit 0 new failures, grep 0 GSD regressions
- Integration complete means: new files wired into extension manifest, new tools registered, new slice orchestrator hooked into auto dispatch
- Operational complete means: none beyond existing runtime

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- `npx tsc --noEmit` exits 0 with all 4 new files present and wired
- `npm run test:unit` passes with 0 new failures (baseline: 4113/0/5)
- grep -rn '\bgsd\b|\bGSD\b' across all modified source files: 0 hits
- All 82 upstream commits accounted for (applied or explicitly skipped with rationale)

## Risks and Unknowns

- Capability-aware routing is a large new subsystem (model-router.ts 504 lines vs hx auto-model-selection.ts 230 lines) — may require significant restructuring rather than line-by-line port
- Slice-level parallelism touches state.ts, auto.ts, phases.ts — high blast radius, must not regress existing milestone parallelism
- gsd-db.ts in upstream appears to be a refactored version of hx-db.ts — need to determine if it replaces or supplements hx-db.ts
- workflow-logger migration affects ~40+ catch blocks across many files — high volume, risk of missed callers

## Existing Codebase / Prior Art

- `src/resources/extensions/hx/auto-model-selection.ts` — existing model routing (230 lines); upstream model-router.ts is 504 lines with capability scoring added
- `src/resources/extensions/hx/parallel-eligibility.ts` — existing milestone-level parallel eligibility; slice-level parallelism is a separate concern
- `src/resources/extensions/hx/parallel-merge.ts` — existing parallel merge; slice orchestrator adds upstream coordination
- `src/resources/extensions/hx/hx-db.ts` — upstream renamed to gsd-db.ts and refactored; need to reconcile
- `src/resources/extensions/hx/workflow-logger.ts` — already exists in hx-ai; migration is about callers, not the logger itself
- `packages/mcp-server/src/` — exists but lacks readers/ subdirectory

> See `.hx/DECISIONS.md` for all architectural and pattern decisions — it is an append-only register; read it during planning, append to it during execution.

## Relevant Requirements

- R010 — all upstream v2.59.0→v2.63.0 changes
- R011 — capability-aware model routing
- R012 — slice-level parallelism
- R013 — context optimization
- R014 — GSD→HX naming
- R015 — workflow-logger centralization
- R016 — MCP server readers
- R017 — remaining fixes + misc
- R018 — typecheck + tests

## Scope

### In Scope

- All fix/feat/refactor commits between v2.59.0 and v2.63.0 on upstream/main
- v2.59.0 feature commits deferred from M002-yle1ri (R015): /btw skill, codebase map enhancements, stop/backtrack captures, GSD context optimization, security overrides, capability-aware routing
- 4 new source files: context-masker.ts, phase-anchor.ts, commands-codebase.ts, and gsd-db.ts reconciliation with hx-db.ts
- New mcp-server/src/readers/ module (7 files)

### Out of Scope / Non-Goals

- CHANGELOG, version bumps, release metadata
- repowise.db, docs/ refreshes, .mcp.json upstream changes
- Commits after v2.63.0

## Technical Constraints

- All new identifiers must use hx/HX naming — never gsd/GSD
- gsd-db.ts must be reconciled with existing hx-db.ts rather than creating a duplicate file
- Tests must run from main project root (not worktree) per K002
- compile-tests.mjs SKIP_DIRS excludes tests/integration/ — new tests go in flat tests/

## Integration Points

- `src/resources/extensions/hx/extension-manifest.json` — new hooks/tools must be declared here
- `src/resources/extensions/hx/bootstrap/db-tools.ts` — new tool registrations
- `packages/mcp-server/src/server.ts` — new readers must be wired in
- `src/resources/extensions/hx/auto.ts` / `auto/phases.ts` — slice parallelism hooks here

## Open Questions

- gsd-db.ts vs hx-db.ts: upstream appears to have refactored the DB layer; need to diff carefully to determine if it's additive or a replacement — investigate in S01 planning
- HX_SLICE_LOCK env var name: upstream uses GSD_SLICE_LOCK; rename to HX_SLICE_LOCK per naming convention
