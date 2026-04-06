# S01: LLM Safety Harness

**Goal:** Port the LLM safety harness from upstream commit 1e87c973b (+ adversarial fix 4e2ab76fc): create 7 new files in src/resources/extensions/hx/safety/, modify 7 existing files to wire the harness in, and add git-checkpoint regression tests. All GSD→HX naming adaptations applied.
**Demo:** After this: After this: src/resources/extensions/hx/safety/ has 7 files; safety harness wired; tsc clean baseline for S02–S05

## Tasks
- [x] **T01: Created src/resources/extensions/hx/safety/ with all 7 LLM safety harness TypeScript files, HX-adapted, tsc clean, 4298 tests passing** — Create the src/resources/extensions/hx/safety/ directory and write all 7 new TypeScript files ported from upstream commit 1e87c973b with GSD→HX naming adaptations. The adversarial fix 4e2ab76fc must be applied to git-checkpoint.ts (use `git reset --hard <sha>` instead of the original `git branch -f` + double reset). Strip upstream copyright headers (hx-ai files have none).

Adaptations required:
1. `git-checkpoint.ts`: `CHECKPOINT_PREFIX = "refs/hx/checkpoints/"` (not gsd)
2. `file-change-validator.ts`: filter out `.hx/` paths (not `.gsd/`) — line: `!f.startsWith(".hx/") && !f.startsWith(".hx\\")`
3. All files: remove `Copyright (c) 2026 Jeremy McSpadden` header comments
4. `git-checkpoint.ts` rollback: use `git reset --hard <sha>` from 4e2ab76fc, NOT the original double-reset + `git branch -f` pattern

File list and their upstream SHA to port:
- `evidence-collector.ts` — 151 lines, module-level array, 6 exported functions
- `destructive-guard.ts` — 49 lines, 10 DESTRUCTIVE_PATTERNS, classifyCommand()
- `file-change-validator.ts` — 108 lines, validateFileChanges() using git diff HEAD~1 HEAD
- `evidence-cross-ref.ts` — 120 lines, crossReferenceEvidence()
- `git-checkpoint.ts` — 116 lines (adversarial version), createCheckpoint/rollbackToCheckpoint/cleanupCheckpoint
- `content-validator.ts` — 98 lines, validateContent() with plan-slice/plan-milestone validators
- `safety-harness.ts` — 105 lines, SafetyHarnessConfig, DEFAULTS, resolveSafetyHarnessConfig, isHarnessEnabled, re-exports from all 6 siblings
  - Estimate: 1h
  - Files: src/resources/extensions/hx/safety/evidence-collector.ts, src/resources/extensions/hx/safety/destructive-guard.ts, src/resources/extensions/hx/safety/file-change-validator.ts, src/resources/extensions/hx/safety/evidence-cross-ref.ts, src/resources/extensions/hx/safety/git-checkpoint.ts, src/resources/extensions/hx/safety/content-validator.ts, src/resources/extensions/hx/safety/safety-harness.ts
  - Verify: grep -rn 'refs/gsd/checkpoints' src/resources/extensions/hx/safety/ | wc -l | grep -q '^0$' && grep -rn '\.gsd/' src/resources/extensions/hx/safety/ | wc -l | grep -q '^0$' && grep -rn '\bgsd\b\|\bGSD\b' src/resources/extensions/hx/safety/ | wc -l | grep -q '^0$' && echo 'GSD-clean' && npx tsc --noEmit 2>&1 | head -20
- [x] **T02: Wired LLM safety harness into 7 existing files and added 4 git-checkpoint regression tests; tsc clean, all tests pass** — Modify 7 existing files to integrate the safety harness, then add git-checkpoint regression tests. Run compile-tests.mjs and verify all 4 checkpoint tests pass.

File-by-file changes:

**1. workflow-logger.ts** — Add `| "safety"` to LogComponent union after `"reconcile"`:
```
| "reconcile"  // Worktree reconciliation
| "safety";    // LLM safety harness
```
(Note the semicolon moves from `reconcile` to `safety`.)

**2. preferences-types.ts** — Two additions:
- Add `"safety_harness"` to KNOWN_PREFERENCE_KEYS Set (before closing `])`)
- Add `safety_harness?: { enabled?: boolean; evidence_collection?: boolean; file_change_validation?: boolean; evidence_cross_reference?: boolean; destructive_command_warnings?: boolean; content_validation?: boolean; checkpoints?: boolean; auto_rollback?: boolean; timeout_scale_cap?: number; }` to HXPreferences interface with JSDoc comment.

**3. auto/session.ts** — Two changes:
- Add `checkpointSha: string | null = null;` field to AutoSession class (under a `// Safety harness` comment, near other nullable fields)
- Add `this.checkpointSha = null;` to the `reset()` method body

**4. auto/phases.ts** — Two blocks from upstream diff:
- BEFORE `// Prompt injection` section (~line 968): Add safety harness reset+checkpoint block. Imports: `resetEvidence` from `../safety/evidence-collector.js`, `createCheckpoint, cleanupCheckpoint, rollbackToCheckpoint` from `../safety/git-checkpoint.js`, `resolveSafetyHarnessConfig` from `../safety/safety-harness.js`. The block resets evidence and creates a checkpoint for execute-task units.
- AFTER `emitJournalEvent("unit-end")` (~line 1252, before `return { action: "next"... }`): Add checkpoint cleanup/rollback block checking `s.checkpointSha`.

**5. auto-post-unit.ts** — After the rogue-file detection try/catch block (~line 432, before `// Artifact verification`): Insert the 87-line safety harness post-unit validation block. Imports needed: `validateFileChanges` from `./safety/file-change-validator.js`, `validateContent` from `./safety/content-validator.js`, `resolveSafetyHarnessConfig` from `./safety/safety-harness.js`, `resolveExpectedArtifactPath as resolveArtifactForContent` from `./auto-artifact-paths.js`. Uses dynamic import for preferences: `const { loadEffectiveHXPreferences } = await import("./preferences.js")`. The block does: file-change validation, evidence cross-reference (zero-bash check), content validation.

**6. bootstrap/register-hooks.ts** — Two changes:
- Add new `pi.on("tool_call", ...)` safety handler AFTER the existing `pi.on("tool_call", ...)` closing `});` and BEFORE `pi.on("tool_result", ...)`. Imports: `recordToolCall as safetyRecordToolCall, recordToolResult as safetyRecordToolResult` from `../safety/evidence-collector.js`, `classifyCommand` from `../safety/destructive-guard.js`. Handler calls `safetyRecordToolCall(event.toolName, event.input)` always, then for bash events classifies and warns.
- In existing `tool_execution_end` handler: add `if (isAutoActive()) { safetyRecordToolResult(event.toolCallId, event.toolName, event.result, event.isError); }` after `markToolEnd(event.toolCallId)`.

**7. auto-timers.ts** — Replace the timeoutScale line:
Old: `const timeoutScale = estimateMinutes && estimateMinutes > 0 ? Math.max(1, estimateMinutes / 10) : 1;`
New: `const MAX_TIMEOUT_SCALE = 6;\nconst timeoutScale = estimateMinutes && estimateMinutes > 0 ? Math.min(MAX_TIMEOUT_SCALE, Math.max(1, estimateMinutes / 10)) : 1;`

**Test: src/resources/extensions/hx/tests/git-checkpoint.test.ts** — Port from upstream b4e146fbd `src/resources/extensions/gsd/tests/git-checkpoint.test.ts` with these adaptations:
- Change `refs/gsd/checkpoints/` → `refs/hx/checkpoints/` in all assertions (3 places)
- Import from `../safety/git-checkpoint.js`
- Remove copyright header

After all changes: `node scripts/compile-tests.mjs && node --test dist-test/src/resources/extensions/hx/tests/git-checkpoint.test.js`
  - Estimate: 1.5h
  - Files: src/resources/extensions/hx/workflow-logger.ts, src/resources/extensions/hx/preferences-types.ts, src/resources/extensions/hx/auto/session.ts, src/resources/extensions/hx/auto/phases.ts, src/resources/extensions/hx/auto-post-unit.ts, src/resources/extensions/hx/bootstrap/register-hooks.ts, src/resources/extensions/hx/auto-timers.ts, src/resources/extensions/hx/tests/git-checkpoint.test.ts
  - Verify: npx tsc --noEmit 2>&1 | head -20 && node scripts/compile-tests.mjs 2>&1 | tail -5 && node --test dist-test/src/resources/extensions/hx/tests/git-checkpoint.test.js && npm run test:unit 2>&1 | tail -5
