# Plan: Knowledge Audit & Improve Commands

## Tasks

### T1: Prompt files — `knowledge-audit.md` and `knowledge-improve.md`
**Files:** `src/resources/extensions/hx/prompts/knowledge-audit.md`, `src/resources/extensions/hx/prompts/knowledge-improve.md`

Audit prompt:
- Receives full KNOWLEDGE.md content
- Analyzes every entry across Rules / Patterns / Lessons Learned tables
- Returns a structured JSON findings list: `[{ id, type, text, weaknesses: string[], suggestion: string }]`
- Weakness categories: `negative-only` (rule says don't, no alternative), `vague` (no file/scope/example),
  `no-signal` (no way for agent to detect violation), `missing-fix` (lesson has no actionable fix path),
  `ambiguous` (unclear when it applies)
- Entries that are already strong → omitted from results

Improve prompt:
- Receives a single entry (id, type, current text, weakness list, suggestion)
- Rewrites it in strengthened format:
  - Rule: what NOT to do + Instead (specific, file/pattern-level) + Why + Signal
  - Pattern: description + Where used + Example + Anti-example
  - Lesson: what happened + Root cause + Fix + How to prevent
- Returns the rewritten entry text (same table row format as KNOWLEDGE.md)
- Shows the rewrite clearly so the caller can present a diff

**Verify:** Prompt files exist and are valid markdown with correct `{{placeholder}}` syntax.

---

### T2: `handleKnowledgeAudit()` in commands-handlers.ts
**Files:** `src/resources/extensions/hx/commands-handlers.ts`

- Reads `.hx/KNOWLEDGE.md` via existing `loadFile` + `resolveHxRootFile`
- If not found → notify and return
- Loads `knowledge-audit` prompt with `{{ knowledgeContent }}` injected
- Dispatches to LLM via `pi.sendMessage` (same pattern as `handleKnowledge` no-type mode)
- Audit result is LLM output — user reads it in the chat stream
- No state stored (stateless per run)

**Verify:** `/hx knowledge audit` dispatches correctly, notify shown if no KNOWLEDGE.md.

---

### T3: `handleKnowledgeImprove()` in commands-handlers.ts
**Files:** `src/resources/extensions/hx/commands-handlers.ts`

- Reads `.hx/KNOWLEDGE.md`
- Re-runs audit inline (calls same LLM dispatch) — but in improve mode, we need structured output
  - Use a two-step flow: first send audit prompt asking for JSON output, then present results as multi-select
  - Since `pi.sendMessage` is fire-and-forget, use a simpler approach:
    agent reads KNOWLEDGE.md, sends improve prompt with the full content asking it to:
    1. Identify weak entries
    2. Present a numbered list
    3. Ask the user which numbers to improve
    4. Improve selected ones, show before/after
    5. Write each confirmed improvement via `/hx knowledge --raw`
- This is fully LLM-driven (same pattern as other complex handlers) — the prompt handles the interaction loop

**Verify:** `/hx knowledge improve` dispatches to LLM with KNOWLEDGE.md content injected.

---

### T4: Wire up in ops.ts and catalog.ts
**Files:** `src/resources/extensions/hx/commands/handlers/ops.ts`, `src/resources/extensions/hx/commands/catalog.ts`

ops.ts routing (before the generic `knowledge ` catch-all):
```
if (trimmed === "knowledge audit") { ... }
if (trimmed === "knowledge improve") { ... }
```

catalog.ts — add to `knowledge` subcommands:
```
{ cmd: "audit",   desc: "Audit KNOWLEDGE.md for weak or vague entries" },
{ cmd: "improve", desc: "Select and rewrite weak knowledge entries with AI" },
```

**Verify:** `tsc --noEmit` clean. `/hx help` shows audit and improve in knowledge subcommands.

---

## Verification
- `tsc --noEmit` exits 0
- `npm run build` exits 0
- `/hx knowledge audit` → LLM dispatches (or notify if no KNOWLEDGE.md)
- `/hx knowledge improve` → LLM dispatches (or notify if no KNOWLEDGE.md)
- `/hx help` → audit and improve listed under knowledge
