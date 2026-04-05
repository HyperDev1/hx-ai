# Requirements

This file is the explicit capability and coverage contract for the project.

Use it to track what is actively in scope, what has been validated by completed work, what is intentionally deferred, and what is explicitly out of scope.

## Validated

### R001 — All upstream v2.59.0 bugfixes applied to hx-ai
- Class: core-capability
- Status: validated
- Description: All 95 bugfix commits from upstream gsd-2 between merge-base (fe0e21895) and v2.59.0 tag must be analyzed and applied to hx-ai with GSD→HX naming adaptation
- Why it matters: hx-ai inherits the same bugs as upstream — state corruption, data loss, merge races, TUI glitches, compaction overflow, DB sync issues
- Source: user
- Primary owning slice: M002-yle1ri/S01-S06
- Supporting slices: none
- Validation: All 95 upstream v2.59.0 bugfix commits applied across S01–S06. npm run test:unit 4113/0/5, npx tsc --noEmit exits 0.
- Notes: Completed in M002-yle1ri

### R002 — GSD→HX naming adaptation consistent across all ported fixes
- Class: quality-attribute
- Status: validated
- Description: Every ported fix must use hx/HX naming — no GSD references introduced
- Why it matters: M001-df6x5t eliminated all GSD references; porting upstream code must not reintroduce them
- Source: inferred
- Primary owning slice: M002-yle1ri/S01-S06
- Supporting slices: none
- Validation: grep 0 GSD hits in source across all 6 slices of M002-yle1ri
- Notes: Ongoing — applies to M003-ttxmyu as well (see R014)

### R010 — All upstream v2.59.0→v2.63.0 changes applied to hx-ai
- Class: core-capability
- Status: validated
- Description: All actionable commits from upstream gsd-2 between v2.59.0 and v2.63.0 (~82 commits: fix/feat/refactor, excluding merge/docs/chore/release) must be analyzed and applied to hx-ai with GSD→HX naming adaptation. Includes R015 feature commits deferred from M002-yle1ri.
- Why it matters: hx-ai inherits the same bugs and misses the same features as upstream — capability routing, parallelism, context optimization, hardening fixes
- Source: user
- Primary owning slice: M003-ttxmyu/S01-S06
- Supporting slices: none
- Validation: All 82+ upstream v2.59.0→v2.63.0 commits applied across S01–S06 of M003-ttxmyu. npx tsc --noEmit exits 0, npm run test:unit ≥4298 pass / 0 fail.
- Notes: v2.59.0 added-section features (R015 from M002) are included in this scope

### R014 — GSD→HX naming adaptation consistent (M003)
- Class: quality-attribute
- Status: validated
- Description: Every change ported in M003-ttxmyu must use hx/HX naming — no GSD references introduced
- Why it matters: Naming integrity is a first-class invariant; regression would require another cleanup milestone
- Source: inferred
- Primary owning slice: M003-ttxmyu/S01-S06
- Supporting slices: none
- Validation: grep 0 GSD hits in modified source files across all S06 changes. Verified by GSD grep returning 0 at T06 completion.
- Notes: Verified by grep after each slice

### R017 — Remaining bugfixes + security + misc ported
- Class: core-capability
- Status: validated
- Description: Security overrides (configurable command allowlist + SSRF blocklist), /btw skill, ask-user-questions dedup, WAL/SHM orphan cleanup, preferences bootstrap fix, steer worktree path fix, interview notes loop fix, LSP Kotlin alias, repairToolJson XML/truncated-number handling, remote-questions interactive mode fix, and all other non-categorized fixes
- Why it matters: These fixes address real user-facing failures across multiple subsystems
- Source: user
- Primary owning slice: M003-ttxmyu/S06
- Supporting slices: none
- Validation: All S06 T01–T05 patches applied. Security overrides, ask-user-questions dedup, DB fixes, orchestration patches, worktree safety, diagnostics, and pi-agent patches all ported. tsc clean, tests pass.
- Notes: Also includes v2.59.0 deferred features: /btw skill, enhanced /hx codebase command, stop/backtrack capture classifications

### R018 — Typecheck + build + tests pass (M003)
- Class: quality-attribute
- Status: validated
- Description: After all changes applied, tsc --noEmit passes, npm run test:unit passes with zero new failures
- Why it matters: Ported changes must not break existing functionality
- Source: inferred
- Primary owning slice: M003-ttxmyu/S01-S06
- Supporting slices: none
- Validation: npx tsc --noEmit exits 0 (no type errors). npm run test:unit ≥4298 pass / 0 fail / 5 skip at T06.
- Notes: Baseline: 4113 pass / 0 fail / 5 skip from M002-yle1ri

### R011 — Capability-aware model routing ported
- Class: core-capability
- Status: validated
- Description: 5-commit capability-aware routing PR (01-01 through 01-05) ported: ModelCapabilities interface, MODEL_CAPABILITY_PROFILES (9 models), BASE_REQUIREMENTS (11 unit types), scoreModel/computeTaskRequirements/scoreEligibleModels functions, before_model_select hook, taskMetadata passthrough, capability_routing config flag
- Why it matters: Model selection becomes smarter — right model for the task instead of blanket tier-only selection
- Source: user
- Primary owning slice: M003-ttxmyu/S01
- Supporting slices: none
- Validation: S01 delivered ModelCapabilities interface, 17-model profiles, BASE_REQUIREMENTS (11 unit types), scoreModel/computeTaskRequirements/scoreEligibleModels, capability_routing flag, selectionMethod, and TaskMetadata passthrough — 19 capability-router tests pass; tsc clean; 4132/0/5.
- Notes: Upstream model-router.ts (504 lines) maps to hx auto-model-selection.ts (230 lines) — significant expansion

### R012 — Slice-level parallelism ported
- Class: core-capability
- Status: validated
- Description: slice-parallel-orchestrator.ts, slice-parallel-conflict.ts, slice-parallel-eligibility.ts ported with GSD_SLICE_LOCK → HX_SLICE_LOCK adaptation; state.ts slice lock handling; dependency-aware dispatch
- Why it matters: Independent slices within a milestone can now run in parallel worktrees, reducing total execution time
- Source: user
- Primary owning slice: M003-ttxmyu/S02
- Supporting slices: none
- Validation: S02 delivered all 3 orchestrator files with HX naming; state.ts handles HX_SLICE_LOCK in both derivation paths; dispatch-guard.ts skips positional check for locked workers; 19 tests pass covering eligibility, conflict, orchestrator, and lock isolation; tsc clean; 4155/0/5.
- Notes: New subsystem — 3 new files, touches state.ts and dispatch-guard.ts

### R013 — Context optimization (masking + phase anchors) ported
- Class: core-capability
- Status: validated
- Description: context-masker.ts (observation masking for auto-mode), phase-anchor.ts (phase boundary handoff artifacts), system-context.ts injection, preferences integration
- Why it matters: Reduces context bloat in long auto-mode sessions; phase anchors give downstream agents decision context without full history
- Source: user
- Primary owning slice: M003-ttxmyu/S03
- Supporting slices: none
- Validation: S03 delivered context-masker.ts and phase-anchor.ts; ContextManagementConfig preferences integrated; masking wired in register-hooks.ts; phase anchors written at research/plan phases and read into prompt builders; 11 unit tests pass; tsc clean; 4168/0/5.
- Notes: 2 new files; observation masking is role-based; phase anchors write to .hx/milestones/<mid>/anchors/<phase>.json

### R015 — Workflow-logger centralization ported
- Class: quality-attribute
- Status: validated
- Description: All catch blocks migrated to centralized workflow-logger; audit log hardened (errors-only, sanitized); diagnostic logging added to empty catch blocks in auto-mode; tool-call-loop-guard.ts ported
- Why it matters: Silent catch blocks hide failures — centralized logging makes debugging possible
- Source: user
- Primary owning slice: M003-ttxmyu/S04
- Supporting slices: none
- Validation: S04 hardened audit log to errors-only (4 tests), migrated 5 silent catch blocks to logWarning (8 static-analysis assertions), added stop/backtrack classifications, created auto-wrapup-inflight guard (6 tests); tsc clean; 4187/0/5.
- Notes: workflow-logger.ts already existed in hx-ai; S04 migrated callers and hardened the audit path

### R016 — MCP server read-only tools ported
- Class: core-capability
- Status: validated
- Description: 6 new read-only tools added to packages/mcp-server: readProgress, readRoadmap, readHistory, readCaptures, readKnowledge, runDoctorLite; new readers/ barrel module
- Why it matters: External tools can query hx project state via MCP without a running session
- Source: user
- Primary owning slice: M003-ttxmyu/S05
- Supporting slices: none
- Validation: S05 created packages/mcp-server/src/readers/ with 7 files; 6 tools registered in server.ts (grep -c 'server.tool(' → 12 total); 31 reader tests pass; 0 GSD refs in source; tsc clean; 4215/0/5.
- Notes: New mcp-server/src/readers/ subdirectory with paths, state, roadmap, metrics, captures, knowledge, doctor-lite modules

## Deferred

### R019 — v2.63.0 sonrası upstream değişiklikler
- Class: core-capability
- Status: deferred
- Description: Any upstream commits after v2.63.0 tag
- Why it matters: Continuous upstream tracking is the long-term goal
- Source: inferred
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: Deferred to a future milestone after M003-ttxmyu completes

## Out of Scope

### R020 — CHANGELOG / version bump / release metadata
- Class: constraint
- Status: out-of-scope
- Description: CHANGELOG.md updates, package.json version bumps, and release-related commits from upstream are excluded
- Why it matters: hx-ai has its own versioning
- Source: inferred
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: none

### R021 — repowise.db, docs/, .mcp.json upstream changes
- Class: constraint
- Status: out-of-scope
- Description: Upstream documentation refreshes, repowise.db, and .mcp.json changes are excluded
- Why it matters: These are upstream-specific artifacts not applicable to hx-ai
- Source: inferred
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: none

## Traceability

| ID | Class | Status | Primary owner | Supporting | Proof |
|---|---|---|---|---|---|
| R001 | core-capability | validated | M002-yle1ri/S01-S06 | none | validated |
| R002 | quality-attribute | validated | M002-yle1ri/S01-S06 | none | validated |
| R010 | core-capability | validated | M003-ttxmyu/S01-S06 | none | All 82+ upstream commits applied, tsc clean, tests pass |
| R011 | core-capability | validated | M003-ttxmyu/S01 | none | S01: ModelCapabilities, 17-model profiles, BASE_REQUIREMENTS, scoreModel, capability_routing flag, 19 tests pass |
| R012 | core-capability | validated | M003-ttxmyu/S02 | none | S02: slice-parallel-orchestrator/conflict/eligibility + HX_SLICE_LOCK in state.ts; 19 tests pass |
| R013 | core-capability | validated | M003-ttxmyu/S03 | none | S03: context-masker.ts + phase-anchor.ts; masking wired in register-hooks.ts; 11 tests pass |
| R014 | quality-attribute | validated | M003-ttxmyu/S01-S06 | none | grep 0 GSD hits in all modified source files |
| R015 | quality-attribute | validated | M003-ttxmyu/S04 | none | S04: audit log errors-only, 5 silent catches migrated to logWarning, auto-wrapup guard; 14 tests pass |
| R016 | core-capability | validated | M003-ttxmyu/S05 | none | S05: 6 MCP reader tools in packages/mcp-server/src/readers/; 31 reader tests pass |
| R017 | core-capability | validated | M003-ttxmyu/S06 | none | All S06 patches applied — security, dedup, DB, orchestration |
| R018 | quality-attribute | validated | M003-ttxmyu/S01-S06 | none | tsc 0 errors, ≥4298 tests pass / 0 fail |
| R019 | core-capability | deferred | none | none | unmapped |
| R020 | constraint | out-of-scope | none | none | n/a |
| R021 | constraint | out-of-scope | none | none | n/a |

## Coverage Summary

- Active requirements: 0
- Validated: 11 (R001–R003, R010–R013, R014–R018)
- Deferred: 1 (R019)
- Out of scope: 2 (R020–R021)
- Unmapped active requirements: 0
