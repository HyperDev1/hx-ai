---
estimated_steps: 55
estimated_files: 8
skills_used: []
---

# T03: Port codebase-generator, commands-codebase, preferences/paths/catalog/ops wiring, and test

This is the largest task in S05 — port the full /hx codebase command subsystem from upstream commits 1b50a9477, 6b0c48945, and 45a48c4ae.

Step 1 — preferences-types.ts changes:
- Add 'codebase' to the KNOWN_PREFERENCE_KEYS Set
- Add CodebaseMapPreferences interface: { exclude_patterns?: string[]; max_files?: number; collapse_threshold?: number; }
- Add codebase?: CodebaseMapPreferences to the HXPreferences interface

Step 2 — paths.ts changes:
- Add CODEBASE: 'CODEBASE.md' to the HX_ROOT_FILES const
- Add CODEBASE: 'codebase.md' to the LEGACY_HX_ROOT_FILES object
(This is required before system-context.ts can call resolveHxRootFile(cwd, 'CODEBASE'))

Step 3 — Create codebase-generator.ts (~351 lines) at src/resources/extensions/hx/codebase-generator.ts:
- Import hxRoot from './paths.js' (NOT gsdRoot)
- Exports: CodebaseMapOptions interface, parseCodebaseMap, generateCodebaseMap, updateCodebaseMap, writeCodebaseMap, readCodebaseMap, getCodebaseMapStats
- Default exclude list uses '.hx/' not '.gsd/'
- writeCodebaseMap uses hxRoot(basePath) to find where to write CODEBASE.md
- All comments/strings say HX not GSD

Step 4 — Create commands-codebase.ts (~192 lines) at src/resources/extensions/hx/commands-codebase.ts:
- Imports loadEffectiveHXPreferences (not loadEffectiveGSDPreferences)
- Usage string references '/hx codebase' (not '/gsd codebase')
- resolveCodebaseOptions merges prefs.preferences.codebase with CLI flags
- Exports handleCodebase function

Step 5 — commands/catalog.ts: add codebase nested completions to NESTED_COMPLETIONS map:
```typescript
codebase: [
  { cmd: 'generate', desc: 'Generate a new codebase map' },
  { cmd: 'update', desc: 'Update existing codebase map' },
  { cmd: 'stats', desc: 'Show codebase map statistics' },
  { cmd: 'help', desc: 'Show codebase command help' },
  { cmd: '--collapse-threshold', desc: 'Collapse directories with N or fewer files' },
],
```

Step 6 — commands/handlers/ops.ts: add codebase handler import and dispatch:
- Add import: `import { handleCodebase } from '../../commands-codebase.js';`
- Add dispatch block after the last existing handler:
```typescript
if (trimmed === 'codebase' || trimmed.startsWith('codebase ')) {
  await handleCodebase(trimmed.replace(/^codebase\s*/, '').trim(), ctx);
  return true;
}
```

Step 7 — commands-bootstrap.ts: add codebase to TOP_LEVEL_SUBCOMMANDS:
```typescript
{ cmd: 'codebase', desc: 'Generate and manage codebase map (.hx/CODEBASE.md)' },
```

Step 8 — Create test file at src/resources/extensions/hx/tests/codebase-generator.test.ts (~29 tests):
- Port from upstream src/resources/extensions/gsd/tests/codebase-generator.test.ts
- Import from '../codebase-generator.js' (compiled path, not .ts)
- All fixture paths use .hx/ not .gsd/
- Test groups: parseCodebaseMap, generateCodebaseMap, updateCodebaseMap, getCodebaseMapStats, writeCodebaseMap/readCodebaseMap
- makeTmpRepo helper creates a tmp dir with git init; no .hx/ dir needed in test fixtures
- Tests cover: parse empty/valid/partial maps, generate with defaults, generate with exclude patterns, update adds/removes entries, stats returns correct counts, roundtrip write/read

Critical constraints:
- preferences-types.ts CodebaseMapPreferences must exist before tsc compiles commands-codebase.ts
- paths.ts CODEBASE entry must exist before system-context.ts is modified in T04
- Use import '.js' extensions throughout (compiled output style)
- After all changes: `npx tsc --noEmit` must exit 0

## Inputs

- `src/resources/extensions/hx/preferences-types.ts`
- `src/resources/extensions/hx/paths.ts`
- `src/resources/extensions/hx/commands/catalog.ts`
- `src/resources/extensions/hx/commands/handlers/ops.ts`
- `src/resources/extensions/hx/commands-bootstrap.ts`

## Expected Output

- `src/resources/extensions/hx/codebase-generator.ts`
- `src/resources/extensions/hx/commands-codebase.ts`
- `src/resources/extensions/hx/tests/codebase-generator.test.ts`
- `src/resources/extensions/hx/preferences-types.ts`
- `src/resources/extensions/hx/paths.ts`
- `src/resources/extensions/hx/commands/catalog.ts`
- `src/resources/extensions/hx/commands/handlers/ops.ts`
- `src/resources/extensions/hx/commands-bootstrap.ts`

## Verification

npx tsc --noEmit && npm run test:unit 2>&1 | tail -5
