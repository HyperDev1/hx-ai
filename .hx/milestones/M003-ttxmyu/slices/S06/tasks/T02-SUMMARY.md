---
id: T02
parent: S06
milestone: M003-ttxmyu
provides: []
requires: []
affects: []
key_files: ["src/resources/extensions/ask-user-questions.ts", "src/resources/extensions/hx/bootstrap/register-hooks.ts", "src/resources/extensions/hx/bootstrap/tool-call-loop-guard.ts", "src/resources/extensions/hx/tests/ask-user-questions-dedup.test.ts", "src/resources/extensions/hx/tests/tool-call-loop-guard.test.ts"]
key_decisions: ["Cache only successful results (not cancelled/error paths)", "STRICT_LOOP_TOOLS threshold=1 means block on 2nd identical call — distinct from default threshold of 4", "tryRemoteQuestions unconditionally attempted before hasUI check so remote mode works in non-interactive sessions"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "tsc --noEmit exits 0. Both new test files pass when run directly. npm run test:unit passes 4234 tests with 0 failures."
completed_at: 2026-04-05T19:08:40.874Z
blocker_discovered: false
---

# T02: Added per-turn dedup cache to ask-user-questions and strict 1-call loop guard threshold for ask_user_questions tool

> Added per-turn dedup cache to ask-user-questions and strict 1-call loop guard threshold for ask_user_questions tool

## What Happened
---
id: T02
parent: S06
milestone: M003-ttxmyu
key_files:
  - src/resources/extensions/ask-user-questions.ts
  - src/resources/extensions/hx/bootstrap/register-hooks.ts
  - src/resources/extensions/hx/bootstrap/tool-call-loop-guard.ts
  - src/resources/extensions/hx/tests/ask-user-questions-dedup.test.ts
  - src/resources/extensions/hx/tests/tool-call-loop-guard.test.ts
key_decisions:
  - Cache only successful results (not cancelled/error paths)
  - STRICT_LOOP_TOOLS threshold=1 means block on 2nd identical call — distinct from default threshold of 4
  - tryRemoteQuestions unconditionally attempted before hasUI check so remote mode works in non-interactive sessions
duration: ""
verification_result: passed
completed_at: 2026-04-05T19:08:40.875Z
blocker_discovered: false
---

# T02: Added per-turn dedup cache to ask-user-questions and strict 1-call loop guard threshold for ask_user_questions tool

**Added per-turn dedup cache to ask-user-questions and strict 1-call loop guard threshold for ask_user_questions tool**

## What Happened

Ported the ask-user-questions dedup cluster from upstream commits 7bd8fe47d, b75af3bc2, and 4c9073f62. Added turnCache module var, exported resetAskUserQuestionsCache and questionSignature to ask-user-questions.ts; wired cache reset into session_start/session_switch/agent_end in register-hooks.ts; added STRICT_LOOP_TOOLS set with MAX_CONSECUTIVE_STRICT=1 to tool-call-loop-guard.ts; moved tryRemoteQuestions before the hasUI guard. Created ask-user-questions-dedup.test.ts with 8 scenarios; updated tool-call-loop-guard.test.ts to reflect strict-mode semantics.

## Verification

tsc --noEmit exits 0. Both new test files pass when run directly. npm run test:unit passes 4234 tests with 0 failures.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx tsc --noEmit` | 0 | ✅ pass | 4300ms |
| 2 | `node --test dist-test/src/resources/extensions/hx/tests/ask-user-questions-dedup.test.js dist-test/src/resources/extensions/hx/tests/tool-call-loop-guard.test.js` | 0 | ✅ pass | 2200ms |
| 3 | `npm run test:unit -- --reporter=dot` | 0 | ✅ pass | 73900ms |


## Deviations

RPC fallback path result caching added (plan omitted this detail) — semantically correct and consistent with remote/local paths.

## Known Issues

None.

## Files Created/Modified

- `src/resources/extensions/ask-user-questions.ts`
- `src/resources/extensions/hx/bootstrap/register-hooks.ts`
- `src/resources/extensions/hx/bootstrap/tool-call-loop-guard.ts`
- `src/resources/extensions/hx/tests/ask-user-questions-dedup.test.ts`
- `src/resources/extensions/hx/tests/tool-call-loop-guard.test.ts`


## Deviations
RPC fallback path result caching added (plan omitted this detail) — semantically correct and consistent with remote/local paths.

## Known Issues
None.
