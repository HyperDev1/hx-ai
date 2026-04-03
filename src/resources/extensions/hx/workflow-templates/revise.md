# Revise Workflow

<template_meta>
name: revise
version: 1
requires_project: false
artifact_dir: .hx/workflows/revisions/
</template_meta>

<purpose>
Iteratively revise existing work based on user feedback. Designed for situations
where a feature, page, or component was built but doesn't meet expectations.
Supports multiple revision rounds with explicit scope protection to prevent
unintended changes to working parts of the codebase.
</purpose>

<phases>
1. assess    — Understand what exists and what the user wants changed
2. scope     — Define change boundaries and freeze list
3. plan      — Break revision into tasks
4. iterate   — Apply changes
5. review    — Present result, user decides: approve or another round
</phases>

<revision_state>
This workflow tracks revision rounds in STATE.json:
- currentRound: increments each time the user requests another round
- freezeList: files/components/behaviors that must not change
- changeList: files/components that are in scope for changes
- rounds[]: history of each round's feedback, changes, and verdict
</revision_state>

<process>

## Phase 1: Assess

**Goal:** Understand what exists and what needs to change.

1. **Identify the target:**
   - If the user references a previous workflow → read its artifact directory and summary
   - If the user describes files/pages/components → locate and read them
   - If a URL or visual target is mentioned → check in browser, take screenshots

2. **Gather feedback:**
   - What specifically doesn't meet expectations?
   - What does the user want it to look like / behave like instead?
   - Are there reference examples (URLs, screenshots, descriptions)?

3. **Assess current state:**
   - Read the relevant source files
   - If it's a UI change, view it in the browser and capture the current state
   - Note what's working well (these become freeze candidates)

4. **Produce:** Write `ASSESS.md` in the artifact directory with:
   - Current state description
   - User feedback summary
   - List of identified issues
   - If round > 1: what changed in previous rounds, what still needs work

5. **Gate:** Confirm understanding with user — "Here's what I understand needs to change. Correct?"

## Phase 2: Scope

**Goal:** Draw clear boundaries — what changes, what doesn't.

1. **Build the freeze list:**
   - Files, components, or behaviors that must NOT be modified
   - Explicitly ask: "Is there anything you want to make sure stays exactly as-is?"
   - Include things the user said are working well from the assess phase

2. **Build the change list:**
   - Files, components, or behaviors that ARE in scope for modification
   - Be specific: file paths, component names, CSS classes, behavior descriptions

3. **Produce:** Write `SCOPE.md` in the artifact directory with:
   ```
   ## Freeze List (do not touch)
   - path/to/file.tsx — reason
   - ComponentName — reason

   ## Change List (in scope)
   - path/to/target.tsx — what changes
   - path/to/styles.css — what changes

   ## Behavioral Constraints
   - Existing API contracts must be preserved
   - (any other constraints)
   ```

4. **Gate:** User must approve scope before planning begins. This is a hard gate — no skipping.

## Phase 3: Plan

**Goal:** Break the revision into clear, executable tasks.

1. **Create tasks** from the change list:
   - Each task should be independently verifiable
   - Each task must note which freeze list items are nearby (risk awareness)
   - Include specific verification steps per task

2. **Cross-reference freeze list:**
   - For each task, note if it touches files near frozen items
   - Add explicit "do not modify" reminders for adjacent frozen code

3. **Produce:** Write `PLAN.md` in the artifact directory with:
   - Numbered tasks with descriptions
   - File paths per task
   - Verification criteria per task
   - Freeze list cross-reference

4. **Gate:** Present plan to user for approval. Adjust if needed.

## Phase 4: Iterate

**Goal:** Execute the revision plan.

1. **Execute tasks in order:**
   - Before each file edit, check against freeze list
   - If a frozen file must be touched for the change to work, STOP and ask user
   - After each task, verify:
     a. The specific change works as intended
     b. No freeze list items were modified (git diff check)
     c. Related functionality still works

2. **Freeze list enforcement:**
   - After all tasks complete, run a final freeze list check:
     `git diff` on all frozen files — must show zero changes
   - If any frozen file was modified, revert those changes and fix the approach

3. **Commit:** Use message format: `revise(<scope>): <description>`

## Phase 5: Review

**Goal:** Present the result and get user verdict.

1. **Show the result:**
   - If UI changes: take screenshots, show before/after comparison
   - Show git diff summary of what changed
   - Confirm freeze list was respected (zero changes to frozen files)

2. **Freeze list verification:**
   - Run `git diff` on frozen files and report: "Freeze list verified — no frozen files were modified"
   - If any were modified, flag it immediately

3. **User verdict — two outcomes:**

   **✅ Approved:**
   - Write `SUMMARY.md` with:
     - What was revised and why
     - Total rounds taken
     - Files modified
     - Freeze list compliance confirmation
   - Workflow complete

   **🔄 Another round:**
   - Record the round in STATE.json:
     ```json
     {
       "round": N,
       "feedback": "user's new feedback",
       "changes": ["list of files changed this round"],
       "verdict": "another-round"
     }
     ```
   - Increment currentRound
   - Return to **Phase 1: Assess** with the new feedback
   - Previous round's scope may be adjusted — freeze/change lists can evolve

</process>
