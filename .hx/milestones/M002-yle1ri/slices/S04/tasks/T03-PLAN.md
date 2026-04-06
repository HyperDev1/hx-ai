---
estimated_steps: 18
estimated_files: 14
skills_used: []
---

# T03: TUI 28-file review port (Band A interactive-mode fixes)

Apply the upstream TUI review commit (#3055) fixes to hx-ai interactive-mode files. The research identified 16 items (A1–A16); A4 (`/export startsWith`) is already done. Apply the remaining missing behavioral changes:

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

## Inputs

- ``packages/pi-coding-agent/src/modes/interactive/interactive-mode.ts` — 3818 lines, existing interactive mode`
- ``packages/pi-coding-agent/src/modes/interactive/controllers/chat-controller.ts` — existing`
- ``packages/pi-coding-agent/src/modes/interactive/controllers/input-controller.ts` — existing`
- ``packages/pi-coding-agent/src/modes/interactive/components/armin.ts` — existing`
- ``packages/pi-coding-agent/src/modes/interactive/components/config-selector.ts` — existing`
- ``packages/pi-coding-agent/src/modes/interactive/components/countdown-timer.ts` — existing`
- ``packages/pi-coding-agent/src/modes/interactive/components/daxnuts.ts` — existing`
- ``packages/pi-coding-agent/src/modes/interactive/components/oauth-selector.ts` — existing`
- ``packages/pi-coding-agent/src/modes/interactive/components/provider-manager.ts` — 177 lines, single-press remove confirmed`
- ``packages/pi-coding-agent/src/modes/interactive/components/scoped-models-selector.ts` — existing`
- ``packages/pi-coding-agent/src/modes/interactive/components/session-selector.ts` — existing`
- ``packages/pi-coding-agent/src/modes/interactive/components/tool-execution.ts` — existing`
- ``packages/pi-coding-agent/src/modes/interactive/components/footer.ts` — existing`
- ``src/tests/provider-manager-remove.test.ts` — 134 lines already present`

## Expected Output

- ``packages/pi-coding-agent/src/modes/interactive/interactive-mode.ts` — over-engineered serializer/cleanup removed`
- ``packages/pi-coding-agent/src/modes/interactive/controllers/chat-controller.ts` — lastProcessedContentIndex removed if present`
- ``packages/pi-coding-agent/src/modes/interactive/controllers/input-controller.ts` — isKnownSlashCommand/try-catch removed if present`
- ``packages/pi-coding-agent/src/modes/interactive/components/armin.ts` — fixed-padding centering`
- ``packages/pi-coding-agent/src/modes/interactive/components/config-selector.ts` — simplified scroll indicator`
- ``packages/pi-coding-agent/src/modes/interactive/components/tool-execution.ts` — tab width 3, truncation removed`
- ``src/tests/provider-manager-remove.test.ts` — passes (confirms single-press remove)`

## Verification

npx tsc --noEmit && node --test dist-test/src/tests/provider-manager-remove.test.js
