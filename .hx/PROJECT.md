# Project

## What This Is

HX is a CLI-based AI coding agent harness that manages structured project execution through milestones, slices, and tasks. It includes a terminal TUI, web interface, native Rust parser engine, VS Code extension, Docker support, daemon mode, and MCP server.

The codebase was originally named "GSD" and has been fully rebranded to "HX" / "hx". M001-df6x5t completed the GSD→HX rename across 377 files. The only surviving GSD references are in migrate-gsd-to-hx.ts (backward-compat migration code for users upgrading from the old GSD binary).

## Core Value

HX is a complete, consistently-named AI coding agent harness with upstream stability fixes applied. The GSD→HX rename is complete, and the codebase stays current with upstream bugfixes while maintaining its own identity.

## Current State

- **M001-df6x5t COMPLETE** — All GSD→HX renames finished across 377 files. Zero GSD references outside migrate-gsd-to-hx.ts (intentionally preserved). typecheck:extensions exits 0.
- **M002-yle1ri COMPLETE** — All 95 upstream gsd-2 v2.59.0 bugfix commits ported to hx-ai with GSD→HX naming adaptation. 422 non-.hx/ files changed. 4113 tests pass / 0 fail / 5 skip. npx tsc --noEmit exits 0. R001–R014 all validated.
  - S01 ✅ State/DB Reconciliation & Data Safety — DB sync, disk→DB reconciliation, VACUUM recovery, unit ownership migration, coercion, data loss prevention (16 fixes)
  - S02 ✅ Worktree/Git & Auto-mode Fixes — Worktree merge, MERGE_HEAD cleanup, pre-merge safety, auto-mode dispatch, headless routing, parallel mode fixes (21 fixes)
  - S03 ✅ Milestone Lifecycle, Guided-flow & Model/Provider — Completion, guided-flow routing, model routing, provider resolution, rate-limit, OAuth fixes (19 fixes)
  - S04 ✅ TUI/UI, Error Handling & Context Management — TUI layout (28-file), JSON parse error handling, YAML repair, compaction overflow, prompt explosion prevention (15 fixes)
  - S05 ✅ Prompts, Diagnostics & Extensions — Prompt camelCase params, web_search→search-the-web migration, forensics DB counts / marker persistence / dedup ordering, doctor false-positive fixes, extension manifest hooks (12 fixes)
  - S06 ✅ Remaining Fixes — read-tool offset clamping, Windows shell guards, ask-user-questions free-text, MCP name handling, OAuth google_search shape, misc (9 fixes + 4 test infrastructure repairs)
- **M003-ttxmyu ALL SLICES COMPLETE** — All 82+ upstream v2.60.0–v2.63.0 commits (plus v2.59.0 deferred features) ported with GSD→HX naming. 4298 tests pass / 0 fail / 5 skip. npx tsc --noEmit exits 0. R010, R014, R017, R018 validated.
  - S01 ✅ Capability-Aware Model Routing + DB Reconciliation — tsc clean baseline, routing selectionMethod logging
  - S02 ✅ Slice-Level Parallelism — orchestrator/conflict/eligibility files, HX_SLICE_LOCK, 3 test files
  - S03 ✅ Context Optimization (Masking + Phase Anchors) — context-masker.ts, phase-anchor.ts, tests pass
  - S04 ✅ Workflow-Logger Centralization + Auto-mode Hardening — audit errors-only, stop/backtrack captures, auto-wrapup-guard, 5 silent catches → logWarning, 14 new tests; 4187 pass / 0 fail
  - S05 ✅ MCP Server Readers + Misc Features — 6 MCP readers, /btw skill, commands-codebase.ts, codebase-map integration
  - S06 ✅ Remaining Bugfixes, Security + Final Verification — 22 upstream clusters ported; security overrides, ask-user-questions dedup, 5 DB-layer fixes, 7 orchestration patches, 8 misc clusters; 4298 tests / 0 fail; tsc clean; 0 GSD regressions
- `.hx/` directory structure is in place (migrated from `.gsd/`)
- `migrate-gsd-to-hx.ts` handles backward compat for `.gsd/` → `.hx/` directory migration

## Architecture / Key Patterns

- **Monorepo** with workspaces: `packages/` (daemon, mcp-server, native, pi-ai, pi-coding-agent, pi-tui, hx-agent-core), `web/` (Next.js), `native/` (Rust NAPI), `vscode-extension/`
- **Native engine**: Rust crate at `native/crates/engine/src/hx_parser.rs` compiled to `hx_engine.*.node` addon, loaded via `packages/native/src/native.ts` using `@hx-build/engine-*` platform packages
- **DB tools**: Registered in `src/resources/extensions/hx/bootstrap/db-tools.ts` with canonical + alias naming (13 hx_* aliases for backward compat)
- **Prompts**: Markdown files in `src/resources/extensions/hx/prompts/` reference hx_* tool names exclusively
- **Preferences**: `HXPreferences` interface is the central config type used across ~30 files
- **Web module**: Next.js app at `web/` uses `HX_WEB_*` env vars and HX-prefixed React components
- **Upstream**: Fork of `gsd-build/gsd-2` — upstream remote configured, diverged at `fe0e21895`. Upstream uses `gsd`/`GSD` naming; hx-ai uses `hx`/`HX` naming. All upstream ports require naming adaptation.

## Capability Contract

See `.hx/REQUIREMENTS.md` for the explicit capability contract, requirement status, and coverage mapping.

## Milestone Sequence

- [x] M001-df6x5t: GSD → HX Complete Rename — **COMPLETE** — Eliminated all residual GSD identifiers across 377 files. Zero GSD hits outside migrate-gsd-to-hx.ts. typecheck:extensions exits 0.
- [x] M002-yle1ri: Upstream v2.59.0 Bugfix Port — **COMPLETE** — Ported all 95 upstream gsd-2 v2.59.0 bugfix commits with GSD→HX naming adaptation across 6 slices. 422 files changed. 4113 tests pass / 0 fail. npx tsc --noEmit exits 0. R001–R014 validated.
- [x] M003-ttxmyu: Upstream v2.60.0–v2.63.0 Port + v2.59.0 Feature Backfill — **COMPLETE** — 82+ commits ported with GSD→HX naming. Capability routing, slice parallelism, context optimization, workflow-logger, MCP readers. 4298 tests / 0 fail. R010–R018 validated.
- [ ] M004-erchk5: Upstream v2.64.0 Port — ~58 commits: LLM safety harness, Ollama native /api/chat, requirements DB seed, slice context injection, DB bash guard, auto-mode loop stability, MCP OAuth, misc fixes.
  - S01 ✅ LLM Safety Harness — 7-file safety/ subsystem created and wired; git-checkpoint adversarial fix applied; 4 regression tests; tsc clean; 4300 tests pass
