---
estimated_steps: 29
estimated_files: 8
skills_used: []
---

# T02: Wire safety harness into existing files and add checkpoint tests

Modify 7 existing files to integrate the safety harness, then add git-checkpoint regression tests. Run compile-tests.mjs and verify all 4 checkpoint tests pass.

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

## Inputs

- `src/resources/extensions/hx/safety/evidence-collector.ts`
- `src/resources/extensions/hx/safety/destructive-guard.ts`
- `src/resources/extensions/hx/safety/git-checkpoint.ts`
- `src/resources/extensions/hx/safety/file-change-validator.ts`
- `src/resources/extensions/hx/safety/content-validator.ts`
- `src/resources/extensions/hx/safety/safety-harness.ts`
- `src/resources/extensions/hx/workflow-logger.ts`
- `src/resources/extensions/hx/preferences-types.ts`
- `src/resources/extensions/hx/auto/session.ts`
- `src/resources/extensions/hx/auto/phases.ts`
- `src/resources/extensions/hx/auto-post-unit.ts`
- `src/resources/extensions/hx/bootstrap/register-hooks.ts`
- `src/resources/extensions/hx/auto-timers.ts`

## Expected Output

- `src/resources/extensions/hx/workflow-logger.ts`
- `src/resources/extensions/hx/preferences-types.ts`
- `src/resources/extensions/hx/auto/session.ts`
- `src/resources/extensions/hx/auto/phases.ts`
- `src/resources/extensions/hx/auto-post-unit.ts`
- `src/resources/extensions/hx/bootstrap/register-hooks.ts`
- `src/resources/extensions/hx/auto-timers.ts`
- `src/resources/extensions/hx/tests/git-checkpoint.test.ts`

## Verification

npx tsc --noEmit 2>&1 | head -20 && node scripts/compile-tests.mjs 2>&1 | tail -5 && node --test dist-test/src/resources/extensions/hx/tests/git-checkpoint.test.js && npm run test:unit 2>&1 | tail -5

## Observability Impact

Activates 'safety' LogComponent — all safety warnings now appear in workflow log. Checkpoint refs visible at refs/hx/checkpoints/ after execute-task units in auto-mode.
