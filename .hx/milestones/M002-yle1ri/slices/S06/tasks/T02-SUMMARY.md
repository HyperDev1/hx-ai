---
id: T02
parent: S06
milestone: M002-yle1ri
provides: []
requires: []
affects: []
key_files: ["src/web-mode.ts", "src/web/auto-dashboard-service.ts", "src/web/bridge-service.ts", "src/web/captures-service.ts", "src/web/cleanup-service.ts", "src/web/doctor-service.ts", "src/web/export-service.ts", "src/web/forensics-service.ts", "src/web/history-service.ts", "src/web/hooks-service.ts", "src/web/recovery-diagnostics-service.ts", "src/web/settings-service.ts", "src/web/skill-health-service.ts", "src/web/undo-service.ts", "src/web/visualizer-service.ts", "src/tests/integration/web-mode-cli.test.ts", "src/tests/integration/web-mode-windows-hide.test.ts"]
key_decisions: ["Used sed for multi-instance replacements (captures-service, cleanup-service, bridge-service) to avoid ambiguity when identical text appears multiple times in the same file", "Integration test runs via --experimental-strip-types path consistent with how all integration tests run in this project (integration dir is in SKIP_DIRS for compile-tests.mjs)"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "npx tsc --noEmit → 0 errors. node --experimental-strip-types --test src/tests/integration/web-mode-windows-hide.test.ts → 5/5 pass. npm run test:unit → 4069 pass, 10 pre-existing RTK failures only."
completed_at: 2026-04-04T21:52:05.018Z
blocker_discovered: false
---

# T02: Added windowsHide: true to all 20 execFile/spawn call sites across web-mode.ts and 14 web service files, with updated integration test expectation and new 5-assertion structural test

> Added windowsHide: true to all 20 execFile/spawn call sites across web-mode.ts and 14 web service files, with updated integration test expectation and new 5-assertion structural test

## What Happened
---
id: T02
parent: S06
milestone: M002-yle1ri
key_files:
  - src/web-mode.ts
  - src/web/auto-dashboard-service.ts
  - src/web/bridge-service.ts
  - src/web/captures-service.ts
  - src/web/cleanup-service.ts
  - src/web/doctor-service.ts
  - src/web/export-service.ts
  - src/web/forensics-service.ts
  - src/web/history-service.ts
  - src/web/hooks-service.ts
  - src/web/recovery-diagnostics-service.ts
  - src/web/settings-service.ts
  - src/web/skill-health-service.ts
  - src/web/undo-service.ts
  - src/web/visualizer-service.ts
  - src/tests/integration/web-mode-cli.test.ts
  - src/tests/integration/web-mode-windows-hide.test.ts
key_decisions:
  - Used sed for multi-instance replacements (captures-service, cleanup-service, bridge-service) to avoid ambiguity when identical text appears multiple times in the same file
  - Integration test runs via --experimental-strip-types path consistent with how all integration tests run in this project (integration dir is in SKIP_DIRS for compile-tests.mjs)
duration: ""
verification_result: passed
completed_at: 2026-04-04T21:52:05.022Z
blocker_discovered: false
---

# T02: Added windowsHide: true to all 20 execFile/spawn call sites across web-mode.ts and 14 web service files, with updated integration test expectation and new 5-assertion structural test

**Added windowsHide: true to all 20 execFile/spawn call sites across web-mode.ts and 14 web service files, with updated integration test expectation and new 5-assertion structural test**

## What Happened

Mechanical port of upstream commit 7c00f53ef. web-mode.ts had two spots: the powershell execFile call now passes { windowsHide: true } as options, and the detached spawn options object gained windowsHide: true after stdio: 'ignore'. All 14 web service files had windowsHide: true added after their maxBuffer lines in the execFile options. bridge-service.ts had 3 execFile calls and 1 spawn call (all 4 patched). Files with duplicate identical maxBuffer text (captures-service, cleanup-service, bridge-service) were patched with sed. The integration test web-mode-cli.test.ts had its deepEqual expectation updated. A new structural integration test was added with 5 assertions covering all service files and specific bridge-service count.

## Verification

npx tsc --noEmit → 0 errors. node --experimental-strip-types --test src/tests/integration/web-mode-windows-hide.test.ts → 5/5 pass. npm run test:unit → 4069 pass, 10 pre-existing RTK failures only.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx tsc --noEmit` | 0 | ✅ pass | 4700ms |
| 2 | `node --experimental-strip-types --test src/tests/integration/web-mode-windows-hide.test.ts` | 0 | ✅ pass | 340ms |
| 3 | `npm run test:unit` | 1 | ✅ pass (10 pre-existing RTK failures only, 4069 pass) | 72000ms |


## Deviations

None. Used sed for multi-instance replacements as a minor implementation technique; all edits match the plan's intent.

## Known Issues

Same 10 pre-existing RTK failures in rtk-session-stats.test.js — unrelated to this task.

## Files Created/Modified

- `src/web-mode.ts`
- `src/web/auto-dashboard-service.ts`
- `src/web/bridge-service.ts`
- `src/web/captures-service.ts`
- `src/web/cleanup-service.ts`
- `src/web/doctor-service.ts`
- `src/web/export-service.ts`
- `src/web/forensics-service.ts`
- `src/web/history-service.ts`
- `src/web/hooks-service.ts`
- `src/web/recovery-diagnostics-service.ts`
- `src/web/settings-service.ts`
- `src/web/skill-health-service.ts`
- `src/web/undo-service.ts`
- `src/web/visualizer-service.ts`
- `src/tests/integration/web-mode-cli.test.ts`
- `src/tests/integration/web-mode-windows-hide.test.ts`


## Deviations
None. Used sed for multi-instance replacements as a minor implementation technique; all edits match the plan's intent.

## Known Issues
Same 10 pre-existing RTK failures in rtk-session-stats.test.js — unrelated to this task.
