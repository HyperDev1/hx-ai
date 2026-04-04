---
id: T04
parent: S04
milestone: M002-yle1ri
provides: []
requires: []
affects: []
key_files: ["src/resources/extensions/hx/prompt-loader.ts", "src/resources/extensions/hx/tests/prompt-loader-replacement.test.ts", "src/resources/extensions/hx/prompts/plan-slice.md", "src/resources/extensions/hx/prompts/execute-task.md", "src/resources/extensions/hx/prompts/complete-slice.md", "src/resources/extensions/hx/tests/auto-mode-interactive-guard.test.ts", "packages/pi-tui/src/terminal.ts", "packages/pi-tui/src/tui.ts", "packages/pi-coding-agent/src/modes/rpc/remote-terminal.ts", "src/tests/tui-non-tty-render-loop.test.ts", "packages/pi-coding-agent/src/core/image-overflow-recovery.ts", "packages/pi-coding-agent/src/core/image-overflow-recovery.test.ts", "packages/pi-coding-agent/src/core/agent-session.ts", "packages/pi-coding-agent/src/modes/interactive/controllers/chat-controller.ts"]
key_decisions: ["TUI non-TTY test uses source-file inspection + behavioral mock rather than importing TUI class directly, because worktree symlinks resolve to main repo dist", "image_overflow_recovery event added as new AgentSessionEvent type for UI status feedback"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "TypeScript compiles clean (npx tsc --noEmit). All 53 tests pass across 4 test suites: 12 prompt-loader-replacement tests, 9 auto-mode-interactive-guard tests, 9 tui-non-tty-render-loop tests, 23 image-overflow-recovery tests."
completed_at: 2026-04-04T15:03:21.244Z
blocker_discovered: false
---

# T04: Applied Band C1–C4 fixes: split/join prompt substitution, secure_env_collect auto-mode prohibition, isTTY non-TTY guard, and image overflow auto-recovery module with full test coverage (53 tests pass)

> Applied Band C1–C4 fixes: split/join prompt substitution, secure_env_collect auto-mode prohibition, isTTY non-TTY guard, and image overflow auto-recovery module with full test coverage (53 tests pass)

## What Happened
---
id: T04
parent: S04
milestone: M002-yle1ri
key_files:
  - src/resources/extensions/hx/prompt-loader.ts
  - src/resources/extensions/hx/tests/prompt-loader-replacement.test.ts
  - src/resources/extensions/hx/prompts/plan-slice.md
  - src/resources/extensions/hx/prompts/execute-task.md
  - src/resources/extensions/hx/prompts/complete-slice.md
  - src/resources/extensions/hx/tests/auto-mode-interactive-guard.test.ts
  - packages/pi-tui/src/terminal.ts
  - packages/pi-tui/src/tui.ts
  - packages/pi-coding-agent/src/modes/rpc/remote-terminal.ts
  - src/tests/tui-non-tty-render-loop.test.ts
  - packages/pi-coding-agent/src/core/image-overflow-recovery.ts
  - packages/pi-coding-agent/src/core/image-overflow-recovery.test.ts
  - packages/pi-coding-agent/src/core/agent-session.ts
  - packages/pi-coding-agent/src/modes/interactive/controllers/chat-controller.ts
key_decisions:
  - TUI non-TTY test uses source-file inspection + behavioral mock rather than importing TUI class directly, because worktree symlinks resolve to main repo dist
  - image_overflow_recovery event added as new AgentSessionEvent type for UI status feedback
duration: ""
verification_result: passed
completed_at: 2026-04-04T15:03:21.247Z
blocker_discovered: false
---

# T04: Applied Band C1–C4 fixes: split/join prompt substitution, secure_env_collect auto-mode prohibition, isTTY non-TTY guard, and image overflow auto-recovery module with full test coverage (53 tests pass)

**Applied Band C1–C4 fixes: split/join prompt substitution, secure_env_collect auto-mode prohibition, isTTY non-TTY guard, and image overflow auto-recovery module with full test coverage (53 tests pass)**

## What Happened

Implemented four upstream Band C context/prompt management fixes: C1 changed replaceAll to split/join in prompt-loader.ts to prevent $-pattern explosion; C2 added secure_env_collect prohibition and reasonable assumptions guidance to three auto-mode prompts; C3 added isTTY to Terminal interface with guards in TUI.start() and requestRender(); C4 created image-overflow-recovery module with detection, downsize, and event emission integrated into agent-session and chat-controller.

## Verification

TypeScript compiles clean (npx tsc --noEmit). All 53 tests pass across 4 test suites: 12 prompt-loader-replacement tests, 9 auto-mode-interactive-guard tests, 9 tui-non-tty-render-loop tests, 23 image-overflow-recovery tests.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx tsc --noEmit` | 0 | ✅ pass | 6200ms |
| 2 | `node --import ./scripts/dist-test-resolve.mjs --test dist-test/src/resources/extensions/hx/tests/prompt-loader-replacement.test.js` | 0 | ✅ pass | 300ms |
| 3 | `node --import ./scripts/dist-test-resolve.mjs --test dist-test/src/resources/extensions/hx/tests/auto-mode-interactive-guard.test.js` | 0 | ✅ pass | 300ms |
| 4 | `node --import ./scripts/dist-test-resolve.mjs --test dist-test/src/tests/tui-non-tty-render-loop.test.js` | 0 | ✅ pass | 300ms |
| 5 | `node --test packages/pi-coding-agent/dist/core/image-overflow-recovery.test.js` | 0 | ✅ pass | 200ms |


## Deviations

TUI non-TTY test uses source inspection + behavioral mock instead of TUI class import due to worktree symlink resolution. Used agent.replaceMessages() and agent.state.messages instead of plan's setMessages/getState per actual Agent API.

## Known Issues

None.

## Files Created/Modified

- `src/resources/extensions/hx/prompt-loader.ts`
- `src/resources/extensions/hx/tests/prompt-loader-replacement.test.ts`
- `src/resources/extensions/hx/prompts/plan-slice.md`
- `src/resources/extensions/hx/prompts/execute-task.md`
- `src/resources/extensions/hx/prompts/complete-slice.md`
- `src/resources/extensions/hx/tests/auto-mode-interactive-guard.test.ts`
- `packages/pi-tui/src/terminal.ts`
- `packages/pi-tui/src/tui.ts`
- `packages/pi-coding-agent/src/modes/rpc/remote-terminal.ts`
- `src/tests/tui-non-tty-render-loop.test.ts`
- `packages/pi-coding-agent/src/core/image-overflow-recovery.ts`
- `packages/pi-coding-agent/src/core/image-overflow-recovery.test.ts`
- `packages/pi-coding-agent/src/core/agent-session.ts`
- `packages/pi-coding-agent/src/modes/interactive/controllers/chat-controller.ts`


## Deviations
TUI non-TTY test uses source inspection + behavioral mock instead of TUI class import due to worktree symlink resolution. Used agent.replaceMessages() and agent.state.messages instead of plan's setMessages/getState per actual Agent API.

## Known Issues
None.
