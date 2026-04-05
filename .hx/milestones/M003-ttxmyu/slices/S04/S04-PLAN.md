# S04: Workflow-Logger Centralization + Auto-mode Hardening

**Goal:** Harden the workflow-logger audit (errors-only), add stop/backtrack capture classifications, create the auto-wrapup-inflight guard module, and migrate targeted silent catch blocks to logWarning — all verified by three new test files.
**Demo:** After this: After this: workflow-logger-audit, silent-catch-diagnostics, tool-call-loop-guard, auto-wrapup-inflight-guard tests pass; no empty catch blocks in modified files

## Tasks
- [x] **T01: Added severity guard in workflow-logger._push() so only error entries persist to audit-log.jsonl, and wrote workflow-logger-audit.test.ts with 4 verifying tests** — Add a 1-line severity guard in workflow-logger.ts _push() so only error-severity entries are persisted to audit-log.jsonl. Then write workflow-logger-audit.test.ts verifying the new behavior.

## Steps

1. Read `src/resources/extensions/hx/workflow-logger.ts` lines 230–240 to confirm the exact text of the `if (_auditBasePath)` block.
2. Add a guard: wrap the `appendFileSync` call so it only runs when `severity === 'error'`. The change is: immediately after `if (_auditBasePath) {` add `if (severity === 'error') {` and close that extra brace before the outer `catch`. Keep the existing `try/catch` structure intact — only the `mkdirSync`+`appendFileSync` block moves inside the inner guard.
3. Create `src/resources/extensions/hx/tests/workflow-logger-audit.test.ts`. Model it on the audit section of the existing `workflow-logger.test.ts` (which uses `mkdtempSync` + `setLogBasePath` + `resetWorkflowLogger`). Write tests:
   - `logWarning()` does NOT write to audit-log.jsonl
   - `logError()` DOES write to audit-log.jsonl
   - Mixed log sequence: `readAuditLog()` returns only the error entries
   - `readAuditLog()` returns [] when no errors logged (only warnings)
4. Confirm the existing workflow-logger.test.ts audit section still passes (it also tests logError writing — should still pass after change).
5. Run `node --experimental-strip-types src/resources/extensions/hx/tests/workflow-logger-audit.test.ts` or `npm run test:unit -- --grep workflow-logger-audit` to verify.
  - Estimate: 45m
  - Files: src/resources/extensions/hx/workflow-logger.ts, src/resources/extensions/hx/tests/workflow-logger-audit.test.ts
  - Verify: npm run test:unit 2>&1 | grep -E 'workflow-logger-audit|passed|failed' | tail -5; npx tsc --noEmit
- [ ] **T02: Add stop/backtrack capture classifications + triage-resolution handling** — Extend captures.ts with 'stop' and 'backtrack' Classification values, wire them into VALID_CLASSIFICATIONS and loadActionableCaptures, add case handlers in triage-resolution.ts, and update the triage-captures.md prompt.

## Steps

1. Read `src/resources/extensions/hx/captures.ts` lines 18 and 43–47 (Classification type + VALID_CLASSIFICATIONS array).
2. Update Classification type union: add `| 'stop' | 'backtrack'` to the existing 5 values.
3. Add `'stop'` and `'backtrack'` to the `VALID_CLASSIFICATIONS` readonly array.
4. Update `loadActionableCaptures()` filter (lines 259–268): add `c.classification === 'stop'` and `c.classification === 'backtrack'` to the OR chain.
5. Read `src/resources/extensions/hx/triage-resolution.ts` lines 345–360 (TriageExecutionResult interface) and lines 420–455 (the switch statement).
6. Add `stopped: number; backtracks: number;` to TriageExecutionResult interface. Initialize both to 0 in the result object.
7. Add `case 'stop':` and `case 'backtrack':` to the switch in executeTriageResolutions:
   - `stop`: write `{ trigger: 'stop', captureId: capture.id, captureText: capture.text, ts: new Date().toISOString() }` as JSON to `.hx/runtime/stop-trigger.json` using `join(hxRoot(basePath), 'runtime', 'stop-trigger.json')`. Use `mkdirSync({ recursive: true })` on the dir first. Then `markCaptureExecuted` and increment `result.stopped`.
   - `backtrack`: parse a slice ID from `capture.resolution` using `/\b(S\d{2})\b/` regex. If found, write `{ trigger: 'backtrack', targetSlice: sliceId, captureId: capture.id, ts: new Date().toISOString() }` to `.hx/runtime/backtrack-trigger.json`. If not found, call `logWarning('engine', 'backtrack capture has no parseable slice ID', { captureId: capture.id })` — but still `markCaptureExecuted` to avoid retry loops. Import `logWarning` from `'../workflow-logger.js'` if not already imported. Increment `result.backtracks`.
8. Update `src/resources/extensions/hx/prompts/triage-captures.md`: add `stop` and `backtrack` to the Classification Criteria section (after `note`):
   - **stop**: Halt auto-mode execution immediately. Use when continuing would cause harm or the session is fundamentally off-track and no replan can fix it.
   - **backtrack**: Rewind to a specific previous slice. Include the target slice ID (e.g. S02) in the Resolution field.
9. Run `npx tsc --noEmit` and `npm run test:unit` — expect 0 new failures (no new test file needed; captures.test.ts covers parse behavior, triage integration is runtime).
  - Estimate: 45m
  - Files: src/resources/extensions/hx/captures.ts, src/resources/extensions/hx/triage-resolution.ts, src/resources/extensions/hx/prompts/triage-captures.md
  - Verify: npx tsc --noEmit && npm run test:unit 2>&1 | tail -5 && grep -c 'stop\|backtrack' src/resources/extensions/hx/captures.ts
- [ ] **T03: Create auto-wrapup-guard.ts + wire into auto-timers.ts and auto.ts + write test** — Create the auto-wrapup-inflight guard module, wire setWrapupInflight() into the soft-timeout callback in auto-timers.ts and clearWrapupInflight() into clearUnitTimeout() in auto.ts, then write the test file.

## Steps

1. Create `src/resources/extensions/hx/bootstrap/auto-wrapup-guard.ts`:
```typescript
/** Tracks whether an hx-auto-wrapup message has been sent and the triggered turn is still inflight. */
let _wrapupInflight = false;

/** Mark that a wrapup message has been sent and a new turn is inflight. */
export function setWrapupInflight(): void { _wrapupInflight = true; }

/** Clear the inflight flag — called when the triggered turn completes or the unit ends. */
export function clearWrapupInflight(): void { _wrapupInflight = false; }

/** Returns true if a wrapup message has been sent and the turn is still inflight. */
export function isWrapupInflight(): boolean { return _wrapupInflight; }

/** Reset guard state — called at session start and session switch. */
export function resetWrapupGuard(): void { _wrapupInflight = false; }
```

2. Wire into `src/resources/extensions/hx/auto-timers.ts`:
   - Add `import { setWrapupInflight } from './bootstrap/auto-wrapup-guard.js';` at the top imports.
   - In the soft-timeout callback (around line 116, the `s.wrapupWarningHandle = setTimeout(() => {` block), call `setWrapupInflight()` immediately before the `pi.sendMessage(...)` call.
   - Also check line ~292 for a second `customType: 'hx-auto-wrapup'` sendMessage — add `setWrapupInflight()` before that one too if it's in a parallel path.

3. Wire into `src/resources/extensions/hx/auto.ts`:
   - Widen the existing `import { setLogBasePath } from './workflow-logger.js'` to NOT change (setLogBasePath is the only import needed there).
   - Add a NEW import line: `import { clearWrapupInflight } from './bootstrap/auto-wrapup-guard.js';`
   - In `clearUnitTimeout()` (around line 477), add `clearWrapupInflight();` at the end of the function body, before the closing brace.

4. Create `src/resources/extensions/hx/tests/auto-wrapup-inflight-guard.test.ts`:
   - Import the 4 functions from `'../bootstrap/auto-wrapup-guard.js'` (compiled path — check if other tests use `.js` extension for imports from bootstrap/).
   - Test 1: `isWrapupInflight()` returns false initially
   - Test 2: after `setWrapupInflight()`, `isWrapupInflight()` returns true
   - Test 3: after `setWrapupInflight()` then `clearWrapupInflight()`, `isWrapupInflight()` returns false
   - Test 4: `resetWrapupGuard()` clears inflight state after `setWrapupInflight()`
   - Test 5 (static): `readFileSync` the compiled auto-timers.ts source and assert it contains `setWrapupInflight()` in the wrapup callback region
   - Test 6 (static): `readFileSync` auto.ts source and assert it contains `clearWrapupInflight` in the clearUnitTimeout region
   - Note: reset state between each test via `resetWrapupGuard()` in beforeEach or explicit reset calls

5. Run `npm run test:unit` and `npx tsc --noEmit`.
  - Estimate: 45m
  - Files: src/resources/extensions/hx/bootstrap/auto-wrapup-guard.ts, src/resources/extensions/hx/auto-timers.ts, src/resources/extensions/hx/auto.ts, src/resources/extensions/hx/tests/auto-wrapup-inflight-guard.test.ts
  - Verify: npm run test:unit 2>&1 | grep -E 'auto-wrapup-inflight|passed|failed' | tail -5; npx tsc --noEmit
- [ ] **T04: Migrate targeted silent catch blocks + write silent-catch-diagnostics.test.ts** — Add logWarning calls to 5 specific empty/silent catch blocks across auto.ts, auto/phases.ts, and bootstrap/register-hooks.ts, then write a static analysis test that proves the migration.

## Steps

1. **auto.ts** — widen the workflow-logger import. Current: `import { setLogBasePath } from './workflow-logger.js'`. Change to: `import { setLogBasePath, logWarning } from './workflow-logger.js'`.

2. **auto.ts line ~664** — catch block after `milestoneComplete = wtSummaryPath !== null`:
   - Find the catch block: `} catch {` followed by `// Non-fatal — fall through to preserveBranch path`
   - Change to: `} catch (e) {\n  logWarning('engine', 'Failed to check milestone SUMMARY existence', { milestone: s.currentMilestoneId ?? 'unknown', error: String(e) });\n}`

3. **auto.ts line ~865** — catch block after `writeFileSync(join(runtimeDir, 'paused-session.json'), ...)`:
   - Find: `} catch {` followed by `// Non-fatal — resume will still work via full bootstrap, just without worktree context`
   - Change to: `} catch (e) {\n  logWarning('engine', 'Failed to write paused-session.json', { error: String(e) });\n}`

4. **auto.ts line ~873** — catch block around `closeoutUnit(...)` call:
   - Find: `} catch {` followed by `// Non-fatal — best-effort closeout on pause`
   - Change to: `} catch (e) {\n  logWarning('engine', 'Unit closeout on pause threw', { error: String(e) });\n}`

5. **auto/phases.ts line ~1214** — catch block after phase anchor write:
   - Find: `} catch { /* non-fatal — anchor is advisory */ }`
   - Change to: `} catch (e) { logWarning('engine', 'Phase anchor write failed', { error: String(e) }); }`
   - NOTE: phases.ts already imports `logWarning` from `'../workflow-logger.js'` at line 31 — no import change needed.

6. **bootstrap/register-hooks.ts line ~51** — preference load catch:
   - Find: `} catch { /* non-fatal */ }` in the preference load block (around the `show_token_cost` section)
   - Add import: `import { logWarning } from '../workflow-logger.js';` at the top of the file (after existing imports)
   - Change catch to: `} catch (e) { logWarning('engine', 'Failed to load preferences for show_token_cost', { error: String(e) }); }`

7. Create `src/resources/extensions/hx/tests/silent-catch-diagnostics.test.ts`:
   - Use `readFileSync` to read each modified source file
   - Assert the OLD silent catch patterns are GONE:
     - auto.ts: does NOT contain `catch {\n          // Non-fatal — fall through to preserveBranch path`
     - auto.ts: does NOT contain `catch {\n    // Non-fatal — resume will still work via full bootstrap`
     - auto.ts: does NOT contain `catch {\n      // Non-fatal — best-effort closeout on pause`
     - phases.ts: does NOT contain `catch { /* non-fatal — anchor is advisory */ }`
     - register-hooks.ts: does NOT contain first `catch { /* non-fatal */ }` in the preference block
   - Assert the NEW patterns ARE present:
     - phases.ts: contains `logWarning('engine', 'Phase anchor write failed'`
     - auto.ts: contains `logWarning('engine', 'Failed to check milestone SUMMARY existence'`
     - register-hooks.ts: contains `logWarning('engine', 'Failed to load preferences for show_token_cost'`

8. Run `npm run test:unit` and `npx tsc --noEmit`. Expect no regressions.
  - Estimate: 45m
  - Files: src/resources/extensions/hx/auto.ts, src/resources/extensions/hx/auto/phases.ts, src/resources/extensions/hx/bootstrap/register-hooks.ts, src/resources/extensions/hx/tests/silent-catch-diagnostics.test.ts
  - Verify: npm run test:unit 2>&1 | grep -E 'silent-catch|passed|failed' | tail -5; npx tsc --noEmit; grep -c "logWarning.*Phase anchor write failed" src/resources/extensions/hx/auto/phases.ts
