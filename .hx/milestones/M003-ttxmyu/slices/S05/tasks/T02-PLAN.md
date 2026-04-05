---
estimated_steps: 32
estimated_files: 3
skills_used: []
---

# T02: Wire readers into server.ts + index.ts, and add /btw skill

Two small, independent jobs combined because neither merits a full task slot:

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

## Inputs

- `packages/mcp-server/src/readers/index.ts`
- `packages/mcp-server/src/readers/paths.ts`
- `packages/mcp-server/src/readers/state.ts`
- `packages/mcp-server/src/readers/roadmap.ts`
- `packages/mcp-server/src/readers/metrics.ts`
- `packages/mcp-server/src/readers/captures.ts`
- `packages/mcp-server/src/readers/knowledge.ts`
- `packages/mcp-server/src/readers/doctor-lite.ts`
- `packages/mcp-server/src/server.ts`
- `packages/mcp-server/src/index.ts`

## Expected Output

- `packages/mcp-server/src/server.ts`
- `packages/mcp-server/src/index.ts`
- `src/resources/skills/btw/SKILL.md`

## Verification

cd packages/mcp-server && npm run build && node --test dist/readers/readers.test.js
