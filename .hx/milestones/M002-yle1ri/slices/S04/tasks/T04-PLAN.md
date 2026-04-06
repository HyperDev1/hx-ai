---
estimated_steps: 18
estimated_files: 14
skills_used: []
---

# T04: Prompt explosion prevention, non-TTY guard, image overflow recovery (Band C1–C4)

Apply upstream Band C context/prompt management fixes C1–C4:

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

## Inputs

- ``src/resources/extensions/hx/prompt-loader.ts` — replaceAll at line 137`
- ``src/resources/extensions/hx/prompts/plan-slice.md` — 89 lines, autonomous execution section at line 85`
- ``src/resources/extensions/hx/prompts/execute-task.md` — 82 lines`
- ``src/resources/extensions/hx/prompts/complete-slice.md` — 50 lines`
- ``packages/pi-tui/src/terminal.ts` — Terminal interface at line 11`
- ``packages/pi-tui/src/tui.ts` — start() at line 400, requestRender() at line 460`
- ``packages/pi-coding-agent/src/modes/rpc/remote-terminal.ts` — RemoteTerminal class`
- ``packages/pi-coding-agent/src/core/agent-session.ts` — main agent loop error handling`

## Expected Output

- ``src/resources/extensions/hx/prompt-loader.ts` — split/join replaces replaceAll`
- ``src/resources/extensions/hx/tests/prompt-loader-replacement.test.ts` — NEW: ~178 lines`
- ``src/resources/extensions/hx/prompts/plan-slice.md` — secure_env_collect prohibition + reasonable assumptions`
- ``src/resources/extensions/hx/prompts/execute-task.md` — same additions`
- ``src/resources/extensions/hx/prompts/complete-slice.md` — same additions`
- ``src/resources/extensions/hx/tests/auto-mode-interactive-guard.test.ts` — NEW: ~71 lines`
- ``packages/pi-tui/src/terminal.ts` — isTTY in Terminal interface + ProcessTerminal impl`
- ``packages/pi-tui/src/tui.ts` — isTTY guards in start() and requestRender()`
- ``packages/pi-coding-agent/src/modes/rpc/remote-terminal.ts` — isTTY = true getter`
- ``src/tests/tui-non-tty-render-loop.test.ts` — NEW: ~143 lines`
- ``packages/pi-coding-agent/src/core/image-overflow-recovery.ts` — NEW: ~118 lines`
- ``packages/pi-coding-agent/src/core/image-overflow-recovery.test.ts` — NEW: ~228 lines`
- ``packages/pi-coding-agent/src/core/agent-session.ts` — image overflow detection + recovery + event emit`
- ``packages/pi-coding-agent/src/modes/interactive/controllers/chat-controller.ts` — image_overflow_recovery handler`

## Verification

npx tsc --noEmit && node --test dist-test/src/resources/extensions/hx/tests/prompt-loader-replacement.test.js && node --test dist-test/src/resources/extensions/hx/tests/auto-mode-interactive-guard.test.js && node --test dist-test/src/tests/tui-non-tty-render-loop.test.js && node --test dist-test/packages/pi-coding-agent/src/core/image-overflow-recovery.test.js
