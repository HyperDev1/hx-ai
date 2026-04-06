# Doctor + Cleanup Consolidation Plan

## Problem

HX has 7+ commands that check, diagnose, or clean up project state. Several overlap or duplicate each other, and worktree lifecycle management is missing entirely. Users can't answer "what's safe to delete?" without manual git investigation.

### Current surface area

| Command | Purpose | Overlap |
|---|---|---|
| `/hx doctor` | State integrity, git health, worktrees, runtime, env, prefs | **Primary health system** |
| `/hx doctor fix` | Auto-fix detected issues | |
| `/hx doctor heal` | Dispatch unfixable issues to LLM | |
| `/hx doctor audit` | Expanded output, no fix | |
| `/hx cleanup` | Runs branches + snapshots cleanup | **Redundant** — doctor already handles branches |
| `/hx cleanup branches` | Delete merged `hx/*` branches | **Redundant** — doctor detects but won't fix legacy branches |
| `/hx cleanup snapshots` | Prune old snapshot refs | **Gap** — doctor has no snapshot check |
| `/hx cleanup projects` | Audit orphaned `~/.hx/projects/` dirs | **Fully redundant** — doctor's `orphaned_project_state` does the same |
| `/hx keys doctor` | Per-key health check | **Complementary** — deeper than doctor's surface provider check |
| `/hx skill-health` | Skill usage stats | No overlap — analytics, not health |
| `/hx inspect` | SQLite DB diagnostics | No overlap — introspection tool |
| `/hx forensics` | Post-failure investigation | No overlap — different lifecycle |

### Missing

- No worktree lifecycle checks (merged? stale? dirty? unpushed?)
- `/worktree list` shows name/branch/path but no safety status
- Doctor checks completed-milestone worktrees but nothing else

---

## Design: Doctor as the single health authority

**Principle:** Doctor finds problems. Doctor fix resolves them. One command, not three paths to the same outcome.

### Phase 1: New doctor checks for worktree lifecycle

Add to `doctor-checks.ts` → `checkGitHealth()`:

| Check code | Severity | Fixable | Condition | What `--fix` does |
|---|---|---|---|---|
| `worktree_branch_merged` | info | yes | Worktree's branch is fully merged into main (merge-base --is-ancestor) | Remove worktree + delete branch |
| `worktree_stale` | warning | no | No commits in 14+ days AND no open PR on remote | Report only — needs user decision |
| `worktree_dirty` | warning | no | Stale worktree has uncommitted changes | Report only — data loss risk |
| `worktree_unpushed` | warning | no | Worktree branch has commits not on any remote | Report only — push first |

**Scope:** Only HX-managed worktrees under `.hx/worktrees/`. Not `.claude/worktrees/`, not sibling repos, not `/tmp/` worktrees. HX owns what HX creates.

**Safety rules:**
- Never auto-remove a worktree matching `process.cwd()` (existing pattern)
- Never auto-remove a worktree with uncommitted changes
- Never auto-remove a worktree with unpushed commits
- `worktree_branch_merged` is the only auto-fixable worktree check — it's the safest (work is already in main)

### Phase 2: Fold `/hx cleanup` into doctor

**2a. Make `legacy_slice_branches` fixable in doctor.**

Currently detected as `info` severity, not fixable. Change to:
- Severity: `info` (keep)
- Fixable: `true`
- `--fix` action: `nativeBranchDelete(basePath, branch, true)` for each merged legacy branch

This makes `cleanup branches` redundant — doctor handles both `milestone/*` and `hx/*` branches.

**2b. Add `snapshot_ref_bloat` doctor check.**

New check in `checkRuntimeHealth()`:
- Count `refs/hx/snapshots/` refs
- If > 50 refs per label, report `snapshot_ref_bloat` (warning, fixable)
- `--fix` action: prune to newest 5 per label (same logic as existing `handleCleanupSnapshots`)

This makes `cleanup snapshots` redundant.

**2c. `/hx cleanup projects` is already redundant.**

Doctor's `orphaned_project_state` check (in `checkGlobalHealth`) does the same thing. No code change needed — just deprecation.

**2d. `/hx cleanup` becomes a permanent alias.**

- `/hx cleanup` → runs `doctor fix` scoped to cleanup-class issues (branches, snapshots, projects, worktrees)
- `/hx cleanup branches` → doctor fix for branch issues
- `/hx cleanup snapshots` → doctor fix for snapshot issues
- `/hx cleanup projects` → doctor fix for project state issues
- `/hx cleanup worktrees` → doctor fix for worktree issues

No deprecation warnings. Same commands, doctor under the hood. Existing muscle memory keeps working.

### Phase 3: Enhance `/worktree list` with safety status

Enhance `handleList()` in `worktree-command.ts` to show safety information inline:

```
HX Worktrees

  feature-x  ● active
    branch  worktree/feature-x
    path    .hx/worktrees/feature-x
    status  3 uncommitted files · 2 unpushed commits · last commit 4h ago

  old-bugfix  
    branch  worktree/old-bugfix
    path    .hx/worktrees/old-bugfix
    status  ✓ merged into main · safe to remove

  stale-experiment  
    branch  worktree/stale-experiment
    path    .hx/worktrees/stale-experiment
    status  ⚠ no commits in 18 days · no open PR
```

Data to show per worktree:
- Uncommitted file count (if any)
- Unpushed commit count (if any)
- Merge status (merged into main or not)
- Last commit age
- Whether branch has been pushed to remote

### Phase 4: Add `/hx cleanup worktrees` convenience entry point

For discoverability, add to the cleanup catalog:
```
/hx cleanup worktrees        — Remove merged/safe-to-delete worktrees
/hx cleanup worktrees --dry  — Preview what would be removed
```

This is a thin wrapper that runs doctor fix scoped to `worktree_branch_merged` issues only.

---

## What stays separate (no changes)

| Command | Why |
|---|---|
| `/hx keys doctor` | Deeper per-key analysis; general doctor's provider check is a sufficient surface check |
| `/hx inspect` | DB introspection — not a health check |
| `/hx skill-health` | Usage analytics — not a health check |
| `/hx forensics` | Post-mortem investigation — different purpose and lifecycle |
| `/hx logs` | Read-only log viewer |

---

## Implementation order

1. **Phase 1** — Worktree lifecycle checks in doctor (the core ask)
2. **Phase 3** — Enhanced `/worktree list` (immediate user value, depends on same data as Phase 1)
3. **Phase 2** — Fold cleanup into doctor (reduces surface area)
4. **Phase 4** — Cleanup worktrees convenience entry (trivial once Phase 1+2 land)

Phase 1 and 3 share git inspection code (merge status, uncommitted changes, unpushed commits). Build that as shared helpers in `worktree-manager.ts` or a new `worktree-health.ts`, then both phases consume it.

---

## Files likely touched

| File | Changes |
|---|---|
| `doctor-checks.ts` | New worktree lifecycle checks, make `legacy_slice_branches` fixable, add snapshot bloat check |
| `doctor-types.ts` | New issue codes: `worktree_branch_merged`, `worktree_stale`, `worktree_dirty`, `worktree_unpushed`, `snapshot_ref_bloat` |
| `worktree-manager.ts` | New helpers: `getWorktreeMergeStatus()`, `getWorktreeDirtyStatus()`, `getWorktreeUnpushedCount()`, `getWorktreeLastCommitAge()` |
| `worktree-command.ts` | Enhanced `handleList()` with safety status |
| `commands-maintenance.ts` | Deprecation wrappers for cleanup subcommands |
| `commands/catalog.ts` | Add `worktrees` to cleanup subcommands, update doctor subcommand descriptions |
| `commands/handlers/ops.ts` | Wire up `/hx cleanup worktrees` |

---

## Decisions

1. **Stale threshold** — 14 days default, configurable via preferences.
2. **Remote PR check** — Commit age is the primary signal. PR check is a bonus when `gh` is available. Degrade gracefully if `gh` is missing.
3. **Cleanup as permanent alias** — `/hx cleanup` stays as a permanent alias that silently calls doctor fix under the hood. No deprecation noise. Users who learned cleanup keep using it, new users learn doctor.
