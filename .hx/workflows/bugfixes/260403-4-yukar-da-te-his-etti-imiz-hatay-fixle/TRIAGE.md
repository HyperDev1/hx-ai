# Triage: UAT pipeline fails for frontend projects

## Root Cause

Three interconnected issues in the UAT auto-mode pipeline:

1. **complete-slice.md** writes UAT files without specifying UAT mode. The `## UAT Type`
   section is either missing or has no mode value. `getUatType` defaults to `artifact-driven`,
   so browser-dependent test cases are run with grep/file checks — guaranteed to fail or
   produce meaningless PASS verdicts.

2. **run-uat.md** doesn't instruct the agent to start a dev server before browser checks.
   For `browser-executable` mode, the agent navigates to localhost:3000 but nothing is
   running → all checks FAIL → verdict gate blocks auto-mode progression.

3. **UAT template** (`templates/uat.md`) doesn't list `browser-executable` or
   `runtime-executable` as mode options, so agents don't know they exist.

## Affected Files

- `src/resources/extensions/hx/prompts/complete-slice.md` — step 8, no mode selection guidance
- `src/resources/extensions/hx/prompts/run-uat.md` — no dev server lifecycle for browser mode
- `src/resources/extensions/hx/templates/uat.md` — missing mode options

## Fix

1. Add `browser-executable` and `runtime-executable` to UAT template mode options
2. Add explicit UAT mode selection rules to complete-slice step 8
3. Add dev server lifecycle instructions to run-uat for browser-executable mode
