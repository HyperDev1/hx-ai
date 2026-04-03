---
id: T03
parent: S02
milestone: M001-df6x5t
provides: []
requires: []
affects: []
key_files: ["tests/smoke/test-help.ts", "tests/smoke/test-init.ts", "tests/smoke/test-version.ts", "tests/live-regression/run.ts", "tests/live/run.ts", "tests/fixtures/provider.ts", "tests/fixtures/record.ts", "scripts/postinstall.js", "scripts/recover-gsd-1364.sh", "scripts/verify-s03.sh", "scripts/verify-s04.sh", ".github/workflows/pipeline.yml", "docker/entrypoint.sh", "docker/docker-compose.full.yaml"]
key_decisions: ["Used perl -pi loop (K001 pattern) for synchronous foreground substitution", "Ordered longer strings before shorter substrings to avoid partial match collisions"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "Exhaustive grep for GSD_ in all source file types → 0 hits. web/package-lock.json shows hx-web. npm run typecheck:extensions → exit 0."
completed_at: 2026-04-03T20:34:32.021Z
blocker_discovered: false
---

# T03: Renamed all remaining GSD_* env vars in tests, scripts, CI, and Docker — exhaustive grep confirms zero GSD_ references remain in the codebase; typecheck:extensions passes

> Renamed all remaining GSD_* env vars in tests, scripts, CI, and Docker — exhaustive grep confirms zero GSD_ references remain in the codebase; typecheck:extensions passes

## What Happened
---
id: T03
parent: S02
milestone: M001-df6x5t
key_files:
  - tests/smoke/test-help.ts
  - tests/smoke/test-init.ts
  - tests/smoke/test-version.ts
  - tests/live-regression/run.ts
  - tests/live/run.ts
  - tests/fixtures/provider.ts
  - tests/fixtures/record.ts
  - scripts/postinstall.js
  - scripts/recover-gsd-1364.sh
  - scripts/verify-s03.sh
  - scripts/verify-s04.sh
  - .github/workflows/pipeline.yml
  - docker/entrypoint.sh
  - docker/docker-compose.full.yaml
key_decisions:
  - Used perl -pi loop (K001 pattern) for synchronous foreground substitution
  - Ordered longer strings before shorter substrings to avoid partial match collisions
duration: ""
verification_result: passed
completed_at: 2026-04-03T20:34:32.022Z
blocker_discovered: false
---

# T03: Renamed all remaining GSD_* env vars in tests, scripts, CI, and Docker — exhaustive grep confirms zero GSD_ references remain in the codebase; typecheck:extensions passes

**Renamed all remaining GSD_* env vars in tests, scripts, CI, and Docker — exhaustive grep confirms zero GSD_ references remain in the codebase; typecheck:extensions passes**

## What Happened

Wrote /tmp/s02-t03-misc.pl with 15 ordered substitution rules and applied synchronously via perl -pi loop to 14 files: 7 test files, 4 script files, pipeline.yml, docker/entrypoint.sh, docker/docker-compose.full.yaml. Post-apply exhaustive grep across all *.ts/*.tsx/*.js/*.sh/*.yml/*.yaml/*.json files (excluding node_modules, dist, .next, .hx/, .git/) returned 0 hits. web/package-lock.json confirmed hx-web. typecheck:extensions passed (exit 0, ~20s).

## Verification

Exhaustive grep for GSD_ in all source file types → 0 hits. web/package-lock.json shows hx-web. npm run typecheck:extensions → exit 0.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `grep -rn 'GSD_' --include='*.ts' --include='*.tsx' --include='*.js' --include='*.sh' --include='*.yml' --include='*.yaml' --include='*.json' . | grep -v node_modules | grep -v dist | grep -v .next | grep -v '.hx/' | grep -v '.git/' | wc -l` | 0 | ✅ pass | 300ms |
| 2 | `grep '"name"' web/package-lock.json | head -2` | 0 | ✅ pass | 50ms |
| 3 | `npm run typecheck:extensions` | 0 | ✅ pass | 20100ms |


## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `tests/smoke/test-help.ts`
- `tests/smoke/test-init.ts`
- `tests/smoke/test-version.ts`
- `tests/live-regression/run.ts`
- `tests/live/run.ts`
- `tests/fixtures/provider.ts`
- `tests/fixtures/record.ts`
- `scripts/postinstall.js`
- `scripts/recover-gsd-1364.sh`
- `scripts/verify-s03.sh`
- `scripts/verify-s04.sh`
- `.github/workflows/pipeline.yml`
- `docker/entrypoint.sh`
- `docker/docker-compose.full.yaml`


## Deviations
None.

## Known Issues
None.
