# Project

## What This Is

HX is a CLI-based AI coding agent harness that manages structured project execution through milestones, slices, and tasks. It includes a terminal TUI, web interface, native Rust parser engine, VS Code extension, Docker support, daemon mode, and MCP server.

The codebase was originally named "GSD" and has been fully rebranded to "HX" / "hx". M001-df6x5t completed the GSD→HX rename across 377 files. The only surviving GSD references are in migrate-gsd-to-hx.ts (backward-compat migration code for users upgrading from the old GSD binary).

## Core Value

HX is a complete, consistently-named AI coding agent harness. The GSD→HX rename is complete — every public-facing and internal identifier uses `hx` / `HX` naming.

## Current State

- **M001-df6x5t COMPLETE** — All GSD→HX renames finished across 377 files. Zero GSD references outside migrate-gsd-to-hx.ts (intentionally preserved). typecheck:extensions exits 0.
- Runtime binaries and CLI entry points use `hx` naming
- `.hx/` directory structure is in place (migrated from `.gsd/`)
- `migrate-gsd-to-hx.ts` handles backward compat for `.gsd/` → `.hx/` directory migration
- **Post-merge items:** run test:unit/test:integration in main repo; CI must rebuild native binaries (hx_engine.*.node); publish @hx-build/engine-* platform packages to npm registry; rename any GSD_* secrets in GitHub repository settings.

## Architecture / Key Patterns

- **Monorepo** with workspaces: `packages/` (daemon, mcp-server, native, pi-ai, pi-coding-agent, pi-tui, hx-agent-core), `web/` (Next.js), `native/` (Rust NAPI), `vscode-extension/`
- **Native engine**: Rust crate at `native/crates/engine/src/hx_parser.rs` compiled to `hx_engine.*.node` addon, loaded via `packages/native/src/native.ts` using `@hx-build/engine-*` platform packages
- **DB tools**: Registered in `src/resources/extensions/hx/bootstrap/db-tools.ts` with canonical + alias naming (13 hx_* aliases for backward compat)
- **Prompts**: Markdown files in `src/resources/extensions/hx/prompts/` reference hx_* tool names exclusively
- **Preferences**: `HXPreferences` interface is the central config type used across ~30 files
- **Web module**: Next.js app at `web/` uses `HX_WEB_*` env vars and HX-prefixed React components

## Capability Contract

See `.hx/REQUIREMENTS.md` for the explicit capability contract, requirement status, and coverage mapping.

## Milestone Sequence

- [x] M001-df6x5t: GSD → HX Complete Rename — **COMPLETE** — Eliminated all residual GSD identifiers across 377 files. Zero GSD hits outside migrate-gsd-to-hx.ts. typecheck:extensions exits 0.
