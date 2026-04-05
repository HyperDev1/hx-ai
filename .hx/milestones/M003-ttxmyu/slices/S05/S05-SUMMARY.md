---
id: S05
parent: M003-ttxmyu
milestone: M003-ttxmyu
provides:
  - packages/mcp-server/src/readers/ — 6 read-only reader modules callable by any MCP client
  - 6 new MCP tools registered in server.ts: hx_progress, hx_roadmap, hx_history, hx_captures, hx_knowledge, hx_doctor
  - src/resources/skills/btw/SKILL.md — /btw skill for capturing timestamped notes to .hx/CAPTURES.md
  - src/resources/extensions/hx/codebase-generator.ts — full codebase map generation/update/read/stats API
  - src/resources/extensions/hx/commands-codebase.ts — /hx codebase generate|update|stats|help CLI handler
  - /hx codebase command wired into catalog, ops, bootstrap — fully addressable from /hx prompt
  - CODEBASE.md auto-generated on /hx init and injected into system context on startup
  - CodebaseMapPreferences in preferences-types.ts — exclude_patterns, max_files, collapse_threshold configurable
requires:
  - slice: S01
    provides: tsc clean baseline + HX naming infrastructure that S05 codebase-generator and readers import from
affects:
  - S06 — final bugfix slice can build on clean tsc+4215-test baseline established here; R016 (MCP readers) and R017 (/btw skill, codebase) are now satisfied pending S06 sign-off
key_files:
  - packages/mcp-server/src/readers/paths.ts
  - packages/mcp-server/src/readers/state.ts
  - packages/mcp-server/src/readers/roadmap.ts
  - packages/mcp-server/src/readers/metrics.ts
  - packages/mcp-server/src/readers/captures.ts
  - packages/mcp-server/src/readers/knowledge.ts
  - packages/mcp-server/src/readers/doctor-lite.ts
  - packages/mcp-server/src/readers/index.ts
  - packages/mcp-server/src/readers/readers.test.ts
  - packages/mcp-server/src/server.ts
  - packages/mcp-server/src/index.ts
  - src/resources/skills/btw/SKILL.md
  - src/resources/extensions/hx/codebase-generator.ts
  - src/resources/extensions/hx/commands-codebase.ts
  - src/resources/extensions/hx/tests/codebase-generator.test.ts
  - src/resources/extensions/hx/preferences-types.ts
  - src/resources/extensions/hx/paths.ts
  - src/resources/extensions/hx/commands/catalog.ts
  - src/resources/extensions/hx/commands/handlers/ops.ts
  - src/resources/extensions/hx/commands-bootstrap.ts
  - src/resources/extensions/hx/bootstrap/system-context.ts
  - src/resources/extensions/hx/init-wizard.ts
key_decisions:
  - All MCP reader tool handlers use synchronous invocation — reader functions return values not Promises
  - MCP readers tests live in packages/mcp-server (not hx/tests/) because imports are package-relative
  - generateCodebaseMap is fully synchronous — await in init-wizard.ts is harmless but retained for forward compatibility
  - codebaseBlock injected between knowledgeBlock and memoryBlock in system-context.ts, capped at 8000 chars
  - DEFAULT_EXCLUDE_PATTERNS uses .hx/ not .gsd/ throughout codebase-generator.ts
  - doctor-lite.ts remediation messages use /hx status (not /gsd status)
patterns_established:
  - MCP server reader tool registration pattern: server.tool(name, desc, {projectDir: z.string()}, async handler) with synchronous reader invocation inside
  - Non-fatal try/catch wrapping optional feature reads in system-context.ts (codebaseBlock, similar to knowledgeBlock, memoryBlock)
  - SKILL.md format for capture-style skills: frontmatter + objective + arguments + steps + constraints sections
  - hxRoot() probe in codebase-generator tests: tmp dirs need git init so hxRoot() doesn't walk up to the real repo root
observability_surfaces:
  - hx_doctor MCP tool exposes health check results (runDoctorLite) via MCP interface — external tools can now query project health without a running session
  - CODEBASE.md injected into system prompt with truncation notice at 8000 chars — agents see map size and truncation status
drill_down_paths:
  - .hx/milestones/M003-ttxmyu/slices/S05/tasks/T01-SUMMARY.md
  - .hx/milestones/M003-ttxmyu/slices/S05/tasks/T02-SUMMARY.md
  - .hx/milestones/M003-ttxmyu/slices/S05/tasks/T03-SUMMARY.md
  - .hx/milestones/M003-ttxmyu/slices/S05/tasks/T04-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-04-05T18:29:04.588Z
blocker_discovered: false
---

# S05: MCP Server Readers + Misc Features

**Ported 6 MCP read-only tools, /btw skill, and full /hx codebase subsystem from upstream — tsc clean, 4215 tests pass, 0 GSD refs in scope.**

## What Happened

S05 delivered three independent feature clusters from upstream gsd-2 commits 206ebf8c9, 7a046098b, 1b50a9477, 6b0c48945, and 45a48c4ae.

**T01 — MCP readers module (8 files, 31 tests):** Created `packages/mcp-server/src/readers/` from scratch with paths.ts (resolveHxRoot + filesystem helpers), state.ts (readProgress), roadmap.ts (readRoadmap), metrics.ts (readHistory), captures.ts (readCaptures), knowledge.ts (readKnowledge), doctor-lite.ts (runDoctorLite, /hx status in remediation messages), and a barrel index.ts. All GSD path strings and function names adapted to HX. Fixed one import bug during build (tmpdir from node:os not node:path). All 31 reader tests pass; 0 GSD refs in source.

**T02 — server.ts wiring + /btw skill:** Added 6 reader imports and 6 `server.tool()` registrations (hx_progress, hx_roadmap, hx_history, hx_captures, hx_knowledge, hx_doctor) to packages/mcp-server/src/server.ts after the existing hx_resolve_blocker tool. Updated index.ts with 17 function + 17 type re-exports from the readers barrel. MCP server now exposes 12 total tools. Created src/resources/skills/btw/SKILL.md (55 lines) following the established SKILL.md format for appending timestamped notes to .hx/CAPTURES.md.

**T03 — /hx codebase subsystem (8 files, 28 tests):** Created codebase-generator.ts with 6 exported functions (parseCodebaseMap, generateCodebaseMap, updateCodebaseMap, writeCodebaseMap, readCodebaseMap, getCodebaseMapStats), all synchronous, no GSD refs. Created commands-codebase.ts with generate/update/stats/help subcommands using loadEffectiveHXPreferences for preferences merging. Added CodebaseMapPreferences interface and codebase field to HXPreferences in preferences-types.ts. Added CODEBASE key to HX_ROOT_FILES and LEGACY_HX_ROOT_FILES in paths.ts. Wired catalog.ts nested completions, ops.ts dispatch, commands-bootstrap.ts TOP_LEVEL_SUBCOMMANDS. 28 tests using real tmp dirs with git init for hxRoot() probe compatibility.

**T04 — system-context.ts + init-wizard.ts wiring:** Added codebaseBlock injection in system-context.ts between knowledgeBlock and memoryBlock, capped at 8000 chars with truncation notice, non-fatal try/catch. Added codebase auto-generation on /hx init in init-wizard.ts, wrapped in non-fatal try/catch.

Final state: tsc --noEmit exits 0, npm run test:unit 4215/0/5, node --test packages/mcp-server/dist/readers/readers.test.js 31/0, 0 GSD refs in all 6 in-scope paths.

## Verification

Ran full slice-level verification gates:
1. `npx tsc --noEmit` → exit 0 (clean)
2. `npm run test:unit` → 4215 passed, 0 failed, 5 skipped
3. `node --test packages/mcp-server/dist/readers/readers.test.js` → 31 passed, 0 failed
4. `grep -rn '\bgsd\b|\bGSD\b' packages/mcp-server/src/readers/ src/resources/skills/btw/ src/resources/extensions/hx/codebase-generator.ts src/resources/extensions/hx/commands-codebase.ts src/resources/extensions/hx/bootstrap/system-context.ts src/resources/extensions/hx/init-wizard.ts | wc -l` → 0
5. `grep -c 'server.tool(' packages/mcp-server/dist/server.js` → 12 (6 original + 6 new readers)

## Requirements Advanced

- R016 — 6 read-only MCP tools (hx_progress, hx_roadmap, hx_history, hx_captures, hx_knowledge, hx_doctor) built and registered in server.ts; readers module with 31 passing tests
- R017 — /btw skill delivered as src/resources/skills/btw/SKILL.md; /hx codebase command fully implemented with generate/update/stats/help subcommands and CODEBASE.md system-prompt injection
- R014 — 0 GSD refs in all 6 in-scope source paths; all reader modules, skill, and codebase subsystem use HX naming throughout
- R018 — tsc --noEmit exits 0; 4215 tests pass, 0 failures — clean baseline delivered to S06

## Requirements Validated

- R016 — 6 MCP tools registered (grep -c 'server.tool(' dist/server.js → 12); 31 reader tests pass; 0 GSD refs in source

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

T01: 31 tests written instead of planned 33 — all 6 readers and helpers covered with equivalent depth.
T03: 28 tests written instead of planned 29 — one planned test folded into an existing test case.
T02: None. T04: None.

## Known Limitations

Pre-existing TS2307 errors for @hyperlab/hx-rpc-client in packages/mcp-server/src/session-manager.ts and types.ts persist — sibling package not linked locally in this dev environment. Unrelated to S05 changes.

## Follow-ups

S06 should audit the remaining ~20 upstream commits for bugfixes not yet ported (security overrides, ask-user-questions dedup, WAL/SHM orphan cleanup, steer worktree path fix, etc.) and mark R010/R014/R018 validated after final tsc+test pass.

## Files Created/Modified

- `packages/mcp-server/src/readers/paths.ts` — New: resolveHxRoot + filesystem navigation helpers
- `packages/mcp-server/src/readers/state.ts` — New: readProgress() — reads .hx/STATE.md and milestone filesystem
- `packages/mcp-server/src/readers/roadmap.ts` — New: readRoadmap() — parses ROADMAP.md slice tables
- `packages/mcp-server/src/readers/metrics.ts` — New: readHistory() — reads metrics.json
- `packages/mcp-server/src/readers/captures.ts` — New: readCaptures() — parses CAPTURES.md
- `packages/mcp-server/src/readers/knowledge.ts` — New: readKnowledge() — parses KNOWLEDGE.md
- `packages/mcp-server/src/readers/doctor-lite.ts` — New: runDoctorLite() — health checker with /hx status remediation messages
- `packages/mcp-server/src/readers/index.ts` — New: barrel re-export of all 6 readers + types
- `packages/mcp-server/src/readers/readers.test.ts` — New: 31 reader tests using Node built-in runner with real tmp-dir fixtures
- `packages/mcp-server/src/server.ts` — Modified: added 6 reader imports + 6 server.tool() registrations (hx_progress, hx_roadmap, hx_history, hx_captures, hx_knowledge, hx_doctor)
- `packages/mcp-server/src/index.ts` — Modified: added 17 function + 17 type re-exports from readers barrel
- `src/resources/skills/btw/SKILL.md` — New: /btw skill for capturing timestamped notes to .hx/CAPTURES.md
- `src/resources/extensions/hx/codebase-generator.ts` — New: 6-function codebase map API (parse/generate/update/write/read/stats)
- `src/resources/extensions/hx/commands-codebase.ts` — New: /hx codebase CLI handler with generate/update/stats/help subcommands
- `src/resources/extensions/hx/tests/codebase-generator.test.ts` — New: 28 codebase generator tests
- `src/resources/extensions/hx/preferences-types.ts` — Modified: added CodebaseMapPreferences interface + codebase field to HXPreferences
- `src/resources/extensions/hx/paths.ts` — Modified: added CODEBASE key to HX_ROOT_FILES and LEGACY_HX_ROOT_FILES
- `src/resources/extensions/hx/commands/catalog.ts` — Modified: added codebase nested completions to NESTED_COMPLETIONS map
- `src/resources/extensions/hx/commands/handlers/ops.ts` — Modified: added codebase dispatch block + handleCodebase import
- `src/resources/extensions/hx/commands-bootstrap.ts` — Modified: added codebase to TOP_LEVEL_SUBCOMMANDS
- `src/resources/extensions/hx/bootstrap/system-context.ts` — Modified: added codebaseBlock injection between knowledgeBlock and memoryBlock
- `src/resources/extensions/hx/init-wizard.ts` — Modified: added codebase auto-generation on /hx init
