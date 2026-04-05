# S03: Context Optimization (Masking + Phase Anchors)

**Goal:** Port context-masker.ts and phase-anchor.ts from upstream, wire observation masking into the before_provider_request hook, add ContextManagementConfig preferences, and write phase anchors at research/plan phase boundaries so downstream agents inherit decisions without re-reading full history.
**Demo:** After this: After this: context-masker.ts and phase-anchor.ts exist; tests pass; phase-anchor.json written in auto-mode session

## Tasks
- [x] **T01: Created context-masker.ts and phase-anchor.ts (HX naming) with 11 passing unit tests, tsc clean, no GSD tokens** — Create the two new source files (with HX naming) and their test files. This is purely additive — no existing files are modified.

**context-masker.ts** (`src/resources/extensions/hx/context-masker.ts`, ~75 lines):
- Port verbatim from upstream with doc-comment adaptation (GSD→HX in comments only)
- No imports needed
- Exports: `createObservationMask(keepRecentTurns: number = 8)`
- `findTurnBoundary`: scans messages from end, counts assistant turns, returns index of the boundary
- `isBashResultUserMessage`: checks `m.role === 'user'` and content[0].text starts with `'Ran \`'`
- `isMaskableMessage`: returns true if `m.role === 'toolResult'` OR `isBashResultUserMessage(m)` — NOT by type field
- `createObservationMask`: returns a function that replaces content of maskable messages older than the boundary with `MASK_CONTENT_BLOCK = [{ type: 'text', text: '[result masked — within summarized history]' }]`

**phase-anchor.ts** (`src/resources/extensions/hx/phase-anchor.ts`, ~71 lines):
- Port with one import change: `import { hxRoot } from './paths.js'` (not gsdRoot)
- Exports: `PhaseAnchor` interface, `writePhaseAnchor(basePath, milestoneId, anchor)`, `readPhaseAnchor(basePath, milestoneId, phase)`, `formatAnchorForPrompt(anchor)`
- `writePhaseAnchor`: writes to `hxRoot(basePath)/milestones/<mid>/anchors/<phase>.json` via `mkdirSync({ recursive: true })` + `writeFileSync`
- `readPhaseAnchor`: reads and JSON-parses the anchor file; returns null if file doesn't exist
- `formatAnchorForPrompt`: returns a markdown block with the anchor fields

**context-masker.test.ts** (`src/resources/extensions/hx/tests/context-masker.test.ts`, 7 tests):
- Helper: `toolResultMsg(text)` → `{ role: 'toolResult', content: [{ type: 'text', text }] }`
- Helper: `assistantMsg()` → `{ role: 'assistant', content: [{ type: 'text', text: 'reply' }] }`
- Helper: `bashResultMsg(text)` → `{ role: 'user', content: [{ type: 'text', text: `Ran \`${text}\`` }] }`
- Test 1: masks nothing when all messages within keepRecentTurns
- Test 2: masks tool results older than keepRecentTurns boundary
- Test 3: never masks assistant messages
- Test 4: never masks plain user messages (without `Ran \`` prefix)
- Test 5: masks bash result user messages (Ran \` prefix)
- Test 6: returns same array length after masking
- Test 7: masks toolResult by role (not by type field — a message with role:'user' type:'toolResult' is NOT masked)

**phase-anchor.test.ts** (`src/resources/extensions/hx/tests/phase-anchor.test.ts`, 4 tests):
- Helper: `makeTempBase()` — creates a temp dir with `.hx/` subdir (using `fs.mkdtempSync`), returns cleanup fn
- Test 1: `writePhaseAnchor` creates anchor file at correct path (`.hx/milestones/M001/anchors/discuss.json`)
- Test 2: `readPhaseAnchor` returns the written anchor
- Test 3: `readPhaseAnchor` returns null when no anchor exists
- Test 4: `formatAnchorForPrompt` produces non-empty string with phase name and intent
  - Estimate: 45m
  - Files: src/resources/extensions/hx/context-masker.ts, src/resources/extensions/hx/phase-anchor.ts, src/resources/extensions/hx/tests/context-masker.test.ts, src/resources/extensions/hx/tests/phase-anchor.test.ts
  - Verify: npm run test:unit -- --grep 'context-masker|phase-anchor' 2>&1 | tail -5 && npx tsc --noEmit && grep -rn '\bGSD\b\|\bgsd\b' src/resources/extensions/hx/context-masker.ts src/resources/extensions/hx/phase-anchor.ts
- [ ] **T02: Add ContextManagementConfig to preferences** — Three files need purely additive changes. No logic changes.

**preferences-types.ts** (`src/resources/extensions/hx/preferences-types.ts`):
1. Add `ContextManagementConfig` interface before `HXPreferences` (or near the other config interfaces):
```typescript
export interface ContextManagementConfig {
  observation_masking?: boolean;          // default: true
  observation_mask_turns?: number;        // default: 8, range: 1-50
  compaction_threshold_percent?: number;  // default: 0.70, range: 0.5-0.95
  tool_result_max_chars?: number;         // default: 800, range: 200-10000
}
```
2. Add `'context_management'` to the `KNOWN_PREFERENCE_KEYS` Set
3. Add `context_management?: ContextManagementConfig` to the `HXPreferences` interface

**preferences.ts** (`src/resources/extensions/hx/preferences.ts`):
1. Import `ContextManagementConfig` from `./preferences-types.js` (it may already be in a barrel re-export — check first)
2. Add `context_management` merge to the `mergePreferences` function:
```typescript
context_management: (base.context_management || override.context_management)
  ? { ...(base.context_management ?? {}), ...(override.context_management ?? {}) } as ContextManagementConfig
  : undefined,
```

Note: `ContextManagementConfig` may already be exported via the preferences-types re-export in preferences.ts — check the existing export list before adding a new import.
  - Estimate: 20m
  - Files: src/resources/extensions/hx/preferences-types.ts, src/resources/extensions/hx/preferences.ts
  - Verify: npx tsc --noEmit && npm run test:unit -- --grep 'preferences' 2>&1 | tail -5
- [ ] **T03: Expand before_provider_request hook with observation masking and tool truncation** — Rewrite the `before_provider_request` handler in `register-hooks.ts` to add observation masking and tool-result truncation before the existing service tier logic.

**Critical constraint:** The current handler ends with `return payload` only after the service-tier block. After this change, the entire handler must return `payload` (not bare `return`) at the end. Bare `return` drops the mutation — the service tier won't apply after masking.

The full new handler body (replace everything between `pi.on('before_provider_request', async (event) => {` and its closing `});`):

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

The original handler structure to replace spans from the `pi.on('before_provider_request'` line through its closing `});` — read the file first to get exact text for the Edit tool.
  - Estimate: 25m
  - Files: src/resources/extensions/hx/bootstrap/register-hooks.ts
  - Verify: npx tsc --noEmit && grep -c 'createObservationMask' src/resources/extensions/hx/bootstrap/register-hooks.ts && grep -rn '\bGSD\b\|\bgsd\b' src/resources/extensions/hx/bootstrap/register-hooks.ts
- [ ] **T04: Wire phase anchors in phases.ts, auto-prompts.ts, and execute-task.md** — Four files need changes to write and inject phase anchors.

**phases.ts** (`src/resources/extensions/hx/auto/phases.ts`):
Insert anchor write after `s.unitRecoveryCount.delete(...)` and before `deps.emitJournalEvent(...)` (around line 1197-1200). The `mid` variable is already in scope (destructured from `iterData` at line 868):
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

**auto-prompts.ts** (`src/resources/extensions/hx/auto-prompts.ts`):
Three injections — read the full relevant function bodies before editing:

1. `buildPlanMilestonePrompt`: After the existing `inlined.push(...)` calls and before `const inlinedContext = capPreamble(...)`, add:
```typescript
const researchAnchor = readPhaseAnchor(base, mid, "research-milestone");
if (researchAnchor) inlined.unshift(formatAnchorForPrompt(researchAnchor));
```
(use `inlined.unshift` to put it first)

2. `buildPlanSlicePrompt`: After the existing `inlined.push(...)` calls and before `const depContent = ...`, add:
```typescript
const researchSliceAnchor = readPhaseAnchor(base, mid, "research-slice");
if (researchSliceAnchor) inlined.unshift(formatAnchorForPrompt(researchSliceAnchor));
```

3. `buildExecuteTaskPrompt`: Before the `return loadPrompt('execute-task', {...})` call, add:
```typescript
const planSliceAnchor = readPhaseAnchor(base, mid, "plan-slice");
const phaseAnchorSection = planSliceAnchor ? formatAnchorForPrompt(planSliceAnchor) : "";
```
Then add `phaseAnchorSection` to the `loadPrompt("execute-task", {...})` arguments object.

At the top of `auto-prompts.ts`, add the import (check if it already exists first):
```typescript
import { readPhaseAnchor, formatAnchorForPrompt } from "./phase-anchor.js";
```

**execute-task.md** (`src/resources/extensions/hx/prompts/execute-task.md`):
Read the file first. Add `{{phaseAnchorSection}}` between `{{runtimeContext}}` and `{{resumeSection}}`:
```
{{runtimeContext}}
{{phaseAnchorSection}}
{{resumeSection}}
```

After all changes: run tsc, full test suite, and GSD grep across all 4 modified files.
  - Estimate: 40m
  - Files: src/resources/extensions/hx/auto/phases.ts, src/resources/extensions/hx/auto-prompts.ts, src/resources/extensions/hx/prompts/execute-task.md
  - Verify: npx tsc --noEmit && npm run test:unit 2>&1 | tail -5 && grep -rn '\bGSD\b\|\bgsd\b' src/resources/extensions/hx/auto/phases.ts src/resources/extensions/hx/auto-prompts.ts src/resources/extensions/hx/prompts/execute-task.md
