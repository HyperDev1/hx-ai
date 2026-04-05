---
name: btw
description: Capture a quick note, observation, or reminder into .hx/CAPTURES.md. Use when you want to record something for later without interrupting the current flow — bugs noticed but not fixed, ideas worth revisiting, observations about the codebase.
---

<objective>
Append a timestamped capture entry to `.hx/CAPTURES.md` in the current project. A capture is a short note — an observation, a reminder, a found-but-not-fixed issue, or an idea to revisit. It does not trigger any action; it just records something worth keeping.
</objective>

<arguments>
Everything after `/btw` is the note content. No flags.

Examples:
- `/btw The retry logic in worker.ts doesn't handle ETIMEDOUT`
- `/btw Consider caching the manifest parse result — it's called on every keystroke`
- `/btw TODO: Add integration test for the cancel flow`
</arguments>

<steps>

1. **Extract the note text** from the user's input (everything after `/btw `). If nothing follows `/btw`, prompt: "What do you want to capture?"

2. **Resolve the captures file path**: `.hx/CAPTURES.md` relative to the current working directory. If `.hx/` doesn't exist, note that the project isn't initialised and abort gracefully.

3. **Append the entry** to `CAPTURES.md`. Format:

```markdown
## YYYY-MM-DD — <note text>

Captured at HH:MM.
```

   Use the current local date and time. If `CAPTURES.md` doesn't exist yet, create it with a header first:

```markdown
# Captures

Append-only log of observations, reminders, and ideas captured during work.

---

```

4. **Confirm** with a single line: `Captured: <note text>`

Do not read the rest of CAPTURES.md. Do not summarise prior entries. Do not take any action based on the note content — just record and confirm.

</steps>

<constraints>
- Append only — never rewrite or reformat existing entries.
- No interpretation — record exactly what the user said, word for word.
- No follow-up questions unless the note is completely empty.
- Confirmation is one line maximum.
</constraints>
