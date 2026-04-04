---
id: T04
parent: S05
milestone: M002-yle1ri
provides: []
key_files:
  - src/resources/extensions/hx/doctor-git-checks.ts
  - src/resources/extensions/hx/doctor.ts
  - src/resources/extensions/hx/parsers-legacy.ts
  - src/resources/extensions/hx/tests/integration/doctor-false-positives.test.ts
  - scripts/compile-tests.mjs
key_decisions:
  - "Test placed in tests/integration/ (per task plan) with correct ../../ relative imports; compile-tests.mjs SKIP_DIRS excludes that dir so a targeted esbuild step was added at end of compile-tests.mjs for all .test.ts files under tests/integration/"
  - "parsers-legacy second-pass uses body lines scan with knownIds Set to dedup; native parser path returns early so second-pass only applies in legacy TS fallback path"
  - "Test mock for second-pass uses ## T02 Details (H2 heading) to push T02 outside extractSection('Tasks') boundary"
  - "blocker check proximity threshold set to 700 chars (measured ~529 chars between !allTasksDone guard and blocker_discovered_no_replan push)"
patterns_established:
  - "New unit-style tests in tests/integration/ are automatically compiled by compile-tests.mjs via the dedicated integration step added at end of main()"
observability_surfaces: []
duration: ""
verification_result: passed
completed_at: 2026-04-04T20:15:00.000Z
blocker_discovered: false
---

# T04: Doctor false-positive fixes: orphaned worktree, blocker-resolved guard, parsers-legacy second-pass

**Applied 3 doctor accuracy fixes (isDoctorArtifactOnly guard, !allTasksDone blocker guard, parsers-legacy second-pass) with 9/9 new tests at tests/integration/ path + 28/28 derive-state-db regression tests all passing.**

## What Happened

The auto-fix was triggered because the gate ran `node --test dist-test/src/.../tests/integration/doctor-false-positives.test.js` but that file didn't exist — compile-tests.mjs explicitly skips the `integration/` subdirectory via `SKIP_DIRS`. T04 proper was implemented:

**doctor-git-checks.ts**: Added exported `isDoctorArtifactOnly(dirPath: string): boolean` helper that reads directory entries with `readdirSync` and returns true if length is 0 or the only entry is `"doctor-history.jsonl"`. Added guard `if (isDoctorArtifactOnly(fullPath)) continue;` before pushing `worktree_directory_orphaned`, preventing false-positive alerts on directories containing only the doctor's own artifact file.

**doctor.ts**: Changed `if (!replanPath)` → `if (!replanPath && !allTasksDone)` so `blocker_discovered_no_replan` only fires when there's no replan AND not all tasks are done. Previously it would warn even when all tasks had already completed (implicitly resolving the blocker).

**parsers-legacy.ts**: Added second-pass block after the Tasks section first-pass in `_parsePlanImpl`. Builds `knownIds = new Set<string>(tasks.map(t => t.id))` from first pass then iterates all body lines looking for checkbox lines (`- [x] **TXX:`). Adds any task ID not already in knownIds. Catches task checkboxes that appear outside the `## Tasks` section boundary (e.g., after a sibling `## Detail` heading).

**tests/integration/doctor-false-positives.test.ts**: Created in `tests/integration/` per task plan spec with correct `../../` relative imports (two levels up from `tests/integration/` reaches `hx/` where the modules live). The compile-tests.mjs `SKIP_DIRS` excluded this directory, so a targeted esbuild compile step was added at the end of `compile-tests.mjs`'s `main()` function to compile all `.test.ts` files under `src/.../tests/integration/`. This makes the integration test compilation persistent across re-runs.

**scripts/compile-tests.mjs**: Added integration test compilation step that uses esbuild to compile all `.test.ts` files from `tests/integration/` into `dist-test/.../tests/integration/`, then copies `.ts` sources alongside the compiled output.

## Verification

`npx tsc --noEmit`: 0 errors. `node scripts/compile-tests.mjs`: 1186 files compiled + integration tests. `node --test dist-test/.../tests/integration/doctor-false-positives.test.js`: 9/9 pass. `node --test dist-test/.../derive-state-db.test.js`: 28/28 pass.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cd .hx/worktrees/M002-yle1ri && npx tsc --noEmit` | 0 | ✅ pass | 6900ms |
| 2 | `node scripts/compile-tests.mjs` | 0 | ✅ pass | 4470ms |
| 3 | `node --test dist-test/src/resources/extensions/hx/tests/integration/doctor-false-positives.test.js` | 0 | ✅ pass | 369ms |
| 4 | `node --test dist-test/src/resources/extensions/hx/tests/derive-state-db.test.js` | 0 | ✅ pass | 534ms |

## Diagnostics

- `isDoctorArtifactOnly` is exported from doctor-git-checks.ts and importable via `../../doctor-git-checks.js` from the integration test.
- Second-pass in parsers-legacy only activates when native parser returns null (legacy fallback path). Normal plan files use the native parser and return before the second-pass block.
- Integration test compilation is now part of compile-tests.mjs via the step at the end of `main()`.

## Deviations

1. `scripts/compile-tests.mjs` modified to add targeted integration test compilation — not mentioned in the task plan but required to make the plan's verify command work persistently.
2. Proximity threshold in blocker-check test is 700 chars (measured actual distance ~529 chars between `!allTasksDone` and `blocker_discovered_no_replan`).
3. Test mock for parsers-legacy second-pass uses `## T02 Details` (H2) to push T02 outside Tasks section boundary rather than a `### T02:` heading (which stays inside the Tasks section under `extractSection`).

## Known Issues

None.
