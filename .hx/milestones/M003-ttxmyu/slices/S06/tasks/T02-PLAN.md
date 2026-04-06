---
estimated_steps: 21
estimated_files: 5
skills_used: []
---

# T02: Ask-User-Questions Dedup + Loop Guard Strict Mode (Cluster 2)

Port the ask-user-questions dedup cluster from commits 7bd8fe47d, b75af3bc2, 4c9073f62. Adds a per-turn signature cache that prevents the same question set from being dispatched twice in one turn, and adds a strict single-dispatch threshold for ask_user_questions in the loop guard.

Steps:
1. In `src/resources/extensions/ask-user-questions.ts`:
   - Import `createHash` from `'crypto'` (or use existing hash utility)
   - Add `const turnCache = new Map<string, { questions: unknown[]; result: unknown }>()` module var
   - Export `resetAskUserQuestionsCache(): void` — clears turnCache
   - Add `questionSignature(questions: unknown[]): string` — stringify + sha256 the canonicalized array (sort by id, include header, question, options, allowMultiple)
   - In `execute()`: compute sig = questionSignature(params.questions); check turnCache before dispatching; cache results on success (non-error, non-timeout)
   - Move the `tryRemoteQuestions` call BEFORE the `!ctx.hasUI` guard (this is the remote-questions interactive mode fix from commit b75af3bc2 — remote questions should be attempted even in non-interactive sessions)

2. In `src/resources/extensions/hx/bootstrap/register-hooks.ts`:
   - Import `resetAskUserQuestionsCache` from the ask-user-questions extension
   - Wire it into `session_start`, `session_switch`, and `agent_end` hooks (add the import and the call)

3. In `src/resources/extensions/hx/bootstrap/tool-call-loop-guard.ts`:
   - Add `const STRICT_LOOP_TOOLS = new Set(["ask_user_questions"])` constant
   - Add `const MAX_CONSECUTIVE_STRICT = 1` constant  
   - Add `let lastToolName: string | null = null` state var
   - In the loop detection logic: when `toolName` is in `STRICT_LOOP_TOOLS`, use `MAX_CONSECUTIVE_STRICT` as the threshold instead of `MAX_CONSECUTIVE`
   - Reset `lastToolName = null` in `resetToolCallLoopGuard()`

4. Create test files:
   - `src/resources/extensions/hx/tests/ask-user-questions-dedup.test.ts`: tests for cache hit on identical signature, cache miss on different questions, cache reset on session_start/session_switch/agent_end hooks
   - `src/resources/extensions/hx/tests/tool-call-loop-guard.test.ts` (update existing): add test for STRICT_LOOP_TOOLS threshold — ask_user_questions triggers loop guard after 1 consecutive call instead of the default threshold

## Inputs

- `src/resources/extensions/ask-user-questions.ts`
- `src/resources/extensions/hx/bootstrap/register-hooks.ts`
- `src/resources/extensions/hx/bootstrap/tool-call-loop-guard.ts`
- `src/resources/extensions/hx/tests/tool-call-loop-guard.test.ts`

## Expected Output

- `src/resources/extensions/ask-user-questions.ts`
- `src/resources/extensions/hx/bootstrap/register-hooks.ts`
- `src/resources/extensions/hx/bootstrap/tool-call-loop-guard.ts`
- `src/resources/extensions/hx/tests/ask-user-questions-dedup.test.ts`
- `src/resources/extensions/hx/tests/tool-call-loop-guard.test.ts`

## Verification

npx tsc --noEmit && npm run test:unit -- --reporter=dot 2>&1 | tail -3
