---
id: T03
parent: S05
milestone: M003-ttxmyu
provides: []
requires: []
affects: []
key_files: ["src/resources/extensions/hx/codebase-generator.ts", "src/resources/extensions/hx/commands-codebase.ts", "src/resources/extensions/hx/tests/codebase-generator.test.ts", "src/resources/extensions/hx/preferences-types.ts", "src/resources/extensions/hx/paths.ts", "src/resources/extensions/hx/commands/catalog.ts", "src/resources/extensions/hx/commands/handlers/ops.ts", "src/resources/extensions/hx/commands-bootstrap.ts"]
key_decisions: ["generateCodebaseMap is fully synchronous — no async needed for filesystem scan", "DEFAULT_EXCLUDE_PATTERNS covers .hx/ not .gsd/", "collapseThreshold=3 default keeps map readable without excessive nesting", "Wired via ops.ts static import (not dynamic) since codebase is a core command"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "npx tsc --noEmit: EXIT 0. npm run test:unit: 4215 passed, 0 failed (was 4187 — 28 new tests)."
completed_at: 2026-04-05T18:21:45.171Z
blocker_discovered: false
---

# T03: Ported full /hx codebase subsystem: codebase-generator.ts, commands-codebase.ts, 6 wiring changes, 28 new tests — tsc exits 0, 4215 tests pass

> Ported full /hx codebase subsystem: codebase-generator.ts, commands-codebase.ts, 6 wiring changes, 28 new tests — tsc exits 0, 4215 tests pass

## What Happened
---
id: T03
parent: S05
milestone: M003-ttxmyu
key_files:
  - src/resources/extensions/hx/codebase-generator.ts
  - src/resources/extensions/hx/commands-codebase.ts
  - src/resources/extensions/hx/tests/codebase-generator.test.ts
  - src/resources/extensions/hx/preferences-types.ts
  - src/resources/extensions/hx/paths.ts
  - src/resources/extensions/hx/commands/catalog.ts
  - src/resources/extensions/hx/commands/handlers/ops.ts
  - src/resources/extensions/hx/commands-bootstrap.ts
key_decisions:
  - generateCodebaseMap is fully synchronous — no async needed for filesystem scan
  - DEFAULT_EXCLUDE_PATTERNS covers .hx/ not .gsd/
  - collapseThreshold=3 default keeps map readable without excessive nesting
  - Wired via ops.ts static import (not dynamic) since codebase is a core command
duration: ""
verification_result: passed
completed_at: 2026-04-05T18:21:45.173Z
blocker_discovered: false
---

# T03: Ported full /hx codebase subsystem: codebase-generator.ts, commands-codebase.ts, 6 wiring changes, 28 new tests — tsc exits 0, 4215 tests pass

**Ported full /hx codebase subsystem: codebase-generator.ts, commands-codebase.ts, 6 wiring changes, 28 new tests — tsc exits 0, 4215 tests pass**

## What Happened

Created codebase-generator.ts with parseCodebaseMap/generateCodebaseMap/updateCodebaseMap/writeCodebaseMap/readCodebaseMap/getCodebaseMapStats (all synchronous, no GSD refs). Created commands-codebase.ts with generate/update/stats/help subcommands using loadEffectiveHXPreferences for preferences merge. Added CodebaseMapPreferences interface and codebase field to HXPreferences in preferences-types.ts. Added CODEBASE key to HX_ROOT_FILES and LEGACY_HX_ROOT_FILES in paths.ts. Wired catalog.ts nested completions, ops.ts dispatch block, commands-bootstrap.ts TOP_LEVEL_SUBCOMMANDS. Created 28-test file using real tmp dirs with git init for hxRoot() probe compatibility.

## Verification

npx tsc --noEmit: EXIT 0. npm run test:unit: 4215 passed, 0 failed (was 4187 — 28 new tests).

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx tsc --noEmit` | 0 | ✅ pass | 4500ms |
| 2 | `npm run test:unit` | 0 | ✅ pass (4215 passed, 0 failed) | 73800ms |


## Deviations

28 tests instead of 29 — one planned test folded into an existing test case.

## Known Issues

None.

## Files Created/Modified

- `src/resources/extensions/hx/codebase-generator.ts`
- `src/resources/extensions/hx/commands-codebase.ts`
- `src/resources/extensions/hx/tests/codebase-generator.test.ts`
- `src/resources/extensions/hx/preferences-types.ts`
- `src/resources/extensions/hx/paths.ts`
- `src/resources/extensions/hx/commands/catalog.ts`
- `src/resources/extensions/hx/commands/handlers/ops.ts`
- `src/resources/extensions/hx/commands-bootstrap.ts`


## Deviations
28 tests instead of 29 — one planned test folded into an existing test case.

## Known Issues
None.
