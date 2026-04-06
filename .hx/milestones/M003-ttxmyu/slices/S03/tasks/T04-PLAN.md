---
estimated_steps: 52
estimated_files: 3
skills_used: []
---

# T04: Wire phase anchors in phases.ts, auto-prompts.ts, and execute-task.md

Four files need changes to write and inject phase anchors.

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

## Inputs

- `src/resources/extensions/hx/auto/phases.ts`
- `src/resources/extensions/hx/auto-prompts.ts`
- `src/resources/extensions/hx/prompts/execute-task.md`
- `src/resources/extensions/hx/phase-anchor.ts`

## Expected Output

- `src/resources/extensions/hx/auto/phases.ts`
- `src/resources/extensions/hx/auto-prompts.ts`
- `src/resources/extensions/hx/prompts/execute-task.md`

## Verification

npx tsc --noEmit && npm run test:unit 2>&1 | tail -5 && grep -rn '\bGSD\b\|\bgsd\b' src/resources/extensions/hx/auto/phases.ts src/resources/extensions/hx/auto-prompts.ts src/resources/extensions/hx/prompts/execute-task.md

## Observability Impact

Phase anchor files written to `.hx/milestones/<MID>/anchors/<phase>.json` after each research/plan unit — inspectable via `ls .hx/milestones/<MID>/anchors/`.
