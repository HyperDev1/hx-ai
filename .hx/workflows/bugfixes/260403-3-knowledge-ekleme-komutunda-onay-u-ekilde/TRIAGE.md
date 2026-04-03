# Triage: Knowledge confirmation uses plain text instead of ask_user_questions

## Root Cause

The `knowledge-refine.md` prompt template instructs the LLM to display confirmation
choices (Onayla / Tekrar düzenle) as plain markdown text in the conversation output,
rather than using the `ask_user_questions` tool. This means the user sees a formatted
text block instead of an interactive selection UI.

All other HX prompts that need user choices (discuss, queue, knowledge-improve,
guided-discuss-milestone, guided-discuss-slice, triage-captures) explicitly instruct
the LLM to use `ask_user_questions`. The knowledge-refine prompt was not updated to
follow this pattern.

## Reproduction Steps

1. Run `/hx knowledge <some text>` in an active session
2. LLM refines the text and shows a confirmation prompt
3. Confirmation appears as plain markdown text, not as interactive UI selection

## Affected Files

- `src/resources/extensions/hx/prompts/knowledge-refine.md` — Step 2 (confirm) and Step 3 (classify)

## Proposed Fix

Update `knowledge-refine.md` to instruct the LLM to use `ask_user_questions` at:
- **Step 2:** Confirmation (Onayla / Tekrar düzenle)
- **Step 3:** Type classification (rule / pattern / lesson)

This matches the pattern used by all other interactive HX prompts.
