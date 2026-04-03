# Summary: Knowledge Audit & Improve Commands

## What Was Built

Two new subcommands under `/hx knowledge`:

### `/hx knowledge audit`
Reads the project's KNOWLEDGE.md and dispatches to the LLM to identify weak entries.
The LLM analyzes every entry for five weakness types:
- **negative-only** — rule says don't, but no alternative given
- **vague** — no file, module, scope, or concrete example
- **no-signal** — agent can't detect a violation
- **missing-fix** — lesson has no actionable fix path
- **ambiguous** — unclear when/where it applies

Output is a numbered findings list in the chat stream. Read-only — no edits.

### `/hx knowledge improve`
Reads KNOWLEDGE.md, identifies weak entries, presents a numbered multi-select list to the user.
User picks which entries to improve (e.g. "1,3" or "all").
LLM rewrites selected entries one at a time in a strengthened format:
- **Rule**: what NOT to do + Instead + Why + Signal
- **Pattern**: description + Where + Example + Anti-example
- **Lesson**: What happened + Root cause + Fix + Prevention

Shows before/after diff for each, asks for confirmation. Applies via `/hx knowledge --raw`.

## Files Changed

| File | Change |
|------|--------|
| `src/resources/extensions/hx/prompts/knowledge-audit.md` | New — audit prompt |
| `src/resources/extensions/hx/prompts/knowledge-improve.md` | New — improve prompt with interactive loop |
| `src/resources/extensions/hx/commands-handlers.ts` | Added `handleKnowledgeAudit()` and `handleKnowledgeImprove()` |
| `src/resources/extensions/hx/commands/handlers/ops.ts` | Added routing for `knowledge audit` and `knowledge improve` |
| `src/resources/extensions/hx/commands/catalog.ts` | Added audit and improve to knowledge subcommands |

## How to Use

```
/hx knowledge audit      → lists weak entries, no edits
/hx knowledge improve    → interactive: select entries to strengthen
```

## Verification

- `tsc --noEmit` exits 0
- `npm run build` exits 0
- Routing wired before the generic `knowledge ` catch-all (exact match priority)
- Prompt placeholders: `{{knowledgeContent}}`, `{{language}}`
