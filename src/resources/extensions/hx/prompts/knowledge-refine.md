You are refining a knowledge entry before it's saved to KNOWLEDGE.md.

## Entry Details

- **Type:** {{type}} (if "auto", you must classify it — see below)
- **User's original text:** {{entry}}
- **Scope:** {{scope}}
- **User's language preference:** {{language}}

## Your Task

### Step 0: Classify the entry type (only when type is "auto")

If the type above is "auto", the user did not specify whether this is a rule, pattern, or lesson. Determine the best fit:

- **rule** — A directive: "always do X", "never do Y", "use X for Y". Rules are prescriptive.
- **pattern** — A code pattern or convention the project follows. Patterns are descriptive: "We use X pattern in Y".
- **lesson** — Something learned from experience: "We had X problem because Y, fixed by Z". Lessons are retrospective.

Choose the type based on the content. If ambiguous, briefly ask the user (one question, max). If the type is already specified (rule/pattern/lesson), skip this step.

### Step 1: Discuss briefly

Is this the right framing? Would a slightly different wording capture the intent better? Surface any ambiguity — but keep it short, this is a knowledge entry, not a design doc.

### Step 2: Translate to English

If the user wrote in a non-English language, translate the entry. Knowledge entries are project documentation and must be stored in English.

### Step 3: Refine the wording

Make it clear, concise, and actionable. A good knowledge entry is something a future agent can immediately act on without needing context.

### Step 4: Gather missing fields

Through the conversation (max 2 exchanges total across all steps):

- For **rules**:
  - If the rule is negative-only ("don't do X", "never use Y") — ask: "What should be done instead?" and "How would an agent detect a violation?" before saving. A rule without an alternative and a signal is too weak to enforce.
  - If it's already positive or has an alternative — ask "Why is this important?" only if not obvious.
  - Target format: `Never [X]. Instead: [specific alternative]. Why: [one sentence]. Signal: [grep pattern / file name / observable symptom].`

- For **patterns**: ask "Where in the codebase?" if not obvious

- For **lessons**: ask "What was the root cause?" and "What's the fix?"

### Step 5: Present the final version

Show it to the user in their language for confirmation. Show both the English version (what will be saved) and a translation back to their language so they can verify the meaning is preserved.

### Step 6: Save it

Run: `/hx knowledge --raw <type> <refined English text>`
- Replace `<type>` with rule, pattern, or lesson (the classified or user-specified type).
- If there are additional fields (why/where/rootCause/fix), the interactive prompts will be skipped in --raw mode, so include the essential context in the entry text itself.

## Rules

- Keep the discussion to 1-2 exchanges max. Don't over-discuss a knowledge entry.
- The saved entry MUST be in English regardless of what language the user wrote in.
- After saving, confirm to the user in their preferred language what was saved.
