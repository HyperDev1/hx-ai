# Parallel Milestone Orchestration

Run multiple milestones simultaneously in isolated git worktrees. Each milestone gets its own worker process, its own branch, and its own context window — while a coordinator tracks progress, enforces budgets, and keeps everything in sync.

> **Status:** Behind `parallel.enabled: false` by default. Opt-in only — zero impact to existing users.

## Quick Start

1. Enable parallel mode in your preferences:

```yaml
---
parallel:
  enabled: true
  max_workers: 2
---
```

2. Start parallel execution:

```
/hx parallel start
```

HX scans your milestones, checks dependencies and file overlap, shows an eligibility report, and spawns workers for eligible milestones.

3. Monitor progress:

```
/hx parallel status
```

4. Stop when done:

```
/hx parallel stop
```

## How It Works

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Coordinator (your HX session)                         │
│                                                         │
│  Responsibilities:                                      │
│  - Eligibility analysis (deps + file overlap)           │
│  - Worker spawning and lifecycle                        │
│  - Budget tracking across all workers                   │
│  - Signal dispatch (pause/resume/stop)                  │
│  - Session status monitoring                            │
│  - Merge reconciliation                                 │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ Worker 1 │  │ Worker 2 │  │ Worker 3 │  ...          │
│  │ M001     │  │ M003     │  │ M005     │              │
│  └──────────┘  └──────────┘  └──────────┘              │
│       │              │              │                   │
│       ▼              ▼              ▼                   │
│  .hx/worktrees/ .hx/worktrees/ .hx/worktrees/       │
│  M001/           M003/           M005/                  │
│  (milestone/     (milestone/     (milestone/            │
│   M001 branch)    M003 branch)    M005 branch)          │
└─────────────────────────────────────────────────────────┘
```

### Worker Isolation

Each worker is a separate `hx` process with complete isolation:

| Resource | Isolation Method |
|----------|-----------------|
| **Filesystem** | Git worktree — each worker has its own checkout |
| **Git branch** | `milestone/<MID>` — one branch per milestone |
| **State derivation** | `HX_MILESTONE_LOCK` env var — `deriveState()` only sees the assigned milestone |
| **Context window** | Separate process — each worker has its own agent sessions |
| **Metrics** | Each worktree has its own `.hx/metrics.json` |
| **Crash recovery** | Each worktree has its own `.hx/auto.lock` |

### Coordination

Workers and the coordinator communicate through file-based IPC:

- **Session status files** (`.hx/parallel/<MID>.status.json`) — workers write heartbeats, the coordinator reads them
- **Signal files** (`.hx/parallel/<MID>.signal.json`) — coordinator writes signals, workers consume them
- **Atomic writes** — write-to-temp + rename prevents partial reads

## Eligibility Analysis

Before starting parallel execution, HX checks which milestones can safely run concurrently.

### Rules

1. **Not complete** — Finished milestones are skipped
2. **Dependencies satisfied** — All `dependsOn` entries must have status `complete`
3. **File overlap check** — Milestones touching the same files get a warning (but are still eligible)

### Example Report

```
# Parallel Eligibility Report

## Eligible for Parallel Execution (2)

- **M002** — Auth System
  All dependencies satisfied.
- **M003** — Dashboard UI
  All dependencies satisfied.

## Ineligible (2)

- **M001** — Core Types
  Already complete.
- **M004** — API Integration
  Blocked by incomplete dependencies: M002.

## File Overlap Warnings (1)

- **M002** <-> **M003** — 2 shared file(s):
  - `src/types.ts`
  - `src/middleware.ts`
```

File overlaps are warnings, not blockers. Both milestones work in separate worktrees, so they won't interfere at the filesystem level. Conflicts are detected and resolved during merge.

## Configuration

Add to `~/.hx/PREFERENCES.md` or `.hx/PREFERENCES.md`:

```yaml
---
parallel:
  enabled: false            # Master toggle (default: false)
  max_workers: 2            # Concurrent workers (1-4, default: 2)
  budget_ceiling: 50.00     # Aggregate cost limit in dollars (optional)
  merge_strategy: "per-milestone"  # When to merge: "per-slice" or "per-milestone"
  auto_merge: "confirm"            # "auto", "confirm", or "manual"
---
```

### Configuration Reference

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `enabled` | boolean | `false` | Master toggle. Must be `true` for `/hx parallel` commands to work. |
| `max_workers` | number (1-4) | `2` | Maximum concurrent worker processes. Higher values use more memory and API budget. |
| `budget_ceiling` | number | none | Aggregate cost ceiling in USD across all workers. When reached, no new units are dispatched. |
| `merge_strategy` | `"per-slice"` or `"per-milestone"` | `"per-milestone"` | When worktree changes merge back to main. Per-milestone waits for the full milestone to complete. |
| `auto_merge` | `"auto"`, `"confirm"`, `"manual"` | `"confirm"` | How merge-back is handled. `confirm` prompts before merging. `manual` requires explicit `/hx parallel merge`. |

## Commands

| Command | Description |
|---------|-------------|
| `/hx parallel start` | Analyze eligibility, confirm, and start workers |
| `/hx parallel status` | Show all workers with state, units completed, and cost |
| `/hx parallel stop` | Stop all workers (sends SIGTERM) |
| `/hx parallel stop M002` | Stop a specific milestone's worker |
| `/hx parallel pause` | Pause all workers (finish current unit, then wait) |
| `/hx parallel pause M002` | Pause a specific worker |
| `/hx parallel resume` | Resume all paused workers |
| `/hx parallel resume M002` | Resume a specific worker |
| `/hx parallel merge` | Merge all completed milestones back to main |
| `/hx parallel merge M002` | Merge a specific milestone back to main |

## Signal Lifecycle

The coordinator communicates with workers through signals:

```
Coordinator                    Worker
    │                            │
    ├── sendSignal("pause") ──→  │
    │                            ├── consumeSignal()
    │                            ├── pauseAuto()
    │                            │   (finish current unit, wait)
    │                            │
    ├── sendSignal("resume") ─→  │
    │                            ├── consumeSignal()
    │                            ├── resume dispatch loop
    │                            │
    ├── sendSignal("stop") ───→  │
    │   + SIGTERM ────────────→  │
    │                            ├── consumeSignal() or SIGTERM handler
    │                            ├── stopAuto()
    │                            └── process exits
```

Workers check for signals between units (in `handleAgentEnd`). The coordinator also sends `SIGTERM` for immediate response on stop.

## Merge Reconciliation

When milestones complete, their worktree changes need to merge back to main.

### Merge Order

- **Sequential** (default): Milestones merge in ID order (M001 before M002)
- **By-completion**: Milestones merge in the order they finish

### Conflict Handling

1. `.hx/` state files (STATE.md, metrics.json, etc.) — **auto-resolved** by accepting the milestone branch version
2. Code conflicts — **stop and report**. The merge halts, showing which files conflict. Resolve manually and retry with `/hx parallel merge <MID>`.

### Example

```
/hx parallel merge

# Merge Results

- **M002** — merged successfully (pushed)
- **M003** — CONFLICT (2 file(s)):
  - `src/types.ts`
  - `src/middleware.ts`
  Resolve conflicts manually and run `/hx parallel merge M003` to retry.
```

## Budget Management

When `budget_ceiling` is set, the coordinator tracks aggregate cost across all workers:

- Cost is summed from each worker's session status
- When the ceiling is reached, the coordinator signals workers to stop
- Each worker also respects the project-level `budget_ceiling` preference independently

## Health Monitoring

### Doctor Integration

`/hx doctor` detects parallel session issues:

- **Stale parallel sessions** — Worker process died without cleanup. Doctor finds `.hx/parallel/*.status.json` files with dead PIDs or expired heartbeats and removes them.

Run `/hx doctor --fix` to clean up automatically.

### Stale Detection

Sessions are considered stale when:
- The worker PID is no longer running (checked via `process.kill(pid, 0)`)
- The last heartbeat is older than 30 seconds

The coordinator runs stale detection during `refreshWorkerStatuses()` and automatically removes dead sessions.

## Safety Model

| Safety Layer | Protection |
|-------------|------------|
| **Feature flag** | `parallel.enabled: false` by default — existing users unaffected |
| **Eligibility analysis** | Dependency and file overlap checks before starting |
| **Worker isolation** | Separate processes, worktrees, branches, context windows |
| **`HX_MILESTONE_LOCK`** | Each worker only sees its milestone in state derivation |
| **`HX_PARALLEL_WORKER`** | Workers cannot spawn nested parallel sessions |
| **Budget ceiling** | Aggregate cost enforcement across all workers |
| **Signal-based shutdown** | Graceful stop via file signals + SIGTERM |
| **Doctor integration** | Detects and cleans up orphaned sessions |
| **Conflict-aware merge** | Stops on code conflicts, auto-resolves `.hx/` state conflicts |

## File Layout

```
.hx/
├── parallel/                    # Coordinator ↔ worker IPC
│   ├── M002.status.json         # Worker heartbeat + progress
│   ├── M002.signal.json         # Coordinator → worker signals
│   ├── M003.status.json
│   └── M003.signal.json
├── worktrees/                   # Git worktrees (one per milestone)
│   ├── M002/                    # M002's isolated checkout
│   │   ├── .hx/                # M002's own state files
│   │   │   ├── auto.lock
│   │   │   ├── metrics.json
│   │   │   └── milestones/
│   │   └── src/                 # M002's working copy
│   └── M003/
│       └── ...
└── ...
```

Both `.hx/parallel/` and `.hx/worktrees/` are gitignored — they're runtime-only coordination files that never get committed.

## Troubleshooting

### "Parallel mode is not enabled"

Set `parallel.enabled: true` in your preferences file.

### "No milestones are eligible for parallel execution"

All milestones are either complete or blocked by dependencies. Check `/hx queue` to see milestone status and dependency chains.

### Worker crashed — how to recover

Workers now persist their state to disk automatically. If a worker process dies, the coordinator detects the dead PID via heartbeat expiry and marks the worker as crashed. On restart, the worker picks up from disk state — crash recovery, worktree re-entry, and completed-unit tracking carry over from the crashed session.

1. Run `/hx doctor --fix` to clean up stale sessions
2. Run `/hx parallel status` to see current state
3. Re-run `/hx parallel start` to spawn new workers for remaining milestones

### Merge conflicts after parallel completion

1. Run `/hx parallel merge` to see which milestones have conflicts
2. Resolve conflicts in the worktree at `.hx/worktrees/<MID>/`
3. Retry with `/hx parallel merge <MID>`

### Workers seem stuck

Check if budget ceiling was reached: `/hx parallel status` shows per-worker costs. Increase `parallel.budget_ceiling` or remove it to continue.
