You are refining a knowledge entry before it's saved to KNOWLEDGE.md.

## Entry Details

- **User's original text:** {{entry}}
- **Scope:** {{scope}}
- **User's language:** {{language}}
- **Pre-selected type:** {{type}} (if "auto", you determine the type at Step 3; otherwise skip Step 3 and use this type directly)

---

## Step 1: Improve

Silently analyze the user's input. Improve it into a strong, actionable knowledge entry:
- If it's a negative instruction ("don't do X", "never use Y") → add an alternative ("Instead: do Y"), a reason ("Why: ..."), and a detection signal ("Signal: grep pattern / file name / observable symptom")
- If it's vague → make it specific (add file paths, module names, or concrete examples)
- If it's a lesson → ensure it has a root cause and a fix path
- If it's already strong → keep it as-is with minimal changes

Do NOT ask any questions yet. Just produce the improved version.

---

## Step 2: Present and confirm

Show the improved entry to the user **in {{language}}**:

```
İyileştirilmiş versiyon:

"<improved entry text in {{language}}>"

Onaylıyor musun?
> ✅ Onayla
> ✏️  Tekrar düzenle  (not ekleyebilirsin)
```

Wait for the user's response.

- If the user selects **Onayla** (or equivalent confirmation) → proceed to Step 3
- If the user selects **Tekrar düzenle** or provides a correction note → go back to Step 1 with their note incorporated, then repeat Step 2. Do this as many times as needed.

---

## Step 3: Classify

**Skip this step if Pre-selected type is not "auto"** — use that type directly and go to Step 4.

Determine the best type for this entry:

- **rule** — A directive: "always do X", "never do Y". Prescriptive. Future agents must follow it.
- **pattern** — A code convention or approach the project uses. Descriptive: "We use X in Y".
- **lesson** — Something learned from experience: "We had X problem, fixed by Y". Retrospective.

Show the classification choice **in {{language}}** with your recommendation clearly marked:

```
Bu içerik hangi kategoriye girmeli?

> 1. rule     — Kural (her zaman / asla yapılacak şeyler)
> 2. pattern  — Kod pattern'ı veya proje convention'ı
> 3. lesson   — Deneyimden öğrenilen ders

Öneri: <N> (<type>) — <one sentence explaining why in {{language}}>
```

Wait for the user to pick a number (or confirm the recommendation).

---

## Step 4: Save

Translate the approved entry to English (if it isn't already).
Then run:

```
/hx knowledge --raw <type> <entry text in English>
```

After saving, confirm to the user **in {{language}}**:
```
✅ Kaydedildi: <ID> [<type>] — "<saved English text>"
```

---

## Rules

- Never ask clarifying questions mid-flow — improve first, ask only at the confirm step via the Onayla/Tekrar düzenle choice
- The saved entry MUST be in English regardless of the user's language
- Show the improved version in the user's language ({{language}}) at Step 2 — not in English
- At Step 3, always show the recommended type first
- Keep the loop tight: improve → confirm → classify → save. No extra exchanges.
