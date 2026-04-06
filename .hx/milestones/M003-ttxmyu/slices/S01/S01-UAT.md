# S01: Capability-Aware Model Routing + DB Reconciliation — UAT

**Milestone:** M003-ttxmyu
**Written:** 2026-04-05T14:50:13.155Z

## UAT Type
UAT mode: artifact-driven

## Preconditions

- Working directory: `/Users/beratcan/Desktop/GithubProjects/hx-ai`
- Node.js installed with `npm run test:unit` available
- `npx tsc --noEmit` resolves against the project tsconfig

---

## Test Cases

### TC-01: Schema version and slice_locks table present

**Verify hx-db.ts has been migrated to v15 with all slice_locks references.**

```bash
grep -n 'SCHEMA_VERSION = 15' src/resources/extensions/hx/hx-db.ts
grep -n 'slice_locks' src/resources/extensions/hx/hx-db.ts
```

Expected:
- Line 162: `const SCHEMA_VERSION = 15;`
- At least 5 occurrences: one CREATE TABLE in migration block, one INSERT each in acquireSliceLock, releaseSliceLock, getSliceLock, cleanExpiredSliceLocks

---

### TC-02: Four slice_lock accessor functions exported

**Verify all four accessor functions are exported from hx-db.ts.**

```bash
grep -n 'export function acquireSliceLock\|export function releaseSliceLock\|export function getSliceLock\|export function cleanExpiredSliceLocks' src/resources/extensions/hx/hx-db.ts
```

Expected: 4 matching lines, one per accessor.

---

### TC-03: ModelCapabilities interface and profiles present

**Verify ModelCapabilities interface and 17-model profile map exist.**

```bash
grep -n 'ModelCapabilities' src/resources/extensions/hx/model-router.ts
grep -n 'MODEL_CAPABILITY_PROFILES' src/resources/extensions/hx/model-router.ts
```

Expected:
- `ModelCapabilities` appears as interface declaration and in the profiles map type annotation
- `MODEL_CAPABILITY_PROFILES` appears as constant declaration

---

### TC-04: selectionMethod and capability_routing present in model-router.ts

**Verify the two key new fields on RoutingDecision and DynamicRoutingConfig.**

```bash
grep -n 'selectionMethod' src/resources/extensions/hx/model-router.ts
grep -n 'capability_routing' src/resources/extensions/hx/model-router.ts
```

Expected:
- `selectionMethod` appears ≥8 times (interface definition + all 5 return paths + scoring branch)
- `capability_routing` appears ≥3 times (interface, defaultRoutingConfig, if-branch)

---

### TC-05: TaskMetadata capability fields in complexity-classifier.ts

**Verify three new optional fields are declared and populated.**

```bash
grep -n 'toolUsage\|visionRequired\|requiresReasoning' src/resources/extensions/hx/complexity-classifier.ts
```

Expected: ≥9 hits (declarations in interface + population in extractTaskMetadata for each field).

---

### TC-06: selectionMethod suffix in auto-model-selection.ts

**Verify routing notify uses selectionMethod to append capability-score suffix.**

```bash
grep -n 'selectionMethod\|capability-score' src/resources/extensions/hx/auto-model-selection.ts
```

Expected: At least 1 hit showing selectionMethod is read to conditionally append routing suffix.

---

### TC-07: GSD naming check — zero hits in all touched files

**Verify no GSD references were introduced.**

```bash
grep -rn 'GSD' \
  src/resources/extensions/hx/model-router.ts \
  src/resources/extensions/hx/hx-db.ts \
  src/resources/extensions/hx/complexity-classifier.ts \
  src/resources/extensions/hx/auto-model-selection.ts \
  src/resources/extensions/hx/auto/loop-deps.ts \
  src/resources/extensions/hx/auto/phases.ts \
  src/resources/extensions/hx/tests/capability-router.test.ts \
  2>/dev/null | grep -v '^Binary' || echo 'GSD check: 0 hits'
```

Expected output: `GSD check: 0 hits`

---

### TC-08: TypeScript compilation clean

```bash
npx tsc --noEmit
echo "Exit: $?"
```

Expected: exit code 0, no diagnostics output.

---

### TC-09: capability-router test file exists with 19 tests

**Verify test file is present and covers required cases.**

```bash
grep -c 'test(' src/resources/extensions/hx/tests/capability-router.test.ts
grep -n 'capability-score\|tier-only\|selectionMethod\|visionRequired\|replan-slice' src/resources/extensions/hx/tests/capability-router.test.ts | head -20
```

Expected: ≥19 `test(` calls; grep shows selectionMethod, capability-score, tier-only, vision, replan-slice are all covered.

---

### TC-10: Full test suite — 4132 pass, 0 fail

```bash
npm run test:unit 2>&1 | tail -5
```

Expected: `✔ 4132 passed, 0 failed, 5 skipped` (or greater if tests were added after T04).

---

## Edge Cases

### EC-01: capability_routing defaults to false (no behavior change without opt-in)

```bash
grep -n 'capability_routing: false' src/resources/extensions/hx/model-router.ts
```

Expected: 1 hit in `defaultRoutingConfig`.

### EC-02: scoreModel returns 1.0 for unknown models (pass-through semantics)

```bash
grep -n 'return 1.0\|return 1 ' src/resources/extensions/hx/model-router.ts | head -5
```

Expected: at least 1 hit showing the `return 1.0` path for profiles not found in MODEL_CAPABILITY_PROFILES.

### EC-03: releaseSliceLock guards on worker_pid

```bash
grep -A5 'export function releaseSliceLock' src/resources/extensions/hx/hx-db.ts | grep 'worker_pid'
```

Expected: `worker_pid` appears in the WHERE clause of the DELETE statement, preventing cross-worker lock stomping.

