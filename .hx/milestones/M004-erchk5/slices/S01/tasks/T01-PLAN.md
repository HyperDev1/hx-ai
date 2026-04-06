---
estimated_steps: 14
estimated_files: 7
skills_used: []
---

# T01: Create 7 safety module files with HX naming

Create the src/resources/extensions/hx/safety/ directory and write all 7 new TypeScript files ported from upstream commit 1e87c973b with GSD→HX naming adaptations. The adversarial fix 4e2ab76fc must be applied to git-checkpoint.ts (use `git reset --hard <sha>` instead of the original `git branch -f` + double reset). Strip upstream copyright headers (hx-ai files have none).

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

## Inputs

- `src/resources/extensions/hx/workflow-logger.ts`

## Expected Output

- `src/resources/extensions/hx/safety/evidence-collector.ts`
- `src/resources/extensions/hx/safety/destructive-guard.ts`
- `src/resources/extensions/hx/safety/file-change-validator.ts`
- `src/resources/extensions/hx/safety/evidence-cross-ref.ts`
- `src/resources/extensions/hx/safety/git-checkpoint.ts`
- `src/resources/extensions/hx/safety/content-validator.ts`
- `src/resources/extensions/hx/safety/safety-harness.ts`

## Verification

grep -rn 'refs/gsd/checkpoints' src/resources/extensions/hx/safety/ | wc -l | grep -q '^0$' && grep -rn '\.gsd/' src/resources/extensions/hx/safety/ | wc -l | grep -q '^0$' && grep -rn '\bgsd\b\|\bGSD\b' src/resources/extensions/hx/safety/ | wc -l | grep -q '^0$' && echo 'GSD-clean' && npx tsc --noEmit 2>&1 | head -20

## Observability Impact

Establishes the safety module. No runtime wiring yet — tsc errors from missing 'safety' LogComponent expected until T02 adds it.
