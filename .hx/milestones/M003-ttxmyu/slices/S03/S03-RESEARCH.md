# S03: Context Optimization (Masking + Phase Anchors) — Research

## Summary

S03 ports two new subsystems from the upstream `feat: GSD context optimization` PR (merged as commit `a7b574acf`, comprised of commits `1272438e8`, `696cb60d6`, `b7761a117`, `87a14d061`). Both source files are available verbatim from the git history. The work is well-scoped with no ambiguous requirements:

1. **`context-masker.ts`** — Observation masking for auto-mode. Replaces old tool-result content with a placeholder to reduce context window bloat between compactions. Operates on the pi-ai LLM payload (post-`convertToLlm`, pre-provider) inside a `before_provider_request` hook.

2. **`phase-anchor.ts`** — Phase handoff anchors. Write/read compact structured JSON files between auto-mode phases (research → plan → execute) so downstream agents inherit decisions, blockers, and intent without re-reading full history.

Both files need HX naming adaptation (gsd → hx path imports), and four existing files need wiring changes.

---

## Upstream Source (verbatim, post-fix)

### `context-masker.ts` (final form after fix commit `87a14d061`)

```typescript
/**
 * Observation masking for HX auto-mode sessions.
 * Operates on the pi-ai Message[] format (post-convertToLlm, pre-provider):
 *   - toolResult messages: { role: "toolResult", content: TextContent[] }
 *   - bash results: { role: "user", content: [{type:"text",text:"Ran `...`"}] }
 */
interface MaskableMessage {
  role: string;
  content: unknown;
  type?: string;
  [key: string]: unknown;
}

const MASK_PLACEHOLDER = "[result masked — within summarized history]";
const MASK_CONTENT_BLOCK = [{ type: "text" as const, text: MASK_PLACEHOLDER }];

function findTurnBoundary(messages: MaskableMessage[], keepRecentTurns: number): number { ... }
function isBashResultUserMessage(m: MaskableMessage): boolean { ... }
function isMaskableMessage(m: MaskableMessage): boolean { ... }
export function createObservationMask(keepRecentTurns: number = 8) { ... }
```

Key: detects maskable messages by `role === "toolResult"` (not `type`), and by bash-result detection (`Ran \`` prefix). Content is always replaced with a `TextContent[]` array block, never a string.

### `phase-anchor.ts` (no changes needed from fix commit)

```typescript
import { hxRoot } from "./paths.js";  // GSD→HX: gsdRoot → hxRoot

export interface PhaseAnchor { phase, milestoneId, generatedAt, intent, decisions[], blockers[], nextSteps[] }
export function writePhaseAnchor(basePath, milestoneId, anchor): void { ... }
export function readPhaseAnchor(basePath, milestoneId, phase): PhaseAnchor | null { ... }
export function formatAnchorForPrompt(anchor): string { ... }
```

Anchor files written to `.hx/milestones/<MID>/anchors/<phase>.json`.

---

## Files to Create

### 1. `src/resources/extensions/hx/context-masker.ts` (~75 lines)
- Direct port of upstream with comment adaptation (GSD → HX in doc comments only)
- No import changes needed (no imports in the upstream file)

### 2. `src/resources/extensions/hx/phase-anchor.ts` (~71 lines)
- Port with one import change: `gsdRoot` → `hxRoot` from `./paths.js`

---

## Files to Modify

### 3. `src/resources/extensions/hx/preferences-types.ts`
Two additions:
1. Add `ContextManagementConfig` interface (before `HXPreferences`):
   ```typescript
   export interface ContextManagementConfig {
     observation_masking?: boolean;          // default: true
     observation_mask_turns?: number;        // default: 8, range: 1-50
     compaction_threshold_percent?: number;  // default: 0.70, range: 0.5-0.95
     tool_result_max_chars?: number;         // default: 800, range: 200-10000
   }
   ```
2. Add `"context_management"` to `KNOWN_PREFERENCE_KEYS`
3. Add `context_management?: ContextManagementConfig` to `HXPreferences` interface

### 4. `src/resources/extensions/hx/preferences.ts`
Add `context_management` to `mergePreferences`:
```typescript
context_management: (base.context_management || override.context_management)
  ? { ...(base.context_management ?? {}), ...(override.context_management ?? {}) } as ContextManagementConfig
  : undefined,
```
Also add `ContextManagementConfig` to the re-export type list.

### 5. `src/resources/extensions/hx/bootstrap/register-hooks.ts`
Expand the `before_provider_request` handler to add observation masking and tool truncation before the service tier block. The current handler (lines 259–270) is minimal. New logic (adapted from upstream `b7761a117` + `87a14d061`):

```typescript
pi.on("before_provider_request", async (event) => {
  const payload = event.payload as Record<string, unknown> | null;
  if (!payload || typeof payload !== "object") return;

  // ── Observation Masking ──────────────────────────────────────────
  if (isAutoActive()) {
    try {
      const { loadEffectiveHXPreferences } = await import("../preferences.js");
      const prefs = loadEffectiveHXPreferences();
      const cmConfig = prefs?.preferences.context_management;

      if (cmConfig?.observation_masking !== false) {
        const keepTurns = cmConfig?.observation_mask_turns ?? 8;
        const { createObservationMask } = await import("../context-masker.js");
        const mask = createObservationMask(keepTurns);
        const messages = payload.messages;
        if (Array.isArray(messages)) {
          payload.messages = mask(messages);
        }
      }

      // Tool result truncation (immutable — create new objects)
      const maxChars = cmConfig?.tool_result_max_chars ?? 800;
      const msgs = payload.messages;
      if (Array.isArray(msgs)) {
        payload.messages = msgs.map((msg: Record<string, unknown>) => {
          if (msg?.role === "toolResult" && Array.isArray(msg.content)) {
            const blocks = msg.content as Array<Record<string, unknown>>;
            const totalLen = blocks.reduce((sum: number, b) =>
              sum + (typeof b.text === "string" ? b.text.length : 0), 0);
            if (totalLen > maxChars) {
              const truncated = blocks.map(b => {
                if (typeof b.text === "string" && b.text.length > maxChars) {
                  return { ...b, text: b.text.slice(0, maxChars) + "\n…[truncated]" };
                }
                return b;
              });
              return { ...msg, content: truncated };
            }
          }
          return msg;
        });
      }
    } catch { /* non-fatal */ }
  }

  // ── Service Tier ─────────────────────────────────────────────────
  const modelId = event.model?.id;
  if (!modelId) return payload;
  const { getEffectiveServiceTier, supportsServiceTier } = await import("../service-tier.js");
  const tier = getEffectiveServiceTier();
  if (!tier || !supportsServiceTier(modelId)) return payload;
  payload.service_tier = tier;
  return payload;
});
```

Note: `return payload` (not just `return`) at the end because the upstream fix changed the bare `return` to `return payload`. This is important — the hook must return the mutated payload.

### 6. `src/resources/extensions/hx/auto/phases.ts`
Add phase anchor write after successful research/planning unit completion. Insert after the `artifactVerified` check (~line that currently reads the `artifactVerified` block in `runUnitPhase`). The exact insertion point is after `s.unitRecoveryCount.delete(...)` and before `deps.emitJournalEvent(...)`:

```typescript
// Write phase handoff anchor after successful research/planning completion
const anchorPhases = new Set(["research-milestone", "research-slice", "plan-milestone", "plan-slice"]);
if (artifactVerified && mid && anchorPhases.has(unitType)) {
  try {
    const { writePhaseAnchor } = await import("../phase-anchor.js");
    writePhaseAnchor(s.basePath, mid, {
      phase: unitType,
      milestoneId: mid,
      generatedAt: new Date().toISOString(),
      intent: `Completed ${unitType} for ${unitId}`,
      decisions: [],
      blockers: [],
      nextSteps: [],
    });
  } catch { /* non-fatal — anchor is advisory */ }
}
```

### 7. `src/resources/extensions/hx/auto-prompts.ts`
Three changes:
1. `buildPlanMilestonePrompt` — inject `research-milestone` anchor at top of `inlined[]`
2. `buildPlanSlicePrompt` — inject `research-slice` anchor at top of `inlined[]`
3. `buildExecuteTaskPrompt` — read `plan-slice` anchor, pass `phaseAnchorSection` to `loadPrompt("execute-task", ...)`

### 8. `src/resources/extensions/hx/prompts/execute-task.md`
Add `{{phaseAnchorSection}}` placeholder after `{{runtimeContext}}` and before `{{resumeSection}}`.

---

## Tests to Create

### `src/resources/extensions/hx/tests/context-masker.test.ts`
Port of upstream test with corrected pi-ai message format (from fix commit `87a14d061`). 7 tests:
- masks nothing when within keepRecentTurns
- masks tool results older than keepRecentTurns
- never masks assistant messages
- never masks user messages
- masks bash result user messages (Ran ` prefix detection)
- returns same array length
- masks toolResult by role, not by type field (new test from fix commit)

Helper format: `toolResult` uses `{ role: "toolResult", content: [{type:"text",text}], ... }` not `{role:"user", type:"toolResult"}`.

### `src/resources/extensions/hx/tests/phase-anchor.test.ts`
Port of upstream test with `.gsd` → `.hx` path adaptation. 4 tests:
- writePhaseAnchor creates anchor file in correct location (`.hx/milestones/M001/anchors/discuss.json`)
- readPhaseAnchor returns written anchor
- readPhaseAnchor returns null when no anchor exists
- formatAnchorForPrompt produces markdown block

The `makeTempBase` helper creates `.hx` dir instead of `.gsd`. Tests need to create the `.hx/milestones/M001/anchors/` directory manually in setup since `writePhaseAnchor` creates it via `mkdirSync({ recursive: true })`.

---

## Integration Constraints

- **No new extension-manifest.json entries needed** — context-masker and phase-anchor are not registered as tools or hooks in the manifest; they are used inside existing hooks and prompt builders.
- **`hxRoot` import in phase-anchor.ts** — already exported from `./paths.js`, matches `gsdRoot` semantics exactly.
- **`isAutoActive` already imported** in register-hooks.ts (line 15).
- **`loadEffectiveHXPreferences` import** in the hook uses a dynamic `import()` (consistent with the upstream pattern and consistent with the existing preferences import pattern in register-hooks.ts).
- **compile-tests.mjs** — new test files go in flat `tests/` (not `tests/integration/`) per KNOWLEDGE K002. No skip-dirs issue.
- **`return payload`** pattern at end of `before_provider_request` — the current hx-ai handler returns nothing (bare `return`); must be updated to `return payload` after the masking block runs, consistent with upstream fix commit and consistent with other handlers that return modified payloads.

---

## Verification Commands

After implementation:
```
npx tsc --noEmit                        # must exit 0
npm run test:unit                       # 4155 + ~11 new tests = ~4166 pass
grep -rn '\bgsd\b|\bGSD\b' \
  src/resources/extensions/hx/context-masker.ts \
  src/resources/extensions/hx/phase-anchor.ts \
  src/resources/extensions/hx/bootstrap/register-hooks.ts \
  src/resources/extensions/hx/auto/phases.ts \
  src/resources/extensions/hx/auto-prompts.ts   # must return 0 hits
```

Also: after a real auto-mode research phase, verify `.hx/milestones/<MID>/anchors/research-milestone.json` is written.

---

## Task Decomposition Recommendation

**T01 — context-masker.ts + phase-anchor.ts (new files + tests)**
- Create both source files with HX naming
- Create both test files
- Verify: tsc clean, tests pass for the 2 new test files in isolation

**T02 — Preferences: ContextManagementConfig**
- Add `ContextManagementConfig` interface to preferences-types.ts
- Add `context_management` to KNOWN_PREFERENCE_KEYS and HXPreferences
- Add merge in preferences.ts
- Verify: tsc clean, existing preferences tests still pass

**T03 — register-hooks.ts: observation masking + tool truncation**
- Expand `before_provider_request` handler
- Verify: tsc clean, 0 GSD hits

**T04 — phases.ts + auto-prompts.ts + execute-task.md: anchor wiring**
- Write phase anchors in runUnitPhase
- Inject anchors in all 3 prompt builders
- Add {{phaseAnchorSection}} to execute-task.md template
- Verify: tsc clean, 0 GSD hits, full test suite passes

---

## Risk Assessment

**Low overall risk.** Context-masker and phase-anchor are additive (new files, no changes to existing logic). The hook expansion in register-hooks.ts is wrapped in `try/catch` (non-fatal by design). The prompt injection is optional (anchors only injected when the file exists). The preferences change is purely additive. 

One non-obvious point: the `return payload` at the end of `before_provider_request` matters — the current hx-ai handler returns nothing. Upstream changed bare `return` to `return payload` in the fix commit. If we forget this, the service tier won't be applied after the masking block runs.

## Known Gaps / Not Ported

- `compaction_threshold_percent` in `ContextManagementConfig` is defined but not wired to any compaction logic (upstream also doesn't wire it yet — it's future-planned).
- The `execute-task.md` `{{phaseAnchorSection}}` will be empty string when no anchor exists — `loadPrompt` handles this by rendering the template with the empty string, which results in a blank line. This is acceptable (upstream does the same).
