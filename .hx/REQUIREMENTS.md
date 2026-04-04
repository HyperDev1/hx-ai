# Requirements

This file is the explicit capability and coverage contract for the project.

Use it to track what is actively in scope, what has been validated by completed work, what is intentionally deferred, and what is explicitly out of scope.

## Active

### R001 — All upstream v2.59.0 bugfixes applied to hx-ai
- Class: core-capability
- Status: active
- Description: All 95 bugfix commits from upstream gsd-2 between merge-base (fe0e21895) and v2.59.0 tag must be analyzed and applied to hx-ai with GSD→HX naming adaptation
- Why it matters: hx-ai inherits the same bugs as upstream — state corruption, data loss, merge races, TUI glitches, compaction overflow, DB sync issues
- Source: user
- Primary owning slice: M002-yle1ri/S01-S06
- Supporting slices: none
- Validation: unmapped
- Notes: Each fix applied or explicitly skipped with documented rationale

### R002 — GSD→HX naming adaptation consistent across all ported fixes
- Class: quality-attribute
- Status: active
- Description: Every ported fix must use hx/HX naming (function names, env vars, file paths, comments, strings) — no GSD references introduced
- Why it matters: M001-df6x5t eliminated all GSD references; porting upstream code must not reintroduce them
- Source: inferred
- Primary owning slice: M002-yle1ri/S01-S06
- Supporting slices: none
- Validation: unmapped
- Notes: Verified by grep for residual gsd/GSD references after each slice

### R003 — State/DB reconciliation fixes applied (16 fixes)
- Class: core-capability
- Status: active
- Description: State machine DB sync, disk→DB reconciliation, SQLite migration, schema recovery, and data loss prevention fixes from upstream applied
- Why it matters: State corruption and data loss are the most severe class of bugs — these fixes prevent silent data destruction
- Source: user
- Primary owning slice: M002-yle1ri/S01
- Supporting slices: none
- Validation: unmapped
- Notes: Includes VACUUM recovery, unit ownership migration, DB column coercion, deriveState reconciliation

### R004 — Worktree/git merge fixes applied (14 fixes)
- Class: core-capability
- Status: active
- Description: Worktree merge, MERGE_HEAD cleanup, pre-merge safety, snapshot absorption, nested .git detection, and parallel mode boundary fixes from upstream applied
- Why it matters: Worktree operations are the most complex git interactions — merge failures can destroy work
- Source: user
- Primary owning slice: M002-yle1ri/S02
- Supporting slices: none
- Validation: unmapped
- Notes: Includes 3 separate MERGE_HEAD cleanup fixes, worktree DB sync, parallel milestone scoping

### R005 — Milestone lifecycle fixes applied (10 fixes)
- Class: core-capability
- Status: active
- Description: Milestone/slice completion, roadmap parser, validation invalidation, SUMMARY render, plan-milestone guard, and completing-milestone gate fixes from upstream applied
- Why it matters: Milestone lifecycle bugs cause stuck states, lost progress, and incorrect completion reporting
- Source: user
- Primary owning slice: M002-yle1ri/S03
- Supporting slices: none
- Validation: unmapped
- Notes: Includes 4 state corruption fixes in completion, roadmap H3 header parser, milestone title preservation

### R006 — Model/provider routing fixes applied (8 fixes)
- Class: core-capability
- Status: active
- Description: Model routing, provider resolution, rate-limit classification, OAuth API key resolution, and new provider integration fixes from upstream applied
- Why it matters: Model routing bugs cause 400/429 errors, wrong provider selection, and failed LLM calls
- Source: user
- Primary owning slice: M002-yle1ri/S03
- Supporting slices: none
- Validation: unmapped
- Notes: Includes Codex/Gemini CLI integration, claude-code provider statefulness, bare model ID resolution

### R007 — Auto-mode dispatch fixes applied (7 fixes)
- Class: core-capability
- Status: active
- Description: Auto-mode dispatch, headless routing, ask_user_questions poisoning prevention, stopAuto race guard, and work execution blocking fixes from upstream applied
- Why it matters: Auto-mode is the primary execution path — dispatch bugs cause hangs, infinite loops, and lost work
- Source: user
- Primary owning slice: M002-yle1ri/S02
- Supporting slices: none
- Validation: unmapped
- Notes: Includes piped stdout detection, empty-content abort skip, queue mode blocking

### R008 — TUI/UI rendering fixes applied (7 fixes)
- Class: quality-attribute
- Status: active
- Description: TUI layout, flow, rendering, state, border color, widget, tab switching, notification, and non-TTY CPU burn fixes from upstream applied
- Why it matters: TUI bugs cause visual glitches, CPU waste on non-TTY, and broken interactive workflows
- Source: user
- Primary owning slice: M002-yle1ri/S04
- Supporting slices: none
- Validation: unmapped
- Notes: Includes comprehensive 28-file TUI review fix, skip-render-loop on non-TTY

### R009 — Error handling / JSON parse fixes applied (4 fixes)
- Class: quality-attribute
- Status: active
- Description: STREAM_RE catch-all, YAML bullet list repair, malformed tool-call JSON repair, and prompt explosion prevention fixes from upstream applied
- Why it matters: Error handling gaps cause silent failures, unrecoverable parse errors, and prompt context poisoning
- Source: user
- Primary owning slice: M002-yle1ri/S04
- Supporting slices: none
- Validation: unmapped
- Notes: Includes catch-all V8 JSON.parse pattern replacing whack-a-mole approach

### R010 — Guided-flow / wizard fixes applied (4 fixes)
- Class: core-capability
- Status: active
- Description: Guided-flow session isolation, discussion milestone queries, roadmap fallback, allDiscussed routing, and dynamic routing pipeline fixes from upstream applied
- Why it matters: Guided-flow bugs cause wrong milestone selection, stuck discussions, and session state leaks
- Source: user
- Primary owning slice: M002-yle1ri/S03
- Supporting slices: none
- Validation: unmapped
- Notes: Includes dispatchWorkflow routing through dynamic routing pipeline

### R011 — Prompt and template fixes applied (5 fixes)
- Class: quality-attribute
- Status: active
- Description: camelCase parameter naming, web_search→search-the-web replacement, PROJECT.md write tool specification, and template replacement explosion prevention fixes from upstream applied
- Why it matters: Prompt bugs cause LLM confusion, wrong tool calls, and template corruption
- Source: user
- Primary owning slice: M002-yle1ri/S05
- Supporting slices: none
- Validation: unmapped
- Notes: Fixes span execute-task, complete-slice, milestone, and slice prompts

### R012 — Diagnostics (doctor/forensics) fixes applied (4 fixes)
- Class: quality-attribute
- Status: active
- Description: Doctor audit false positives, forensics duplicate detection ordering, forensics report persistence, and completion status DB read fixes from upstream applied
- Why it matters: False positives erode trust in diagnostics; missing persistence loses investigation context
- Source: user
- Primary owning slice: M002-yle1ri/S05
- Supporting slices: none
- Validation: unmapped
- Notes: Includes forensics reading completion from DB instead of legacy file

### R013 — Remaining fixes applied (tools, windows, user-interaction, misc)
- Class: core-capability
- Status: active
- Description: read-tool offset clamping, Windows shell guards, ask-user-questions free-text input, MCP server name spaces, OAuth google_search shape, Discord links, and other miscellaneous fixes from upstream applied
- Why it matters: These fixes address edge cases across multiple subsystems that individually cause user-facing failures
- Source: user
- Primary owning slice: M002-yle1ri/S06
- Supporting slices: none
- Validation: unmapped
- Notes: Mix of platform compat, tool UX, and documentation fixes

### R014 — Typecheck + build + tests all pass
- Class: quality-attribute
- Status: active
- Description: After all fixes applied, tsc --noEmit passes, build succeeds, and full test suite passes
- Why it matters: Ported fixes must not break existing functionality
- Source: user
- Primary owning slice: M002-yle1ri/S01-S06
- Supporting slices: none
- Validation: unmapped
- Notes: Verified after each slice completion

## Deferred

### R015 — Upstream feature commits port (Ollama, codebase map, vscode redesign, etc.)
- Class: core-capability
- Status: deferred
- Description: 8 feature commits from upstream v2.59.0 (Ollama extension, codebase map, vscode sidebar redesign, dynamic model routing default, widget improvements, extension topological sort, splash header)
- Why it matters: These add new capabilities but are not stability fixes
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: Deferred by user decision — bugfixes only for M002-yle1ri

## Out of Scope

### R016 — Upstream CHANGELOG / version bump changes
- Class: constraint
- Status: out-of-scope
- Description: CHANGELOG.md updates, package.json version bumps, and release-related changes from upstream are excluded
- Why it matters: hx-ai has its own versioning and changelog — upstream release metadata is not applicable
- Source: inferred
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: hx-ai maintains independent version numbers

## Traceability

| ID | Class | Status | Primary owner | Supporting | Proof |
|---|---|---|---|---|---|
| R001 | core-capability | active | M002-yle1ri/S01-S06 | none | unmapped |
| R002 | quality-attribute | active | M002-yle1ri/S01-S06 | none | unmapped |
| R003 | core-capability | active | M002-yle1ri/S01 | none | unmapped |
| R004 | core-capability | active | M002-yle1ri/S02 | none | unmapped |
| R005 | core-capability | active | M002-yle1ri/S03 | none | unmapped |
| R006 | core-capability | active | M002-yle1ri/S03 | none | unmapped |
| R007 | core-capability | active | M002-yle1ri/S02 | none | unmapped |
| R008 | quality-attribute | active | M002-yle1ri/S04 | none | unmapped |
| R009 | quality-attribute | active | M002-yle1ri/S04 | none | unmapped |
| R010 | core-capability | active | M002-yle1ri/S03 | none | unmapped |
| R011 | quality-attribute | active | M002-yle1ri/S05 | none | unmapped |
| R012 | quality-attribute | active | M002-yle1ri/S05 | none | unmapped |
| R013 | core-capability | active | M002-yle1ri/S06 | none | unmapped |
| R014 | quality-attribute | active | M002-yle1ri/S01-S06 | none | unmapped |
| R015 | core-capability | deferred | none | none | unmapped |
| R016 | constraint | out-of-scope | none | none | n/a |

## Coverage Summary

- Active requirements: 14
- Mapped to slices: 14
- Validated: 0
- Unmapped active requirements: 0
