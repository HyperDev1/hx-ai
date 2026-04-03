---
id: T02
parent: S04
milestone: M001-df6x5t
provides: []
requires: []
affects: []
key_files: ["native/scripts/build.js", "packages/native/src/__tests__/clipboard.test.mjs", "packages/native/src/__tests__/diff.test.mjs", "packages/native/src/__tests__/fd.test.mjs", "packages/native/src/__tests__/glob.test.mjs", "packages/native/src/__tests__/grep.test.mjs", "packages/native/src/__tests__/highlight.test.mjs", "packages/native/src/__tests__/html.test.mjs", "packages/native/src/__tests__/image.test.mjs", "packages/native/src/__tests__/json-parse.test.mjs", "packages/native/src/__tests__/ps.test.mjs", "packages/native/src/__tests__/text.test.mjs", "packages/native/src/__tests__/truncate.test.mjs", "packages/native/src/__tests__/ttsr.test.mjs", "src/tests/initial-hx-header-filter.test.ts", "src/tests/hx-web-launcher-contract.test.ts", "scripts/recover-hx-1364.sh", "scripts/recover-hx-1364.ps1", "scripts/recover-hx-1668.sh", "scripts/recover-hx-1668.ps1", "src/resources/skills/create-skill/references/hx-skill-ecosystem.md"]
key_decisions: ["Used sed -i '' loop for bulk .mjs file renames (consistent with T01 approach); git mv for file renames to preserve git history"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "All four T02 verification checks plus all four slice-level checks passed: grep for gsd_engine in build.js and __tests__/ returned 0; old file absence checks passed; new file presence checks passed; npm run typecheck:extensions exited 0 in 13.4s. All slice-level grep checks (native/crates/engine/src, native/npm, 3 TS bridge files) also returned 0."
completed_at: 2026-04-03T21:22:01.366Z
blocker_discovered: false
---

# T02: Replaced all gsd_engine path strings in build.js and 15 test .mjs files; git-mv'd 7 gsd-named files to hx-* equivalents; all 4 slice verification checks pass

> Replaced all gsd_engine path strings in build.js and 15 test .mjs files; git-mv'd 7 gsd-named files to hx-* equivalents; all 4 slice verification checks pass

## What Happened
---
id: T02
parent: S04
milestone: M001-df6x5t
key_files:
  - native/scripts/build.js
  - packages/native/src/__tests__/clipboard.test.mjs
  - packages/native/src/__tests__/diff.test.mjs
  - packages/native/src/__tests__/fd.test.mjs
  - packages/native/src/__tests__/glob.test.mjs
  - packages/native/src/__tests__/grep.test.mjs
  - packages/native/src/__tests__/highlight.test.mjs
  - packages/native/src/__tests__/html.test.mjs
  - packages/native/src/__tests__/image.test.mjs
  - packages/native/src/__tests__/json-parse.test.mjs
  - packages/native/src/__tests__/ps.test.mjs
  - packages/native/src/__tests__/text.test.mjs
  - packages/native/src/__tests__/truncate.test.mjs
  - packages/native/src/__tests__/ttsr.test.mjs
  - src/tests/initial-hx-header-filter.test.ts
  - src/tests/hx-web-launcher-contract.test.ts
  - scripts/recover-hx-1364.sh
  - scripts/recover-hx-1364.ps1
  - scripts/recover-hx-1668.sh
  - scripts/recover-hx-1668.ps1
  - src/resources/skills/create-skill/references/hx-skill-ecosystem.md
key_decisions:
  - Used sed -i '' loop for bulk .mjs file renames (consistent with T01 approach); git mv for file renames to preserve git history
duration: ""
verification_result: passed
completed_at: 2026-04-03T21:22:01.367Z
blocker_discovered: false
---

# T02: Replaced all gsd_engine path strings in build.js and 15 test .mjs files; git-mv'd 7 gsd-named files to hx-* equivalents; all 4 slice verification checks pass

**Replaced all gsd_engine path strings in build.js and 15 test .mjs files; git-mv'd 7 gsd-named files to hx-* equivalents; all 4 slice verification checks pass**

## What Happened

Applied sed -i '' 's/gsd_engine/hx_engine/g' to native/scripts/build.js (2 hits on lines 75–76) and looped across all 15 *.test.mjs files in packages/native/src/__tests__/ (plan listed 13, but 2 additional files stream-process.test.mjs and xxhash.test.mjs also existed — the loop handled them cleanly). Used git mv to rename: src/tests/initial-gsd-header-filter.test.ts → initial-hx-header-filter.test.ts, src/tests/gsd-web-launcher-contract.test.ts → hx-web-launcher-contract.test.ts, scripts/recover-gsd-1364.sh/ps1 → recover-hx-1364.sh/ps1, scripts/recover-gsd-1668.sh/ps1 → recover-hx-1668.sh/ps1, and src/resources/skills/create-skill/references/gsd-skill-ecosystem.md → hx-skill-ecosystem.md. PowerShell internal variable content ($gsdDir, $GsdIsSymlink) intentionally deferred to S05 per plan note.

## Verification

All four T02 verification checks plus all four slice-level checks passed: grep for gsd_engine in build.js and __tests__/ returned 0; old file absence checks passed; new file presence checks passed; npm run typecheck:extensions exited 0 in 13.4s. All slice-level grep checks (native/crates/engine/src, native/npm, 3 TS bridge files) also returned 0.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `grep -rn 'gsd_engine' native/scripts/build.js packages/native/src/__tests__/ | wc -l` | 0 | ✅ pass | 50ms |
| 2 | `test ! -f src/tests/initial-gsd-header-filter.test.ts && test ! -f src/tests/gsd-web-launcher-contract.test.ts && test ! -f scripts/recover-gsd-1364.sh` | 0 | ✅ pass | 10ms |
| 3 | `test -f src/tests/initial-hx-header-filter.test.ts && test -f src/tests/hx-web-launcher-contract.test.ts && test -f scripts/recover-hx-1364.sh && test -f src/resources/skills/create-skill/references/hx-skill-ecosystem.md` | 0 | ✅ pass | 10ms |
| 4 | `npm run typecheck:extensions` | 0 | ✅ pass | 13400ms |
| 5 | `grep -rn 'gsd|GSD|Gsd' native/crates/engine/src/ | wc -l` | 0 | ✅ pass | 30ms |
| 6 | `grep -rn 'gsd|GSD|Gsd' native/npm/ | wc -l` | 0 | ✅ pass | 20ms |
| 7 | `grep -n 'gsd|GSD|Gsd' src/resources/extensions/hx/native-parser-bridge.ts packages/native/src/hx-parser/index.ts packages/native/src/native.ts | wc -l` | 0 | ✅ pass | 10ms |


## Deviations

Plan listed 13 .mjs test files but __tests__/ contains 15 (stream-process.test.mjs and xxhash.test.mjs were extras). The for-loop glob covered all automatically.

## Known Issues

The .ps1 script internal variable names ($gsdDir, $GsdIsSymlink) retain the gsd prefix — deferred to S05 per task plan.

## Files Created/Modified

- `native/scripts/build.js`
- `packages/native/src/__tests__/clipboard.test.mjs`
- `packages/native/src/__tests__/diff.test.mjs`
- `packages/native/src/__tests__/fd.test.mjs`
- `packages/native/src/__tests__/glob.test.mjs`
- `packages/native/src/__tests__/grep.test.mjs`
- `packages/native/src/__tests__/highlight.test.mjs`
- `packages/native/src/__tests__/html.test.mjs`
- `packages/native/src/__tests__/image.test.mjs`
- `packages/native/src/__tests__/json-parse.test.mjs`
- `packages/native/src/__tests__/ps.test.mjs`
- `packages/native/src/__tests__/text.test.mjs`
- `packages/native/src/__tests__/truncate.test.mjs`
- `packages/native/src/__tests__/ttsr.test.mjs`
- `src/tests/initial-hx-header-filter.test.ts`
- `src/tests/hx-web-launcher-contract.test.ts`
- `scripts/recover-hx-1364.sh`
- `scripts/recover-hx-1364.ps1`
- `scripts/recover-hx-1668.sh`
- `scripts/recover-hx-1668.ps1`
- `src/resources/skills/create-skill/references/hx-skill-ecosystem.md`


## Deviations
Plan listed 13 .mjs test files but __tests__/ contains 15 (stream-process.test.mjs and xxhash.test.mjs were extras). The for-loop glob covered all automatically.

## Known Issues
The .ps1 script internal variable names ($gsdDir, $GsdIsSymlink) retain the gsd prefix — deferred to S05 per task plan.
