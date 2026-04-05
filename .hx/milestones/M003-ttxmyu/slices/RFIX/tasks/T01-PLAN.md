---
estimated_steps: 18
estimated_files: 2
skills_used: []
---

# T01: Fix triage-ui.ts and ask-user-questions.ts build errors

Two surgical TypeScript fixes to unblock npm run build.

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

## Inputs

- ``src/resources/extensions/hx/triage-ui.ts` — has CLASSIFICATION_LABELS and ALL_CLASSIFICATIONS missing stop/backtrack`
- ``src/resources/extensions/hx/captures.ts` — defines Classification type (read-only reference)`
- ``src/resources/extensions/ask-user-questions.ts` — lines 259 and 265 missing as const`

## Expected Output

- ``src/resources/extensions/hx/triage-ui.ts` — CLASSIFICATION_LABELS includes stop and backtrack entries; ALL_CLASSIFICATIONS has 7 entries`
- ``src/resources/extensions/ask-user-questions.ts` — lines 259 and 265 use `type: "text" as const``

## Verification

npx tsc --project tsconfig.resources.json --noEmit && npx tsc --project tsconfig.extensions.json --noEmit && npm run build 2>&1 | tail -5
