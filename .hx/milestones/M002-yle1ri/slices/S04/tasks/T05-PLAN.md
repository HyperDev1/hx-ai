---
estimated_steps: 17
estimated_files: 12
skills_used: []
---

# T05: pty-chat awaiting-input, workspace store trim, notifications project name, rethink commit instruction (Band C5–C7)

Apply upstream Band C5–C7 context management fixes.

**C5 (#3092)** — pty-chat-parser awaitingInput:
- `web/lib/pty-chat-parser.ts`: Add `_awaitingInput: boolean = false` private field to `PtyChatParser` class. Add `isAwaitingInput(): boolean` public method. Set `_awaitingInput = true` when a prompt line is detected (in the prompt detection path). Reset `_awaitingInput = false` when assistant content starts flowing. Widen the `>` prompt regex in PROMPT_MARKERS (currently `/^>\s+/`) to also match `>` with no trailing space: `/^>\s*/`. Add post-prompt user classification: after a prompt marker line, subsequent lines should be classified as user role.
- `web/lib/hx-workspace-store.tsx`: In the transcript overflow handler at line ~5085, also trim `chatUserMessages` by the same overflow amount: `chatUserMessages: overflow > 0 ? this.state.chatUserMessages.slice(overflow) : this.state.chatUserMessages`.
- `web/components/hx/chat-mode.tsx`: Add a visual indicator when `isAwaitingInput()` is true — show a "Ready for your input" badge/indicator in the chat UI near the input area.
- `src/tests/pty-chat-parser.test.ts`: Add 2 new test cases: (1) `isAwaitingInput()` returns true after a `❯ ` prompt line is fed to parser; (2) `isAwaitingInput()` returns false before any prompt line, resets after content.

IMPORTANT: `pty-chat-parser.ts` already has HX naming in all comments (`HX's shared UI`, `HX prompt markers`, `hx\s+v[\d.]+`). Do NOT change these to GSD — keep all existing HX naming.

**C6 (#3072)** — Notifications project name:
- `src/resources/extensions/hx/notifications.ts`: Add optional `projectName?: string` parameter to `sendDesktopNotification()`. Add `formatNotificationTitle(projectName?: string): string` function that returns `"HX — " + projectName` if projectName is provided, else `"HX"`.
- `src/resources/extensions/hx/auto/loop-deps.ts`: Update `sendDesktopNotification` signature in the `LoopDeps` interface to include optional `projectName?: string` parameter.
- `src/resources/extensions/hx/auto/phases.ts`: At the 5 `sendDesktopNotification("HX", ...)` call sites (lines 228, 386, 414, 490, 512 — plus any budget/completion calls), replace the hardcoded `"HX"` title with `formatNotificationTitle(basename(s.originalBasePath || s.basePath))` or the equivalent using the already-available `basename` import (line 71 confirms it is imported). Import `formatNotificationTitle` from notifications.ts.
- `src/resources/extensions/hx/tests/notifications.test.ts`: Add tests for `formatNotificationTitle`: (a) no projectName → returns `"HX"`, (b) projectName `"my-project"` → returns `"HX — my-project"`, (c) empty string → returns `"HX"`.

**C7 (#3059)** — Rethink commit instruction:
- `src/resources/extensions/hx/gitignore.ts`: Add `isHxGitignored(basePath: string): Promise<{ gitignored: boolean; commitInstruction: string }>` function that runs `git check-ignore -q .hx/` (using `execFileSync`) and returns `{ gitignored: true, commitInstruction: 'Do not commit — .hx/ planning docs are managed externally and not tracked in git.' }` if exit code 0, else `{ gitignored: false, commitInstruction: 'After changes, run git add .hx/ && git commit -m "docs(hx): rethink milestone plan" to persist.' }`.
- `src/resources/extensions/hx/rethink.ts`: Import `isHxGitignored`. Call it before `loadPrompt`, passing its `commitInstruction` result to the prompt template variables.
- `src/resources/extensions/hx/prompts/rethink.md`: Replace the hardcoded `git add .hx/ && git commit -m ...` instruction at line 83 with the template variable `{{commitInstruction}}` so the dynamically determined instruction is injected.
- No separate integration test file needed (the gitignore.ts change is simple enough for a unit test). Create `src/resources/extensions/hx/tests/integration/gitignore-staging-2570.test.ts` (~40 lines) testing: `isHxGitignored` returns `{ gitignored: false, ... }` in a temp dir with no .gitignore, and returns `{ gitignored: true, ... }` in a temp dir where `.hx/` is gitignored.

## Inputs

- ``web/lib/pty-chat-parser.ts` — 779 lines, PROMPT_MARKERS at line ~116, existing HX naming in all comments`
- ``web/lib/hx-workspace-store.tsx` — overflow handler at line 5085`
- ``web/components/hx/chat-mode.tsx` — 2324 lines`
- ``src/tests/pty-chat-parser.test.ts` — 21 lines, 1 existing test`
- ``src/resources/extensions/hx/notifications.ts` — sendDesktopNotification signature`
- ``src/resources/extensions/hx/auto/loop-deps.ts` — sendDesktopNotification in LoopDeps interface at line 91`
- ``src/resources/extensions/hx/auto/phases.ts` — 5 sendDesktopNotification call sites with hardcoded 'HX'`
- ``src/resources/extensions/hx/tests/notifications.test.ts` — existing tests to extend`
- ``src/resources/extensions/hx/gitignore.ts` — existing gitignore bootstrap file`
- ``src/resources/extensions/hx/rethink.ts` — loadPrompt call`
- ``src/resources/extensions/hx/prompts/rethink.md` — line 83 hardcoded git add .hx/`

## Expected Output

- ``web/lib/pty-chat-parser.ts` — _awaitingInput field, isAwaitingInput() method, widened > regex`
- ``web/lib/hx-workspace-store.tsx` — chatUserMessages trimmed in overflow path`
- ``web/components/hx/chat-mode.tsx` — 'Ready for your input' indicator when isAwaitingInput()`
- ``src/tests/pty-chat-parser.test.ts` — 2 new awaitingInput test cases`
- ``src/resources/extensions/hx/notifications.ts` — projectName param + formatNotificationTitle()`
- ``src/resources/extensions/hx/auto/loop-deps.ts` — updated sendDesktopNotification signature`
- ``src/resources/extensions/hx/auto/phases.ts` — formatNotificationTitle() at 5+ call sites`
- ``src/resources/extensions/hx/tests/notifications.test.ts` — formatNotificationTitle tests`
- ``src/resources/extensions/hx/gitignore.ts` — isHxGitignored() function`
- ``src/resources/extensions/hx/rethink.ts` — commitInstruction passed to prompt`
- ``src/resources/extensions/hx/prompts/rethink.md` — {{commitInstruction}} template var`
- ``src/resources/extensions/hx/tests/integration/gitignore-staging-2570.test.ts` — NEW: ~40 lines`

## Verification

npx tsc --noEmit && node --test dist-test/src/tests/pty-chat-parser.test.js && node --test dist-test/src/resources/extensions/hx/tests/notifications.test.js
