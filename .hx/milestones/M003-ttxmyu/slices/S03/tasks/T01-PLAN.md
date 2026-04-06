---
estimated_steps: 32
estimated_files: 4
skills_used: []
---

# T01: Create context-masker.ts, phase-anchor.ts, and their tests

Create the two new source files (with HX naming) and their test files. This is purely additive — no existing files are modified.

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

## Inputs

- `src/resources/extensions/hx/paths.ts`

## Expected Output

- `src/resources/extensions/hx/context-masker.ts`
- `src/resources/extensions/hx/phase-anchor.ts`
- `src/resources/extensions/hx/tests/context-masker.test.ts`
- `src/resources/extensions/hx/tests/phase-anchor.test.ts`

## Verification

npm run test:unit -- --grep 'context-masker|phase-anchor' 2>&1 | tail -5 && npx tsc --noEmit && grep -rn '\bGSD\b\|\bgsd\b' src/resources/extensions/hx/context-masker.ts src/resources/extensions/hx/phase-anchor.ts

## Observability Impact

None — new files only, no runtime hooks wired yet.
