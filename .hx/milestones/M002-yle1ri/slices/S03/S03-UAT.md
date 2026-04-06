# S03: Milestone Lifecycle, Guided-flow & Model/Provider — UAT

**Milestone:** M002-yle1ri
**Written:** 2026-04-04T14:02:12.543Z

## UAT Type

UAT mode: runtime-executable

## Preconditions

- Working directory: `/Users/beratcan/Desktop/GithubProjects/hx-ai/.hx/worktrees/M002-yle1ri`
- Node.js ≥20, TypeScript toolchain available
- `node_modules` symlinked from main project (done in worktree setup)
- Test files compiled: `node scripts/compile-tests.mjs`

---

## Test Suite 1: Milestone Lifecycle Fixes (commits c1a80e20d, 82779b24d)

**Purpose:** Verify state corruption fixes and unified SUMMARY render format.

**Step 1 — Run state-corruption tests:**
```
node --test dist-test/src/resources/extensions/hx/tests/state-corruption-2945.test.js
```
**Expected:** All tests pass. Specifically:
- "demo fallback uses 'TBD' not full_uat_md" → PASS
- "replaySliceComplete guard prevents premature done state" → PASS
- "MV01-MV04 gate rows inserted on validate-milestone" → PASS

**Step 2 — Run SUMMARY render parity tests:**
```
node --test dist-test/src/resources/extensions/hx/tests/summary-render-parity.test.js
```
**Expected:** All tests pass. YAML list format used for key_files/key_decisions (`  - item` not `["item"]`). Evidence table rendered when evidence provided. `verification_result` computed from evidence exit codes.

**Step 3 — Run workflow-projections tests:**
```
node --test dist-test/src/resources/extensions/hx/tests/workflow-projections.test.js
```
**Expected:** "renderSummaryContent uses YAML list format for key_files" → PASS. "renderSummaryContent uses narrative not full_summary_md for What Happened" → PASS.

---

## Test Suite 2: Guided-flow Session Isolation (commits cf6f7d4ef, 71c5fc933, bc04b9517, 9c943f4a3)

**Purpose:** Verify Map-based session isolation and routing fixes.

**Step 4 — Run session isolation tests:**
```
node --test dist-test/src/resources/extensions/hx/tests/guided-flow-session-isolation.test.js
```
**Expected:** basePath "A" and basePath "B" get isolated pendingAutoStart state. clearPendingAutoStart("A") does not clear "B". getDiscussionMilestoneId(basePath) returns the correct milestone for each session.

**Step 5 — Run dynamic routing tests:**
```
node --test dist-test/src/resources/extensions/hx/tests/guided-flow-dynamic-routing.test.js
```
**Expected:** Structural assertion that `dispatchWorkflow` source uses `selectAndApplyModel` (not `resolveModelWithFallbacksForUnit`) → PASS (1 skipped if source check not applicable).

**Step 6 — Run queued milestone and empty-DB fallback tests:**
```
node --test dist-test/src/resources/extensions/hx/tests/discuss-queued-milestones.test.js dist-test/src/resources/extensions/hx/tests/discuss-empty-db-fallback.test.js
```
**Expected:** Test 12 (zero pending slices routes to queued milestone) → PASS. Test 13 (allDiscussed routes to queued milestone) → PASS. Empty-DB fallback uses parseRoadmapSlices output → PASS.

---

## Test Suite 3: DB/Dispatch Micro-fixes (commits 0a6d1e52d, 4c12ba34a, b7236743c, ca6071ad3, a26f187e0)

**Purpose:** Verify title preservation, validation invalidation, gate widening, artifact path, and roadmap parser.

**Step 7 — Run plan-milestone-title test:**
```
node --test dist-test/src/resources/extensions/hx/tests/plan-milestone-title.test.js
```
**Expected:** upsertMilestonePlanning preserves title across re-upserts. COALESCE logic: if title provided → uses it; if null provided → keeps existing title.

**Step 8 — Run reassess-handler test:**
```
node --test dist-test/src/resources/extensions/hx/tests/reassess-handler.test.js
```
**Expected:** All 56 tests pass (including #2957 test block for stale-validation invalidation). No pre-existing failures. Deleted slices do NOT reappear after reassess (disk→DB reconciliation fixed).

**Step 9 — Run verification-operational-gate test:**
```
node --test dist-test/src/resources/extensions/hx/tests/verification-operational-gate.test.js
```
**Expected:** `isVerificationNotApplicable("")` → true. `isVerificationNotApplicable("none")` → true. `isVerificationNotApplicable("N/A")` → true. `isVerificationNotApplicable("not applicable")` → true. `isVerificationNotApplicable("See logs")` → false.

**Step 10 — Run roadmap-slices test:**
```
node --test dist-test/src/resources/extensions/hx/tests/roadmap-slices.test.js
```
**Expected:** New format variants parsed: `1. ## S01: Title`, `(2) # S02: Title`, `[S03] ## Title`, `  ## S04: Title` (leading whitespace). All H3 headers recognized.

---

## Test Suite 4: Reassess Disk→DB Fix (commit in T04)

**Purpose:** Verify deleted slices don't re-appear after reassess-roadmap call.

**Step 11 — Edge case already covered in Step 8 reassess-handler.test.js test #2957.**

---

## Test Suite 5: Model/Provider Routing Fixes (commits 939c98c2c, 28d39c3fd, 188dd2e86, 5f7f476a6)

**Purpose:** Verify EXTENSION_PROVIDERS bare model ID logic, deferred validation, Codex/Gemini routes.

**Step 12 — Run auto-model-selection tests (bare ID section):**
```
node --test dist-test/src/resources/extensions/hx/tests/auto-model-selection.test.js
```
**Expected:** "bare ID with multiple matches prefers anthropic over claude-code" → PASS. "bare ID with current provider=claude-code still returns anthropic" → PASS. "bare ID with no candidates returns undefined" → PASS.

**Step 13 — Run extension-model-validation test:**
```
node --test dist-test/src/tests/extension-model-validation.test.js
```
**Expected:** "picks anthropic fallback when model not configured" → PASS. "disables thinking when no models available" → PASS. "extension model visible after extensions register" → PASS.

**Step 14 — Run cli-provider-rate-limit test:**
```
node --test dist-test/src/resources/extensions/hx/tests/cli-provider-rate-limit.test.js
```
**Expected:** "openai-codex capped at 30s" → PASS. "google-gemini-cli capped at 30s" → PASS. "anthropic provider not capped" → PASS.

**Step 15 — Run doctor-providers test (new routes):**
```
node --test dist-test/src/resources/extensions/hx/tests/doctor-providers.test.js
```
**Expected:** "openai-codex is included in openai routes" → PASS. "google-gemini-cli is included in google routes" → PASS.

---

## Test Suite 6: Retry/StopReason/OAuth/StreamAdapter (T05 commits)

**Purpose:** Verify long-context retry, pauseTurn, OAuth key, claude-code stateful.

**Step 16 — Run memory-extractor test:**
```
node --test dist-test/src/resources/extensions/hx/tests/memory-extractor.test.js
```
**Expected:** "buildMemoryLLMCall includes resolvedApiKey when getApiKey returns a key" → PASS. "buildMemoryLLMCall omits apiKey when getApiKey rejects" → PASS.

**Step 17 — Run stream-adapter test:**
```
node --test dist-test/src/resources/extensions/claude-code-cli/tests/stream-adapter.test.js
```
**Expected:** "buildSdkOptions sets persistSession:true" → PASS. "buildPromptFromContext builds prompt from full context" → PASS.

---

## Full Slice Verification

**Step 18 — Run all S03 tests in one command:**
```
node --test \
  dist-test/src/resources/extensions/hx/tests/state-corruption-2945.test.js \
  dist-test/src/resources/extensions/hx/tests/summary-render-parity.test.js \
  dist-test/src/resources/extensions/hx/tests/workflow-projections.test.js \
  dist-test/src/resources/extensions/hx/tests/validate-milestone-write-order.test.js \
  dist-test/src/resources/extensions/hx/tests/guided-flow-session-isolation.test.js \
  dist-test/src/resources/extensions/hx/tests/guided-flow-dynamic-routing.test.js \
  dist-test/src/resources/extensions/hx/tests/discuss-queued-milestones.test.js \
  dist-test/src/resources/extensions/hx/tests/discuss-empty-db-fallback.test.js \
  dist-test/src/resources/extensions/hx/tests/plan-milestone-title.test.js \
  dist-test/src/resources/extensions/hx/tests/reassess-handler.test.js \
  dist-test/src/resources/extensions/hx/tests/verification-operational-gate.test.js \
  dist-test/src/resources/extensions/hx/tests/roadmap-slices.test.js \
  dist-test/src/resources/extensions/hx/tests/auto-model-selection.test.js \
  dist-test/src/resources/extensions/hx/tests/cli-provider-rate-limit.test.js \
  dist-test/src/resources/extensions/hx/tests/doctor-providers.test.js \
  dist-test/src/resources/extensions/hx/tests/memory-extractor.test.js \
  dist-test/src/resources/extensions/hx/tests/auto-loop.test.js \
  dist-test/src/resources/extensions/claude-code-cli/tests/stream-adapter.test.js \
  dist-test/src/tests/extension-model-validation.test.js
```
**Expected:** ≥290 pass, 0 fail (1 skipped structural test is acceptable).

**Step 19 — Typecheck:**
```
npx tsc --noEmit
```
**Expected:** Exit 0, no output.

**Step 20 — GSD naming check:**
```
grep -r 'gsd\|GSD' \
  src/resources/extensions/hx/milestone-validation-gates.ts \
  src/resources/extensions/hx/guided-flow.ts \
  src/startup-model-validation.ts \
  2>/dev/null | grep -v 'migrate-gsd-to-hx' | wc -l
```
**Expected:** Output is `0`.
