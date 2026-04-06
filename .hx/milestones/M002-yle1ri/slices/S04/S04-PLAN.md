# S04: TUI/UI, Error Handling & Context Management

**Goal:** Port all TUI/UI rendering fixes (Band A — 28-file TUI review), error handling fixes (Band B — STREAM_RE, YAML repair, compaction overflow, custom message prefix), and context/prompt management fixes (Band C — prompt explosion, non-TTY CPU burn, image overflow, pty-chat awaiting-input, notifications project name, rethink commit instruction) from upstream gsd-2 v2.59.0 into hx-ai with GSD→HX naming adaptation.
**Demo:** After this: After this: TUI layout/rendering (28-file comprehensive review), JSON parse error handling, YAML repair, compaction overflow, and prompt explosion prevention fixes are applied. typecheck + tests pass.

## Tasks
- [x] **T01: Broadened STREAM_RE to catch all V8 JSON parse error variants with check moved before server/connection checks, and added repairToolJson YAML-to-JSON repair utility integrated across anthropic-shared.ts and partial-builder.ts with full test coverage.** — Apply upstream bugfix ports for Band B1 (broaden STREAM_RE in error-classifier.ts) and Band B2 (create repair-tool-json.ts utility, integrate into json-parse.ts + anthropic-shared.ts + partial-builder.ts, export from pi-ai/index.ts, add tests).

B1 (#3243): In `src/resources/extensions/hx/error-classifier.ts` line 51, replace the narrow `Expected double-quoted property name` literal with catch-all V8 patterns `Expected.*in JSON` and add `Unterminated.*in JSON`. Move the STREAM_RE check BEFORE the server/connection checks (currently it is checked after).

B2 (#3090): Create `packages/pi-ai/src/utils/repair-tool-json.ts` — a new utility that detects YAML bullet-list-style tool arguments (lines starting with `- key: value`) and converts them to a JSON array. Signature: `export function repairToolJson(raw: string): string | null` — returns the repaired JSON string on success, null if not a YAML list pattern. Integrate into `packages/pi-ai/src/utils/json-parse.ts` by adding a `repairAndParseToolJson(raw: string): unknown` export that calls repairToolJson first, then JSON.parse. Export repairToolJson from `packages/pi-ai/src/index.ts`. Integrate into `packages/pi-ai/src/providers/anthropic-shared.ts` at line 245 (before `block.arguments = JSON.parse(jsonStr)`) — call repairAndParseToolJson instead of bare JSON.parse. Integrate into `src/resources/extensions/claude-code-cli/partial-builder.ts` at the `block.arguments = JSON.parse(jsonStr)` call in the toolCall finalization block.

Name adaptation: use `@hyperlab/hx-agent-core`, `@hyperlab/hx-ai` etc. — no GSD references.

Test files to create:
1. `packages/pi-ai/src/utils/tests/repair-tool-json.test.ts` — ~100 lines testing: null return for plain JSON, YAML list detection, conversion correctness, edge cases (empty list, nested values)
2. New tests in `src/resources/extensions/hx/tests/provider-errors.test.ts` — 4 new test cases: `classifyError` returns `stream_error` for V8 messages `Expected double-quoted property name in JSON`, `Expected string in JSON at position 5`, `Unterminated string in JSON at position`, `Unexpected token } in JSON` — verify each hits stream_error not a different kind
  - Estimate: 1.5h
  - Files: src/resources/extensions/hx/error-classifier.ts, src/resources/extensions/hx/tests/provider-errors.test.ts, packages/pi-ai/src/utils/repair-tool-json.ts, packages/pi-ai/src/utils/json-parse.ts, packages/pi-ai/src/utils/tests/repair-tool-json.test.ts, packages/pi-ai/src/providers/anthropic-shared.ts, packages/pi-ai/src/index.ts, src/resources/extensions/claude-code-cli/partial-builder.ts
  - Verify: npx tsc --noEmit && node --test dist-test/src/resources/extensions/hx/tests/provider-errors.test.js && node --test dist-test/packages/pi-ai/src/utils/tests/repair-tool-json.test.js
- [x] **T02: Added chunkMessages/singlePassSummary helpers and overflow-chunked fallback to generateSummary, plus CUSTOM_MESSAGE_PREFIX/MIDDLE/SUFFIX constants wrapping the case-'custom' branch in convertToLlm — 15 compaction tests and 14 messages tests all pass.** — Apply upstream bugfix ports for Band B3 (compaction.ts chunked fallback) and Band B4 (messages.ts custom prefix constants).

B3 (#3038): In `packages/pi-coding-agent/src/core/compaction/compaction.ts`, add:
1. `chunkMessages(messages, maxChunkSize)` — splits a message array into chunks fitting within a token budget
2. `singlePassSummary(messages, completeFn)` — attempts a single summary pass on a message chunk
3. Refactor `generateSummary()` to accept an optional `_completeFn` injection parameter (for testing), and add a chunked fallback path: if the first summary attempt fails due to context overflow, split messages into chunks, summarize each chunk, then combine
4. The `_completeFn` parameter makes the function testable without hitting a real LLM

B4 (#3069): In `packages/pi-coding-agent/src/core/messages.ts`, add three new exported constants:
- `CUSTOM_MESSAGE_PREFIX` — a string that wraps custom user messages for LLM context (e.g. a system notification prefix string)
- `CUSTOM_MESSAGE_MIDDLE` — separator between prefix metadata and message content  
- `CUSTOM_MESSAGE_SUFFIX` — closing wrapper
Update the `case "custom"` block (currently at line ~162) to wrap custom message content with these prefix/suffix constants when constructing the `{ role: 'user', content: [...] }` object for LLM context.

Test files to create:
1. `packages/pi-coding-agent/src/core/compaction/compaction.test.ts` — NEW ~236 lines: test chunkMessages splits correctly, test singlePassSummary with mock completeFn, test generateSummary chunked fallback path (inject completeFn that simulates context-too-large on first attempt)
2. `packages/pi-coding-agent/src/core/messages.test.ts` — NEW ~114 lines: test that custom messages are wrapped with PREFIX/SUFFIX in LLM context output, test PREFIX/MIDDLE/SUFFIX are non-empty strings, test that other message types (branchSummary, compactionSummary) are unaffected

Import naming: use `@hyperlab/hx-agent-core`, `@hyperlab/hx-ai` (NOT gsd variants).
  - Estimate: 1.5h
  - Files: packages/pi-coding-agent/src/core/compaction/compaction.ts, packages/pi-coding-agent/src/core/compaction/compaction.test.ts, packages/pi-coding-agent/src/core/messages.ts, packages/pi-coding-agent/src/core/messages.test.ts
  - Verify: npx tsc --noEmit && node --test dist-test/packages/pi-coding-agent/src/core/compaction/compaction.test.js && node --test dist-test/packages/pi-coding-agent/src/core/messages.test.js
- [x] **T03: Applied Band A TUI review: generic tool JSON tab width set to 3; A1–A12/A14–A16 all confirmed already correct in hx-ai** — Apply the upstream TUI review commit (#3055) fixes to hx-ai interactive-mode files. The research identified 16 items (A1–A16); A4 (`/export startsWith`) is already done. Apply the remaining missing behavioral changes:

**A1** (`interactive-mode.ts`): Remove event queue serializer if present, remove `isKnownSlashCommand` usage, remove `_branchChangeUnsub`, remove `stopThemeWatcher`, remove redundant cleanup blocks in dispose method.

**A2** (`controllers/chat-controller.ts`): Remove `lastProcessedContentIndex` optimization if present. Note: `image_overflow_recovery` event handler is intentionally deferred — T04a adds it back. So only remove it here if it exists.

**A3** (`controllers/input-controller.ts`): Remove `isKnownSlashCommand` call, remove try/catch around `session.prompt()` if present.

**A5** (`components/armin.ts`): Replace `visibleWidth`-based centering with fixed-padding layout (the centering calculation using terminal column measurement should be replaced with a simpler fixed-offset approach).

**A6** (`components/config-selector.ts`): Simplify scroll indicator — remove selectable-item-only counting; count all items.

**A7** (`components/countdown-timer.ts`): Remove unused fields if present.

**A8** (`components/daxnuts.ts`): Apply small rendering fix.

**A9** (`components/oauth-selector.ts`): Apply minor cleanup.

**A10** (`components/provider-manager.ts`): The `hasAuth` field, `updateHints()`, and `confirmingRemove` double-press flow were NOT found in the current codebase — the single-press remove is already implemented. Verify provider-manager.ts already has correct single-press behavior (confirmed: line 168 does direct remove). Only apply any missed fixes; the test file `src/tests/provider-manager-remove.test.ts` already exists (134 lines) — verify its tests still pass.

**A11** (`components/scoped-models-selector.ts`): Ctrl+C clears search field text before cancelling (if not already done).

**A12** (`components/session-selector.ts`): Apply minor cleanup.

**A13** (`components/tool-execution.ts`): Change JSON tab width 4→3 if not already done; remove 20-line truncation of generic tool JSON output if present.

**A14** (`components/footer.ts`): Verify HX_SHOW_TOKEN_COST and HX_ENV already present (they are) — apply any missing group structure changes from upstream. hx-ai is ahead on HX naming; only apply behavioral differences.

**A15** (`src/welcome-screen.ts`): hx-ai is already HX-named and ahead of upstream — no changes needed.

**A16** test file `src/tests/provider-manager-remove.test.ts`: Already exists (134 lines) — verify tests cover single-press remove behavior.

**Process**: For each file, read the current content first, then apply only the missing behavioral hunks. Do NOT wholesale replace with upstream code — that would undo HX naming adaptations.

**Verification**: After applying each file, run `npx tsc --noEmit` to catch type errors immediately.
  - Estimate: 2h
  - Files: packages/pi-coding-agent/src/modes/interactive/interactive-mode.ts, packages/pi-coding-agent/src/modes/interactive/controllers/chat-controller.ts, packages/pi-coding-agent/src/modes/interactive/controllers/input-controller.ts, packages/pi-coding-agent/src/modes/interactive/components/armin.ts, packages/pi-coding-agent/src/modes/interactive/components/config-selector.ts, packages/pi-coding-agent/src/modes/interactive/components/countdown-timer.ts, packages/pi-coding-agent/src/modes/interactive/components/daxnuts.ts, packages/pi-coding-agent/src/modes/interactive/components/oauth-selector.ts, packages/pi-coding-agent/src/modes/interactive/components/provider-manager.ts, packages/pi-coding-agent/src/modes/interactive/components/scoped-models-selector.ts, packages/pi-coding-agent/src/modes/interactive/components/session-selector.ts, packages/pi-coding-agent/src/modes/interactive/components/tool-execution.ts, packages/pi-coding-agent/src/modes/interactive/components/footer.ts, src/tests/provider-manager-remove.test.ts
  - Verify: npx tsc --noEmit && node --test dist-test/src/tests/provider-manager-remove.test.js
- [x] **T04: Applied Band C1–C4 fixes: split/join prompt substitution, secure_env_collect auto-mode prohibition, isTTY non-TTY guard, and image overflow auto-recovery module with full test coverage (53 tests pass)** — Apply upstream Band C context/prompt management fixes C1–C4:

**C1 (#3232)** — `src/resources/extensions/hx/prompt-loader.ts` line 137: Replace `content.replaceAll(...)` with `content.split(key).join(value)` to prevent `$` in replacement values from being treated as a special replacement pattern by String.replace. This is the `{{var}}` → value substitution loop. Change from: `content = content.replaceAll(\`{{${key}}}\`, value)` to: `content = content.split(\`{{${key}}}\`).join(value)`. Create test file `src/resources/extensions/hx/tests/prompt-loader-replacement.test.ts` (~178 lines) with cases: normal replacement, replacement value containing `$&`, `$1`, `$$`, multi-occurrence replacement — all should produce verbatim output without pattern explosion.

**C2 (#3240)** — Update three prompt files to add the `secure_env_collect` prohibition and "make reasonable assumptions" guidance:
- `src/resources/extensions/hx/prompts/plan-slice.md`: In the autonomous execution section (line 85 has `Do not use ask_user_questions`), also add: "NEVER call `secure_env_collect` — env var collection requires human interaction. Make reasonable assumptions when information is missing."
- `src/resources/extensions/hx/prompts/execute-task.md`: Same addition in the autonomous execution guidance.
- `src/resources/extensions/hx/prompts/complete-slice.md`: Same addition.
Create test file `src/resources/extensions/hx/tests/auto-mode-interactive-guard.test.ts` (~71 lines) that reads each prompt file and asserts: (a) contains `ask_user_questions` prohibition, (b) contains `secure_env_collect` prohibition, (c) contains "reasonable assumptions" guidance.

**C3 (#3263)** — Non-TTY isTTY guard:
- `packages/pi-tui/src/terminal.ts`: Add `isTTY: boolean` to the `Terminal` interface (after the existing `kittyProtocolActive` getter). In `ProcessTerminal`, add `get isTTY(): boolean { return process.stdout.isTTY ?? false }`.
- `packages/pi-tui/src/tui.ts`: In `start()` method (line 400), add an early return if `!this.terminal.isTTY` to skip starting the render loop. In `requestRender()` (line 460), add guard: `if (!this.terminal.isTTY) return;` before the render scheduling logic.
- `packages/pi-coding-agent/src/modes/rpc/remote-terminal.ts`: Add `get isTTY(): boolean { return true }` — remote terminal is always TTY-like.
Create test file `src/tests/tui-non-tty-render-loop.test.ts` (~143 lines) testing: when terminal.isTTY is false, TUI.start() does not schedule renders; when true, it does.

**C4 (#3075)** — Image overflow auto-recovery:
- Create `packages/pi-coding-agent/src/core/image-overflow-recovery.ts` (NEW, ~118 lines): Export `isImageDimensionError(error: unknown): boolean` that detects when an API error is caused by image dimensions exceeding limits. Export `downsizeConversationImages(messages: Message[]): Message[]` that removes or downsizes image content blocks from conversation history. Export `IMAGE_OVERFLOW_RECOVERY_EVENT = 'image_overflow_recovery'` constant.
- `packages/pi-coding-agent/src/core/agent-session.ts`: Import the three exports from image-overflow-recovery.ts. In the error handling path of the main agent loop, detect `isImageDimensionError(error)` → call `downsizeConversationImages(this.messages)` to repair the conversation → emit `this.emit('image_overflow_recovery')` event → retry the request.
- `packages/pi-coding-agent/src/modes/interactive/controllers/chat-controller.ts`: Add `image_overflow_recovery` event handler that shows a status message "Resizing images to fit context window..." (or similar).
- Create test file `packages/pi-coding-agent/src/core/image-overflow-recovery.test.ts` (~228 lines): test isImageDimensionError detection, test downsizeConversationImages removes image blocks, test event emission on recovery path.

**Naming**: Use `@hyperlab/hx-coding-agent`, `@hyperlab/hx-agent-core`, `@hyperlab/hx-ai` — no GSD references. All new .ts files use `.js` extension in import paths.
  - Estimate: 2h
  - Files: src/resources/extensions/hx/prompt-loader.ts, src/resources/extensions/hx/tests/prompt-loader-replacement.test.ts, src/resources/extensions/hx/prompts/plan-slice.md, src/resources/extensions/hx/prompts/execute-task.md, src/resources/extensions/hx/prompts/complete-slice.md, src/resources/extensions/hx/tests/auto-mode-interactive-guard.test.ts, packages/pi-tui/src/terminal.ts, packages/pi-tui/src/tui.ts, packages/pi-coding-agent/src/modes/rpc/remote-terminal.ts, src/tests/tui-non-tty-render-loop.test.ts, packages/pi-coding-agent/src/core/image-overflow-recovery.ts, packages/pi-coding-agent/src/core/image-overflow-recovery.test.ts, packages/pi-coding-agent/src/core/agent-session.ts, packages/pi-coding-agent/src/modes/interactive/controllers/chat-controller.ts
  - Verify: npx tsc --noEmit && node --test dist-test/src/resources/extensions/hx/tests/prompt-loader-replacement.test.js && node --test dist-test/src/resources/extensions/hx/tests/auto-mode-interactive-guard.test.js && node --test dist-test/src/tests/tui-non-tty-render-loop.test.js && node --test dist-test/packages/pi-coding-agent/src/core/image-overflow-recovery.test.js
- [x] **T05: Applied Band C5–C7: PtyChatParser isAwaitingInput, workspace transcript overflow trim, formatNotificationTitle with project name, and dynamic rethink commit instruction** — Apply upstream Band C5–C7 context management fixes.

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
  - Estimate: 2h
  - Files: web/lib/pty-chat-parser.ts, web/lib/hx-workspace-store.tsx, web/components/hx/chat-mode.tsx, src/tests/pty-chat-parser.test.ts, src/resources/extensions/hx/notifications.ts, src/resources/extensions/hx/auto/loop-deps.ts, src/resources/extensions/hx/auto/phases.ts, src/resources/extensions/hx/tests/notifications.test.ts, src/resources/extensions/hx/gitignore.ts, src/resources/extensions/hx/rethink.ts, src/resources/extensions/hx/prompts/rethink.md, src/resources/extensions/hx/tests/integration/gitignore-staging-2570.test.ts
  - Verify: npx tsc --noEmit && node --test dist-test/src/tests/pty-chat-parser.test.js && node --test dist-test/src/resources/extensions/hx/tests/notifications.test.js
