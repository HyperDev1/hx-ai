# Triage: Branch prefix still uses `gsd/` instead of `hx/`

## Root Cause

**Already fixed.** The `gsd/` → `hx/` branch prefix migration was completed in commit `1be0d923` (`fix(hx): replace stale .gsd path references with .hx across runtime code and tests`).

Both branch-creation code paths now use `hx/` prefix:

- `commands-workflow-templates.ts` line 279: `` `hx/${templateId}/${slug}` ``
- `quick.ts` line 198: `` `hx/quick/${taskNum}-${slug}` ``

The installed binary at `/usr/local/bin/hx` is npm-linked to this repo, so source changes are immediately effective.

## Evidence

- Current branch for this workflow: `hx/bugfix/bir-i-lem-ba-latt-mda-gsd-olarak-branch` — correctly uses `hx/` prefix
- Old branches (`gsd/bugfix/*`, `gsd/small-feature/*`, `gsd/hotfix/*`) were created before commit `1be0d923`
- `rg 'gsd/' src/ -t ts` returns zero hits outside `migrate-gsd-to-hx.ts` and test files

## Remaining Cleanup

Four stale `gsd/` branches remain in the local repo:
- `gsd/bugfix/fork-repo-issues-lardaki-problemi-z`
- `gsd/bugfix/gsd-init-yapt-mda-gsd-already-initialize`
- `gsd/hotfix/parsepreferencesmarkdown-preferences-md`
- `gsd/small-feature/yukar-daki-problem-i-in-knowledge-audit`

## Proposed Fix

No code fix needed — delete the stale `gsd/` branches.
