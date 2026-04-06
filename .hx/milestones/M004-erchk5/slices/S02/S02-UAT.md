# S02: Ollama Native Provider + Flat-rate Routing Guard — UAT

**Milestone:** M004-erchk5
**Written:** 2026-04-06T08:07:31.120Z

## UAT Type
UAT mode: runtime-executable

## Purpose
Verify S02 deliverables: Ollama native provider registration, flat-rate routing guard, ollama_manage tool, and model fallback race fix.

## Preconditions
- Working directory: `/Users/beratcan/Desktop/GithubProjects/hx-ai`
- `packages/pi-ai` has been built (`cd packages/pi-ai && npm run build`)
- `node scripts/compile-tests.mjs` has been run
- Ollama does NOT need to be running — tests use mock fetch or test against error handling

## Test Cases

### TC01 — ollama-chat provider: full NDJSON streaming
**What:** 9 ollama-chat.test.js tests covering all provider paths.
```bash
node --test dist-test/src/resources/extensions/hx/tests/ollama-chat.test.js
```
**Expected:** 9 pass, 0 fail. Tests cover: text streaming, token usage from done chunk, non-200 error, tool call response, custom baseUrl, apiKey stripping, abort signal, convertDiscoveredModels api assignment, KnownApi compile-time guard.

### TC02 — flat-rate routing guard: github-copilot models not downgraded
**What:** 5 flat-rate guard tests in model-router.test.js.
```bash
node --test dist-test/src/resources/extensions/hx/tests/model-router.test.js 2>&1 | grep -E 'flat-rate|isFlatRateModel|pass|fail'
```
**Expected:** All 5 flat-rate tests pass: `isFlatRateModel: github-copilot/ prefix is flat-rate`, `isFlatRateModel: non-flat-rate providers return false`, `flat-rate model is not downgraded even with routing enabled`, `flat-rate guard returns configured fallbacks unchanged`, `non-flat-rate model is still downgraded normally`.

### TC03 — full model-router test suite
**What:** All 20 model-router tests (15 pre-existing + 5 new).
```bash
node --test dist-test/src/resources/extensions/hx/tests/model-router.test.js
```
**Expected:** 20 pass, 0 fail.

### TC04 — tsc typecheck clean
**What:** No type errors introduced.
```bash
npx tsc --noEmit 2>&1; echo "EXIT:$?"
```
**Expected:** No output, `EXIT:0`.

### TC05 — KnownApi includes ollama-chat (compile-time guard)
**What:** The KnownApi type guard test confirms 'ollama-chat' is in the union.
```bash
node --test dist-test/src/resources/extensions/hx/tests/ollama-chat.test.js 2>&1 | grep "KnownApi"
```
**Expected:** `✔ KnownApi type includes ollama-chat (compile-time guard)`

### TC06 — Ollama provider registered with authMode:none
**What:** Verify the provider registration call exists in register-extension.ts.
```bash
grep -n "authMode.*none\|registerProvider.*ollama" src/resources/extensions/hx/bootstrap/register-extension.ts
```
**Expected:** Lines showing `registerProvider("ollama"` with `authMode: "none"` and `api: "ollama-chat"`.

### TC07 — ollama_manage tool gracefully handles Ollama not running
**What:** Static check that ollama-manage-tool.ts returns error object (not throws) on fetch failure.
```bash
grep -n 'return.*error\|catch.*error' src/resources/extensions/hx/bootstrap/ollama-manage-tool.ts | head -10
```
**Expected:** Multiple error return paths visible; no `throw` on network failure.

### TC08 — model fallback race fix: appliedModel set before byId attempt
**What:** Verify the fix is in place in auto-model-selection.ts.
```bash
grep -n 'appliedModel = startModel' src/resources/extensions/hx/auto-model-selection.ts
```
**Expected:** Two lines — one for the `setModel` success path and one for the fallback path (line ~189: set before byId attempt).

### TC09 — zero GSD references in modified files
**What:** Naming invariant check.
```bash
grep -rn '\bGSD\b\|GSD_\|gsd_' \
  packages/pi-ai/src/providers/ollama-chat.ts \
  src/resources/extensions/hx/bootstrap/ollama-manage-tool.ts \
  src/resources/extensions/hx/model-router.ts \
  src/resources/extensions/hx/auto-model-selection.ts \
  src/resources/extensions/hx/bootstrap/register-extension.ts \
  src/resources/extensions/hx/tests/model-router.test.ts \
  src/resources/extensions/hx/tests/ollama-chat.test.ts
```
**Expected:** No output (zero hits).

### TC10 — full test suite baseline maintained
**What:** Suite count at or above S01 baseline (4309).
```bash
npm run test:unit 2>&1 | tail -5
```
**Expected:** ≥4309 pass, 0 new failures beyond the 3 pre-existing.

## Edge Cases

- **Ollama not running:** `ollama_manage list` should return `{error: "..."}` not throw. Covered by TC07 static check; confirmed in T02 task narrative.
- **github-copilot/claude-3.5-sonnet (provider/model format):** `isFlatRateModel` splits on first slash and checks prefix — covered by TC02 tests.
- **startModel found but setModel returns false:** `appliedModel` is still set to `startModel` (not null) — covered by TC08 grep and T02 narrative.
- **Trailing slash in Ollama baseUrl:** `ollama-chat.ts` normalizes baseUrl by stripping trailing slash before appending `/api/chat` — covered by TC01 (custom baseUrl test).
