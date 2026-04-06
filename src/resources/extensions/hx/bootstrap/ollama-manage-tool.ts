/**
 * ollama_manage tool — manage local Ollama models via the Ollama REST API.
 *
 * Subcommands:
 *   list           — GET  /api/tags         — list installed models
 *   pull <name>    — POST /api/pull         — pull (download) a model
 *   remove <name>  — DELETE /api/delete     — remove a model
 *   show <name>    — POST /api/show         — show model info
 *
 * Uses fetch() only; no subprocesses, no new npm deps.
 * Gracefully returns an error object when Ollama is not running.
 */

import type { ExtensionAPI } from "@hyperlab/hx-coding-agent";

const OLLAMA_BASE_URL = "http://localhost:11434";

// ─── REST helpers ─────────────────────────────────────────────────────────────

async function ollamaGet<T>(path: string): Promise<T> {
  const response = await fetch(`${OLLAMA_BASE_URL}${path}`);
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Ollama ${path} returned ${response.status}: ${body}`);
  }
  return response.json() as Promise<T>;
}

async function ollamaPost<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${OLLAMA_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const errBody = await response.text().catch(() => "");
    throw new Error(`Ollama ${path} returned ${response.status}: ${errBody}`);
  }
  return response.json() as Promise<T>;
}

async function ollamaDelete<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${OLLAMA_BASE_URL}${path}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const errBody = await response.text().catch(() => "");
    throw new Error(`Ollama ${path} returned ${response.status}: ${errBody}`);
  }
  // DELETE /api/delete returns 200 with empty body on success
  const text = await response.text().catch(() => "");
  if (!text.trim()) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return {} as T;
  }
}

// ─── Subcommand implementations ───────────────────────────────────────────────

interface OllamaModel {
  name: string;
  size?: number;
  digest?: string;
  modified_at?: string;
  details?: Record<string, unknown>;
}

interface OllamaTagsResponse {
  models: OllamaModel[];
}

async function listModels(): Promise<unknown> {
  const data = await ollamaGet<OllamaTagsResponse>("/api/tags");
  const models = data.models ?? [];
  if (models.length === 0) {
    return { models: [], message: "No models installed. Use `ollama_manage pull <name>` to download one." };
  }
  return {
    models: models.map((m) => ({
      name: m.name,
      size: m.size,
      digest: m.digest?.substring(0, 12),
      modified_at: m.modified_at,
      parameter_size: (m.details as any)?.parameter_size,
    })),
  };
}

async function pullModel(name: string): Promise<unknown> {
  // Pull is a streaming NDJSON endpoint; we collect all lines and return the final status.
  const response = await fetch(`${OLLAMA_BASE_URL}/api/pull`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, stream: false }),
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Ollama /api/pull returned ${response.status}: ${body}`);
  }
  const result = await response.json() as { status?: string };
  return { name, status: result.status ?? "success" };
}

async function removeModel(name: string): Promise<unknown> {
  await ollamaDelete<unknown>("/api/delete", { name });
  return { name, status: "deleted" };
}

async function showModel(name: string): Promise<unknown> {
  const data = await ollamaPost<unknown>("/api/show", { name });
  return data;
}

// ─── Tool parameter schema ────────────────────────────────────────────────────

const schema = {
  type: "object",
  properties: {
    subcommand: {
      type: "string",
      enum: ["list", "pull", "remove", "show"],
      description: "Action to perform: list installed models, pull (download) a model, remove a model, or show model info.",
    },
    model: {
      type: "string",
      description: "Model name (required for pull, remove, show). Example: 'llama3.2', 'mistral:7b'.",
    },
  },
  required: ["subcommand"],
} as const;

// ─── Registration ─────────────────────────────────────────────────────────────

export function registerOllamaManageTool(pi: ExtensionAPI): void {
  pi.registerTool({
    name: "ollama_manage",
    description:
      "Manage local Ollama models. Subcommands: list (show installed models), " +
      "pull <model> (download a model), remove <model> (delete a model), " +
      "show <model> (display model details). Ollama must be running at http://localhost:11434.",
    parameters: schema,
    execute: async (
      _toolCallId: string,
      params: { subcommand: string; model?: string },
    ) => {
      try {
        switch (params.subcommand) {
          case "list":
            return JSON.stringify(await listModels(), null, 2);

          case "pull": {
            const name = params.model?.trim();
            if (!name) return JSON.stringify({ error: "Model name required for 'pull' subcommand." });
            const result = await pullModel(name);
            return JSON.stringify(result, null, 2);
          }

          case "remove": {
            const name = params.model?.trim();
            if (!name) return JSON.stringify({ error: "Model name required for 'remove' subcommand." });
            const result = await removeModel(name);
            return JSON.stringify(result, null, 2);
          }

          case "show": {
            const name = params.model?.trim();
            if (!name) return JSON.stringify({ error: "Model name required for 'show' subcommand." });
            const result = await showModel(name);
            return JSON.stringify(result, null, 2);
          }

          default:
            return JSON.stringify({ error: `Unknown subcommand '${params.subcommand}'. Use: list, pull, remove, show.` });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        // Distinguish "Ollama not running" from other errors
        const isConnRefused =
          message.includes("ECONNREFUSED") ||
          message.includes("fetch failed") ||
          message.includes("connect ECONNREFUSED");
        return JSON.stringify({
          error: isConnRefused
            ? "Ollama is not running. Start it with: ollama serve"
            : message,
        });
      }
    },
  } as any);
}
