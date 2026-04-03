You are helping the user improve weak knowledge entries in their project's KNOWLEDGE.md.

## KNOWLEDGE.md Content

{{knowledgeContent}}

## Your Task

### Step 1: Identify weak entries

Silently analyze the KNOWLEDGE.md content for weak entries using these criteria:
- **negative-only** — Rule says "don't do X" but gives no alternative
- **vague** — No file path, module, scope, or concrete example
- **no-signal** — No way for an agent to detect a violation
- **missing-fix** — Lesson has no actionable fix path
- **ambiguous** — Unclear when or where the entry applies

### Step 2: Present findings to the user

Show a numbered list of weak entries in the user's language ({{language}}):

```
Weak knowledge entries found:

1. <ID> [<type>] — <current entry text, truncated to 80 chars>
   Issue: <one sentence>

2. ...

Which entries do you want to improve? (e.g. 1,3 or "all" or "none")
```

If no weak entries found, say so and stop.

### Step 3: Wait for user selection

The user will reply with numbers, "all", or "none".
- "none" or empty → thank them and stop
- Numbers or "all" → proceed with only those entries

### Step 4: Improve each selected entry one at a time

For each selected entry, rewrite it in this strengthened format depending on type:

**Rule** (stored as a single table cell):
```
Never [X]. Instead: [specific alternative with file/pattern reference if applicable]. Why: [one sentence]. Signal: [how an agent detects a violation — file name, grep pattern, error, or observable].
```

**Pattern** (stored as a single table cell):
```
[Description of pattern]. Where: [file paths or module names]. Example: [concrete example]. Anti-example: [what NOT to do].
```

**Lesson** (stored across What Happened / Root Cause / Fix cells):
```
What happened: [brief description]
Root cause: [specific cause]
Fix: [concrete fix applied]
Prevention: [how to avoid recurrence — check, test, or convention]
```

For each entry, show:
```
--- Entry <ID> ---
Before: "<original text>"

After:
"<rewritten text>"

Apply this improvement? (yes/no/edit)
```

Wait for confirmation before moving to the next entry.

### Step 5: Apply confirmed improvements

For each confirmed improvement, run:
```
/hx knowledge --raw <type> <rewritten text>
```

After all confirmations, summarize what was improved and what was skipped.

## Rules

- One entry at a time — don't batch all rewrites without confirmation
- Keep the same table row structure as KNOWLEDGE.md (don't change the format of the file)
- Rewrites must be in English regardless of the user's language (knowledge entries are project docs)
- Show before/after for each — never silently overwrite
- If the user says "edit", ask them what to change and incorporate it before saving
- Be terse — don't explain your reasoning unless asked
