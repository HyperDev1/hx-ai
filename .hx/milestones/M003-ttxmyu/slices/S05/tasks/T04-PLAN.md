---
estimated_steps: 37
estimated_files: 2
skills_used: []
---

# T04: CODEBASE injection in system-context.ts + init-wizard auto-init + final verification

Two small wiring changes to close the codebase feature loop, then full slice verification.

Step 1 — bootstrap/system-context.ts: add codebaseBlock injection between knowledgeBlock and memoryBlock.
- existsSync and readFileSync are already imported at line 1
- resolveHxRootFile is already imported (line 10)
- After the knowledgeBlock assignment (line 67), add:
```typescript
let codebaseBlock = '';
try {
  const codebasePath = resolveHxRootFile(process.cwd(), 'CODEBASE');
  if (existsSync(codebasePath)) {
    const raw = readFileSync(codebasePath, 'utf-8').trim();
    const capped = raw.length > 8000 ? raw.slice(0, 8000) + '\n... (truncated — run /hx codebase update to refresh)' : raw;
    codebaseBlock = `\n\n[CODEBASE MAP]\n\n${capped}`;
  }
} catch {
  // non-fatal
}
```
- Inject codebaseBlock into fullSystem string between knowledgeBlock and memoryBlock:
  Change: `...${knowledgeBlock}${memoryBlock}...`
  To: `...${knowledgeBlock}${codebaseBlock}${memoryBlock}...`

Step 2 — init-wizard.ts: add codebase auto-generation just before ctx.ui.notify('HX initialized...').
- Add import at top: `import { generateCodebaseMap, writeCodebaseMap } from './codebase-generator.js';`
- Just before the notify call at line ~241, add:
```typescript
try {
  const codebaseMap = await generateCodebaseMap(basePath, {});
  writeCodebaseMap(basePath, codebaseMap);
} catch {
  // non-fatal — codebase generation failure should never block project init
}
```

Step 3 — Final verification:
- `npx tsc --noEmit` → must exit 0
- `npm run test:unit` → must pass with ≥4161 tests (4132 baseline + 29 codebase tests), 0 failures
- `grep -rn '\bgsd\b\|\bGSD\b' packages/mcp-server/src/readers/ src/resources/skills/btw/ src/resources/extensions/hx/codebase-generator.ts src/resources/extensions/hx/commands-codebase.ts src/resources/extensions/hx/bootstrap/system-context.ts src/resources/extensions/hx/init-wizard.ts` → 0 hits

Note: generateCodebaseMap may need to be async if the upstream implementation scans the filesystem asynchronously. Check the function signature in codebase-generator.ts (T03 output) and use await only if the function returns a Promise.

## Inputs

- `src/resources/extensions/hx/bootstrap/system-context.ts`
- `src/resources/extensions/hx/init-wizard.ts`
- `src/resources/extensions/hx/codebase-generator.ts`
- `src/resources/extensions/hx/paths.ts`

## Expected Output

- `src/resources/extensions/hx/bootstrap/system-context.ts`
- `src/resources/extensions/hx/init-wizard.ts`

## Verification

npx tsc --noEmit && npm run test:unit 2>&1 | tail -3 && grep -rn '\bgsd\b\|\bGSD\b' packages/mcp-server/src/readers/ src/resources/skills/btw/ src/resources/extensions/hx/codebase-generator.ts src/resources/extensions/hx/commands-codebase.ts 2>/dev/null | wc -l | xargs -I{} test {} -eq 0 && echo 'PASS'
