# S05: MCP Server Readers + Misc Features

**Goal:** Port the MCP server read-only tools module (6 readers), the /btw skill, and the /hx codebase command subsystem (codebase-generator, commands-codebase, system-context injection, init-wizard auto-init) from upstream gsd-2 commits 206ebf8c9, 7a046098b, 1b50a9477, 6b0c48945, and 45a48c4ae with full GSD→HX naming adaptation.
**Demo:** After this: After this: mcp-server readers module exists with 6 readers; server.ts registers them; /btw skill available; commands-codebase.ts present

## Tasks
- [x] **T01: Created MCP server readers module with 8 files (6 readers + barrel index + 31 tests), 0 GSD refs in source** — Port the 6 read-only reader modules + barrel index from upstream commit 206ebf8c9 into packages/mcp-server/src/readers/. All .gsd path strings become .hx; resolveGsdRoot becomes resolveHxRoot; doctor-lite message '/gsd status' becomes '/hx status'; copyright headers 'GSD MCP Server' become 'HX MCP Server'.

Files to create:
1. paths.ts — resolveHxRoot (not resolveGsdRoot), resolveRootFile, milestonesDir, findMilestoneIds, resolveMilestoneDir, resolveMilestoneFile, findSliceIds, resolveSliceDir, resolveSliceFile, findTaskFiles. existsSync checks '.hx' not '.gsd'. ~217 lines.
2. state.ts — readProgress() + ProgressResult interface; all .gsd/ paths → .hx/. ~223 lines.
3. roadmap.ts — readRoadmap() parsing ROADMAP.md tables; all .gsd/ → .hx/. ~263 lines.
4. metrics.ts — readHistory() reading metrics.json; no GSD refs, clean port. ~118 lines.
5. captures.ts — readCaptures() parsing CAPTURES.md; no GSD refs. ~119 lines.
6. knowledge.ts — readKnowledge() parsing KNOWLEDGE.md; no GSD refs. ~111 lines.
7. doctor-lite.ts — runDoctorLite() health checker; '/gsd status' → '/hx status'; .gsd file refs → .hx. ~225 lines.
8. index.ts — barrel re-export of all 6 readers + types. ~16 lines.

Note: readers.test.ts goes in the same package at packages/mcp-server/src/readers/readers.test.ts (33 tests). All .gsd/ fixture paths in tests → .hx/. This test file is NOT in src/resources/extensions/hx/tests/ — it stays in the mcp-server package because its imports are package-relative.
  - Estimate: 2h
  - Files: packages/mcp-server/src/readers/paths.ts, packages/mcp-server/src/readers/state.ts, packages/mcp-server/src/readers/roadmap.ts, packages/mcp-server/src/readers/metrics.ts, packages/mcp-server/src/readers/captures.ts, packages/mcp-server/src/readers/knowledge.ts, packages/mcp-server/src/readers/doctor-lite.ts, packages/mcp-server/src/readers/index.ts, packages/mcp-server/src/readers/readers.test.ts
  - Verify: grep -rn 'gsd\|GSD' packages/mcp-server/src/readers/ | grep -v '.test.' | wc -l | xargs -I{} test {} -eq 0 && echo 'PASS: 0 GSD hits in readers source'
- [x] **T02: Wired 6 reader tools into mcp-server server.ts, exported all readers from index.ts, and created the /btw skill** — Two small, independent jobs combined because neither merits a full task slot:

(A) server.ts + index.ts wiring (packages/mcp-server):
- Add 6 imports at the top of server.ts: readProgress from './readers/state.js', readRoadmap from './readers/roadmap.js', readHistory from './readers/metrics.js', readCaptures from './readers/captures.js', readKnowledge from './readers/knowledge.js', runDoctorLite from './readers/doctor-lite.js'
- After the existing hx_resolve_blocker tool registration, add 6 new server.tool() registrations with names: hx_progress, hx_roadmap, hx_history, hx_captures, hx_knowledge, hx_doctor
- Tool descriptions must say '.hx/' not '.gsd/' — replace any gsd references in description strings
- index.ts: add reader exports after existing MAX_EVENTS/INIT_TIMEOUT_MS exports; update doc comment to mention project state readers
- Then build the package: cd packages/mcp-server && npm run build
- Run readers test: node --test dist/readers/readers.test.js (expect 33 passed)

(B) /btw skill:
- Create src/resources/skills/btw/SKILL.md — a standalone markdown file from upstream commit 7a046098b
- The file is self-contained, ~42 lines, no GSD references
- It ships via the existing copy-resources.cjs pipeline (no code changes needed)

Each server.tool() registration follows the exact pattern of the existing tools in server.ts:
```typescript
server.tool(
  'hx_progress',
  'Read current execution progress from .hx/STATE.md and milestone filesystem. Returns structured progress data.',
  {
    projectDir: z.string().describe('Absolute path to the project directory'),
  },
  async (args: Record<string, unknown>) => {
    const { projectDir } = args as { projectDir: string };
    try {
      const result = readProgress(projectDir);
      return jsonContent(result);
    } catch (err) {
      return errorContent(err instanceof Error ? err.message : String(err));
    }
  },
);
```
Note: readProgress/readRoadmap/readHistory/readCaptures/readKnowledge are synchronous; runDoctorLite is synchronous. Use synchronous invocation (no await) unless the upstream signatures are async.
  - Estimate: 45m
  - Files: packages/mcp-server/src/server.ts, packages/mcp-server/src/index.ts, src/resources/skills/btw/SKILL.md
  - Verify: cd packages/mcp-server && npm run build && node --test dist/readers/readers.test.js
- [x] **T03: Ported full /hx codebase subsystem: codebase-generator.ts, commands-codebase.ts, 6 wiring changes, 28 new tests — tsc exits 0, 4215 tests pass** — This is the largest task in S05 — port the full /hx codebase command subsystem from upstream commits 1b50a9477, 6b0c48945, and 45a48c4ae.

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
  - Estimate: 2.5h
  - Files: src/resources/extensions/hx/preferences-types.ts, src/resources/extensions/hx/paths.ts, src/resources/extensions/hx/codebase-generator.ts, src/resources/extensions/hx/commands-codebase.ts, src/resources/extensions/hx/commands/catalog.ts, src/resources/extensions/hx/commands/handlers/ops.ts, src/resources/extensions/hx/commands-bootstrap.ts, src/resources/extensions/hx/tests/codebase-generator.test.ts
  - Verify: npx tsc --noEmit && npm run test:unit 2>&1 | tail -5
- [ ] **T04: CODEBASE injection in system-context.ts + init-wizard auto-init + final verification** — Two small wiring changes to close the codebase feature loop, then full slice verification.

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
  - Estimate: 45m
  - Files: src/resources/extensions/hx/bootstrap/system-context.ts, src/resources/extensions/hx/init-wizard.ts
  - Verify: npx tsc --noEmit && npm run test:unit 2>&1 | tail -3 && grep -rn '\bgsd\b\|\bGSD\b' packages/mcp-server/src/readers/ src/resources/skills/btw/ src/resources/extensions/hx/codebase-generator.ts src/resources/extensions/hx/commands-codebase.ts 2>/dev/null | wc -l | xargs -I{} test {} -eq 0 && echo 'PASS'
