---
estimated_steps: 33
estimated_files: 4
skills_used: []
---

# T03: Create auto-wrapup-guard.ts + wire into auto-timers.ts and auto.ts + write test

Create the auto-wrapup-inflight guard module, wire setWrapupInflight() into the soft-timeout callback in auto-timers.ts and clearWrapupInflight() into clearUnitTimeout() in auto.ts, then write the test file.

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

## Inputs

- ``src/resources/extensions/hx/auto-timers.ts` — soft-timeout callback where pi.sendMessage({customType: 'hx-auto-wrapup'}) is called`
- ``src/resources/extensions/hx/auto.ts` — clearUnitTimeout() function at ~line 477`
- ``src/resources/extensions/hx/bootstrap/tool-call-loop-guard.ts` — reference module for guard module pattern and test import style`

## Expected Output

- ``src/resources/extensions/hx/bootstrap/auto-wrapup-guard.ts` — new module with 4 exported functions`
- ``src/resources/extensions/hx/auto-timers.ts` — imports setWrapupInflight; calls it before hx-auto-wrapup sendMessage`
- ``src/resources/extensions/hx/auto.ts` — imports clearWrapupInflight; calls it in clearUnitTimeout()`
- ``src/resources/extensions/hx/tests/auto-wrapup-inflight-guard.test.ts` — 6 tests: 4 state-machine + 2 static source wiring checks`

## Verification

npm run test:unit 2>&1 | grep -E 'auto-wrapup-inflight|passed|failed' | tail -5; npx tsc --noEmit

## Observability Impact

isWrapupInflight() state is now inspectable at runtime; future guard logic can check this flag before dispatching a new unit during wrapup window
