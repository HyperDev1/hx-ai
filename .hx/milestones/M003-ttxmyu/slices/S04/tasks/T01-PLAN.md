---
estimated_steps: 11
estimated_files: 2
skills_used: []
---

# T01: workflow-logger errors-only audit + workflow-logger-audit.test.ts

Add a 1-line severity guard in workflow-logger.ts _push() so only error-severity entries are persisted to audit-log.jsonl. Then write workflow-logger-audit.test.ts verifying the new behavior.

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

## Inputs

- ``src/resources/extensions/hx/workflow-logger.ts` — _push() function to modify (lines 206–241)`
- ``src/resources/extensions/hx/tests/workflow-logger.test.ts` — existing audit section to model new test on`

## Expected Output

- ``src/resources/extensions/hx/workflow-logger.ts` — _push() now only persists severity==='error' entries to disk`
- ``src/resources/extensions/hx/tests/workflow-logger-audit.test.ts` — 4 test cases covering errors-only audit behavior`

## Verification

npm run test:unit 2>&1 | grep -E 'workflow-logger-audit|passed|failed' | tail -5; npx tsc --noEmit

## Observability Impact

audit-log.jsonl now contains only actionable error entries; warn entries remain in in-memory buffer and stderr only
