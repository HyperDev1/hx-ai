# M002-yle1ri: Upstream v2.59.0 Bugfix Port — Context

**Gathered:** 2026-04-04
**Status:** Ready for planning

## Project Description

Port 95 bugfix commits from the upstream gsd-build/gsd-2 repository (between merge-base fe0e21895 and tag v2.59.0) into hx-ai. Every fix requires GSD→HX naming adaptation because hx-ai completed a full rename in M001-df6x5t.

## Why This Milestone

hx-ai forked from gsd-2 and completed a full GSD→HX rename. Since the fork point, upstream accumulated 95 stability fixes addressing state corruption, data loss, merge race conditions, TUI glitches, compaction overflow, DB sync issues, model routing errors, and more. These same bugs exist in hx-ai's codebase. Without this port, hx-ai users hit the same failures upstream already solved.

## User-Visible Outcome

### When this milestone is complete, the user can:

- Run hx-ai with all upstream v2.59.0 stability fixes active
- Trust that state/DB reconciliation, worktree merges, and milestone lifecycle work reliably
- Benefit from improved error handling, TUI rendering, and model provider routing

### Entry point / environment

- Entry point: `hx-dev` CLI command (staging mode)
- Environment: local dev
- Live dependencies involved: none — purely source code port

## Completion Class

- Contract complete means: typecheck passes, test suite passes, all 95 fixes analyzed and applied/skipped with rationale
- Integration complete means: build succeeds end-to-end
- Operational complete means: none — no runtime verification beyond tests

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- `tsc --noEmit` passes with zero errors
- Full test suite passes
- No residual GSD references introduced (grep verification)
- All 95 upstream fix commits accounted for (applied or documented skip)

## Risks and Unknowns

- **Merge conflict density** — 95 files have changes on both sides (upstream + hx-ai rename). Manual resolution required for each conflicting hunk.
- **Naming adaptation depth** — some fixes touch deeply nested GSD references (function names, env vars, DB column names, string literals). Missing an adaptation creates a runtime bug with no compile-time signal.
- **New files from upstream** — 100 new files added by upstream; some belong to feature commits (out of scope) but others are test files for bugfixes that need porting with adaptation.
- **Large commit complexity** — the TUI review fix (91f028674) touches 28 files. Manual adaptation at that scale increases error risk.
- **Test file divergence** — upstream tests reference `gsd`/`.gsd` paths; adapted tests must reference `hx`/`.hx` paths. Test fixture assumptions may differ.

## Existing Codebase / Prior Art

- `src/resources/extensions/hx/` — the primary area (67 of 95 fixes target `src/resources/extensions/gsd/` upstream, mapped to `hx/` in hx-ai)
- `packages/pi-coding-agent/src/` — TUI, compaction, model resolver, tools
- `packages/pi-ai/src/` — JSON parse repair, provider shared code
- `src/web/` — web services (dashboard, forensics, doctor, etc.)
- `.hx/milestones/M001-df6x5t/` — M001 summaries document the rename patterns and known exceptions

> See `.hx/DECISIONS.md` for all architectural and pattern decisions — it is an append-only register; read it during planning, append to it during execution.

## Relevant Requirements

- R001 — All 95 upstream v2.59.0 bugfixes analyzed and applied
- R002 — GSD→HX naming adaptation consistent across all ported fixes
- R003-R013 — Category-specific fix application requirements
- R014 — Typecheck + build + tests all pass

## Scope

### In Scope

- All 95 fix commits between merge-base and v2.59.0
- New test files associated with bugfix commits
- GSD→HX naming adaptation for all ported code
- Category-based commit grouping

### Out of Scope / Non-Goals

- 8 feature commits (Ollama extension, codebase map, vscode sidebar redesign, dynamic model routing, widget improvements, extension topological sort, splash header, state machine tests/refactors)
- CHANGELOG.md and version bump changes
- Upstream package.json version numbers
- Any changes to migrate-gsd-to-hx.ts backward-compat code

## Technical Constraints

- Every file path `src/resources/extensions/gsd/` maps to `src/resources/extensions/hx/` in hx-ai
- Every `gsd`/`GSD`/`.gsd`/`GSD_` reference in ported code must be adapted to `hx`/`HX`/`.hx`/`HX_`
- Function names like `gsdRoot()` are `hxRoot()` in hx-ai; `gsd.db` is `hx.db`; `GsdPreferences` is `HxPreferences`
- The Rust native binary still exports original function names — do not rename native call sites (per M001 K001 knowledge)
- migrate-gsd-to-hx.ts is a protected file — do not modify it

## Integration Points

- upstream remote: `gsd-build/gsd-2` (already configured, fetched to v2.59.0)
- Merge-base: `fe0e218954d5e42d2045192f8b8234c0cd56b8c6`
- Tag: `v2.59.0` → commit `9d8e73431`

## Open Questions

- None — scope, strategy, and verification are fully defined
