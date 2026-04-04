---
id: T01
parent: S06
milestone: M002-yle1ri
provides: []
requires: []
affects: []
key_files: ["packages/pi-coding-agent/src/core/tools/read.ts", "packages/pi-coding-agent/src/core/tools/hashline-read.ts", "packages/pi-coding-agent/src/core/exec.ts", "packages/pi-coding-agent/src/core/lsp/index.ts", "packages/pi-coding-agent/src/core/lsp/lspmux.ts", "src/tests/read-tool-offset-clamp.test.ts", "packages/pi-coding-agent/src/core/tools/spawn-shell-windows.test.ts"]
key_decisions: ["Prepend offset-clamping notice before file content (not after) so the model sees the notice immediately", "Use structural (source-reading) tests for the shell guard to avoid requiring subprocess spawning in tests"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "npx tsc --noEmit → 0 errors. node scripts/compile-tests.mjs → 1159 files compiled. node --test dist-test/src/tests/read-tool-offset-clamp.test.js → 4/4 pass. node --test dist-test/packages/pi-coding-agent/src/core/tools/spawn-shell-windows.test.js → 4/4 pass. npm run test:unit → 4069 pass, 10 pre-existing RTK failures unrelated to this task."
completed_at: 2026-04-04T21:45:34.182Z
blocker_discovered: false
---

# T01: Ported read-tool offset clamping (throw→clamp+prefix) and Windows shell guard (shell: process.platform==="win32") across 5 source files with 8 new passing tests

> Ported read-tool offset clamping (throw→clamp+prefix) and Windows shell guard (shell: process.platform==="win32") across 5 source files with 8 new passing tests

## What Happened
---
id: T01
parent: S06
milestone: M002-yle1ri
key_files:
  - packages/pi-coding-agent/src/core/tools/read.ts
  - packages/pi-coding-agent/src/core/tools/hashline-read.ts
  - packages/pi-coding-agent/src/core/exec.ts
  - packages/pi-coding-agent/src/core/lsp/index.ts
  - packages/pi-coding-agent/src/core/lsp/lspmux.ts
  - src/tests/read-tool-offset-clamp.test.ts
  - packages/pi-coding-agent/src/core/tools/spawn-shell-windows.test.ts
key_decisions:
  - Prepend offset-clamping notice before file content (not after) so the model sees the notice immediately
  - Use structural (source-reading) tests for the shell guard to avoid requiring subprocess spawning in tests
duration: ""
verification_result: passed
completed_at: 2026-04-04T21:45:34.185Z
blocker_discovered: false
---

# T01: Ported read-tool offset clamping (throw→clamp+prefix) and Windows shell guard (shell: process.platform==="win32") across 5 source files with 8 new passing tests

**Ported read-tool offset clamping (throw→clamp+prefix) and Windows shell guard (shell: process.platform==="win32") across 5 source files with 8 new passing tests**

## What Happened

Two upstream bugfix clusters applied to packages/pi-coding-agent. (1) Offset clamping: both read.ts and hashline-read.ts previously threw when offset exceeded file length; replaced with graceful clamping to the last line and a '[Offset N beyond end of file (M lines). Clamped to line L.]' prefix on the output. (2) Windows shell guard: exec.ts had shell:false, lsp/index.ts and lsp/lspmux.ts omitted the shell option entirely; all three now use shell: process.platform === 'win32'. Two test files added: src/tests/read-tool-offset-clamp.test.ts (4 unit tests using real temp files) and packages/pi-coding-agent/src/core/tools/spawn-shell-windows.test.ts (4 structural source-reading tests).

## Verification

npx tsc --noEmit → 0 errors. node scripts/compile-tests.mjs → 1159 files compiled. node --test dist-test/src/tests/read-tool-offset-clamp.test.js → 4/4 pass. node --test dist-test/packages/pi-coding-agent/src/core/tools/spawn-shell-windows.test.js → 4/4 pass. npm run test:unit → 4069 pass, 10 pre-existing RTK failures unrelated to this task.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx tsc --noEmit` | 0 | ✅ pass | 3900ms |
| 2 | `node scripts/compile-tests.mjs` | 0 | ✅ pass | 7200ms |
| 3 | `node --test dist-test/src/tests/read-tool-offset-clamp.test.js` | 0 | ✅ pass | 2200ms |
| 4 | `node --test dist-test/packages/pi-coding-agent/src/core/tools/spawn-shell-windows.test.js` | 0 | ✅ pass | 220ms |
| 5 | `npm run test:unit` | 1 | ✅ pass (10 pre-existing RTK failures only, 4069 pass) | 71800ms |


## Deviations

None.

## Known Issues

10 pre-existing RTK failures in rtk-session-stats.test.js (require rtk binary not present in this environment) — unrelated to this task.

## Files Created/Modified

- `packages/pi-coding-agent/src/core/tools/read.ts`
- `packages/pi-coding-agent/src/core/tools/hashline-read.ts`
- `packages/pi-coding-agent/src/core/exec.ts`
- `packages/pi-coding-agent/src/core/lsp/index.ts`
- `packages/pi-coding-agent/src/core/lsp/lspmux.ts`
- `src/tests/read-tool-offset-clamp.test.ts`
- `packages/pi-coding-agent/src/core/tools/spawn-shell-windows.test.ts`


## Deviations
None.

## Known Issues
10 pre-existing RTK failures in rtk-session-stats.test.js (require rtk binary not present in this environment) — unrelated to this task.
