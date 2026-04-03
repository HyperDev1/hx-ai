# Knowledge Audit & Improve Commands

## Problem

Agents ignore KNOWLEDGE.md rules during task execution — especially negative rules ("don't use X").
Root cause: rules are stored as plain text with no actionable alternatives, no signals, no enforcement hooks.
A rule like "don't use bruin tables" has no "instead do this", so the agent defaults to what's already in the codebase.

## What We're Building

Two new subcommands under `/hx knowledge`:

### `/hx knowledge audit`
- Reads the project's KNOWLEDGE.md
- Identifies weak entries: negative-only rules, vague patterns, lessons without fix paths
- Outputs a numbered list of findings (no edits made)
- Each finding includes: entry reference, weakness type, suggested improvement direction

### `/hx knowledge improve`
- Reads the audit findings (or re-runs audit internally)
- Presents a multi-select list to the user: which findings to improve
- For each selected finding, dispatches to LLM to rewrite the entry in strengthened format:
  - **Rule**: what NOT to do + **Instead**: what to do (specific, file/pattern level) + **Why** + **Signal** (how agent detects a violation)
  - **Pattern**: where used + example + anti-example
  - **Lesson**: root cause + fix + how to prevent recurrence
- Shows before/after diff for each, asks for confirmation before writing
- Overwrites the entry in KNOWLEDGE.md

## Key Decisions

- Audit is read-only — no edits, just findings
- Improve is interactive — user selects which findings to act on
- LLM rewrites one entry at a time, shows diff, user confirms each
- Strengthened format is additive (same KNOWLEDGE.md structure, richer content) — no schema change
- Both commands work on the project-level KNOWLEDGE.md (process.cwd())

## Scope Boundaries

**In scope:**
- `handleKnowledgeAudit()` function in commands-handlers.ts
- `handleKnowledgeImprove()` function in commands-handlers.ts
- New prompt files: `knowledge-audit.md`, `knowledge-improve.md`
- Wiring in commands/handlers/ops.ts and catalog.ts

**Out of scope:**
- Automatic enforcement (lint rules, CI hooks)
- KNOWLEDGE.md schema changes
- Global (~/.hx) knowledge audit
- Audit persistence / caching between runs
