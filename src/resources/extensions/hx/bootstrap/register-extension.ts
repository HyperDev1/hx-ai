import type { ExtensionAPI, ExtensionCommandContext } from "@hyperlab/hx-coding-agent";

import { registerHXCommand } from "../commands.js";
import { registerExitCommand } from "../exit-command.js";
import { registerWorktreeCommand } from "../worktree-command.js";
import { registerDbTools } from "./db-tools.js";
import { registerDynamicTools } from "./dynamic-tools.js";
import { registerJournalTools } from "./journal-tools.js";
import { registerHooks } from "./register-hooks.js";
import { registerOllamaManageTool } from "./ollama-manage-tool.js";
import { registerShortcuts } from "./register-shortcuts.js";

export function handleRecoverableExtensionProcessError(err: Error): boolean {
  if ((err as NodeJS.ErrnoException).code === "EPIPE") {
    process.exit(0);
  }
  if ((err as NodeJS.ErrnoException).code === "ENOENT") {
    const syscall = (err as NodeJS.ErrnoException).syscall;
    if (syscall?.startsWith("spawn")) {
      process.stderr.write(`[hx] spawn ENOENT: ${(err as any).path ?? "unknown"} — command not found\n`);
      return true;
    }
    if (syscall === "uv_cwd") {
      process.stderr.write(`[hx] ENOENT (${syscall}): ${err.message}\n`);
      return true;
    }
  }
  return false;
}

function installEpipeGuard(): void {
  if (!process.listeners("uncaughtException").some((listener) => listener.name === "_hxEpipeGuard")) {
    const _hxEpipeGuard = (err: Error): void => {
      if (handleRecoverableExtensionProcessError(err)) {
        return;
      }
      throw err;
    };
    process.on("uncaughtException", _hxEpipeGuard);
  }
}

export function registerHxExtension(pi: ExtensionAPI): void {
  registerHXCommand(pi);
  registerWorktreeCommand(pi);
  registerExitCommand(pi);

  installEpipeGuard();

  // Register Ollama as a keyless local provider so discovered models route
  // via the native ollama-chat API instead of the broken openai shim.
  pi.registerProvider("ollama", {
    authMode: "none",
    api: "ollama-chat",
    baseUrl: "http://localhost:11434",
  });

  pi.registerCommand("kill", {
    description: "Exit HX immediately (no cleanup)",
    handler: async (_args: string, _ctx: ExtensionCommandContext) => {
      process.exit(0);
    },
  });

  registerDynamicTools(pi);
  registerDbTools(pi);
  registerJournalTools(pi);
  registerShortcuts(pi);
  registerHooks(pi);
  registerOllamaManageTool(pi);
}
