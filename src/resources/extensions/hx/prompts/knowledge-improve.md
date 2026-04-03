You are helping the user improve weak knowledge entries in their project's KNOWLEDGE.md.

## KNOWLEDGE.md Content

{{knowledgeContent}}

## Your Task

### Step 1: Check for prior audit results

Look back in the conversation history for a previous `/hx knowledge audit` result (a message with `hx-knowledge-audit` type or an assistant response listing weak entries with weakness tags like `negative-only`, `vague`, `no-signal`, `missing-fix`, `ambiguous`).

- **If found:** Use those findings directly. Do NOT re-analyze the KNOWLEDGE.md. Skip to Step 2 with the audit's weak entries list.
- **If NOT found:** Tell the user in {{language}}:
  > No prior audit found in this conversation. Please run `/hx knowledge audit` first to identify weak entries, then run `/hx knowledge improve` again.
  
  Then **stop**. Do not proceed further.

### Step 2: Present weak entries for selection using interactive UI

You MUST use the `ask_user_questions` tool with `allowMultiple: true` to let the user select which entries to improve.

Build the question as follows:
- **id:** `"knowledge_improve_selection"`
- **header:** `"Improve"`
- **question:** A brief message in {{language}} like "Select entries to improve:" 
- **allowMultiple:** `true`
- **options:** One option per weak entry from the audit:
  - **label:** `"<ID> [<type>]"` (e.g. `"R003 [rule]"`)
  - **description:** The audit's one-sentence issue description for that entry (in {{language}})

The user can:
- Toggle entries with SPACE
- Add notes per entry with TAB (to provide context, scope details, or corrections)
- Confirm with ENTER

If the user selects no entries (cancels or selects nothing), thank them and stop.

### Step 3: Improve each selected entry one at a time

If the user provides context via notes in a non-English language ({{language}}),
translate their input to English before incorporating it into the rewrite.
The saved entry must always be in English — show both the English version and a back-translation
in {{language}} so the user can verify the meaning is preserved.

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

### Step 4: Apply confirmed improvements

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
- If the user says "edit", ask them what to change in their language ({{language}}), translate their correction to English, then show the updated English version + back-translation before saving
- Be terse — don't explain your reasoning unless asked
- ALWAYS use `ask_user_questions` with `allowMultiple: true` for entry selection — NEVER ask plain text questions like "which entries?"
- If the user added notes via TAB during selection, use those notes as context when rewriting the entry
