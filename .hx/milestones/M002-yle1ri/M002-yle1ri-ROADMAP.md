# M002-yle1ri: Upstream v2.59.0 Bugfix Port

## Vision
Port 95 bugfix commits from upstream gsd-build/gsd-2 v2.59.0 into hx-ai with GSD→HX naming adaptation. Every fix is manually analyzed, adapted for the renamed codebase, and verified with typecheck + tests. Feature commits are excluded — only stability fixes.

## Slice Overview
| ID | Slice | Risk | Depends | Done | After this |
|----|-------|------|---------|------|------------|
| S01 | State/DB Reconciliation & Data Safety | high | — | ✅ | After this: State machine DB sync, disk→DB reconciliation, VACUUM recovery, unit ownership migration, DB column coercion, and data loss prevention fixes are applied. typecheck + tests pass. |
| S02 | Worktree/Git & Auto-mode Fixes | high | S01 | ✅ | After this: Worktree merge, MERGE_HEAD cleanup, pre-merge safety, auto-mode dispatch, headless routing, and parallel mode boundary fixes are applied. typecheck + tests pass. |
| S03 | Milestone Lifecycle, Guided-flow & Model/Provider | medium | S01 | ✅ | After this: Milestone/slice completion, guided-flow routing, model routing, provider resolution, rate-limit classification, and OAuth fixes are applied. typecheck + tests pass. |
| S04 | TUI/UI, Error Handling & Context Management | medium | S01 | ✅ | After this: TUI layout/rendering (28-file comprehensive review), JSON parse error handling, YAML repair, compaction overflow, and prompt explosion prevention fixes are applied. typecheck + tests pass. |
| S05 | Prompts, Diagnostics & Extensions | low | S01 | ⬜ | After this: Prompt template corrections, doctor/forensics accuracy improvements, extension manifest updates, and web_search→search-the-web migration are applied. typecheck + tests pass. |
| S06 | Remaining Fixes (tools, windows, user-interaction, misc) | low | S01 | ⬜ | After this: read-tool offset clamping, Windows shell guards, ask-user-questions free-text, MCP server name handling, OAuth google_search shape, and miscellaneous fixes are applied. typecheck + tests pass. All 95 upstream fixes accounted for. |
