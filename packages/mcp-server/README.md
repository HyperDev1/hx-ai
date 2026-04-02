# @hyperlab/hx-mcp-server

MCP server exposing HX orchestration tools for Claude Code, Cursor, and other MCP-compatible clients.

Start HX auto-mode sessions, poll progress, resolve blockers, and retrieve results — all through the [Model Context Protocol](https://modelcontextprotocol.io/).

## Installation

```bash
npm install @hyperlab/hx-mcp-server
```

Or with the monorepo workspace:

```bash
# Already available as a workspace package
npx hx-mcp-server
```

## Configuration

### Claude Code

Add to your project's `.mcp.json`:

```json
{
  "mcpServers": {
    "hx": {
      "command": "npx",
      "args": ["hx-mcp-server"],
      "env": {
        "HX_CLI_PATH": "/path/to/hx"
      }
    }
  }
}
```

Or if installed globally:

```json
{
  "mcpServers": {
    "hx": {
      "command": "hx-mcp-server"
    }
  }
}
```

### Cursor

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "hx": {
      "command": "npx",
      "args": ["hx-mcp-server"],
      "env": {
        "HX_CLI_PATH": "/path/to/hx"
      }
    }
  }
}
```

## Tools

### `hx_execute`

Start a HX auto-mode session for a project directory.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `projectDir` | `string` | ✅ | Absolute path to the project directory |
| `command` | `string` | | Command to send (default: `"/hx auto"`) |
| `model` | `string` | | Model ID override |
| `bare` | `boolean` | | Run in bare mode (skip user config) |

**Returns:** `{ sessionId, status: "started" }`

### `hx_status`

Poll the current status of a running HX session.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sessionId` | `string` | ✅ | Session ID from `hx_execute` |

**Returns:**

```json
{
  "status": "running",
  "progress": { "eventCount": 42, "toolCalls": 15 },
  "recentEvents": [ ... ],
  "pendingBlocker": null,
  "cost": { "totalCost": 0.12, "tokens": { "input": 5000, "output": 2000, "cacheRead": 1000, "cacheWrite": 500 } },
  "durationMs": 45000
}
```

### `hx_result`

Get the accumulated result of a session. Works for both running (partial) and completed sessions.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sessionId` | `string` | ✅ | Session ID from `hx_execute` |

**Returns:**

```json
{
  "sessionId": "abc-123",
  "projectDir": "/path/to/project",
  "status": "completed",
  "durationMs": 120000,
  "cost": { ... },
  "recentEvents": [ ... ],
  "pendingBlocker": null,
  "error": null
}
```

### `hx_cancel`

Cancel a running session. Aborts the current operation and stops the agent process.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sessionId` | `string` | ✅ | Session ID from `hx_execute` |

**Returns:** `{ cancelled: true }`

### `hx_query`

Query HX project state from the filesystem without an active session. Returns STATE.md, PROJECT.md, requirements, and milestone listing.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `projectDir` | `string` | ✅ | Absolute path to the project directory |
| `query` | `string` | ✅ | What to query (e.g. `"status"`, `"milestones"`) |

**Returns:**

```json
{
  "projectDir": "/path/to/project",
  "state": "...",
  "project": "...",
  "requirements": "...",
  "milestones": [
    { "id": "M001", "hasRoadmap": true, "hasSummary": false }
  ]
}
```

### `hx_resolve_blocker`

Resolve a pending blocker in a session by sending a response to the blocked UI request.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sessionId` | `string` | ✅ | Session ID from `hx_execute` |
| `response` | `string` | ✅ | Response to send for the pending blocker |

**Returns:** `{ resolved: true }`

## Environment Variables

| Variable | Description |
|----------|-------------|
| `HX_CLI_PATH` | Absolute path to the HX CLI binary. If not set, the server resolves `hx` via `which`. |

## Architecture

```
┌─────────────────┐     stdio      ┌──────────────────────────┐
│  MCP Client     │ ◄────────────► │  @hyperlab/hx-mcp-server │
│  (Claude Code,  │    JSON-RPC    │                          │
│   Cursor, etc.) │                │  SessionManager          │
└─────────────────┘                │       │                  │
                                   │       ▼                  │
                                   │  @hyperlab/hx-rpc-client │
                                   │       │                  │
                                   │       ▼                  │
                                   │  HX CLI (child           │
                                   │  process via RPC)        │
                                   └──────────────────────────┘
```

- **@hyperlab/hx-mcp-server** — MCP protocol adapter. Translates MCP tool calls into SessionManager operations.
- **SessionManager** — Manages RpcClient lifecycle. One session per project directory. Tracks events in a ring buffer (last 50), detects blockers, accumulates cost.
- **@hyperlab/hx-rpc-client** — Low-level RPC client that spawns and communicates with the HX CLI process via JSON-RPC over stdio.

## License

MIT
