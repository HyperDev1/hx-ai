# RFIX: Build Error Remediation: triage-ui.ts + ask-user-questions.ts

**Goal:** Fix two TypeScript type errors that block `npm run build` (triage-ui.ts missing stop/backtrack in CLASSIFICATION_LABELS and ALL_CLASSIFICATIONS; ask-user-questions.ts missing `as const` on two type: "text" literals), then validate R011–R016 in REQUIREMENTS.md with evidence from S01–S05 summaries.
**Demo:** After this: npm run build exits 0; tsconfig.resources.json compilation clean; R011/R012/R013/R015/R016 moved to Validated in REQUIREMENTS.md

## Tasks
- [x] **T01: Fixed two TypeScript build errors: added stop/backtrack to triage-ui.ts Classification maps and added `as const` to two type: "text" literals in ask-user-questions.ts** — Two surgical TypeScript fixes to unblock npm run build.

**Fix 1 — triage-ui.ts:** The `Classification` type in captures.ts includes `"stop"` and `"backtrack"` (added in S04/T02), but `CLASSIFICATION_LABELS` and `ALL_CLASSIFICATIONS` in triage-ui.ts were never updated. This makes the `Record<Classification, ...>` type incomplete, causing a tsc error.

Add to `CLASSIFICATION_LABELS` object (after the existing `"note"` entry):
```typescript
"stop": {
  label: "Stop",
  description: "Halt auto-mode execution immediately — session is fundamentally off-track.",
},
"backtrack": {
  label: "Backtrack",
  description: "Rewind to a specific previous slice. Include target slice ID in the rationale.",
},
```

Add `"stop"` and `"backtrack"` to the `ALL_CLASSIFICATIONS` array (currently ends with `"note"`).

Do NOT touch the auto-confirm block (lines ~87+) — stop/backtrack already require user confirmation (not auto-confirmed like note/defer).

**Fix 2 — ask-user-questions.ts:** Two return sites (lines 259 and 265) infer `type: string` instead of the required `type: "text"` literal. Add `as const` after `"text"` at those two locations:
- Line 259: `content: [{ type: "text", text: "ask_user_questions was cancelled..." }]` → `type: "text" as const`
- Line 265: `content: [{ type: "text", text: formatForLLM(result) }]` → `type: "text" as const`
  - Estimate: 15m
  - Files: src/resources/extensions/hx/triage-ui.ts, src/resources/extensions/ask-user-questions.ts
  - Verify: npx tsc --project tsconfig.resources.json --noEmit && npx tsc --project tsconfig.extensions.json --noEmit && npm run build 2>&1 | tail -5
- [ ] **T02: Validate R011–R016 in REQUIREMENTS.md with S01–S05 evidence** — Read S01–S05 slice summaries and confirm each Active requirement (R011, R012, R013, R015, R016) was delivered. Update REQUIREMENTS.md to move each from Active to Validated with a one-sentence evidence note.

Requirements to validate:
- **R011** — Capability-aware model routing (S01): Check S01-SUMMARY.md confirms capability-router.ts, MODEL_CAPABILITY_PROFILES, scoreModel, before_model_select hook, capability_routing config flag ported
- **R012** — Slice-level parallelism (S02): Check S02-SUMMARY.md confirms slice-parallel-orchestrator.ts, slice-parallel-conflict.ts, slice-parallel-eligibility.ts exist with HX_SLICE_LOCK; state.ts updated
- **R013** — Context optimization masking + phase anchors (S03): Check S03-SUMMARY.md confirms context-masker.ts and phase-anchor.ts exist; system-context.ts wired; preferences integrated
- **R015** — Workflow-logger centralization (S04): Check S04-SUMMARY.md confirms catch blocks migrated, workflow-logger-audit, silent-catch-diagnostics, tool-call-loop-guard.ts ported
- **R016** — MCP server read-only tools (S05): Check S05-SUMMARY.md confirms 6 readers (readProgress, readRoadmap, readHistory, readCaptures, readKnowledge, runDoctorLite) in packages/mcp-server/src/readers/

For each requirement, move its block from the `## Active` section to `## Validated` section in REQUIREMENTS.md and fill in the Validation field with one sentence of evidence from the slice summary.

Also update the Traceability table at the bottom — change `unmapped` to the validation evidence for each of R011/R012/R013/R015/R016.

Finally, update Coverage Summary counts (Active → 0, Validated → 11).
  - Estimate: 20m
  - Files: .hx/REQUIREMENTS.md
  - Verify: grep -c 'status: validated' .hx/REQUIREMENTS.md | grep -qE '^[0-9]+$' && grep -c 'status: active' .hx/REQUIREMENTS.md
