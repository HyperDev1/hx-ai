# RFIX Research: Build Error Remediation — triage-ui.ts + ask-user-questions.ts

## Summary

Two TypeScript type errors block `npm run build` (via `copy-resources.cjs` which runs `tsc --project tsconfig.resources.json`). Both are surgical single-file fixes. `npx tsc --noEmit` (main tsconfig.json) passes clean because `src/resources` is excluded from `tsconfig.json`; the errors only surface via `tsconfig.resources.json` and `tsconfig.extensions.json`. `npm run test:unit` is unaffected (4298/0/5 still passing).

## Error 1: triage-ui.ts(31) — Missing `stop`/`backtrack` in Record<Classification, ...>

**Root cause:** The S04/T02 commit (837eb6fe7) extended `Classification` in `captures.ts` to include `"stop"` and `"backtrack"`, but `triage-ui.ts` was never updated. Two structures are incomplete:

1. `CLASSIFICATION_LABELS: Record<Classification, { label: string; description: string }>` — missing `"stop"` and `"backtrack"` entries
2. `ALL_CLASSIFICATIONS: Classification[]` — only includes the original 5 values

**Fix:** Add to `CLASSIFICATION_LABELS`:
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

Add `"stop"` and `"backtrack"` to `ALL_CLASSIFICATIONS` array.

**Behavior note:** `stop` and `backtrack` are high-impact classifications (they write trigger files that halt/rewind execution per `triage-resolution.ts`). They should NOT be auto-confirmed like `note`/`defer` — they require the UI confirmation flow like `quick-task`/`inject`/`replan`. No change needed to the `showTriageConfirmation` auto-confirm block.

**Affected file:** `src/resources/extensions/hx/triage-ui.ts` (lines 31–55, 54–56)

## Error 2: ask-user-questions.ts(161) — `type: string` not assignable to `type: "text"`

**Root cause:** The S06/T02 commit (812258a11) added dedup caching and moved `tryRemoteQuestions` before the `hasUI` guard. In doing so, two return sites were written without `as const` on the `type` property:

- Line 259: `content: [{ type: "text", text: "ask_user_questions was cancelled..." }]`
- Line 265: `content: [{ type: "text", text: formatForLLM(result) }]`

TypeScript widens `"text"` to `string` here, so the inferred union return type of `execute` contains a member with `content: { type: string; text: string }[]`. This doesn't satisfy `AgentToolResult<unknown>` which requires `content: (TextContent | ImageContent)[]` where `TextContent.type` is `"text"` (literal).

Other return sites either use `as const` (line 244) or have an explicit return type annotation (`errorResult` at line 120). Only lines 259 and 265 are missing `as const`.

**Fix:** Add `as const` to both lines:
```typescript
// Line 259
content: [{ type: "text" as const, text: "ask_user_questions was cancelled before receiving a response" }],
// Line 265
content: [{ type: "text" as const, text: formatForLLM(result) }],
```

**Affected file:** `src/resources/extensions/ask-user-questions.ts` (lines 259 and 265)

## Build Pipeline Context

- `npm run build` calls `copy-resources.cjs` which invokes `tsc --project tsconfig.resources.json`
- `tsconfig.resources.json` extends `tsconfig.json` and includes `src/resources/extensions`
- `tsconfig.json` itself excludes `src/resources` — so main `tsc --noEmit` passes clean
- The `typecheck:extensions` npm script uses `tsconfig.extensions.json` which has the same include set — it produces the same 2 errors
- Both errors appear in `tsconfig.resources.json` and `tsconfig.extensions.json` but NOT in `tsconfig.json`

## Implementation Landscape

### File 1: `src/resources/extensions/hx/triage-ui.ts`
- Lines 31–53: `CLASSIFICATION_LABELS` object — add `"stop"` and `"backtrack"` entries
- Lines 54–56: `ALL_CLASSIFICATIONS` array — append `"stop"`, `"backtrack"`
- No logic changes needed; auto-confirm block at line 87 stays unchanged (stop/backtrack require user confirmation)

### File 2: `src/resources/extensions/ask-user-questions.ts`
- Line 259: add `as const` after `"text"`
- Line 265: add `as const` after `"text"`
- Two character-level edits, no logic changes

## Verification Commands

```bash
# Confirm both errors fixed
npx tsc --project tsconfig.resources.json --noEmit
npx tsc --project tsconfig.extensions.json --noEmit

# Confirm main tsc still clean
npx tsc --noEmit

# Confirm full build succeeds
npm run build 2>&1 | tail -20

# Confirm tests still pass
npm run test:unit -- --reporter=dot 2>&1 | tail -5
```

Expected: all exit 0, 4298/0/5 test result unchanged.

## RFIX Slice Goal Recap

The roadmap says: "npm run build exits 0; tsconfig.resources.json compilation clean; R011/R012/R013/R015/R016 moved to Validated in REQUIREMENTS.md"

The R011–R016 requirement validation updates require reviewing S01–S05 summaries to confirm they were implemented and writing validation evidence to REQUIREMENTS.md. This is a separate task from the two build errors.

## Recommendation

Two tasks:

**T01 — Fix triage-ui.ts + ask-user-questions.ts build errors**  
Surgical edits. 5 line changes across 2 files. Verify with `npx tsc --project tsconfig.resources.json --noEmit` and `npm run build`.

**T02 — Validate R011–R016 in REQUIREMENTS.md**  
Read S01–S05 summaries, confirm each requirement is delivered, update REQUIREMENTS.md status from Active → Validated with evidence. No code changes.
