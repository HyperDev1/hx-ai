# Getting Started

## Install

```bash
npm install -g hx-pi
```

Requires Node.js ≥ 22.0.0 (24 LTS recommended) and Git.

> **`command not found: hx`?** Your shell may not have npm's global bin directory in `$PATH`. Run `npm prefix -g` to find it, then add `$(npm prefix -g)/bin` to your PATH. See [Troubleshooting](./troubleshooting.md#command-not-found-hx-after-install) for details.

HX checks for updates once every 24 hours. When a new version is available, you'll see an interactive prompt at startup with the option to update immediately or skip. You can also update from within a session with `/hx update`.

### Set up API keys

If you use a non-Anthropic model, you'll need a search API key for web search. Run `/hx config` to set keys globally — they're saved to `~/.hx/agent/auth.json` and apply to all projects:

```bash
# Inside any HX session:
/hx config
```

See [Global API Keys](./configuration.md#global-api-keys-hx-config) for details on supported keys.

### Set up custom MCP servers

If you want HX to call local or external MCP servers, add project-local config in `.mcp.json` or `.hx/mcp.json`.

See [Configuration → MCP Servers](./configuration.md#mcp-servers) for examples and verification steps.

### VS Code Extension

HX is also available as a VS Code extension. Install from the marketplace (publisher: FluxLabs) or search for "HX" in VS Code extensions. The extension provides:

- **`@hx` chat participant** — talk to the agent in VS Code Chat
- **Sidebar dashboard** — connection status, model info, token usage, quick actions
- **Full command palette** — start/stop agent, switch models, export sessions

The CLI (`hx-pi`) must be installed first — the extension connects to it via RPC.

### Web Interface

HX also has a browser-based interface. Run `hx --web` to start a local web server with a visual dashboard, real-time progress, and multi-project support. See [Web Interface](./web-interface.md) for details.

## First Launch

Run `hx` in any directory:

```bash
hx
```

HX displays a welcome screen showing your version, active model, and available tool keys. Then on first launch, it runs a setup wizard:

1. **LLM Provider** — select from 20+ providers (Anthropic, OpenAI, Google, OpenRouter, GitHub Copilot, Amazon Bedrock, Azure, and more). OAuth flows handle Claude Max and Copilot subscriptions automatically; otherwise paste an API key.
2. **Tool API Keys** (optional) — Brave Search, Context7, Jina, Slack, Discord. Press Enter to skip any.

If you have an existing Pi installation, provider credentials are imported automatically.

Re-run the wizard anytime with:

```bash
hx config
```

## Choose a Model

HX auto-selects a default model after login. Switch later with:

```
/model
```

Or configure per-phase models in preferences — see [Configuration](./configuration.md).

## Two Ways to Work

### Step Mode — `/hx`

Type `/hx` inside a session. HX executes one unit of work at a time, pausing between each with a wizard showing what completed and what's next.

- **No `.hx/` directory** → starts a discussion flow to capture your project vision
- **Milestone exists, no roadmap** → discuss or research the milestone
- **Roadmap exists, slices pending** → plan the next slice or execute a task
- **Mid-task** → resume where you left off

Step mode is the on-ramp. You stay in the loop, reviewing output between each step.

### Auto Mode — `/hx auto`

Type `/hx auto` and walk away. HX autonomously researches, plans, executes, verifies, commits, and advances through every slice until the milestone is complete.

```
/hx auto
```

See [Auto Mode](./auto-mode.md) for full details.

## Two Terminals, One Project

The recommended workflow: auto mode in one terminal, steering from another.

**Terminal 1 — let it build:**

```bash
hx
/hx auto
```

**Terminal 2 — steer while it works:**

```bash
hx
/hx discuss    # talk through architecture decisions
/hx status     # check progress
/hx queue      # queue the next milestone
```

Both terminals read and write the same `.hx/` files. Decisions in terminal 2 are picked up at the next phase boundary automatically.

## Project Structure

HX organizes work into a hierarchy:

```
Milestone  →  a shippable version (4-10 slices)
  Slice    →  one demoable vertical capability (1-7 tasks)
    Task   →  one context-window-sized unit of work
```

The iron rule: **a task must fit in one context window.** If it can't, it's two tasks.

All state lives on disk in `.hx/`:

```
.hx/
  PROJECT.md          — what the project is right now
  REQUIREMENTS.md     — requirement contract (active/validated/deferred)
  DECISIONS.md        — append-only architectural decisions
  KNOWLEDGE.md        — cross-session rules, patterns, and lessons
  RUNTIME.md          — runtime context: API endpoints, env vars, services (v2.39)
  STATE.md            — quick-glance status
  milestones/
    M001/
      M001-ROADMAP.md — slice plan with risk levels and dependencies
      M001-CONTEXT.md — scope and goals from discussion
      slices/
        S01/
          S01-PLAN.md     — task decomposition
          S01-SUMMARY.md  — what happened
          S01-UAT.md      — human test script
          tasks/
            T01-PLAN.md
            T01-SUMMARY.md
```

## Resume a Session

```bash
hx --continue    # or hx -c
```

Resumes the most recent session for the current directory.

To browse and pick from all saved sessions:

```bash
hx sessions
```

Shows each session's date, message count, and first-message preview so you can choose which one to resume.

## Next Steps

- [Auto Mode](./auto-mode.md) — deep dive into autonomous execution
- [Configuration](./configuration.md) — model selection, timeouts, budgets
- [Commands Reference](./commands.md) — all commands and shortcuts

## Troubleshooting

### `hx` command runs `git svn dcommit` instead of HX

The [oh-my-zsh git plugin](https://github.com/ohmyzsh/ohmyzsh/tree/master/plugins/git) defines `alias hx='git svn dcommit'`, which shadows the HX binary.

**Option 1** — Remove the alias in your `~/.zshrc` (add after the `source $ZSH/oh-my-zsh.sh` line):

```bash
unalias hx 2>/dev/null
```

**Option 2** — Use the alternative binary name:

```bash
hx-cli
```

Both `hx` and `hx-cli` point to the same binary.
