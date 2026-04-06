# S01: LLM Safety Harness — UAT

**Milestone:** M004-erchk5
**Written:** 2026-04-06T07:20:02.529Z

## UAT Type
UAT mode: mixed

## Preconditions
- Working directory: `/Users/beratcan/Desktop/GithubProjects/hx-ai`
- `src/resources/extensions/hx/safety/` exists with 7 files
- `dist-test/` is populated (run `node scripts/compile-tests.mjs` if needed)
- Git repo available (checkpoint tests need a real git repo)

---

## Test Cases

### TC-01: safety/ directory contains exactly 7 files with correct names

```bash
ls src/resources/extensions/hx/safety/
```

**Expected:** Output lists exactly these 7 files:
- `content-validator.ts`
- `destructive-guard.ts`
- `evidence-collector.ts`
- `evidence-cross-ref.ts`
- `file-change-validator.ts`
- `git-checkpoint.ts`
- `safety-harness.ts`

---

### TC-02: No GSD references in safety/ directory

```bash
grep -rn 'refs/gsd/checkpoints' src/resources/extensions/hx/safety/ | wc -l
grep -rn '\.gsd/' src/resources/extensions/hx/safety/ | wc -l
grep -rn '\bgsd\b\|\bGSD\b' src/resources/extensions/hx/safety/ | wc -l
```

**Expected:** All three commands print `0`.

---

### TC-03: CHECKPOINT_PREFIX uses refs/hx/checkpoints/

```bash
grep 'CHECKPOINT_PREFIX' src/resources/extensions/hx/safety/git-checkpoint.ts
```

**Expected:** Line reads `const CHECKPOINT_PREFIX = "refs/hx/checkpoints/";` (hx, not gsd).

---

### TC-04: file-change-validator filters .hx/ paths (not .gsd/)

```bash
grep '\.hx/' src/resources/extensions/hx/safety/file-change-validator.ts
```

**Expected:** Contains `.startsWith(".hx/")` or `.startsWith(".hx\\")` — no `.gsd/` references.

---

### TC-05: git-checkpoint uses spawnSync (not execSync with template literal)

```bash
grep -n 'spawnSync\|execSync' src/resources/extensions/hx/safety/git-checkpoint.ts
```

**Expected:** Lines show `spawnSync` usage with array args; no `execSync` calls.

---

### TC-06: safety LogComponent added to workflow-logger.ts

```bash
grep 'safety' src/resources/extensions/hx/workflow-logger.ts
```

**Expected:** Shows `| "safety"` in the LogComponent union.

---

### TC-07: safety_harness key in preferences-types.ts

```bash
grep 'safety_harness' src/resources/extensions/hx/preferences-types.ts
```

**Expected:** Shows `"safety_harness"` in KNOWN_PREFERENCE_KEYS and `safety_harness?:` in HXPreferences interface.

---

### TC-08: checkpointSha field in AutoSession

```bash
grep 'checkpointSha' src/resources/extensions/hx/auto/session.ts
```

**Expected:** Shows `checkpointSha: string | null = null` declaration and `this.checkpointSha = null` in reset().

---

### TC-09: MAX_TIMEOUT_SCALE cap in auto-timers.ts

```bash
grep 'MAX_TIMEOUT_SCALE\|Math.min' src/resources/extensions/hx/auto-timers.ts
```

**Expected:** Shows `const MAX_TIMEOUT_SCALE = 6` and `Math.min(MAX_TIMEOUT_SCALE,` in the timeoutScale computation.

---

### TC-10: TypeScript compiles clean

```bash
npx tsc --noEmit 2>&1 | head -20
echo "Exit: $?"
```

**Expected:** No error output; exit code 0.

---

### TC-11: git-checkpoint regression tests — 4/4 pass

```bash
node scripts/compile-tests.mjs 2>&1 | tail -3
node --test dist-test/src/resources/extensions/hx/tests/git-checkpoint.test.js
```

**Expected:** Compile completes without error. Test output shows:
```
✔ createCheckpoint creates a ref under refs/hx/checkpoints/
✔ cleanupCheckpoint removes the ref
✔ rollbackToCheckpoint restores HEAD to the checkpoint sha
✔ createCheckpoint in a non-git directory returns success=false
pass 4 / fail 0
```

---

### TC-12: Full unit test suite — no new failures

```bash
npm run test:unit 2>&1 | tail -5
```

**Expected:** ≥4298 pass / 0 new failures (pre-existing flaky count ≤3).

---

## Edge Cases

### EC-01: rollbackToCheckpoint in non-git directory returns success=false (not thrown error)

Covered by TC-11 fourth test case: `createCheckpoint in a non-git directory returns success=false`. The function catches git errors and returns `{ success: false, error: ... }` rather than propagating.

### EC-02: safety harness wiring doesn't activate during manual sessions

The `safetyRecordToolResult` call in `register-hooks.ts` is gated by `isAutoActive()`. In a manual session (not in auto-mode), tool results are NOT recorded to the safety evidence buffer. Only `safetyRecordToolCall` (destructive command warnings) fires unconditionally.

### EC-03: timeoutScale cap prevents pathological timeout values

With `MAX_TIMEOUT_SCALE = 6`, an estimate of 180 minutes produces `timeoutScale = min(6, max(1, 18)) = 6` — not 18. An estimate of 10 minutes produces `timeoutScale = min(6, max(1, 1)) = 1`. Zero or missing estimate produces `timeoutScale = 1`.

