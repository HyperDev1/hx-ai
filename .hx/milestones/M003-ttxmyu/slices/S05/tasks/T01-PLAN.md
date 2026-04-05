---
estimated_steps: 11
estimated_files: 9
skills_used: []
---

# T01: Create MCP readers module (8 files in packages/mcp-server/src/readers/)

Port the 6 read-only reader modules + barrel index from upstream commit 206ebf8c9 into packages/mcp-server/src/readers/. All .gsd path strings become .hx; resolveGsdRoot becomes resolveHxRoot; doctor-lite message '/gsd status' becomes '/hx status'; copyright headers 'GSD MCP Server' become 'HX MCP Server'.

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

## Inputs

- `packages/mcp-server/src/server.ts`
- `packages/mcp-server/tsconfig.json`
- `packages/mcp-server/package.json`

## Expected Output

- `packages/mcp-server/src/readers/paths.ts`
- `packages/mcp-server/src/readers/state.ts`
- `packages/mcp-server/src/readers/roadmap.ts`
- `packages/mcp-server/src/readers/metrics.ts`
- `packages/mcp-server/src/readers/captures.ts`
- `packages/mcp-server/src/readers/knowledge.ts`
- `packages/mcp-server/src/readers/doctor-lite.ts`
- `packages/mcp-server/src/readers/index.ts`
- `packages/mcp-server/src/readers/readers.test.ts`

## Verification

grep -rn 'gsd\|GSD' packages/mcp-server/src/readers/ | grep -v '.test.' | wc -l | xargs -I{} test {} -eq 0 && echo 'PASS: 0 GSD hits in readers source'
