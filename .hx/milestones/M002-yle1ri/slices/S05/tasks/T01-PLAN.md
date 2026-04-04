---
estimated_steps: 15
estimated_files: 15
skills_used: []
---

# T01: Prompt text fixes: camelCase params, write-tool instructions, web_search migration, forensics dedup ordering

Apply 4 upstream prompt/agent text fixes and add/extend 5 test files.

**Steps:**

1. In `src/resources/extensions/hx/prompts/execute-task.md`: find the `hx_complete_task` call line (~line 73) that says `milestone_id, slice_id, task_id` and change to `milestoneId, sliceId, taskId`.

2. In `src/resources/extensions/hx/prompts/complete-slice.md`: (a) find the `hx_slice_complete`/`hx_complete_slice` call line (~line 42) that says `milestone_id, slice_id` and change to `milestoneId, sliceId`; (b) find step 13 (update PROJECT.md) and add explicit `write` tool instruction: "use the `write` tool with `path: ".hx/PROJECT.md"` and `content` containing the full updated document".

3. In `src/resources/extensions/hx/prompts/complete-milestone.md`: find step 11 (update PROJECT.md, ~line 59) and add explicit `write` tool instruction matching the pattern above.

4. In 4 discuss prompt files (`discuss-headless.md`, `discuss.md`, `guided-discuss-slice.md`, `guided-discuss-milestone.md`): replace every `web_search` with `search-the-web`.

5. In `src/resources/agents/researcher.md`: replace `web_search` with `search-the-web` in the frontmatter `tools:` line.

6. In `src/resources/extensions/hx/prompts/forensics.md`: move the `{{dedupSection}}` placeholder (currently after Investigation Protocol) to appear BEFORE `## Investigation Protocol`. The section should appear right after any preamble/intro but before the investigation steps.

7. In `src/resources/extensions/hx/forensics.ts`: find the `DEDUP_PROMPT_SECTION` constant and update its title/instructions to be a pre-investigation Decision Gate ("if already-fixed or open-issue match found, skip full investigation").

8. **Create** `src/resources/extensions/hx/tests/prompt-tool-names.test.ts`: scan all `.md` files in `prompts/` dir and all `.md` files in `agents/` dir for literal `web_search` string; assert none are found. Use `fs.readdirSync` + `fs.readFileSync` pattern. Paths: `promptsDir = join(__dirname, "..", "prompts")`, `agentsDir = join(__dirname, "..", "..", "..", "agents")`.

9. **Extend** `src/resources/extensions/hx/tests/prompt-contracts.test.ts`: add 2 tests — (a) execute-task.md uses `milestoneId, sliceId, taskId` (not snake_case); (b) complete-slice.md uses `milestoneId, sliceId` (not snake_case).

10. **Extend** `src/resources/extensions/hx/tests/complete-milestone.test.ts`: add 1 test asserting step 11 mentions the `write` tool and `PROJECT.md`.

11. **Extend** `src/resources/extensions/hx/tests/complete-slice.test.ts`: add 1 test asserting the PROJECT.md update step mentions the `write` tool.

12. **Extend** `src/resources/extensions/hx/tests/forensics-dedup.test.ts`: add 1 test asserting `{{dedupSection}}` appears at an index BEFORE `## Investigation Protocol` in forensics.md content.

**Verify:** Run `node --test dist-test/src/resources/extensions/hx/tests/prompt-tool-names.test.js` and the 4 extended test files after `node scripts/compile-tests.mjs`.

## Inputs

- ``src/resources/extensions/hx/prompts/execute-task.md``
- ``src/resources/extensions/hx/prompts/complete-slice.md``
- ``src/resources/extensions/hx/prompts/complete-milestone.md``
- ``src/resources/extensions/hx/prompts/discuss-headless.md``
- ``src/resources/extensions/hx/prompts/discuss.md``
- ``src/resources/extensions/hx/prompts/guided-discuss-slice.md``
- ``src/resources/extensions/hx/prompts/guided-discuss-milestone.md``
- ``src/resources/extensions/hx/prompts/forensics.md``
- ``src/resources/agents/researcher.md``
- ``src/resources/extensions/hx/forensics.ts``
- ``src/resources/extensions/hx/tests/prompt-contracts.test.ts``
- ``src/resources/extensions/hx/tests/complete-milestone.test.ts``
- ``src/resources/extensions/hx/tests/complete-slice.test.ts``
- ``src/resources/extensions/hx/tests/forensics-dedup.test.ts``

## Expected Output

- ``src/resources/extensions/hx/prompts/execute-task.md``
- ``src/resources/extensions/hx/prompts/complete-slice.md``
- ``src/resources/extensions/hx/prompts/complete-milestone.md``
- ``src/resources/extensions/hx/prompts/discuss-headless.md``
- ``src/resources/extensions/hx/prompts/discuss.md``
- ``src/resources/extensions/hx/prompts/guided-discuss-slice.md``
- ``src/resources/extensions/hx/prompts/guided-discuss-milestone.md``
- ``src/resources/extensions/hx/prompts/forensics.md``
- ``src/resources/agents/researcher.md``
- ``src/resources/extensions/hx/forensics.ts``
- ``src/resources/extensions/hx/tests/prompt-tool-names.test.ts``
- ``src/resources/extensions/hx/tests/prompt-contracts.test.ts``
- ``src/resources/extensions/hx/tests/complete-milestone.test.ts``
- ``src/resources/extensions/hx/tests/complete-slice.test.ts``
- ``src/resources/extensions/hx/tests/forensics-dedup.test.ts``

## Verification

cd /Users/beratcan/Desktop/GithubProjects/hx-ai/.hx/worktrees/M002-yle1ri && node scripts/compile-tests.mjs && node --test dist-test/src/resources/extensions/hx/tests/prompt-tool-names.test.js && node --test dist-test/src/resources/extensions/hx/tests/prompt-contracts.test.js && node --test dist-test/src/resources/extensions/hx/tests/complete-milestone.test.js && node --test dist-test/src/resources/extensions/hx/tests/complete-slice.test.js && node --test dist-test/src/resources/extensions/hx/tests/forensics-dedup.test.js
