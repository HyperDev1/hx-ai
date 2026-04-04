# S04: TUI/UI, Error Handling & Context Management — UAT

**Milestone:** M002-yle1ri
**Written:** 2026-04-04T15:22:53.635Z

## UAT Type
UAT mode: artifact-driven

## Overview
S04 delivered 3 bands of upstream fixes: Band A (TUI/UI review), Band B (error handling/JSON repair), Band C (context/prompt management). All checks below verify the code changes exist and the test suites pass.

---

## Preconditions
- Working directory: `/Users/beratcan/Desktop/GithubProjects/hx-ai/.hx/worktrees/M002-yle1ri`
- TypeScript must compile clean: `npx tsc --noEmit` → exit 0
- `npm run test:compile` must succeed before running dist-test node commands
- No GSD references in any newly touched file: `grep -r 'gsd\|GSD' <new-files>` → 0 matches

---

## Test Cases

### TC-01: STREAM_RE catches all V8 JSON parse error variants
**Precondition:** `dist-test/` compiled  
**Command:** `node --import ./scripts/dist-test-resolve.mjs --test dist-test/src/resources/extensions/hx/tests/provider-errors.test.js`  
**Expected:** 49 pass, 0 fail  
**Verifies:** B1 — STREAM_RE broadened, check moved before network/server heuristics

### TC-02: STREAM_RE check position (before network/server checks)
**Command:** `grep -n 'STREAM_RE\|isNetworkError\|isServerError' src/resources/extensions/hx/error-classifier.ts | head -10`  
**Expected:** STREAM_RE test appears at a lower line number than any `isNetworkError`/`isServerError`/connection check call  
**Verifies:** B1 ordering fix

### TC-03: repairToolJson handles YAML bullet-list tool arguments
**Command:** `node --import ./scripts/dist-test-resolve.mjs --test dist-test/packages/pi-ai/src/utils/tests/repair-tool-json.test.js`  
**Expected:** 21 pass, 0 fail  
**Verifies:** B2 — YAML repair utility correctness

### TC-04: repairToolJson exported from pi-ai index
**Command:** `grep 'repairToolJson' packages/pi-ai/src/index.ts`  
**Expected:** at least one export line containing `repairToolJson`  
**Verifies:** B2 — public API availability

### TC-05: repairAndParseToolJson integrated into anthropic-shared.ts
**Command:** `grep 'repairAndParseToolJson' packages/pi-ai/src/providers/anthropic-shared.ts`  
**Expected:** at least one call site  
**Verifies:** B2 — integration into tool-call finalization

### TC-06: repairAndParseToolJson integrated into partial-builder.ts
**Command:** `grep 'repairAndParseToolJson\|repairToolJson' src/resources/extensions/claude-code-cli/partial-builder.ts`  
**Expected:** at least one reference  
**Verifies:** B2 — integration into streaming partial builder

### TC-07: Compaction chunked fallback tests pass
**Command:** `node --import ./scripts/dist-test-resolve.mjs --test dist-test/packages/pi-coding-agent/src/core/compaction/compaction.test.js`  
**Expected:** 15 pass, 0 fail  
**Verifies:** B3 — chunkMessages, singlePassSummary, overflow retry path

### TC-08: chunkMessages and singlePassSummary exported from compaction.ts
**Command:** `grep 'export.*chunkMessages\|export.*singlePassSummary' packages/pi-coding-agent/src/core/compaction/compaction.ts`  
**Expected:** both exports present  
**Verifies:** B3 — public API for per-chunk callers

### TC-09: CUSTOM_MESSAGE_PREFIX/MIDDLE/SUFFIX exported from messages.ts
**Command:** `grep 'export.*CUSTOM_MESSAGE_' packages/pi-coding-agent/src/core/messages.ts`  
**Expected:** 3 matches (PREFIX, MIDDLE, SUFFIX)  
**Verifies:** B4 — constants exported

### TC-10: Custom message wrapping tests pass
**Command:** `node --import ./scripts/dist-test-resolve.mjs --test dist-test/packages/pi-coding-agent/src/core/messages.test.js`  
**Expected:** 14 pass, 0 fail  
**Verifies:** B4 — custom messages wrapped correctly in LLM context

### TC-11: tool-execution.ts JSON tab-width is 3
**Command:** `grep 'JSON.stringify' packages/pi-coding-agent/src/modes/interactive/components/tool-execution.ts`  
**Expected:** contains `JSON.stringify(..., 3)` or similar with indent=3  
**Verifies:** A13 — tab-width fix

### TC-12: provider-manager single-press remove tests pass
**Command:** `node --import ./scripts/dist-test-resolve.mjs --test dist-test/src/tests/provider-manager-remove.test.js`  
**Expected:** 2 pass, 0 fail  
**Verifies:** A10 — confirmed single-press remove behavior

### TC-13: prompt-loader uses split().join() not replaceAll
**Command:** `grep 'split.*join\|replaceAll' src/resources/extensions/hx/prompt-loader.ts`  
**Expected:** `split` + `join` present; `replaceAll` absent (for the template substitution loop)  
**Verifies:** C1 — $ pattern explosion prevention

### TC-14: Prompt substitution tests pass
**Command:** `node --import ./scripts/dist-test-resolve.mjs --test dist-test/src/resources/extensions/hx/tests/prompt-loader-replacement.test.js`  
**Expected:** 12 pass, 0 fail  
**Verifies:** C1 — split/join handles $, $1, recursive {{var}} safely

### TC-15: Auto-mode prompts prohibit secure_env_collect
**Command:** `node --import ./scripts/dist-test-resolve.mjs --test dist-test/src/resources/extensions/hx/tests/auto-mode-interactive-guard.test.js`  
**Expected:** 9 pass, 0 fail  
**Verifies:** C2 — plan-slice, execute-task, complete-slice all contain ask_user_questions prohibition, secure_env_collect prohibition, and reasonable assumptions guidance

### TC-16: isTTY guard prevents render loop in non-TTY
**Command:** `node --import ./scripts/dist-test-resolve.mjs --test dist-test/src/tests/tui-non-tty-render-loop.test.js`  
**Expected:** 9 pass, 0 fail  
**Verifies:** C3 — TUI.start() and requestRender() respect isTTY

### TC-17: isTTY added to Terminal interface
**Command:** `grep 'isTTY' packages/pi-tui/src/terminal.ts`  
**Expected:** interface declaration and ProcessTerminal getter both present  
**Verifies:** C3 — Terminal abstraction extended

### TC-18: RemoteTerminal returns isTTY=true
**Command:** `grep 'isTTY' packages/pi-coding-agent/src/modes/rpc/remote-terminal.ts`  
**Expected:** `return true` in isTTY getter  
**Verifies:** C3 — remote terminal treated as TTY-like

### TC-19: image-overflow-recovery module exists with correct exports
**Command:** `grep 'export' packages/pi-coding-agent/src/core/image-overflow-recovery.ts | head -10`  
**Expected:** `isImageDimensionError`, `downsizeConversationImages`, `IMAGE_OVERFLOW_RECOVERY_EVENT` all exported  
**Verifies:** C4 — module structure

### TC-20: image overflow recovery tests pass
**Command:** `node --import ./scripts/dist-test-resolve.mjs --test dist-test/packages/pi-coding-agent/src/core/image-overflow-recovery.test.js`  
**Expected:** 23 pass, 0 fail  
**Verifies:** C4 — detection, downsize, event emission all correct

### TC-21: image_overflow_recovery event handled in chat-controller
**Command:** `grep 'image_overflow_recovery' packages/pi-coding-agent/src/modes/interactive/controllers/chat-controller.ts`  
**Expected:** event handler registration present  
**Verifies:** C4 — UI status feedback wired up

### TC-22: isAwaitingInput in PtyChatParser
**Command:** `node --import ./scripts/dist-test-resolve.mjs --test dist-test/src/tests/pty-chat-parser.test.js`  
**Expected:** 3 pass, 0 fail (including 2 new isAwaitingInput tests)  
**Verifies:** C5 — _awaitingInput flag, isAwaitingInput() method, widened prompt regex

### TC-23: chatUserMessages trimmed in workspace store overflow
**Command:** `grep 'chatUserMessages.*slice\|overflow.*chatUser' web/lib/hx-workspace-store.tsx`  
**Expected:** chatUserMessages slice expression present in overflow handler  
**Verifies:** C5 — symmetric transcript overflow trim

### TC-24: formatNotificationTitle with project name
**Command:** `node --import ./scripts/dist-test-resolve.mjs --test dist-test/src/resources/extensions/hx/tests/notifications.test.js`  
**Expected:** 9 pass, 0 fail (including 3 new formatNotificationTitle tests)  
**Verifies:** C6 — "HX — projectName" format, empty/missing → "HX"

### TC-25: phases.ts call sites use formatNotificationTitle
**Command:** `grep 'formatNotificationTitle\|basename' src/resources/extensions/hx/auto/phases.ts | head -15`  
**Expected:** formatNotificationTitle imported and used at sendDesktopNotification call sites with basename(...)  
**Verifies:** C6 — all 10 notification calls include project name

### TC-26: rethink.md uses {{commitInstruction}} template variable
**Command:** `grep 'commitInstruction' src/resources/extensions/hx/prompts/rethink.md`  
**Expected:** `{{commitInstruction}}` present (not hardcoded git command)  
**Verifies:** C7 — dynamic commit instruction injected

### TC-27: isHxGitignored exported from gitignore.ts
**Command:** `grep 'export.*isHxGitignored' src/resources/extensions/hx/gitignore.ts`  
**Expected:** export present  
**Verifies:** C7 — gitignore utility available

### TC-28: TypeScript compiles clean across entire codebase
**Command:** `npx tsc --noEmit`  
**Expected:** exit 0, no output  
**Verifies:** No type regressions from any S04 change

### TC-29: No GSD references in new files
**Command:** `grep -r 'gsd\|GSD' packages/pi-ai/src/utils/repair-tool-json.ts packages/pi-coding-agent/src/core/image-overflow-recovery.ts packages/pi-coding-agent/src/core/compaction/compaction.test.ts packages/pi-coding-agent/src/core/messages.test.ts`  
**Expected:** 0 matches  
**Verifies:** R002 — naming adaptation preserved in all new files
