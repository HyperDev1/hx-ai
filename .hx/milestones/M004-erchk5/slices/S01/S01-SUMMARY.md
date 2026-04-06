---
id: S01
parent: M004-erchk5
milestone: M004-erchk5
provides:
  - src/resources/extensions/hx/safety/ directory with 7 complete TypeScript files — evidence-collector, destructive-guard, file-change-validator, evidence-cross-ref, git-checkpoint, content-validator, safety-harness
  - safety_harness preference type in HXPreferences interface
  - safety LogComponent in workflow-logger.ts
  - 4 git-checkpoint regression tests under tests/
  - tsc-clean baseline for S02–S05
requires:
  []
affects:
  - S02
  - S03
  - S04
  - S05
key_files:
  - src/resources/extensions/hx/safety/evidence-collector.ts
  - src/resources/extensions/hx/safety/destructive-guard.ts
  - src/resources/extensions/hx/safety/file-change-validator.ts
  - src/resources/extensions/hx/safety/evidence-cross-ref.ts
  - src/resources/extensions/hx/safety/git-checkpoint.ts
  - src/resources/extensions/hx/safety/content-validator.ts
  - src/resources/extensions/hx/safety/safety-harness.ts
  - src/resources/extensions/hx/workflow-logger.ts
  - src/resources/extensions/hx/preferences-types.ts
  - src/resources/extensions/hx/auto/session.ts
  - src/resources/extensions/hx/auto/phases.ts
  - src/resources/extensions/hx/auto-post-unit.ts
  - src/resources/extensions/hx/bootstrap/register-hooks.ts
  - src/resources/extensions/hx/auto-timers.ts
  - src/resources/extensions/hx/tests/git-checkpoint.test.ts
key_decisions:
  - git-checkpoint.ts uses spawnSync(cmd, string[]) not execSync with template literal — required for cross-platform static analysis test compliance
  - auto-post-unit.ts imports logWarning via dynamic import to avoid circular dependency (following K003 pattern)
  - safetyRecordToolResult gated by isAutoActive() in register-hooks.ts — avoids recording during manual/discussion sessions
  - MAX_TIMEOUT_SCALE=6 constant in auto-timers.ts prevents runaway timeout escalation for large estimate values
  - adversarial rollback fix 4e2ab76fc applied — git reset --hard <sha> not git branch -f + double reset
patterns_established:
  - safety/ subdirectory pattern: new subsystem files under src/resources/extensions/hx/safety/ with all GSD→HX naming applied at creation time
  - Safety harness phases.ts integration: reset+checkpoint block before execute-task dispatch; cleanup/rollback block after unit-end event
  - Post-unit validation pattern in auto-post-unit.ts: 3-stage check (file changes, evidence cross-ref, content validation) with dynamic imports to avoid circular deps
observability_surfaces:
  - safety LogComponent added to workflow-logger.ts — safety harness events visible in workflow log under component 'safety'
  - Destructive command warnings emitted via logWarning to console on every tool_call event when command matches DESTRUCTIVE_PATTERNS
  - git-checkpoint creates refs/hx/checkpoints/<unitId> in git — visible via git for-each-ref refs/hx/checkpoints/
drill_down_paths:
  - .hx/milestones/M004-erchk5/slices/S01/tasks/T01-SUMMARY.md
  - .hx/milestones/M004-erchk5/slices/S01/tasks/T02-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-04-06T07:20:02.529Z
blocker_discovered: false
---

# S01: LLM Safety Harness

**Created 7-file safety/ subsystem and wired harness into 7 existing files; 4 git-checkpoint tests pass; tsc clean; 4300 unit tests pass.**

## What Happened

S01 ported the LLM safety harness from upstream commit 1e87c973b (plus adversarial fix 4e2ab76fc) into hx-ai as a clean two-task sequence.

**T01 — Create safety/ directory (7 new files)**

Created `src/resources/extensions/hx/safety/` with all 7 TypeScript files: `evidence-collector.ts`, `destructive-guard.ts`, `file-change-validator.ts`, `evidence-cross-ref.ts`, `git-checkpoint.ts`, `content-validator.ts`, and `safety-harness.ts`. All GSD→HX naming adaptations applied: `CHECKPOINT_PREFIX = "refs/hx/checkpoints/"`, `.hx/` path filter in `file-change-validator.ts`, adversarial rollback fix (`git reset --hard <sha>` not `git branch -f` + double reset) in `git-checkpoint.ts`, no upstream copyright headers. The initial implementation used `execSync` with template literal interpolation, which triggered the cross-platform filesystem safety static-analysis test (Pattern 4). Rewrote the `runGit` helper to use `spawnSync(cmd, string[])` which is cleaner and passes the test. GSD-clean checks all passed (0 hits for `refs/gsd/checkpoints`, `.gsd/`, `gsd/GSD` tokens). TSC clean. 4298 unit tests pass.

**T02 — Wire harness into 7 existing files + checkpoint tests**

Modified all 7 existing files per plan:
- `workflow-logger.ts`: Added `| "safety"` LogComponent union member
- `preferences-types.ts`: Added `"safety_harness"` to KNOWN_PREFERENCE_KEYS, added `safety_harness?: { ... }` interface member with full JSDoc
- `auto/session.ts`: Added `checkpointSha: string | null = null` field + `this.checkpointSha = null` in `reset()`
- `auto/phases.ts`: Added safety harness reset+checkpoint block before `// Prompt injection` section; added checkpoint cleanup/rollback block after `emitJournalEvent("unit-end")`
- `auto-post-unit.ts`: Added 3-stage post-unit safety validation block (file-change validation, evidence cross-reference, content validation) using dynamic import for `logWarning` to avoid circular dependency
- `bootstrap/register-hooks.ts`: Added `tool_call` safety handler and `safetyRecordToolResult` call in `tool_execution_end` handler; gated by `isAutoActive()`
- `auto-timers.ts`: Added `MAX_TIMEOUT_SCALE = 6` constant and `Math.min()` cap on `timeoutScale`

Added `git-checkpoint.test.ts` with 4 regression tests ported from upstream b4e146fbd with `refs/hx/checkpoints/` adaptation. TSC clean. 4/4 checkpoint tests pass. 4300 unit tests pass (3 pre-existing flaky failures confirmed on pre-T02 baseline, unrelated to this work).

## Verification

Slice-level verification checks all passed:

1. `grep -rn 'refs/gsd/checkpoints' src/resources/extensions/hx/safety/ | wc -l` → 0 ✅
2. `grep -rn '\.gsd/' src/resources/extensions/hx/safety/ | wc -l` → 0 ✅
3. `grep -rn '\bgsd\b|\bGSD\b' src/resources/extensions/hx/safety/ | wc -l` → 0 ✅
4. `npx tsc --noEmit` → exit 0 ✅
5. `node scripts/compile-tests.mjs` → 1218 files compiled ✅
6. `node --test dist-test/.../git-checkpoint.test.js` → 4/4 pass ✅
7. `npm run test:unit` → 4300 passed, 0 new failures ✅

## Requirements Advanced

- R022 — All 7 safety harness files created and wired; 4 regression tests pass; tsc clean
- R029 — Zero GSD references in any safety/ file; all identifiers use HX naming
- R030 — tsc --noEmit exits 0; 4300 unit tests pass / 0 new failures

## Requirements Validated

- R022 — 7 files in src/resources/extensions/hx/safety/; GSD-clean grep returns 0; tsc clean; 4 checkpoint tests pass; 4300 unit tests pass

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

T01: git-checkpoint.ts uses spawnSync with string[] args instead of execSync with template literal — required to pass the cross-platform-filesystem-safety static analysis test (Pattern 4). T02: auto-post-unit.ts uses dynamic import for logWarning inside the safety block (following K003 lazy-dynamic-import pattern). T02: crossReferenceEvidence imported directly from evidence-cross-ref.js rather than via the safety-harness re-export barrel. Both deviations are intentional and documented.

## Known Limitations

None. All planned files created, all wiring completed, all tests pass.

## Follow-ups

S02–S05 can now proceed — the safety harness provides the tsc-clean baseline they depend on. The safety harness operates in warn-and-continue mode by default (auto_rollback: false); if users want rollback on violations they must set safety_harness.auto_rollback: true in preferences.

## Files Created/Modified

- `src/resources/extensions/hx/safety/evidence-collector.ts` — New — module-level evidence array, 6 exported functions (recordToolCall, recordToolResult, getEvidence, resetEvidence, getEvidenceSummary, getEvidenceForUnit)
- `src/resources/extensions/hx/safety/destructive-guard.ts` — New — 10 DESTRUCTIVE_PATTERNS, classifyCommand() export
- `src/resources/extensions/hx/safety/file-change-validator.ts` — New — validateFileChanges() using git diff HEAD~1 HEAD; filters .hx/ paths (not .gsd/)
- `src/resources/extensions/hx/safety/evidence-cross-ref.ts` — New — crossReferenceEvidence() for zero-bash completion detection
- `src/resources/extensions/hx/safety/git-checkpoint.ts` — New — createCheckpoint/rollbackToCheckpoint/cleanupCheckpoint; CHECKPOINT_PREFIX=refs/hx/checkpoints/; spawnSync pattern; adversarial rollback fix applied
- `src/resources/extensions/hx/safety/content-validator.ts` — New — validateContent() with plan-slice/plan-milestone validators
- `src/resources/extensions/hx/safety/safety-harness.ts` — New — SafetyHarnessConfig, DEFAULTS, resolveSafetyHarnessConfig, isHarnessEnabled, re-exports from all 6 siblings
- `src/resources/extensions/hx/workflow-logger.ts` — Modified — added | "safety" to LogComponent union
- `src/resources/extensions/hx/preferences-types.ts` — Modified — added safety_harness to KNOWN_PREFERENCE_KEYS and HXPreferences interface
- `src/resources/extensions/hx/auto/session.ts` — Modified — added checkpointSha: string | null = null field; reset() clears it
- `src/resources/extensions/hx/auto/phases.ts` — Modified — safety reset+checkpoint block before execute-task dispatch; cleanup/rollback block after unit-end
- `src/resources/extensions/hx/auto-post-unit.ts` — Modified — 3-stage post-unit safety validation block inserted after rogue-file detection
- `src/resources/extensions/hx/bootstrap/register-hooks.ts` — Modified — new tool_call safety handler; safetyRecordToolResult in tool_execution_end gated by isAutoActive()
- `src/resources/extensions/hx/auto-timers.ts` — Modified — MAX_TIMEOUT_SCALE=6 constant; Math.min() cap on timeoutScale
- `src/resources/extensions/hx/tests/git-checkpoint.test.ts` — New — 4 regression tests: create/cleanup/rollback/non-git failure path; refs/hx/checkpoints/ adapted
