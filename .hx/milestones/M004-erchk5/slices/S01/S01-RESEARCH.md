# S01 Research: LLM Safety Harness

## Summary

Straightforward port of upstream commit `1e87c973b` (+ adversarial fix `4e2ab76fc`) from gsd-2 into hx-ai. The upstream introduces a 7-file `safety/` subdirectory plus changes to 7 existing files across the auto-mode pipeline. All upstream source is available via `git show 1e87c973b`. GSD→HX naming adaptation is minimal — only `"safety"` log component and `refs/gsd/checkpoints/` ref prefix need decisions; internal type names (`SafetyHarnessConfig`) already use neutral naming.

## Requirements Owned

- **R022** — LLM safety harness ported (primary)
- **R029** — GSD→HX naming (safety/ uses `refs/hx/checkpoints/` instead of `refs/gsd/checkpoints/`)
- **R030** — tsc clean, tests pass

## Implementation Landscape

### New Files to Create (7)

All go in `src/resources/extensions/hx/safety/`:

| File | Lines | Purpose |
|---|---|---|
| `evidence-collector.ts` | 151 | Module-level `unitEvidence[]` array; `resetEvidence()`, `recordToolCall()`, `recordToolResult()`, `getEvidence()`, `getBashEvidence()`, `getFilePaths()` |
| `destructive-guard.ts` | 49 | 10 regex patterns for dangerous commands; `classifyCommand()` → `CommandClassification` |
| `file-change-validator.ts` | 108 | `validateFileChanges(basePath, expectedOutput, plannedFiles)` — compares `git diff HEAD~1 HEAD --name-only` vs task plan files |
| `evidence-cross-ref.ts` | 120 | `crossReferenceEvidence(claimedEvidence, actualEvidence)` — cross-matches LLM claims vs actual bash calls |
| `git-checkpoint.ts` | 116 | `createCheckpoint()`, `rollbackToCheckpoint()`, `cleanupCheckpoint()` — uses `refs/hx/checkpoints/` (HX naming) |
| `content-validator.ts` | 98 | `validateContent(unitType, artifactPath)` — checks plan-slice (≥2 tasks, Files section, verify section) and plan-milestone (≥1 slice) |
| `safety-harness.ts` | 105 | `SafetyHarnessConfig` interface, `DEFAULTS`, `resolveSafetyHarnessConfig()`, `isHarnessEnabled()`, re-exports from all 6 sibling modules |

### Existing Files to Modify (7)

1. **`src/resources/extensions/hx/workflow-logger.ts`** — Add `"safety"` to `LogComponent` union (after `"reconcile"`)

2. **`src/resources/extensions/hx/preferences-types.ts`** — Add `"safety_harness"` to `KNOWN_PREFERENCE_KEYS` Set and add `safety_harness?: { ... }` field to `HXPreferences` interface

3. **`src/resources/extensions/hx/auto/session.ts`** — Add `checkpointSha: string | null = null;` field to `AutoSession` class (under Safety harness comment); clear it in `reset()`

4. **`src/resources/extensions/hx/auto/phases.ts`** — Two blocks:
   - Before "Prompt injection" section (~line 965): reset evidence + create checkpoint for `execute-task` units
   - After `emitJournalEvent("unit-end")` (~line 1252): checkpoint cleanup or rollback block

5. **`src/resources/extensions/hx/auto-post-unit.ts`** — After rogue-file detection block (~line 432): 87-line safety harness post-unit validation block (file-change validation, evidence cross-reference, content validation)

6. **`src/resources/extensions/hx/bootstrap/register-hooks.ts`** — Two additions:
   - New `pi.on("tool_call")` handler after existing tool_call handler (~line 212): safety evidence collection + destructive command warnings  
   - In `tool_execution_end` handler (~line 257): add `safetyRecordToolResult()` call after `markToolEnd()`

7. **`src/resources/extensions/hx/auto-timers.ts`** — Add `MAX_TIMEOUT_SCALE = 6` constant and apply it: `Math.min(MAX_TIMEOUT_SCALE, Math.max(1, estimateMinutes / 10))`

### Tests to Create

Upstream commit `b4e146fbd` adds `git-checkpoint.test.ts` (94 lines, 4 tests using real git repos via `mkdtempSync`). This should be ported to `src/resources/extensions/hx/tests/git-checkpoint.test.ts` with `refs/gsd/` → `refs/hx/` in the test assertions.

## Key Decisions / HX Naming Adaptations

1. **`refs/gsd/checkpoints/` → `refs/hx/checkpoints/`** — The git-checkpoint.ts `CHECKPOINT_PREFIX` constant uses HX namespace. The test also expects `refs/hx/checkpoints/` in assertions.

2. **`"safety"` LogComponent** — Must be added to the `LogComponent` union in `workflow-logger.ts` before any safety module can call `logWarning("safety", ...)`. Without it, tsc fails.

3. **`loadEffectiveGSDPreferences` → `loadEffectiveHXPreferences`** — The auto-post-unit.ts safety block imports preferences. Use existing `loadEffectiveHXPreferences` from `../preferences.js`.

4. **Copyright headers** — The upstream files all have copyright headers. Strip or adapt per HX convention (existing files have no copyright headers).

5. **`gsd-db.js` imports** — `file-change-validator.ts` imports `logWarning` from `../workflow-logger.js`. No db imports needed in the safety files themselves (the calling site in auto-post-unit.ts does the db lookup via already-imported `getTask`).

## Integration Points (wiring summary)

```
register-hooks.ts
  pi.on("tool_call")     → safetyRecordToolCall() + classifyCommand() (warn)
  pi.on("tool_execution_end") → safetyRecordToolResult()

auto/phases.ts (runUnitPhase)
  before "Prompt injection"  → resetEvidence() + createCheckpoint()
  after emitJournalEvent("unit-end") → cleanupCheckpoint() or rollbackToCheckpoint()

auto-post-unit.ts (postUnitPreVerification)
  after rogue-file detection → validateFileChanges() + evidence xref + validateContent()
```

## Exact Insertion Points in hx-ai Files

### auto/phases.ts
- **Before checkpoint block**: `deps.updateSliceProgressCache(...)` line 963 → then `// Prompt injection` line 968. Insert safety block between these.
- **After checkpoint cleanup block**: `deps.emitJournalEvent(...unit-end...)` line 1252 → then `return { action: "next"... }` line 1254. Insert cleanup block between these.

### auto-post-unit.ts  
- Insert 87-line block after the `} catch (e) { debugLog("postUnit", { phase: "rogue-detection"... }) }` block (~line 432), before `// Artifact verification` section (~line 436).

### register-hooks.ts
- New `pi.on("tool_call")` safety handler: after the existing `pi.on("tool_call")` closing `});` (~line 212), before `pi.on("tool_result")`.
- In `tool_execution_end` handler: add `safetyRecordToolResult()` call after `markToolEnd(event.toolCallId)`.

### auto-timers.ts
- Current line 108-109: `const timeoutScale = estimateMinutes && estimateMinutes > 0 ? Math.max(1, estimateMinutes / 10) : 1;`  
  Replace with: `const MAX_TIMEOUT_SCALE = 6;` constant + `Math.min(MAX_TIMEOUT_SCALE, Math.max(1, estimateMinutes / 10))`

## Risks

- **Minimal** — all 7 new files are self-contained. No upstream merging complexity.
- `"safety"` must be added to `LogComponent` before compiling; otherwise all `logWarning("safety", ...)` calls fail tsc.
- `s.checkpointSha` needs to be added to both `AutoSession` class AND `reset()` method or the auto-session-encapsulation test will catch the gap.
- The adversarial fix `4e2ab76fc` changes `rollbackToCheckpoint` to use `git reset --hard <sha>` (not `git branch -f` + reset). Must apply the fixed version, not the original.

## Verification Commands

```bash
npx tsc --noEmit 2>&1 | head -30
grep -rn 'refs/gsd/checkpoints' src/resources/extensions/hx/safety/ # should be 0
grep -rn '\bGSD\b\|\bgsd\b' src/resources/extensions/hx/safety/ # should be 0
node --test dist-test/src/resources/extensions/hx/tests/git-checkpoint.test.js
npm run test:unit 2>&1 | tail -5
```

## Task Decomposition Recommendation

**T01: Create 7 safety/ files** — All new files. Straightforward copy-and-adapt. No deps on other tasks.

**T02: Wire into existing files + add tests** — Modify workflow-logger, preferences-types, session, phases, auto-post-unit, register-hooks, auto-timers. Add git-checkpoint.test.ts. Verify tsc clean and tests pass.

This is a clean 2-task slice. T01 establishes the module, T02 wires it in. Either order works since T01 files import only Node builtins and workflow-logger — no circular deps.
