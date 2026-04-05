# S04: Workflow-Logger Centralization + Auto-mode Hardening — UAT

**Milestone:** M003-ttxmyu
**Written:** 2026-04-05T17:46:31.796Z

## UAT Type
UAT mode: runtime-executable

## Preconditions
- `npm run test:unit` baseline known (4187 pass / 0 fail / 5 skip)
- `npx tsc --noEmit` exits 0 on current HEAD
- Working directory: `/Users/beratcan/Desktop/GithubProjects/hx-ai`

---

## Test Group 1: Workflow-Logger Audit (Errors-Only)

### TC-1.1: Warnings do NOT write to audit-log.jsonl
```
node --experimental-strip-types -e "
import { mkdtempSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
const dir = mkdtempSync(join(tmpdir(), 'uat-'));
// Must use compiled test or import directly
" 
```
**Preferred:** Run the test file directly:
```bash
node --import ./scripts/dist-test-resolve.mjs --experimental-test-isolation=process --test dist-test/src/resources/extensions/hx/tests/workflow-logger-audit.test.js 2>&1
```
**Expected:** 4 tests pass, 0 fail.

### TC-1.2: Existing workflow-logger tests unaffected
```bash
node --import ./scripts/dist-test-resolve.mjs --experimental-test-isolation=process --test dist-test/src/resources/extensions/hx/tests/workflow-logger.test.js 2>&1 | tail -5
```
**Expected:** 36 tests pass, 0 fail.

### TC-1.3: Severity guard source inspection
```bash
grep -n "severity === 'error'" src/resources/extensions/hx/workflow-logger.ts
```
**Expected:** Line ~234 shows the inner guard inside `if (_auditBasePath)`.

---

## Test Group 2: Stop/Backtrack Capture Classifications

### TC-2.1: Classification type contains stop and backtrack
```bash
grep "stop.*backtrack\|backtrack.*stop" src/resources/extensions/hx/captures.ts
```
**Expected:** Both values present in the Classification type union and VALID_CLASSIFICATIONS array.

### TC-2.2: loadActionableCaptures includes stop and backtrack
```bash
grep -A5 "loadActionableCaptures" src/resources/extensions/hx/captures.ts | grep "stop\|backtrack"
```
**Expected:** Two lines showing `c.classification === 'stop'` and `c.classification === 'backtrack'` in the filter.

### TC-2.3: triage-resolution.ts handles stop case
```bash
grep -A8 "case .stop.:" src/resources/extensions/hx/triage-resolution.ts
```
**Expected:** Writes `stop-trigger.json` to `.hx/runtime/`, increments `result.stopped`.

### TC-2.4: triage-resolution.ts handles backtrack case with slice ID parse
```bash
grep -A15 "case .backtrack.:" src/resources/extensions/hx/triage-resolution.ts
```
**Expected:** Regex `/\b(S\d{2})\b/` used; writes `backtrack-trigger.json`; falls back to logWarning if no slice ID found; always calls markCaptureExecuted.

### TC-2.5: triage-captures.md documents both new classifications
```bash
grep -A2 "stop.*backtrack\|\*\*stop\|\*\*backtrack" src/resources/extensions/hx/prompts/triage-captures.md
```
**Expected:** Both entries present with descriptions.

### TC-2.6: No new tsc errors from T02 changes
```bash
npx tsc --noEmit 2>&1 | grep "captures\|triage-resolution" | head -5
```
**Expected:** No output (no errors in those files).

---

## Test Group 3: Auto-Wrapup-Inflight Guard

### TC-3.1: Guard module tests pass
```bash
node --import ./scripts/dist-test-resolve.mjs --experimental-test-isolation=process --test dist-test/src/resources/extensions/hx/tests/auto-wrapup-inflight-guard.test.js 2>&1 | tail -5
```
**Expected:** 6 tests pass, 0 fail.

### TC-3.2: setWrapupInflight wired at both auto-timers.ts sendMessage sites
```bash
grep -n "setWrapupInflight\|hx-auto-wrapup" src/resources/extensions/hx/auto-timers.ts
```
**Expected:** Two `setWrapupInflight()` calls, each appearing immediately before an `hx-auto-wrapup` sendMessage call.

### TC-3.3: clearWrapupInflight wired in clearUnitTimeout
```bash
grep -n "clearWrapupInflight\|clearUnitTimeout" src/resources/extensions/hx/auto.ts | head -10
```
**Expected:** `clearWrapupInflight()` appears inside the `clearUnitTimeout()` function body.

### TC-3.4: Guard module exports all 4 functions
```bash
grep -n "export function" src/resources/extensions/hx/bootstrap/auto-wrapup-guard.ts
```
**Expected:** 4 lines: setWrapupInflight, clearWrapupInflight, isWrapupInflight, resetWrapupGuard.

---

## Test Group 4: Silent Catch Migration

### TC-4.1: Static analysis test passes
```bash
node --import ./scripts/dist-test-resolve.mjs --experimental-test-isolation=process --test dist-test/src/resources/extensions/hx/tests/silent-catch-diagnostics.test.js 2>&1 | tail -5
```
**Expected:** 8 assertions pass, 0 fail.

### TC-4.2: phases.ts phase anchor catch replaced
```bash
grep -c "logWarning.*Phase anchor write failed" src/resources/extensions/hx/auto/phases.ts
```
**Expected:** 1.

### TC-4.3: register-hooks.ts preference load catch replaced
```bash
grep -c "logWarning.*Failed to load preferences for show_token_cost" src/resources/extensions/hx/bootstrap/register-hooks.ts
```
**Expected:** 1.

### TC-4.4: auto.ts three catches replaced
```bash
grep -c "logWarning.*milestone SUMMARY\|logWarning.*paused-session\|logWarning.*closeout on pause" src/resources/extensions/hx/auto.ts
```
**Expected:** 3.

### TC-4.5: No silent empty catch blocks remain in modified files
```bash
grep -n "catch {$\|catch { }" src/resources/extensions/hx/auto.ts src/resources/extensions/hx/auto/phases.ts src/resources/extensions/hx/bootstrap/register-hooks.ts
```
**Expected:** No output (all converted).

---

## Test Group 5: Full Suite Regression

### TC-5.1: Full test suite passes
```bash
npm run test:unit 2>&1 | tail -3
```
**Expected:** `✔ 4187 passed, 0 failed, 5 skipped` (or higher passed count).

### TC-5.2: TypeScript clean
```bash
npx tsc --noEmit 2>&1 | wc -l
```
**Expected:** 0 lines (no errors).

---

## Edge Cases

### TC-E.1: backtrack with no slice ID logs warning, does not crash
```bash
grep -A5 "no parseable slice ID\|backtrack capture has no" src/resources/extensions/hx/triage-resolution.ts
```
**Expected:** logWarning call present; markCaptureExecuted still called; backtracks counter still incremented.

### TC-E.2: audit log with only warnings returns empty array
```bash
# Confirmed by TC-1.1 test case 4: "readAuditLog() returns [] when no errors logged (only warnings)"
node --import ./scripts/dist-test-resolve.mjs --experimental-test-isolation=process --test dist-test/src/resources/extensions/hx/tests/workflow-logger-audit.test.js 2>&1 | grep "only warnings\|returns.*empty"
```
**Expected:** Test passes (confirmed by full suite TC-5.1).

