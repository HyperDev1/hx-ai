---
id: T04
parent: S05
milestone: M002-yle1ri
provides: []
requires: []
affects: []
key_files: ["src/resources/extensions/hx/doctor-git-checks.ts", "src/resources/extensions/hx/doctor.ts", "src/resources/extensions/hx/parsers-legacy.ts", "src/resources/extensions/hx/tests/doctor-false-positives.test.ts"]
key_decisions: ["Test file placed in flat tests/ (not tests/integration/) because compile-tests.mjs SKIP_DIRS excludes integration/", "parsers-legacy second-pass uses knownIds Set dedup; native parser returns early so second-pass only activates in legacy fallback", "blocker check proximity threshold set to 700 chars based on measured distance of ~529 chars in actual file"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "npx tsc --noEmit: 0 errors. node scripts/compile-tests.mjs: 1186 files compiled. node --test doctor-false-positives.test.js: 9/9 pass. node --test derive-state-db.test.js: 28/28 pass. Prior forensics tests (40/40): all pass."
completed_at: 2026-04-04T18:22:31.336Z
blocker_discovered: false
---

# T04: Applied 3 doctor accuracy fixes (isDoctorArtifactOnly guard, !allTasksDone blocker guard, parsers-legacy second-pass) with 9/9 new tests + 28/28 derive-state-db regression tests all passing.

> Applied 3 doctor accuracy fixes (isDoctorArtifactOnly guard, !allTasksDone blocker guard, parsers-legacy second-pass) with 9/9 new tests + 28/28 derive-state-db regression tests all passing.

## What Happened
---
id: T04
parent: S05
milestone: M002-yle1ri
key_files:
  - src/resources/extensions/hx/doctor-git-checks.ts
  - src/resources/extensions/hx/doctor.ts
  - src/resources/extensions/hx/parsers-legacy.ts
  - src/resources/extensions/hx/tests/doctor-false-positives.test.ts
key_decisions:
  - Test file placed in flat tests/ (not tests/integration/) because compile-tests.mjs SKIP_DIRS excludes integration/
  - parsers-legacy second-pass uses knownIds Set dedup; native parser returns early so second-pass only activates in legacy fallback
  - blocker check proximity threshold set to 700 chars based on measured distance of ~529 chars in actual file
duration: ""
verification_result: passed
completed_at: 2026-04-04T18:22:31.339Z
blocker_discovered: false
---

# T04: Applied 3 doctor accuracy fixes (isDoctorArtifactOnly guard, !allTasksDone blocker guard, parsers-legacy second-pass) with 9/9 new tests + 28/28 derive-state-db regression tests all passing.

**Applied 3 doctor accuracy fixes (isDoctorArtifactOnly guard, !allTasksDone blocker guard, parsers-legacy second-pass) with 9/9 new tests + 28/28 derive-state-db regression tests all passing.**

## What Happened

The auto-fix trigger was a gate path issue from T03 (forensics-context-persist.test.js run from project root instead of worktree). T04 implemented: (1) isDoctorArtifactOnly helper + guard in doctor-git-checks.ts to skip directories containing only doctor-history.jsonl before pushing worktree_directory_orphaned; (2) !allTasksDone condition added to blocker check in doctor.ts to suppress false-positive blocker_discovered_no_replan when all tasks already completed; (3) parsers-legacy.ts second-pass scan with knownIds Set to pick up task checkboxes outside the extractSection('Tasks') boundary. Test file placed in flat tests/ directory (not tests/integration/) because compile-tests.mjs explicitly excludes the integration/ subdir via SKIP_DIRS.

## Verification

npx tsc --noEmit: 0 errors. node scripts/compile-tests.mjs: 1186 files compiled. node --test doctor-false-positives.test.js: 9/9 pass. node --test derive-state-db.test.js: 28/28 pass. Prior forensics tests (40/40): all pass.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cd .hx/worktrees/M002-yle1ri && npx tsc --noEmit` | 0 | ✅ pass | 6900ms |
| 2 | `node scripts/compile-tests.mjs` | 0 | ✅ pass | 4090ms |
| 3 | `node --test dist-test/src/resources/extensions/hx/tests/doctor-false-positives.test.js` | 0 | ✅ pass | 380ms |
| 4 | `node --test dist-test/src/resources/extensions/hx/tests/derive-state-db.test.js` | 0 | ✅ pass | 475ms |
| 5 | `node --test forensics-context-persist + forensics-db-completion + hook-key-parsing` | 0 | ✅ pass | 1828ms |


## Deviations

Test file in tests/ (not tests/integration/) due to compile-tests.mjs SKIP_DIRS exclusion. Proximity threshold 700 chars (500 was too tight at 529 actual distance). Test mock uses ## H2 heading to push T02 outside Tasks section boundary.

## Known Issues

S05 verification gate runs paths relative to project root; must be run with `cd .hx/worktrees/M002-yle1ri` prefix.

## Files Created/Modified

- `src/resources/extensions/hx/doctor-git-checks.ts`
- `src/resources/extensions/hx/doctor.ts`
- `src/resources/extensions/hx/parsers-legacy.ts`
- `src/resources/extensions/hx/tests/doctor-false-positives.test.ts`


## Deviations
Test file in tests/ (not tests/integration/) due to compile-tests.mjs SKIP_DIRS exclusion. Proximity threshold 700 chars (500 was too tight at 529 actual distance). Test mock uses ## H2 heading to push T02 outside Tasks section boundary.

## Known Issues
S05 verification gate runs paths relative to project root; must be run with `cd .hx/worktrees/M002-yle1ri` prefix.
