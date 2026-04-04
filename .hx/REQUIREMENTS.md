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
- Validation: All 95 upstream v2.59.0 bugfix commits applied across S01–S06. S06 summary confirms all accounted for. npm run test:unit 4113/0/5, npx tsc --noEmit exits 0.
- Notes: Each fix applied or explicitly skipped with documented rationale

### R002 — GSD→HX naming adaptation consistent across all ported fixes
- Class: quality-attribute
- Status: validated
- Description: Every ported fix must use hx/HX naming (function names, env vars, file paths, comments, strings) — no GSD references introduced
- Why it matters: M001-df6x5t eliminated all GSD references; porting upstream code must not reintroduce them
- Source: inferred
- Primary owning slice: M002-yle1ri/S01-S06
- Supporting slices: none
- Validation: grep -rn '\bgsd\b|\bGSD\b' across all modified source files: 0 hits in all 6 slice verification runs. Only binary .next/ webpack caches matched (not source).
- Notes: Verified by grep for residual gsd/GSD references after each slice

### R003 — State/DB reconciliation fixes applied (16 fixes)
- Class: core-capability
- Status: validated
- Description: State machine DB sync, disk→DB reconciliation, SQLite migration, schema recovery, and data loss prevention fixes from upstream applied
- Why it matters: State corruption and data loss are the most severe class of bugs — these fixes prevent silent data destruction
- Source: user
- Primary owning slice: M002-yle1ri/S01
- Supporting slices: none
- Validation: S01 applied 16 state/DB fixes: unit-ownership SQLite, deriveState unconditional DB path, slice reconciliation, ghost check, VACUUM recovery, toNumeric coercion, isInsideWorktree guard, symlink layout detection, retry guard, project relocation + upgrade migration, nativeCommit surfacing, hx_requirement_save tools, parallel-eligibility ghost guard, auto-dashboard reconcile, turn_end workspace invalidation. Tests 17/17 + 28/28 + 6/6 + 11/11 + 1/1 pass.
- Notes: Includes VACUUM recovery, unit ownership migration, DB column coercion, deriveState reconciliation

### R004 — Worktree/git merge fixes applied (14 fixes)
- Class: core-capability
- Status: validated
- Description: Worktree merge, MERGE_HEAD cleanup, pre-merge safety, snapshot absorption, nested .git detection, and parallel mode boundary fixes from upstream applied
- Why it matters: Worktree operations are the most complex git interactions — merge failures can destroy work
- Source: user
- Primary owning slice: M002-yle1ri/S02
- Supporting slices: none
- Validation: S02 applied 21 worktree/git+auto-mode fixes (absorbSnapshotCommits N/A in hx-ai). DB truncation guard, mcp.json sync, MERGE_HEAD 3-file cleanup, nativeMergeAbort, milestone shelter, isInsideHxWorktree, HX_MILESTONE_LOCK, findNestedGitDirs, isolation-none safety, DB-complete detection — all confirmed present by post-fix grep checks. 3100 tests pass.
- Notes: Includes 3 separate MERGE_HEAD cleanup fixes, worktree DB sync, parallel milestone scoping

### R005 — Milestone lifecycle fixes applied (10 fixes)
- Class: core-capability
- Status: validated
- Description: Milestone/slice completion, roadmap parser, validation invalidation, SUMMARY render, plan-milestone guard, and completing-milestone gate fixes from upstream applied
- Why it matters: Milestone lifecycle bugs cause stuck states, lost progress, and incorrect completion reporting
- Source: user
- Primary owning slice: M002-yle1ri/S03
- Supporting slices: none
- Validation: S03 applied 19 fixes including renderPlanContent/renderRoadmapContent demo fallback, replaySliceComplete guard, post-merge teardown, milestone-validation-gates.ts (MV01-MV04), unified SUMMARY render with VerificationEvidenceRow. 63+ tests pass. typecheck clean.
- Notes: Includes 4 state corruption fixes in completion, roadmap H3 header parser, milestone title preservation

### R006 — Model/provider routing fixes applied (8 fixes)
- Class: core-capability
- Status: validated
- Description: Model routing, provider resolution, rate-limit classification, OAuth API key resolution, and new provider integration fixes from upstream applied
- Why it matters: Model routing bugs cause 400/429 errors, wrong provider selection, and failed LLM calls
- Source: user
- Primary owning slice: M002-yle1ri/S03
- Supporting slices: none
- Validation: S03 applied EXTENSION_PROVIDERS-aware bare model ID resolution, Codex/Gemini CLI provider routes + 30s rate-limit cap, pauseTurn stop reason propagation, OAuth API key resolution, stateful claude-code stream adapter with persistSession:true, long-context 429 downgrade. typecheck clean, tests pass.
- Notes: Includes Codex/Gemini CLI integration, claude-code provider statefulness, bare model ID resolution

### R007 — Auto-mode dispatch fixes applied (7 fixes)
- Class: core-capability
- Status: validated
- Description: Auto-mode dispatch, headless routing, ask_user_questions poisoning prevention, stopAuto race guard, and work execution blocking fixes from upstream applied
- Why it matters: Auto-mode is the primary execution path — dispatch bugs cause hangs, infinite loops, and lost work
- Source: user
- Primary owning slice: M002-yle1ri/S02
- Supporting slices: none
- Validation: S02 applied hx auto subcommand alias, empty-content abort fast-path, stopAuto null-unit guard with optional chaining, shouldBlockQueueExecution gate, turn_end quick-branch cleanup, autonomous execution guards in 3 prompt files, captures staleness filter/stamp. All confirmed by grep checks. 3100 tests pass.
- Notes: Includes piped stdout detection, empty-content abort skip, queue mode blocking

### R008 — TUI/UI rendering fixes applied (7 fixes)
- Class: quality-attribute
- Status: validated
- Description: TUI layout, flow, rendering, state, border color, widget, tab switching, notification, and non-TTY CPU burn fixes from upstream applied
- Why it matters: TUI bugs cause visual glitches, CPU waste on non-TTY, and broken interactive workflows
- Source: user
- Primary owning slice: M002-yle1ri/S04
- Supporting slices: none
- Validation: S04 applied isTTY guard (non-TTY render loop prevention), image-overflow-recovery module, chatUserMessages overflow trim, formatNotificationTitle with project name. 28-file TUI audit: 12 of 15 items already correct in hx-ai, 3 changed. typecheck clean, tests pass.
- Notes: Includes comprehensive 28-file TUI review fix, skip-render-loop on non-TTY

### R009 — Error handling / JSON parse fixes applied (4 fixes)
- Class: quality-attribute
- Status: validated
- Description: STREAM_RE catch-all, YAML bullet list repair, malformed tool-call JSON repair, and prompt explosion prevention fixes from upstream applied
- Why it matters: Error handling gaps cause silent failures, unrecoverable parse errors, and prompt context poisoning
- Source: user
- Primary owning slice: M002-yle1ri/S04
- Supporting slices: none
- Validation: S04 applied STREAM_RE catch-all V8 patterns, repairToolJson YAML-to-JSON repair, compaction chunked-fallback, split().join() template substitution fix. Tests pass for repair-tool-json and compaction. typecheck clean.
- Notes: Includes catch-all V8 JSON.parse pattern replacing whack-a-mole approach

### R010 — Guided-flow / wizard fixes applied (4 fixes)
- Class: core-capability
- Status: validated
- Description: Guided-flow session isolation, discussion milestone queries, roadmap fallback, allDiscussed routing, and dynamic routing pipeline fixes from upstream applied
- Why it matters: Guided-flow bugs cause wrong milestone selection, stuck discussions, and session state leaks
- Source: user
- Primary owning slice: M002-yle1ri/S03
- Supporting slices: none
- Validation: S03 applied Map-based pendingAutoStartMap for session isolation, guided-flow routing fixes, allDiscussed routing, dispatchWorkflow through dynamic routing pipeline. typecheck clean, tests pass.
- Notes: Includes dispatchWorkflow routing through dynamic routing pipeline

### R011 — Prompt and template fixes applied (5 fixes)
- Class: quality-attribute
- Status: validated
- Description: camelCase parameter naming, web_search→search-the-web replacement, PROJECT.md write tool specification, and template replacement explosion prevention fixes from upstream applied
- Why it matters: Prompt bugs cause LLM confusion, wrong tool calls, and template corruption
- Source: user
- Primary owning slice: M002-yle1ri/S05
- Supporting slices: none
- Validation: S05 applied camelCase milestoneId/sliceId/taskId in execute-task/complete-slice/complete-milestone prompts, web_search→search-the-web migration confirmed (no web_search refs remain). S04 applied split().join() template fix. prompt-tool-names.test.ts and prompt-contracts.test.ts pass.
- Notes: Fixes span execute-task, complete-slice, milestone, and slice prompts

### R012 — Diagnostics (doctor/forensics) fixes applied (4 fixes)
- Class: quality-attribute
- Status: validated
- Description: Doctor audit false positives, forensics duplicate detection ordering, forensics report persistence, and completion status DB read fixes from upstream applied
- Why it matters: False positives erode trust in diagnostics; missing persistence loses investigation context
- Source: user
- Primary owning slice: M002-yle1ri/S05
- Supporting slices: none
- Validation: S05 applied forensics DB-backed getDbCompletionCounts, forensics-marker.json persistence + injection, forensics dedup (Decision Gate before Investigation Protocol), doctor isDoctorArtifactOnly guard + !allTasksDone guard + parsers-legacy second-pass. New test files pass: forensics-db-completion, forensics-dedup, forensics-context-persist, doctor-false-positives.
- Notes: Includes forensics reading completion from DB instead of legacy file

### R013 — Remaining fixes applied (tools, windows, user-interaction, misc)
- Class: core-capability
- Status: validated
- Description: read-tool offset clamping, Windows shell guards, ask-user-questions free-text input, MCP server name spaces, OAuth google_search shape, Discord links, and other miscellaneous fixes from upstream applied
- Why it matters: These fixes address edge cases across multiple subsystems that individually cause user-facing failures
- Source: user
- Primary owning slice: M002-yle1ri/S06
- Supporting slices: none
- Validation: S06 applied all 9 remaining fixes; npm run test:unit 4113/0/5; npx tsc --noEmit exits 0. 8 new test files with 32 new passing tests confirmed all fixes.
- Notes: Mix of platform compat, tool UX, and documentation fixes

### R014 — Typecheck + build + tests all pass
- Class: quality-attribute
- Status: validated
- Description: After all fixes applied, tsc --noEmit passes, build succeeds, and full test suite passes
- Why it matters: Ported fixes must not break existing functionality
- Source: user
- Primary owning slice: M002-yle1ri/S01-S06
- Supporting slices: none
- Validation: npx tsc --noEmit exits 0 (5.0s). npm run test:unit: 4113 passed / 0 failed / 5 skipped. Verified at S06 close and at M002-yle1ri milestone close.
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
| R001 | core-capability | validated | M002-yle1ri/S01-S06 | none | All 95 upstream fixes applied; npm run test:unit 4113/0/5; tsc exits 0 |
| R002 | quality-attribute | validated | M002-yle1ri/S01-S06 | none | grep 0 GSD hits in source across all 6 slices |
| R003 | core-capability | validated | M002-yle1ri/S01 | none | 16 state/DB fixes applied; unit tests pass |
| R004 | core-capability | validated | M002-yle1ri/S02 | none | 14+ worktree/git fixes applied; grep checks pass; 3100 tests |
| R005 | core-capability | validated | M002-yle1ri/S03 | none | Milestone lifecycle fixes applied; 63+ tests pass |
| R006 | core-capability | validated | M002-yle1ri/S03 | none | Model/provider fixes applied; typecheck clean |
| R007 | core-capability | validated | M002-yle1ri/S02 | none | Auto-mode dispatch fixes applied; 3100 tests pass |
| R008 | quality-attribute | validated | M002-yle1ri/S04 | none | TUI/UI fixes applied; 28-file audit complete |
| R009 | quality-attribute | validated | M002-yle1ri/S04 | none | Error handling fixes applied; repair-tool-json tests pass |
| R010 | core-capability | validated | M002-yle1ri/S03 | none | Guided-flow fixes applied; typecheck clean |
| R011 | quality-attribute | validated | M002-yle1ri/S05 | none | Prompt/template fixes applied; prompt-tool-names tests pass |
| R012 | quality-attribute | validated | M002-yle1ri/S05 | none | Diagnostics fixes applied; forensics/doctor tests pass |
| R013 | core-capability | validated | M002-yle1ri/S06 | none | Remaining fixes applied; 4113/0/5 tests |
| R014 | quality-attribute | validated | M002-yle1ri/S01-S06 | none | npx tsc exits 0; npm run test:unit 4113/0/5 |
| R015 | core-capability | deferred | none | none | unmapped |
| R016 | constraint | out-of-scope | none | none | n/a |

## Coverage Summary

- Active requirements: 0
- Validated: 14 (R001–R014)
- Deferred: 1 (R015)
- Out of scope: 1 (R016)
- Unmapped active requirements: 0
