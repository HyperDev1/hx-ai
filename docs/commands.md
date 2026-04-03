# Commands Reference

## Session Commands

| Command | Description |
|---------|-------------|
| `/hx` | Step mode — execute one unit at a time, pause between each |
| `/hx next` | Explicit step mode (same as `/hx`) |
| `/hx auto` | Autonomous mode — research, plan, execute, commit, repeat |
| `/hx quick` | Execute a quick task with HX guarantees (atomic commits, state tracking) without full planning overhead |
| `/hx stop` | Stop auto mode gracefully |
| `/hx pause` | Pause auto-mode (preserves state, `/hx auto` to resume) |
| `/hx steer` | Hard-steer plan documents during execution |
| `/hx discuss` | Discuss architecture and decisions (works alongside auto mode) |
| `/hx status` | Progress dashboard |
| `/hx widget` | Cycle dashboard widget: full / small / min / off |
| `/hx queue` | Queue and reorder future milestones (safe during auto mode) |
| `/hx capture` | Fire-and-forget thought capture (works during auto mode) |
| `/hx triage` | Manually trigger triage of pending captures |
| `/hx dispatch` | Dispatch a specific phase directly (research, plan, execute, complete, reassess, uat, replan) |
| `/hx history` | View execution history (supports `--cost`, `--phase`, `--model` filters) |
| `/hx forensics` | Full-access HX debugger — structured anomaly detection, unit traces, and LLM-guided root-cause analysis for auto-mode failures |
| `/hx cleanup` | Clean up HX state files and stale worktrees |
| `/hx visualize` | Open workflow visualizer (progress, deps, metrics, timeline) |
| `/hx export --html` | Generate self-contained HTML report for current or completed milestone |
| `/hx export --html --all` | Generate retrospective reports for all milestones at once |
| `/hx update` | Update HX to the latest version in-session |
| `/hx knowledge` | Add persistent project knowledge (rule, pattern, or lesson) |
| `/hx fast` | Toggle service tier for supported models (prioritized API routing) |
| `/hx rate` | Rate last unit's model tier (over/ok/under) — improves adaptive routing |
| `/hx changelog` | Show categorized release notes |
| `/hx logs` | Browse activity logs, debug logs, and metrics |
| `/hx remote` | Control remote auto-mode |
| `/hx help` | Categorized command reference with descriptions for all HX subcommands |

## Configuration & Diagnostics

| Command | Description |
|---------|-------------|
| `/hx prefs` | Model selection, timeouts, budget ceiling |
| `/hx mode` | Switch workflow mode (solo/team) with coordinated defaults for milestone IDs, git commit behavior, and documentation |
| `/hx config` | Re-run the provider setup wizard (LLM provider + tool keys) |
| `/hx keys` | API key manager — list, add, remove, test, rotate, doctor |
| `/hx doctor` | Runtime health checks with auto-fix — issues surface in real time across widget, visualizer, and HTML reports (v2.40) |
| `/hx inspect` | Show SQLite DB diagnostics |
| `/hx init` | Project init wizard — detect, configure, bootstrap `.hx/` |
| `/hx setup` | Global setup status and configuration |
| `/hx skill-health` | Skill lifecycle dashboard — usage stats, success rates, token trends, staleness warnings |
| `/hx skill-health <name>` | Detailed view for a single skill |
| `/hx skill-health --declining` | Show only skills flagged for declining performance |
| `/hx skill-health --stale N` | Show skills unused for N+ days |
| `/hx hooks` | Show configured post-unit and pre-dispatch hooks |
| `/hx run-hook` | Manually trigger a specific hook |
| `/hx migrate` | Migrate a v1 `.planning` directory to `.hx` format |

## Milestone Management

| Command | Description |
|---------|-------------|
| `/hx new-milestone` | Create a new milestone |
| `/hx skip` | Prevent a unit from auto-mode dispatch |
| `/hx undo` | Revert last completed unit |
| `/hx undo-task` | Reset a specific task's completion state (DB + markdown) |
| `/hx reset-slice` | Reset a slice and all its tasks (DB + markdown) |
| `/hx park` | Park a milestone — skip without deleting |
| `/hx unpark` | Reactivate a parked milestone |
| Discard milestone | Available via `/hx` wizard → "Milestone actions" → "Discard" |

## Parallel Orchestration

| Command | Description |
|---------|-------------|
| `/hx parallel start` | Analyze eligibility, confirm, and start workers |
| `/hx parallel status` | Show all workers with state, progress, and cost |
| `/hx parallel stop [MID]` | Stop all workers or a specific milestone's worker |
| `/hx parallel pause [MID]` | Pause all workers or a specific one |
| `/hx parallel resume [MID]` | Resume paused workers |
| `/hx parallel merge [MID]` | Merge completed milestones back to main |

See [Parallel Orchestration](./parallel-orchestration.md) for full documentation.

## Workflow Templates (v2.42)

| Command | Description |
|---------|-------------|
| `/hx start` | Start a workflow template (bugfix, spike, feature, hotfix, refactor, security-audit, dep-upgrade, full-project) |
| `/hx start resume` | Resume an in-progress workflow |
| `/hx templates` | List available workflow templates |
| `/hx templates info <name>` | Show detailed template info |

## Custom Workflows (v2.42)

| Command | Description |
|---------|-------------|
| `/hx workflow new` | Create a new workflow definition (via skill) |
| `/hx workflow run <name>` | Create a run and start auto-mode |
| `/hx workflow list` | List workflow runs |
| `/hx workflow validate <name>` | Validate a workflow definition YAML |
| `/hx workflow pause` | Pause custom workflow auto-mode |
| `/hx workflow resume` | Resume paused custom workflow auto-mode |

## Extensions

| Command | Description |
|---------|-------------|
| `/hx extensions list` | List all extensions and their status |
| `/hx extensions enable <id>` | Enable a disabled extension |
| `/hx extensions disable <id>` | Disable an extension |
| `/hx extensions info <id>` | Show extension details |

## cmux Integration

| Command | Description |
|---------|-------------|
| `/hx cmux status` | Show cmux detection, prefs, and capabilities |
| `/hx cmux on` | Enable cmux integration |
| `/hx cmux off` | Disable cmux integration |
| `/hx cmux notifications on/off` | Toggle cmux desktop notifications |
| `/hx cmux sidebar on/off` | Toggle cmux sidebar metadata |
| `/hx cmux splits on/off` | Toggle cmux visual subagent splits |

## GitHub Sync (v2.39)

| Command | Description |
|---------|-------------|
| `/github-sync bootstrap` | Initial setup — creates GitHub Milestones, Issues, and draft PRs from current `.hx/` state |
| `/github-sync status` | Show sync mapping counts (milestones, slices, tasks) |

Enable with `github.enabled: true` in preferences. Requires `gh` CLI installed and authenticated. Sync mapping is persisted in `.hx/.github-sync.json`.

## Git Commands

| Command | Description |
|---------|-------------|
| `/worktree` (`/wt`) | Git worktree lifecycle — create, switch, merge, remove |

## Session Management

| Command | Description |
|---------|-------------|
| `/clear` | Start a new session (alias for `/new`) |
| `/exit` | Graceful shutdown — saves session state before exiting |
| `/kill` | Kill HX process immediately |
| `/model` | Switch the active model |
| `/login` | Log in to an LLM provider |
| `/thinking` | Toggle thinking level during sessions |
| `/voice` | Toggle real-time speech-to-text (macOS, Linux) |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Alt+G` | Toggle dashboard overlay |
| `Ctrl+Alt+V` | Toggle voice transcription |
| `Ctrl+Alt+B` | Show background shell processes |
| `Ctrl+V` / `Alt+V` | Paste image from clipboard (screenshot → vision input) |
| `Escape` | Pause auto mode (preserves conversation) |

> **Note:** In terminals without Kitty keyboard protocol support (macOS Terminal.app, JetBrains IDEs), slash-command fallbacks are shown instead of `Ctrl+Alt` shortcuts.
>
> **Tip:** If `Ctrl+V` is intercepted by your terminal (e.g. Warp), use `Alt+V` instead for clipboard image paste.

## CLI Flags

| Flag | Description |
|------|-------------|
| `hx` | Start a new interactive session |
| `hx --continue` (`-c`) | Resume the most recent session for the current directory |
| `hx --model <id>` | Override the default model for this session |
| `hx --print "msg"` (`-p`) | Single-shot prompt mode (no TUI) |
| `hx --mode <text\|json\|rpc\|mcp>` | Output mode for non-interactive use |
| `hx --list-models [search]` | List available models and exit |
| `hx --web [path]` | Start browser-based web interface (optional project path) |
| `hx --worktree` (`-w`) [name] | Start session in a git worktree (auto-generates name if omitted) |
| `hx --no-session` | Disable session persistence |
| `hx --extension <path>` | Load an additional extension (can be repeated) |
| `hx --append-system-prompt <text>` | Append text to the system prompt |
| `hx --tools <list>` | Comma-separated list of tools to enable |
| `hx --version` (`-v`) | Print version and exit |
| `hx --help` (`-h`) | Print help and exit |
| `hx sessions` | Interactive session picker — list all saved sessions for the current directory and choose one to resume |
| `hx --debug` | Enable structured JSONL diagnostic logging for troubleshooting dispatch and state issues |
| `hx config` | Set up global API keys for search and docs tools (saved to `~/.hx/agent/auth.json`, applies to all projects). See [Global API Keys](./configuration.md#global-api-keys-hx-config). |
| `hx update` | Update HX to the latest version |
| `hx headless new-milestone` | Create a new milestone from a context file (headless — no TUI required) |

## Headless Mode

`hx headless` runs `/hx` commands without a TUI — designed for CI, cron jobs, and scripted automation. It spawns a child process in RPC mode, auto-responds to interactive prompts, detects completion, and exits with meaningful exit codes.

```bash
# Run auto mode (default)
hx headless

# Run a single unit
hx headless next

# Instant JSON snapshot — no LLM, ~50ms
hx headless query

# With timeout for CI
hx headless --timeout 600000 auto

# Force a specific phase
hx headless dispatch plan

# Create a new milestone from a context file and start auto mode
hx headless new-milestone --context brief.md --auto

# Create a milestone from inline text
hx headless new-milestone --context-text "Build a REST API with auth"

# Pipe context from stdin
echo "Build a CLI tool" | hx headless new-milestone --context -
```

| Flag | Description |
|------|-------------|
| `--timeout N` | Overall timeout in milliseconds (default: 300000 / 5 min) |
| `--max-restarts N` | Auto-restart on crash with exponential backoff (default: 3). Set 0 to disable |
| `--json` | Stream all events as JSONL to stdout |
| `--model ID` | Override the model for the headless session |
| `--context <file>` | Context file for `new-milestone` (use `-` for stdin) |
| `--context-text <text>` | Inline context text for `new-milestone` |
| `--auto` | Chain into auto-mode after milestone creation |

**Exit codes:** `0` = complete, `1` = error or timeout, `2` = blocked.

Any `/hx` subcommand works as a positional argument — `hx headless status`, `hx headless doctor`, `hx headless dispatch execute`, etc.

### `hx headless query`

Returns a single JSON object with the full project snapshot — no LLM session, no RPC child, instant response (~50ms). This is the recommended way for orchestrators and scripts to inspect HX state.

```bash
hx headless query | jq '.state.phase'
# "executing"

hx headless query | jq '.next'
# {"action":"dispatch","unitType":"execute-task","unitId":"M001/S01/T03"}

hx headless query | jq '.cost.total'
# 4.25
```

**Output schema:**

```json
{
  "state": {
    "phase": "executing",
    "activeMilestone": { "id": "M001", "title": "..." },
    "activeSlice": { "id": "S01", "title": "..." },
    "activeTask": { "id": "T01", "title": "..." },
    "registry": [{ "id": "M001", "status": "active" }, ...],
    "progress": { "milestones": { "done": 0, "total": 2 }, "slices": { "done": 1, "total": 3 } },
    "blockers": []
  },
  "next": {
    "action": "dispatch",
    "unitType": "execute-task",
    "unitId": "M001/S01/T01"
  },
  "cost": {
    "workers": [{ "milestoneId": "M001", "cost": 1.50, "state": "running", ... }],
    "total": 1.50
  }
}
```

## MCP Server Mode

`hx --mode mcp` runs HX as a [Model Context Protocol](https://modelcontextprotocol.io) server over stdin/stdout. This exposes all HX tools (read, write, edit, bash, etc.) to external AI clients — Claude Desktop, VS Code Copilot, and any MCP-compatible host.

```bash
# Start HX as an MCP server
hx --mode mcp
```

The server registers all tools from the agent session and maps MCP `tools/list` and `tools/call` requests to HX tool definitions. It runs until the transport closes.

## In-Session Update

`/hx update` checks npm for a newer version of HX and installs it without leaving the session.

```bash
/hx update
# Current version: v2.36.0
# Checking npm registry...
# Updated to v2.37.0. Restart HX to use the new version.
```

If already up to date, it reports so and takes no action.

## Export

`/hx export` generates reports of milestone work.

```bash
# Generate HTML report for the active milestone
/hx export --html

# Generate retrospective reports for ALL milestones at once
/hx export --html --all
```

Reports are saved to `.hx/reports/` with a browseable `index.html` that links to all generated snapshots.
