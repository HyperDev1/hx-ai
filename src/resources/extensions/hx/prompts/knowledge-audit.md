You are auditing a project's KNOWLEDGE.md for entries that are too weak to reliably guide an AI agent.

## KNOWLEDGE.md Content

{{knowledgeContent}}

## Your Task

Analyze every entry in the Rules, Patterns, and Lessons Learned tables.
For each entry, determine if it has one or more of these weaknesses:

- **negative-only** — Rule says "don't do X" but gives no alternative ("instead do Y")
- **vague** — No file path, module, scope, or concrete example to anchor the entry
- **no-signal** — No way for an agent to detect a violation (no file name, pattern, error message, or observable symptom to look for)
- **missing-fix** — Lesson has no actionable fix path or prevention step
- **ambiguous** — Unclear when or where the entry applies

Strong entries (specific, positive, with alternatives and signals) should be omitted from results.

## Output Format

Respond with a numbered list of findings. For each weak entry:

```
[N] <ID> (<type>) — <weaknesses, comma-separated>
    Entry: "<current entry text (truncated to 80 chars if long)>"
    Problem: <one sentence explaining the specific weakness>
    Direction: <one sentence suggesting how to strengthen it>
```

After the list, add a one-line summary:
```
Found N weak entries out of M total. Run /hx knowledge improve to fix them.
```

If all entries are strong, say:
```
All knowledge entries look strong. No improvements needed.
```

## Rules

- Be terse. One-line problem, one-line direction per finding.
- Do not rewrite entries here — that is for `/hx knowledge improve`.
- Do not invent weaknesses. If an entry is genuinely clear and actionable, skip it.
- Negative-only is the most common and most impactful weakness — prioritize it.
