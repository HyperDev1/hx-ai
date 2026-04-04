# S04 Research: TUI/UI, Error Handling & Context Management

**Gathered:** 2026-04-04  
**Slice scope:** R008 (TUI/UI), R009 (error handling/JSON parse)  
**Complexity:** Targeted — known TypeScript patterns, ~12 upstream commits to apply

---

## Summary

S04 covers 12 upstream commits grouped into three bands:
1. **TUI review (1 large merge commit)** — 28-file comprehensive TUI fix, already partially present in hx-ai as naming-adapted code, but missing the behavioral changes
2. **Error handling (4 commits)** — STREAM_RE broadening, YAML bullet repair, compaction overflow fallback, custom-message prefix  
3. **Context/prompt management (4+ commits)** — prompt explosion prevention, autonomous execution guard, non-TTY CPU burn, image overflow recovery, chat-mode fixes, notifications project name

All files already exist in hx-ai with correct HX naming. Work is applying missing behavioral hunks and adding new files with naming adaptation.

---

## Fix Inventory

### Band A: TUI Review (upstream commit 394cb1855 + 6a020432c)

| # | Upstream | hx-ai file | Status | Change type |
|---|----------|------------|--------|-------------|
| A1 | #3055 | `packages/pi-coding-agent/src/modes/interactive/interactive-mode.ts` | **MISSING** | Remove event queue serializer, remove `isKnownSlashCommand`, remove `_branchChangeUnsub`, remove `stopThemeWatcher`, remove 4 cleanup blocks in dispose |
| A2 | #3055 | `packages/pi-coding-agent/src/modes/interactive/controllers/chat-controller.ts` | **MISSING** | Remove `lastProcessedContentIndex` optimization, remove `image_overflow_recovery` event case |
| A3 | #3055 | `packages/pi-coding-agent/src/modes/interactive/controllers/input-controller.ts` | **MISSING** | Remove `isKnownSlashCommand` call, remove try/catch around `session.prompt()` |
| A4 | #3055 | `packages/pi-coding-agent/src/modes/interactive/slash-command-handlers.ts` | **MISSING** | Change `/export` check from `===` to `startsWith` |
| A5 | #3055 | `packages/pi-coding-agent/src/modes/interactive/components/armin.ts` | **MISSING** | Replace `visibleWidth`-based centering with fixed-padding layout |
| A6 | #3055 | `packages/pi-coding-agent/src/modes/interactive/components/config-selector.ts` | **MISSING** | Simplify scroll indicator (remove selectable-item-only count) |
| A7 | #3055 | `packages/pi-coding-agent/src/modes/interactive/components/countdown-timer.ts` | **MISSING** | Minor timer cleanup (remove unused fields) |
| A8 | #3055 | `packages/pi-coding-agent/src/modes/interactive/components/daxnuts.ts` | **MISSING** | Small rendering fix |
| A9 | #3055 | `packages/pi-coding-agent/src/modes/interactive/components/oauth-selector.ts` | **MISSING** | Minor cleanup |
| A10 | #3055 | `packages/pi-coding-agent/src/modes/interactive/components/provider-manager.ts` | **MISSING** | Remove `confirmingRemove` double-press flow; remove `hasAuth` guard; remove `updateHints()` method; simplify to single-press remove |
| A11 | #3055 | `packages/pi-coding-agent/src/modes/interactive/components/scoped-models-selector.ts` | **MISSING** | Ctrl+C clears search before cancelling |
| A12 | #3055 | `packages/pi-coding-agent/src/modes/interactive/components/session-selector.ts` | **MISSING** | Minor cleanup |
| A13 | #3055 | `packages/pi-coding-agent/src/modes/interactive/components/tool-execution.ts` | **MISSING** | Change tab width 4→3; remove 20-line truncation of generic tool JSON output |
| A14 | #3055 | `packages/pi-coding-agent/src/modes/interactive/components/footer.ts` | **PARTIAL** | hx-ai has HX_SHOW_TOKEN_COST and HX_ENV already; upstream has different group structure (same direction, different layout) |
| A15 | #3055 | `src/welcome-screen.ts` | **PARTIAL** | hx-ai is already HX-named; upstream still has GSD naming; hx-ai is ahead |
| A16 | #3055 | `src/tests/provider-manager-remove.test.ts` | **MISSING** | Tests for new single-press remove flow (30 lines added) |

**Important for A14/A15:** The `git diff upstream/main HEAD` shows these as additions because hx-ai created new files. The behavioral changes from the TUI review ARE still missing in hx-ai.

**Files from upstream TUI review NOT in hx-ai's namespace** (already handled by rename):
- `assistant-message.ts`, `bash-execution.ts`, `bordered-loader.ts`, `branch-summary-message.ts`, `compaction-summary-message.ts`, `custom-message.ts`, `diff.ts`, `dynamic-border.ts`, `extension-input.ts`, `extension-selector.ts`, `skill-invocation-message.ts`, `user-message-selector.ts`, `themes.ts` — these all had only import namespace changes (`@gsd/pi-tui` → `@hyperlab/hx-tui`) plus trivial 1-2 line tweaks. Need to verify each one has its behavioral hunk applied.

### Band B: Error Handling

| # | Upstream | hx-ai file | Status | Change |
|---|----------|------------|--------|--------|
| B1 | f6aeeabaf (#3243) | `src/resources/extensions/hx/error-classifier.ts` | **MISSING** | Broaden STREAM_RE: replace `Expected double-quoted property name` with `Expected.*in JSON` + add `Unterminated.*in JSON`; move stream check BEFORE server/connection checks |
| B1t | f6aeeabaf (#3243) | `src/resources/extensions/hx/tests/provider-errors.test.ts` | **MISSING** | 4 new test cases for V8 JSON parse variants |
| B2 | 3ba646754 (#3090) | `packages/pi-ai/src/utils/json-parse.ts` | **MISSING** | New `repairToolJson()` integration |
| B2a | 3ba646754 (#3090) | `packages/pi-ai/src/utils/repair-tool-json.ts` | **MISSING — NEW FILE** | New utility: detect YAML bullet lists, convert to JSON arrays |
| B2b | 3ba646754 (#3090) | `packages/pi-ai/src/utils/tests/repair-tool-json.test.ts` | **MISSING — NEW FILE** | 102-line test file |
| B2c | 3ba646754 (#3090) | `packages/pi-ai/src/providers/anthropic-shared.ts` | **MISSING** | Integrate repairToolJson before parse |
| B2d | 3ba646754 (#3090) | `src/resources/extensions/claude-code-cli/partial-builder.ts` | **MISSING** | Integrate repairToolJson in PartialMessageBuilder |
| B2e | 3ba646754 (#3090) | `packages/pi-ai/src/index.ts` | **MISSING** | Export repairToolJson |
| B2f | 3ba646754 (#3090) | `src/resources/extensions/claude-code-cli/tests/partial-builder.test.ts` | **MISSING** | New tests for YAML repair path |
| B3 | 3f506dbcd (#3038) | `packages/pi-coding-agent/src/core/compaction/compaction.ts` | **MISSING** | Add `chunkMessages()`, add `singlePassSummary()`, refactor `generateSummary()` for chunked fallback; add `_completeFn` injection param |
| B3t | 3f506dbcd (#3038) | `packages/pi-coding-agent/src/core/compaction/compaction.test.ts` | **MISSING — NEW FILE** | 236-line test file |
| B4 | df0dbf8ea (#3069) | `packages/pi-coding-agent/src/core/messages.ts` | **MISSING** | Add `CUSTOM_MESSAGE_PREFIX/MIDDLE/SUFFIX` constants; wrap custom messages in LLM context with system notification prefix |
| B4t | df0dbf8ea (#3069) | `packages/pi-coding-agent/src/core/messages.test.ts` | **MISSING — NEW FILE** | 114-line test file |

### Band C: Context/Prompt Management

| # | Upstream | hx-ai file | Status | Change |
|---|----------|------------|--------|--------|
| C1 | 47ce449c5 (#3232) | `src/resources/extensions/hx/prompt-loader.ts` | **MISSING** | Replace `replaceAll()` with `split/join` to prevent `$'` special replacement pattern explosion |
| C1t | 47ce449c5 (#3232) | `src/resources/extensions/hx/tests/prompt-loader-replacement.test.ts` | **MISSING — NEW FILE** | 178-line test file |
| C2 | e8f34cf80 (#3240) | `src/resources/extensions/hx/prompts/plan-slice.md` | **PARTIAL** | Existing guard omits `secure_env_collect` prohibition and "make reasonable assumptions" guidance |
| C2b | e8f34cf80 (#3240) | `src/resources/extensions/hx/prompts/execute-task.md` | **PARTIAL** | Same as C2 |
| C2c | e8f34cf80 (#3240) | `src/resources/extensions/hx/prompts/complete-slice.md` | **PARTIAL** | Same as C2 |
| C2t | e8f34cf80 (#3240) | `src/resources/extensions/hx/tests/auto-mode-interactive-guard.test.ts` | **MISSING — NEW FILE** | 71-line test file for the prompt guard |
| C3 | d92887461 (#3263) | `packages/pi-tui/src/tui.ts` | **MISSING** | Add `isTTY` guard to `TUI.start()` and `requestRender()` to skip render loop on non-TTY stdout |
| C3b | d92887461 (#3263) | `packages/pi-tui/src/terminal.ts` | **MISSING** | Add `isTTY` to Terminal interface + `ProcessTerminal.start()` |
| C3c | d92887461 (#3263) | `packages/pi-coding-agent/src/modes/rpc/remote-terminal.ts` | **MISSING** | `RemoteTerminal.isTTY = true` |
| C3t | d92887461 (#3263) | `src/tests/tui-non-tty-render-loop.test.ts` | **MISSING — NEW FILE** | 143-line test |
| C4 | 3876a89b7 (#3075) | `packages/pi-coding-agent/src/core/agent-session.ts` | **MISSING** | Image overflow auto-recovery: detect `isImageDimensionError`, `downsizeConversationImages`, emit `image_overflow_recovery` event |
| C4b | 3876a89b7 (#3075) | `packages/pi-coding-agent/src/core/image-overflow-recovery.ts` | **MISSING — NEW FILE** | 118 lines |
| C4t | 3876a89b7 (#3075) | `packages/pi-coding-agent/src/core/image-overflow-recovery.test.ts` | **MISSING — NEW FILE** | 228 lines |
| C4d | 3876a89b7 (#3075) | `packages/pi-coding-agent/src/modes/interactive/controllers/chat-controller.ts` | **MISSING** | Add `image_overflow_recovery` event handler (shows status message) |
| C5 | 2b9204764 (#3092) | `web/lib/pty-chat-parser.ts` | **MISSING** | Add `_awaitingInput` flag + `isAwaitingInput()` method; widen `>` and `$` prompt regexes; add post-prompt user classification |
| C5b | 2b9204764 (#3092) | `web/lib/hx-workspace-store.tsx` | **MISSING** | Trim `chatUserMessages` on overflow (same amount as transcript arrays) |
| C5c | 2b9204764 (#3092) | `web/components/hx/chat-mode.tsx` | **MISSING** | Add "Ready for your input" indicator when awaiting input |
| C5t | 2b9204764 (#3092) | `src/tests/pty-chat-parser.test.ts` | **MISSING** | 2 new test cases for awaitingInput behavior |
| C6 | 49d4a37bd (#3072) | `src/resources/extensions/hx/notifications.ts` | **MISSING** | Add `projectName?` param + `formatNotificationTitle()` function |
| C6b | 49d4a37bd (#3072) | `src/resources/extensions/hx/auto/loop-deps.ts` | **MISSING** | Add `projectName?` to `sendDesktopNotification` signature |
| C6c | 49d4a37bd (#3072) | `src/resources/extensions/hx/auto/phases.ts` | **MISSING** | Pass `basename(s.originalBasePath || s.basePath)` at 5 call sites |
| C6t | 49d4a37bd (#3072) | `src/resources/extensions/hx/tests/notifications.test.ts` | **MISSING** | Tests for `formatNotificationTitle` (currently absent from the file) |
| C7 | e8630cfd6 (#3059) | `src/resources/extensions/hx/gitignore.ts` | **MISSING** | Add `isHxGitignored()` using `git check-ignore` |
| C7b | e8630cfd6 (#3059) | `src/resources/extensions/hx/rethink.ts` | **MISSING** | Pass `commitInstruction` from `isHxGitignored()` to prompt |
| C7c | e8630cfd6 (#3059) | `src/resources/extensions/hx/prompts/rethink.md` | **MISSING** | Replace hardcoded `git add .hx/` with `{{commitInstruction}}` |
| C7t | e8630cfd6 (#3059) | Integration test | **MISSING — NEW FILE** | `src/resources/extensions/hx/tests/integration/gitignore-staging-2570.test.ts` |

---

## Key File Locations

### TUI Components (packages/pi-coding-agent/src/modes/interactive/)
- `components/` — 28 files, all present with `@hyperlab/hx-tui` naming
- `controllers/chat-controller.ts`, `controllers/input-controller.ts`
- `interactive-mode.ts`, `slash-command-handlers.ts`

### Error Handling
- `src/resources/extensions/hx/error-classifier.ts` — STREAM_RE line 51
- `packages/pi-ai/src/utils/json-parse.ts` — existing file, repairToolJson integrates here
- `packages/pi-ai/src/utils/repair-tool-json.ts` — NEW file
- `packages/pi-ai/src/providers/anthropic-shared.ts` — existing
- `src/resources/extensions/claude-code-cli/partial-builder.ts` — existing
- `packages/pi-coding-agent/src/core/compaction/compaction.ts` — existing, 754 lines
- `packages/pi-coding-agent/src/core/messages.ts` — existing, `case "custom"` at line ~162

### Context/Prompt
- `src/resources/extensions/hx/prompt-loader.ts` — `replaceAll` at line 137
- `src/resources/extensions/hx/prompts/plan-slice.md`, `execute-task.md`, `complete-slice.md`
- `packages/pi-tui/src/tui.ts`, `packages/pi-tui/src/terminal.ts`
- `packages/pi-coding-agent/src/modes/rpc/remote-terminal.ts`
- `packages/pi-coding-agent/src/core/agent-session.ts` — large file, image overflow recovery
- `packages/pi-coding-agent/src/core/image-overflow-recovery.ts` — NEW file
- `web/lib/pty-chat-parser.ts` — `_awaitingInput` additions
- `web/lib/hx-workspace-store.tsx` — `chatUserMessages` trim in overflow (~line 5085)
- `web/components/hx/chat-mode.tsx` — "Ready for your input" indicator
- `src/resources/extensions/hx/notifications.ts`
- `src/resources/extensions/hx/auto/loop-deps.ts`
- `src/resources/extensions/hx/auto/phases.ts`
- `src/resources/extensions/hx/gitignore.ts`
- `src/resources/extensions/hx/rethink.ts`
- `src/resources/extensions/hx/prompts/rethink.md`

---

## Naming Adaptation Rules for S04

All GSD→HX adaptations follow established patterns:

| Upstream (GSD) | hx-ai (HX) |
|----------------|-----------|
| `@gsd/pi-agent-core` | `@hyperlab/hx-agent-core` |
| `@gsd/pi-ai` | `@hyperlab/hx-ai` |
| `@gsd/pi-tui` | `@hyperlab/hx-tui` |
| `gsdRoot()` | `hxRoot()` |
| `gsd.db` | `hx.db` |
| `"GSD"` (notification title) | `"HX"` |
| `"GSD — projectName"` | `"HX — projectName"` |
| `formatNotificationTitle: "GSD — x"` | `"HX — x"` |
| `.gsd/` paths in test | `.hx/` paths |
| `gsd\s+v[\d.]+` banner regex | `hx\s+v[\d.]+` |
| `loadEffectiveGSDPreferences` | `loadEffectiveHXPreferences` |

**IMPORTANT:** `web/lib/pty-chat-parser.ts` in hx-ai already has HX naming in comments (`HX's shared UI`, `HX prompt markers`). The upstream version has GSD naming. When applying the `_awaitingInput` fix, keep the existing HX naming in all comment strings — do NOT revert to GSD.

---

## Verification

After each task apply:
```bash
npx tsc --noEmit
```

After all tasks:
```bash
node scripts/compile-tests.mjs    # from main repo root (worktree has node_modules symlink)
# Then for specific new test files:
node --test dist-test/src/resources/extensions/hx/tests/provider-errors.test.js
node --test dist-test/src/resources/extensions/hx/tests/prompt-loader-replacement.test.js
node --test dist-test/src/resources/extensions/hx/tests/auto-mode-interactive-guard.test.js
node --test dist-test/src/resources/extensions/hx/tests/notifications.test.js
node --test dist-test/src/tests/pty-chat-parser.test.js
node --test dist-test/src/tests/tui-non-tty-render-loop.test.js
node --test dist-test/packages/pi-coding-agent/src/core/messages.test.js
node --test dist-test/packages/pi-coding-agent/src/core/compaction/compaction.test.js
```

Grep for residual GSD references:
```bash
grep -rn "gsd\b\|GSD\b\|\.gsd" packages/pi-ai/src/utils/repair-tool-json.ts \
  packages/pi-coding-agent/src/core/image-overflow-recovery.ts \
  src/resources/extensions/hx/tests/prompt-loader-replacement.test.ts \
  2>/dev/null | grep -v ".test\." | grep -v "node_modules"
```

---

## Task Decomposition Recommendation

The planner should divide this into 4 tasks grouped by file affinity and shared context:

**T01 — Error classifier + YAML repair (Band B1 + B2)**  
Files: `error-classifier.ts`, `provider-errors.test.ts`, `repair-tool-json.ts` (new), `json-parse.ts`, `anthropic-shared.ts`, `partial-builder.ts`, `index.ts`, test files  
Rationale: All pure logic fixes; no side effects; self-contained; verifiable with their own tests.

**T02 — Compaction overflow + messages custom-prefix (Band B3 + B4)**  
Files: `compaction/compaction.ts`, `compaction/compaction.test.ts` (new), `messages.ts`, `messages.test.ts` (new)  
Rationale: Both are core agent-session utilities; related chunking/serialization domain.

**T03 — TUI review 28-file port (Band A)**  
Files: All `packages/pi-coding-agent/src/modes/interactive/` files in Band A  
Rationale: Large but mostly small hunks per file; shared import namespace; single behavioral theme (remove over-engineered guards and optimizations).

**T04 — Context management: prompt explosion, non-TTY, image overflow, chat fixes, notifications, rethink (Band C minus C4 already in T02 context)**  
Files: `prompt-loader.ts`, prompt `.md` files, `pi-tui/terminal.ts`, `pi-tui/tui.ts`, `remote-terminal.ts`, `agent-session.ts`, `image-overflow-recovery.ts`, `pty-chat-parser.ts`, `hx-workspace-store.tsx`, `chat-mode.tsx`, `notifications.ts`, `loop-deps.ts`, `phases.ts`, `gitignore.ts`, `rethink.ts`, `rethink.md`, all associated test files  
Rationale: These are spread across different subsystems but all relate to context management and can be applied sequentially; the planner can split T04 into two tasks if the combined count feels large (~15+ files).

**Alternative split for T04 if desired:**
- T04a: `prompt-loader`, prompts, `pi-tui` non-TTY, `image-overflow-recovery`
- T04b: `pty-chat-parser`, `hx-workspace-store`, `chat-mode`, notifications, rethink

---

## Risks

1. **`interactive-mode.ts` dispose block** — upstream removed ~28 lines of cleanup code (branch change unsub, theme watcher, getUserInput resolution, widget dispose, custom footer/header dispose). These removals may cause resource leaks if the TUI does not clean up elsewhere. The planner should verify that these cleanup responsibilities moved somewhere in the upstream codebase or were deemed unnecessary.

2. **`image-overflow-recovery.ts` is a new file** — 118 lines. `agent-session.ts` import must use `.js` extension. The event type `image_overflow_recovery` is removed in Band A (chat-controller) but added back in Band C (the same chat-controller). T03 removes the handler; T04 re-adds it. If tasks run in wrong order, typecheck will fail between tasks — but this is fine as long as T04 runs after T03.

3. **`pty-chat-parser.ts` HX naming** — hx-ai already has HX naming in all comments. Upstream has GSD naming. Must not copy-paste upstream wholesale; apply behavioral hunks only.

4. **Compaction test uses `@gsd/pi-agent-core`** — the new `compaction.test.ts` file has GSD import names in the upstream diff. Must adapt to `@hyperlab/hx-agent-core` / `@hyperlab/hx-ai`.

5. **Notification title "GSD"** — phases.ts already uses `"HX"` in hx-ai; the upstream has `"GSD"`. Adaptation: keep existing `"HX"` string; only add `projectName` parameter and `basename(...)` call sites.
