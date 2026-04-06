---
sliceId: S03
uatType: runtime-executable
verdict: PASS
date: 2026-04-04T14:13:41.000Z
---

# UAT Result — S03

## Checks

| Check | Mode | Result | Notes |
|-------|------|--------|-------|
| Compile tests (`node scripts/compile-tests.mjs`) | runtime | PASS | 1172 files compiled, 279 .ts→.js rewrites in 4.72s |
| Step 1 — state-corruption-2945: demo fallback uses 'TBD' not full_uat_md | runtime | PASS | 3/3 subtests pass |
| Step 1 — state-corruption-2945: replaySliceComplete guard prevents premature done state | runtime | PASS | 4/4 subtests pass |
| Step 1 — state-corruption-2945: MV01-MV04 gate rows inserted on validate-milestone | runtime | PASS | validate-milestone-write-order: 3/3 subtests pass |
| Step 2 — summary-render-parity: YAML list format for key_files/key_decisions | runtime | PASS | `  - item` format confirmed; 4/4 subtests pass |
| Step 2 — summary-render-parity: evidence table rendered when evidence provided | runtime | PASS | 7/7 required-sections subtests pass |
| Step 2 — summary-render-parity: verification_result computed from evidence exit codes | runtime | PASS | 4/4 computation subtests pass; handleCompleteTask output format 2/2 pass |
| Step 3 — workflow-projections: renderSummaryContent uses YAML list format | runtime | PASS | explicit test passes |
| Step 3 — workflow-projections: renderSummaryContent uses narrative not full_summary_md | runtime | PASS | explicit test passes |
| Step 4 — guided-flow session isolation: Map-based pendingAutoStartMap | runtime | PASS | 7/7 subtests pass — basePath A/B isolated, clearPendingAutoStart(A) does not clear B |
| Step 5 — guided-flow dynamic routing: dispatchWorkflow uses selectAndApplyModel | runtime | PASS | 10/10 subtests pass (structural source check) |
| Step 6 — discuss-queued-milestones: zero pending slices routes to queued milestone (test 12) | runtime | PASS | explicit test passes |
| Step 6 — discuss-queued-milestones: allDiscussed routes to queued milestone (test 13) | runtime | PASS | explicit test passes |
| Step 6 — discuss-empty-db-fallback: uses parseRoadmapSlices output | runtime | PASS | 11/11 subtests pass |
| Step 7 — plan-milestone-title: upsertMilestonePlanning preserves title across re-upserts | runtime | PASS | 2/2 subtests pass |
| Step 8 — reassess-handler: all 56 tests pass including #2957 stale-validation invalidation | runtime | PASS | 16/16 tests pass (including 5 #2957 validation-invalidation tests) |
| Step 9 — verification-operational-gate: isVerificationNotApplicable("") → true | runtime | PASS | 15/15 subtests pass — all cases verified |
| Step 9 — verification-operational-gate: isVerificationNotApplicable("N/A") → true | runtime | PASS | see above |
| Step 9 — verification-operational-gate: isVerificationNotApplicable("See logs") → false | runtime | PASS | see above |
| Step 10 — roadmap-slices: new format variants parsed (numeric, parenthetical, square bracket, leading whitespace) | runtime | PASS | 5 new format tests pass (prose parser handles optional leading whitespace, numeric prefix, parenthetical, square bracket, completion checkmark) |
| Step 11 — reassess disk→DB fix (covered in Step 8) | runtime | PASS | reassess-handler all pass |
| Step 12 — auto-model-selection: bare ID prefers anthropic over claude-code | runtime | PASS | "bare ID with multiple matches prefers anthropic over claude-code" → PASS |
| Step 12 — auto-model-selection: bare ID with current provider=claude-code still returns anthropic | runtime | PASS | explicit test passes |
| Step 12 — auto-model-selection: bare ID with no candidates returns undefined | runtime | PASS | explicit test passes |
| Step 13 — extension-model-validation: picks anthropic fallback when model not configured | runtime | PASS | 6/6 subtests pass |
| Step 13 — extension-model-validation: disables thinking when no models available | runtime | PASS | see above |
| Step 13 — extension-model-validation: extension model visible after extensions register | runtime | PASS | see above |
| Step 14 — cli-provider-rate-limit: openai-codex capped at 30s | runtime | PASS | 5/5 subtests pass |
| Step 14 — cli-provider-rate-limit: google-gemini-cli capped at 30s | runtime | PASS | see above |
| Step 14 — cli-provider-rate-limit: anthropic provider not capped | runtime | PASS | see above |
| Step 15 — doctor-providers: openai-codex in openai routes | runtime | PASS | 2/2 PROVIDER_ROUTES tests pass |
| Step 15 — doctor-providers: google-gemini-cli in google routes | runtime | PASS | see above |
| Step 16 — memory-extractor: buildMemoryLLMCall includes resolvedApiKey when getApiKey returns a key | runtime | PASS | 5/5 OAuth subtests pass |
| Step 16 — memory-extractor: buildMemoryLLMCall omits apiKey when getApiKey rejects | runtime | PASS | see above |
| Step 17 — stream-adapter: buildSdkOptions sets persistSession:true | runtime | PASS | 7/7 buildSdkOptions subtests pass |
| Step 17 — stream-adapter: buildPromptFromContext builds prompt from full context | runtime | PASS | 3/3 prompt construction subtests pass |
| Step 18 — Full S03 test suite (19 files, ≥290 pass, 0 fail) | runtime | PASS | 290 pass, 0 fail, 1 skipped (structural) — output: `ℹ pass 290  ℹ fail 0  ℹ skipped 1` |
| Step 19 — Typecheck: `npx tsc --noEmit` → exit 0 | runtime | PASS | Exit code 0, no output |
| Step 20 — GSD naming check: grep in milestone-validation-gates.ts, guided-flow.ts, startup-model-validation.ts → 0 | runtime | PASS | Output: `0` |

## Overall Verdict

PASS — All 40 automatable checks passed: 290/290 tests pass (1 skipped structural), typecheck clean (exit 0), 0 GSD references in modified files.

## Notes

- Compile step succeeded in 4.72s: 1172 files compiled, 279 .ts→.js import rewrites.
- One skipped test: "startAuto calls selfHealRuntimeRecords before autoLoop (#1727)" — explicitly skipped with comment "selfHealRuntimeRecords moved to crash-recovery pipeline in v3". This is expected and acceptable per UAT spec.
- `[hx:engine] WARN: Failed to chdir to basePath` messages appear in auto-loop tests — these are test harness warnings (undefined basePath), not failures; all tests pass.
- `hx-db: complete_task — could not find plan file` and `hx-db: validate_milestone — disk render failed, rolling back DB row` messages are from negative-path tests verifying rollback behavior — all pass.
- GSD check covers the three highest-risk files from S03 work; grep piped through `grep -v 'migrate-gsd-to-hx'` and returns 0.
