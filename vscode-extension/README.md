# HX-2 — VS Code Extension

Control the [HX-2 coding agent](https://github.com/hx-build/hx-2) directly from VS Code. Run autonomous coding sessions, chat with `@hx` in VS Code Chat, and monitor your agent from a sidebar dashboard — all without leaving the editor.

## Requirements

HX must be installed before activating this extension:

```bash
npm install -g hx-pi
```

Node.js ≥ 22.0.0 and Git are required.

## Features

### Sidebar Dashboard

Click the HX icon in the Activity Bar to open the agent dashboard. It shows:

- Connection status (connected / disconnected)
- Active model and provider
- Thinking level
- Token usage and session cost
- Quick action buttons: Start, Stop, New Session, Compact, Abort

### Chat Integration (`@hx`)

Use `@hx` in VS Code Chat (`Ctrl+Shift+I`) to send messages to the agent:

```
@hx refactor the auth module to use JWT
@hx /hx auto
@hx what's the current milestone status?
```

### Commands

All commands are accessible via `Ctrl+Shift+P`:

| Command | Description |
|---------|-------------|
| **HX: Start Agent** | Connect to the HX agent |
| **HX: Stop Agent** | Disconnect the agent |
| **HX: New Session** | Start a fresh conversation |
| **HX: Send Message** | Send a message to the agent |
| **HX: Abort Current Operation** | Interrupt the current operation |
| **HX: Steer Agent** | Send a steering message mid-operation |
| **HX: Switch Model** | Pick a model from QuickPick |
| **HX: Cycle Model** | Rotate to the next configured model |
| **HX: Set Thinking Level** | Choose off / low / medium / high |
| **HX: Cycle Thinking Level** | Rotate through thinking levels |
| **HX: Compact Context** | Manually trigger context compaction |
| **HX: Export Conversation as HTML** | Save the session as HTML |
| **HX: Show Session Stats** | Display token usage and cost |
| **HX: Run Bash Command** | Execute a shell command via the agent |
| **HX: List Available Commands** | Browse and run HX slash commands |

### Keyboard Shortcuts

| Shortcut | Command |
|----------|---------|
| `Ctrl+Shift+G Ctrl+Shift+N` | New Session |
| `Ctrl+Shift+G Ctrl+Shift+M` | Cycle Model |
| `Ctrl+Shift+G Ctrl+Shift+T` | Cycle Thinking Level |

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `hx.binaryPath` | `"hx"` | Path to the HX binary if not on PATH |
| `hx.autoStart` | `false` | Start the agent automatically when the extension activates |
| `hx.autoCompaction` | `true` | Enable automatic context compaction |

## Quick Start

1. Install HX: `npm install -g hx-pi`
2. Install this extension
3. Open a project folder in VS Code
4. `Ctrl+Shift+P` → **HX: Start Agent**
5. Use `@hx` in Chat or the sidebar to interact with the agent

## How It Works

The extension spawns `hx --mode rpc` in the background and communicates over JSON-RPC via stdin/stdout. All RPC commands are supported, including streaming events for real-time sidebar updates.

## Links

- [HX Documentation](https://github.com/hx-build/hx-2/tree/main/docs)
- [Getting Started](https://github.com/hx-build/hx-2/blob/main/docs/getting-started.md)
- [Issue Tracker](https://github.com/hx-build/hx-2/issues)
