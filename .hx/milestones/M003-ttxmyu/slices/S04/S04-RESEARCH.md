# S04 Research: Workflow-Logger Centralization + Auto-mode Hardening

## Summary

S04 is medium-complexity with a concrete scope: harden the audit log (errors-only), add stop/backtrack capture classifications, migrate a targeted set of silent catch blocks to logWarning/logError, create a wrapup-inflight guard module, and write three new test files. tool-call-loop-guard.ts already exists and passes — it requires no changes.

---

## What Already Exists

### Fully Done — No Changes Needed

- `src/resources/extensions/hx/bootstrap/tool-call-loop-guard.ts` — complete implementation (SHA-256 hashing, MAX_CONSECUTIVE=4, reset/disable/count exports). ✓
- `src/resources/extensions/hx/tests/tool-call-loop-guard.test.ts` — 8 functional test blocks covering threshold, streak reset, disable, key-order normalization. Passes (`npm run test:unit`). ✓
- `bootstrap/register-hooks.ts` — already imports and calls `checkToolCallLoop` in the `tool_call` hook, and `resetToolCallLoopGuard` in `session_start`/`session_switch`/`agent_end`. ✓
- `workflow-logger.ts` — fully implemented with logWarning/logError, buffer, drainAndSummarize, audit persistence to `.hx/audit-log.jsonl`. **Current gap:** `_push()` writes ALL entries (warn + error) to audit-log.jsonl. S04 should write ONLY error-severity entries.

---

## Gaps to Close

### 1. workflow-logger.ts: Errors-Only Audit Log

**Current behavior** (`_push()`): appends every entry (warn + error) to `.hx/audit-log.jsonl`.

**Required change**: only persist `severity === "error"` entries to audit-log.jsonl. Warn entries stay in the in-memory buffer and stderr only. This is a 1-line guard in `_push()`:

```typescript
// Only persist errors to audit log — warnings are operational noise, not incidents
if (_auditBasePath && severity === "error") { ... appendFileSync ... }
```

**Test file to create**: `tests/workflow-logger-audit.test.ts`
- Test: `logWarning()` does NOT write to audit-log.jsonl
- Test: `logError()` DOES write to audit-log.jsonl
- Test: readAuditLog() returns only error entries when a mix was logged
- Uses temp dir + setLogBasePath pattern (same as existing workflow-logger.test.ts audit section)

### 2. captures.ts + triage-resolution.ts: Stop/Backtrack Classifications

**Current `Classification` type**:
```typescript
export type Classification = "quick-task" | "inject" | "defer" | "replan" | "note";
```

**Required additions**:
```typescript
export type Classification = "quick-task" | "inject" | "defer" | "replan" | "note" | "stop" | "backtrack";
```

Changes needed in captures.ts:
- Add `"stop"` and `"backtrack"` to `VALID_CLASSIFICATIONS` array (line 43-46)
- Update `loadActionableCaptures()` to include `stop` and `backtrack` in the filter
- Update triage prompt (`prompts/triage-captures.md`) to document the two new classifications

Changes needed in triage-resolution.ts:
- Add `case "stop":` and `case "backtrack":` branches in `executeTriageResolutions()`
- `"stop"`: write a stop-trigger marker to `.hx/runtime/stop-trigger.json` (fail-closed — if the stop target is ambiguous, still stop)
- `"backtrack"`: write a backtrack-trigger marker with target slice ID parsed from the resolution text (hardened parser: if parsing fails, log warning but don't crash)
- Update `TriageExecutionResult` to include `stopped: number; backtracks: number` fields

**File**: `src/resources/extensions/hx/triage-resolution.ts` — requires new case blocks in the `for (const capture of actionable)` switch at line ~420

### 3. Silent Catch Block Migration (Targeted)

Scope is **auto-mode files only** that have meaningful diagnostic value. Several `} catch {}` blocks currently swallow errors silently. The following deserve `logWarning`:

**auto.ts** (key ones):
- Line 665: `catch { // Non-fatal — fall through to preserveBranch path }` → `logWarning("engine", "Failed to check milestone SUMMARY existence", { milestone: s.currentMilestoneId! })`
- Line 865: `catch { // Non-fatal — resume will still work via full bootstrap }` → `logWarning("engine", "Failed to write paused-session.json", { error: String(e) })`
- Line 873: `catch { // Non-fatal — best-effort closeout on pause }` → `logWarning("engine", "Unit closeout on pause threw", { error: String(e) })`

**auto/phases.ts**:
- Line 1214: `} catch { /* non-fatal — anchor is advisory */ }` → `logWarning("engine", "Phase anchor write failed", { error: String(e) })`
- Requires adding `import { logWarning } from "../workflow-logger.js"` (already imported!)

**bootstrap/register-hooks.ts**:
- Line 51: `catch { /* non-fatal */ }` (preference load) → `logWarning("engine", "Failed to load preferences for show_token_cost", { error: String(e) })`
- Line 78: `catch {}` (welcome screen) → leave as-is (cosmetic, no diagnostic value)
- Line 302: `catch { /* non-fatal */ }` (before_provider_request masking) → leave as-is (already in outer try of a hook)

**Note**: The following are intentionally left silent (best-effort, no diagnostic value from logging):
- `auto.ts:1466` — `try { process.chdir() } catch {}` (CWD restore)
- `auto.ts:807` — `catch { /* browser-tools may not be loaded */ }` (optional dependency)
- `auto.ts:773` — `catch { /* non-fatal */ }` (paused-session unlink)
- `auto-unit-closeout.ts:34` — `catch { /* non-fatal */ }` (memory extraction)

**Test file to create**: `tests/silent-catch-diagnostics.test.ts`
- Static source analysis test (reads .ts files with `readFileSync`)
- Verifies migrated files no longer have the specific empty catch patterns that were migrated
- Pattern: `assert.ok(!source.includes("catch { /* non-fatal — fall through to preserveBranch"))` etc.
- Also verifies logWarning IS present in phases.ts for the anchor write

### 4. Auto-Wrapup Inflight Guard (New Module)

**What it guards**: When the soft-timeout wrapup signal fires (`pi.sendMessage({ customType: "hx-auto-wrapup", ... }, { triggerTurn: true })`), a new LLM turn is triggered. If `stopAuto` or a new unit dispatch fires during the brief window between `sendMessage` and the turn completing, the session can enter an inconsistent state.

**Module to create**: `src/resources/extensions/hx/bootstrap/auto-wrapup-guard.ts`

```typescript
let _wrapupInflight = false;

export function setWrapupInflight(): void { _wrapupInflight = true; }
export function clearWrapupInflight(): void { _wrapupInflight = false; }
export function isWrapupInflight(): boolean { return _wrapupInflight; }
export function resetWrapupGuard(): void { _wrapupInflight = false; }
```

**Wire into auto-timers.ts**: In the soft timeout callback (line ~116), call `setWrapupInflight()` before `pi.sendMessage()`. The guard is cleared in `resetToolCallLoopGuard()` (already called at `agent_end`) or via the loop-guard reset. Add `clearWrapupInflight()` to `clearUnitTimeout()` in `auto.ts`.

**Test file to create**: `tests/auto-wrapup-inflight-guard.test.ts`
- Tests module-level state: `isWrapupInflight()` returns false initially
- Tests `setWrapupInflight()` → `isWrapupInflight()` returns true
- Tests `clearWrapupInflight()` → `isWrapupInflight()` returns false after set
- Tests `resetWrapupGuard()` clears inflight state
- Static test: verifies `auto-timers.ts` source contains `setWrapupInflight()` call in wrapup callback
- Static test: verifies `clearWrapupInflight` call present in clearUnitTimeout region of `auto.ts`

---

## Implementation Landscape

### Files Modified
| File | Change |
|------|--------|
| `src/resources/extensions/hx/workflow-logger.ts` | `_push()`: only persist errors to audit-log.jsonl |
| `src/resources/extensions/hx/captures.ts` | Add "stop"/"backtrack" to Classification + VALID_CLASSIFICATIONS + loadActionableCaptures |
| `src/resources/extensions/hx/triage-resolution.ts` | Handle stop/backtrack cases in executeTriageResolutions |
| `src/resources/extensions/hx/prompts/triage-captures.md` | Document stop/backtrack classifications |
| `src/resources/extensions/hx/auto.ts` | Add logWarning to 3 key catch blocks; add clearWrapupInflight() to clearUnitTimeout |
| `src/resources/extensions/hx/auto/phases.ts` | Add logWarning to anchor write catch |
| `src/resources/extensions/hx/bootstrap/register-hooks.ts` | Add logWarning to preference load catch |
| `src/resources/extensions/hx/auto-timers.ts` | Call setWrapupInflight() in soft-timeout callback |

### Files Created
| File | Content |
|------|---------|
| `src/resources/extensions/hx/bootstrap/auto-wrapup-guard.ts` | setWrapupInflight / clearWrapupInflight / isWrapupInflight / resetWrapupGuard |
| `src/resources/extensions/hx/tests/workflow-logger-audit.test.ts` | Errors-only audit persistence tests |
| `src/resources/extensions/hx/tests/silent-catch-diagnostics.test.ts` | Static source analysis: migrated catches have logWarning |
| `src/resources/extensions/hx/tests/auto-wrapup-inflight-guard.test.ts` | Guard state machine + static wiring tests |

---

## Task Decomposition Recommendation

**T01** — workflow-logger.ts errors-only audit + workflow-logger-audit.test.ts  
- 1 source change (guard in _push): ~5 lines  
- 1 test file: ~25 tests  
- Verify: `node --experimental-strip-types workflow-logger-audit.test.ts` passes

**T02** — captures.ts stop/backtrack + triage-resolution.ts handling + triage-captures.md update  
- 4 changes (type, array, filter, switch cases): ~30 lines total  
- No new test file (existing captures.test.ts covers parse behavior; triage-resolution coverage is via integration)  
- Verify: tsc clean; grep 0 GSD hits; `npm run test:unit` no regressions

**T03** — auto-wrapup-guard.ts new module + wire into auto-timers.ts + auto.ts + auto-wrapup-inflight-guard.test.ts  
- 1 new file (4 functions): ~20 lines  
- 2 wiring changes: ~3 lines each  
- 1 test file: ~15 tests (state machine + 2 static source checks)  
- Verify: test file passes; tsc clean

**T04** — Silent catch block migration + silent-catch-diagnostics.test.ts  
- ~6 catch block changes across 3 files  
- 1 test file: ~6 static assertions  
- Verify: test file passes; tsc clean; `npm run test:unit` no regressions

---

## Key Constraints

- All new test files go in `tests/` flat (NOT `tests/integration/`) — SKIP_DIRS excludes integration/  
- No GSD names in any new code  
- S04 depends only on S01 (tsc-clean baseline at 4168/0/5 after S02+S03)  
- workflow-logger.ts is imported in many files — the errors-only change is backward compatible (buffer still holds all entries; only the audit disk write changes)
- auto.ts logWarning calls require workflow-logger is already imported — check: `import { logWarning, logError } from "./workflow-logger.js"` exists at auto.ts line ~85: ✓

## Risk Assessment

**Low risk overall.** The hardest part is ensuring the catch-block migration doesn't miss any in the S04 target scope. The errors-only audit change is 1 line. The stop/backtrack classifications are purely additive — no existing code breaks. The wrapup guard is a new module with zero blast radius until wired in.

**One gotcha**: phases.ts already imports `logWarning` (line `import { logWarning, logError } from "../workflow-logger.js"`). auto.ts also already imports it. register-hooks.ts does NOT currently import workflow-logger — T04 must add that import.
