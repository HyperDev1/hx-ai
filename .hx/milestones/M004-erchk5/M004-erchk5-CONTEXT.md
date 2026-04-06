# M004-erchk5: Upstream v2.64.0 Port

**Gathered:** 2026-04-06
**Status:** Ready for planning

## Project Description

HX is a fork of gsd-2. M003-ttxmyu completed all upstream commits through v2.63.0. This milestone ports the full v2.63.0→v2.64.0 delta (~58 actionable commits) with GSD→HX naming adaptation.

## Why This Milestone

v2.64.0 ships several high-value additions: a unified LLM safety harness for auto-mode damage control (7 new files, ~923 lines), a native Ollama /api/chat provider replacing the OpenAI compat shim, requirements DB auto-seeding from REQUIREMENTS.md, slice context injection into all prompt builders, DB bash-access protection, MCP-client OAuth, and 30+ stability bugfixes across the auto-mode loop.

## User-Visible Outcome

### When this milestone is complete, the user can:

- Auto-mode has an active safety harness: destructive command classification, evidence cross-reference, file-change validation, git checkpoint, content validation, timeout scale cap
- Ollama models connect via native `/api/chat` with full option exposure (temperature, top_p, num_gpu, etc.) and inference metrics
- `hx_requirement_update` no longer fails "not_found" — seeds from REQUIREMENTS.md on first call
- Slice context (S##-CONTEXT.md) is automatically injected into all 5 prompt builders
- LLM cannot query hx.db directly via bash — new `hx_milestone_status` read-only tool provides a sanctioned path
- MCP HTTP transport supports OAuth and bearer token auth for remote servers (Sentry, Linear, etc.)
- `hx-dev --version` shows 2.58.0 (staging); `npm run build` exits 0; 0 new test failures

### Entry point / environment

- Entry point: `hx-dev` CLI (staging), `hx-local` (local build)
- Environment: local dev
- Live dependencies: none beyond existing (SQLite, git, node)

## Completion Class

- Contract complete means: tsc --noEmit exits 0, npm run test:unit 0 new failures (baseline 4298/0/5), grep 0 GSD regressions
- Integration complete means: safety harness wired in register-hooks.ts + phases.ts; hx_milestone_status registered in query-tools.ts; Ollama provider registered in known APIs
- Operational complete means: none beyond existing runtime

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- `npx tsc --noEmit` exits 0 with all safety/ files present and wired
- `npm run test:unit` passes with 0 new failures (baseline: 4298/0/5)
- `grep -rn '\bgsd\b|\bGSD\b'` across all modified source files: 0 hits
- All ~58 actionable upstream commits accounted for (applied or explicitly skipped with rationale)
- `hx_requirement_update` called on a fresh requirement seeds from REQUIREMENTS.md without "not_found"

## Risks and Unknowns

- LLM Safety Harness is a large new subsystem (7 files, ~923 lines) — highest risk slice; must not regress existing auto-mode execution path
- Ollama native provider replaces the existing OpenAI-compat shim — need to verify hx-ai's current Ollama provider state before porting
- `fea9d72de` (slice-level parallelism) is in the v2.64.0 commit range but was already ported in M003/S02 — must be explicitly skipped
- Flat-rate routing guard (`6295d2a17`) touches `auto-model-selection.ts` which was significantly expanded in M003/S01 — merge carefully
- S##-CONTEXT.md injection touches 5 prompt builder files — need to identify hx-ai equivalents

## Existing Codebase / Prior Art

- `src/resources/extensions/hx/auto-post-unit.ts` — safety harness hooks here; check current state
- `src/resources/extensions/hx/auto/phases.ts` — safety harness phases integration point
- `src/resources/extensions/hx/auto-model-selection.ts` — flat-rate guard goes here (already expanded in M003/S01)
- `src/resources/extensions/hx/bootstrap/register-hooks.ts` — safety harness hooks registration
- `src/resources/extensions/hx/bootstrap/register-extension.ts` — new tool registration point for hx_milestone_status
- `src/resources/extensions/hx/bootstrap/query-tools.ts` — new hx_milestone_status tool lives here
- `src/resources/extensions/hx/preferences-types.ts` — safety_harness preference type
- `packages/mcp-server/` — OAuth changes for HTTP transport
- `src/resources/extensions/hx/prompts/` — DB guard additions to complete-milestone.md etc.
- `src/resources/extensions/hx/hx-db.ts` — updateRequirementInDb gets REQUIREMENTS.md seeding
- `src/welcome-screen.ts` — 200-column cap removal (trivial)

> See `.hx/DECISIONS.md` for all architectural and pattern decisions — it is an append-only register; read it during planning, append to it during execution.

## Relevant Requirements

- R019 — v2.63.0+ upstream changes (deferred in M003, now active in M004)
- R022 — LLM safety harness ported
- R023 — Ollama native /api/chat provider
- R024 — Requirements DB auto-seed from REQUIREMENTS.md
- R025 — Slice context injection to prompt builders
- R026 — DB bash access protection + hx_milestone_status tool
- R027 — Auto-mode loop stability (13 bugfix cluster)
- R028 — MCP-client OAuth + resource sync + misc
- R029 — GSD→HX naming adaptation (M004)
- R030 — Typecheck + build + tests pass (M004)

## Scope

### In Scope

- All ~58 actionable v2.63.0→v2.64.0 commits (fix/feat/refactor/perf, excluding merge/docs/chore/release/ci)
- GSD→HX naming adaptation for all ported code
- `fea9d72de` explicitly skipped (already in M003/S02)

### Out of Scope / Non-Goals

- Version bump / CHANGELOG / release metadata
- docs/ and repowise.db upstream changes
- Any commits beyond v2.64.0

## Technical Constraints

- Test baseline: 4298 pass / 0 fail / 5 skip (M003-ttxmyu final)
- All changes must pass `npx tsc --noEmit` and `npm run build`
- GSD naming must not be introduced in any modified source file

## Integration Points

- `safety/` subdirectory → `src/resources/extensions/hx/safety/` (new)
- `auto-post-unit.ts` → calls safety harness after each unit
- `phases.ts` → git checkpoint before each unit
- `register-hooks.ts` → registers safety validation hooks
- `query-tools.ts` → registers hx_milestone_status
- `hx-db.ts` → updateRequirementInDb gets seed-from-REQUIREMENTS.md fallback

## Open Questions

- None — commit set fully analyzed before planning
