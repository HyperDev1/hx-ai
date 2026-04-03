# Triage: `/hx knowledge improve` Re-analyzes & Uses Plain Text Selection

## Root Cause

Two independent issues in `handleKnowledgeImprove()` at `src/resources/extensions/hx/commands-handlers.ts`:

### Bug 1: Re-analysis instead of reusing audit results
`handleKnowledgeImprove()` sends the full `knowledge-improve` prompt which instructs the LLM to re-analyze KNOWLEDGE.md from scratch (Step 1: "Silently analyze the KNOWLEDGE.md content for weak entries"). The prompt has no mechanism to reference a prior audit's findings. The `knowledge-improve.md` prompt template should instruct the LLM to check conversation history for a prior audit and reuse those results, warning the user if no audit was found.

### Bug 2: Plain text selection instead of interactive UI
The `knowledge-improve.md` prompt template instructs the LLM to ask a plain text question: `Which entries do you want to improve? (e.g. 1,3 or "all" or "none")`. This should instead use the `ask_user_questions` tool with `allowMultiple: true` to show an interactive checkbox list where users can select entries and add notes via Tab.

## Affected Files
- `src/resources/extensions/hx/prompts/knowledge-improve.md` — prompt template (both bugs)

## Proposed Fix
Rewrite the `knowledge-improve.md` prompt to:
1. **Check conversation history** for a prior `hx-knowledge-audit` result. If found, use its findings directly. If not found, warn the user to run `/hx knowledge audit` first and stop.
2. **Use `ask_user_questions`** with `allowMultiple: true` to present weak entries as checkboxes. Each option gets the entry ID + truncated text as label, and the issue as description. Users can add notes per entry via Tab.
