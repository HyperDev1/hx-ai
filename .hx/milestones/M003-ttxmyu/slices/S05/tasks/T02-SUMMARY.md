---
id: T02
parent: S05
milestone: M003-ttxmyu
provides: []
requires: []
affects: []
key_files: ["packages/mcp-server/src/server.ts", "packages/mcp-server/src/index.ts", "src/resources/skills/btw/SKILL.md"]
key_decisions: ["All 6 reader tool handlers use synchronous invocation matching synchronous reader signatures", "/btw skill follows existing SKILL.md format with frontmatter objective arguments steps constraints"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "tsc: only pre-existing hx-rpc-client errors, zero new. dist/server.js has 12 server.tool() calls (6 original + 6 new). node --test dist/readers/readers.test.js: 31/31 pass. npm run test:unit: 4187 passed, 0 failed."
completed_at: 2026-04-05T18:16:05.923Z
blocker_discovered: false
---

# T02: Wired 6 reader tools into mcp-server server.ts, exported all readers from index.ts, and created the /btw skill

> Wired 6 reader tools into mcp-server server.ts, exported all readers from index.ts, and created the /btw skill

## What Happened
---
id: T02
parent: S05
milestone: M003-ttxmyu
key_files:
  - packages/mcp-server/src/server.ts
  - packages/mcp-server/src/index.ts
  - src/resources/skills/btw/SKILL.md
key_decisions:
  - All 6 reader tool handlers use synchronous invocation matching synchronous reader signatures
  - /btw skill follows existing SKILL.md format with frontmatter objective arguments steps constraints
duration: ""
verification_result: passed
completed_at: 2026-04-05T18:16:05.924Z
blocker_discovered: false
---

# T02: Wired 6 reader tools into mcp-server server.ts, exported all readers from index.ts, and created the /btw skill

**Wired 6 reader tools into mcp-server server.ts, exported all readers from index.ts, and created the /btw skill**

## What Happened

Added 6 reader imports and 6 server.tool() registrations (hx_progress, hx_roadmap, hx_history, hx_captures, hx_knowledge, hx_doctor) to packages/mcp-server/src/server.ts after the existing hx_resolve_blocker tool. Updated index.ts doc comment and added 17 function + 17 type exports from readers/index.js. Created src/resources/skills/btw/SKILL.md (55 lines) following existing skill format for appending timestamped notes to .hx/CAPTURES.md. No new TS errors introduced — only pre-existing hx-rpc-client TS2307 remain.

## Verification

tsc: only pre-existing hx-rpc-client errors, zero new. dist/server.js has 12 server.tool() calls (6 original + 6 new). node --test dist/readers/readers.test.js: 31/31 pass. npm run test:unit: 4187 passed, 0 failed.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cd packages/mcp-server && npx tsc 2>&1 | grep -vc hx-rpc-client` | 0 | ✅ pass (0 new errors) | 4900ms |
| 2 | `grep -c 'server\.tool(' packages/mcp-server/dist/server.js` | 0 | ✅ pass (12 registrations) | 100ms |
| 3 | `node --test packages/mcp-server/dist/readers/readers.test.js` | 0 | ✅ pass (31/31) | 298ms |
| 4 | `npm run test:unit` | 0 | ✅ pass (4187 passed, 0 failed) | 73100ms |


## Deviations

None.

## Known Issues

Pre-existing TS2307 for @hyperlab/hx-rpc-client in session-manager.ts and types.ts — sibling package not linked locally.

## Files Created/Modified

- `packages/mcp-server/src/server.ts`
- `packages/mcp-server/src/index.ts`
- `src/resources/skills/btw/SKILL.md`


## Deviations
None.

## Known Issues
Pre-existing TS2307 for @hyperlab/hx-rpc-client in session-manager.ts and types.ts — sibling package not linked locally.
