import { existsSync } from "node:fs";
import { join, sep } from "node:path";

import type { ExtensionAPI } from "@hyperlab/hx-coding-agent";
import { createBashTool, createEditTool, createReadTool, createWriteTool } from "@hyperlab/hx-coding-agent";

import { DEFAULT_BASH_TIMEOUT_SECS } from "../constants.js";
import { setLogBasePath } from "../workflow-logger.js";

/**
 * Resolve the correct DB path for the current working directory.
 * If `basePath` is inside a `.hx/worktrees/<MID>/` directory, returns
 * the project root's `.hx/hx.db` (shared WAL — R012). Otherwise
 * returns `<basePath>/.hx/hx.db`.
 */
export function resolveProjectRootDbPath(basePath: string): string {
  // Detect worktree: look for `.hx/worktrees/` in the path segments.
  // A worktree path looks like: /project/root/.hx/worktrees/M001/...
  // We need to resolve back to /project/root/.hx/hx.db
  const marker = `${sep}.hx${sep}worktrees${sep}`;
  const idx = basePath.indexOf(marker);
  if (idx !== -1) {
    const projectRoot = basePath.slice(0, idx);
    return join(projectRoot, ".hx", "hx.db");
  }

  // Also handle forward-slash paths on all platforms
  const fwdMarker = "/.hx/worktrees/";
  const fwdIdx = basePath.indexOf(fwdMarker);
  if (fwdIdx !== -1) {
    const projectRoot = basePath.slice(0, fwdIdx);
    return join(projectRoot, ".hx", "hx.db");
  }

  return join(basePath, ".hx", "hx.db");
}

export async function ensureDbOpen(): Promise<boolean> {
  try {
    const db = await import("../hx-db.js");
    if (db.isDbAvailable()) return true;

    const basePath = process.cwd();
    const dbPath = resolveProjectRootDbPath(basePath);
    const gsdDir = join(basePath, ".hx");

    // Derive the project root from the DB path (strip .hx/hx.db)
    const projectRoot = join(dbPath, "..", "..");

    // Open existing DB file (may be at project root for worktrees)
    if (existsSync(dbPath)) {
      const opened = db.openDatabase(dbPath);
      if (opened) setLogBasePath(projectRoot);
      return opened;
    }

    // No DB file — create + migrate from Markdown if .hx/ has content
    if (existsSync(gsdDir)) {
      const hasDecisions = existsSync(join(gsdDir, "DECISIONS.md"));
      const hasRequirements = existsSync(join(gsdDir, "REQUIREMENTS.md"));
      const hasMilestones = existsSync(join(gsdDir, "milestones"));
      if (hasDecisions || hasRequirements || hasMilestones) {
        const opened = db.openDatabase(dbPath);
        if (opened) {
          setLogBasePath(projectRoot);
          try {
            const { migrateFromMarkdown } = await import("../md-importer.js");
            migrateFromMarkdown(basePath);
          } catch (err) {
            process.stderr.write(
              `hx-db: ensureDbOpen auto-migration failed: ${(err as Error).message}\n`,
            );
          }
        }
        return opened;
      }

      // .hx/ exists but has no Markdown content (fresh project) — create empty DB
      const opened = db.openDatabase(dbPath);
      if (opened) setLogBasePath(projectRoot);
      return opened;
    }

    return false;
  } catch {
    return false;
  }
}

export function registerDynamicTools(pi: ExtensionAPI): void {
  const baseBash = createBashTool(process.cwd(), {
    spawnHook: (ctx) => ({ ...ctx, cwd: process.cwd() }),
  });
  const dynamicBash = {
    ...baseBash,
    execute: async (
      toolCallId: string,
      params: { command: string; timeout?: number },
      signal?: AbortSignal,
      onUpdate?: unknown,
      ctx?: unknown,
    ) => {
      const paramsWithTimeout = {
        ...params,
        timeout: params.timeout ?? DEFAULT_BASH_TIMEOUT_SECS,
      };
      return (baseBash as any).execute(toolCallId, paramsWithTimeout, signal, onUpdate, ctx);
    },
  };
  pi.registerTool(dynamicBash as any);

  const baseWrite = createWriteTool(process.cwd());
  pi.registerTool({
    ...baseWrite,
    execute: async (
      toolCallId: string,
      params: { path: string; content: string },
      signal?: AbortSignal,
      onUpdate?: unknown,
      ctx?: unknown,
    ) => {
      const fresh = createWriteTool(process.cwd());
      return (fresh as any).execute(toolCallId, params, signal, onUpdate, ctx);
    },
  } as any);

  const baseRead = createReadTool(process.cwd());
  pi.registerTool({
    ...baseRead,
    execute: async (
      toolCallId: string,
      params: { path: string; offset?: number; limit?: number },
      signal?: AbortSignal,
      onUpdate?: unknown,
      ctx?: unknown,
    ) => {
      const fresh = createReadTool(process.cwd());
      return (fresh as any).execute(toolCallId, params, signal, onUpdate, ctx);
    },
  } as any);

  const baseEdit = createEditTool(process.cwd());
  pi.registerTool({
    ...baseEdit,
    execute: async (
      toolCallId: string,
      params: { path: string; oldText: string; newText: string },
      signal?: AbortSignal,
      onUpdate?: unknown,
      ctx?: unknown,
    ) => {
      const fresh = createEditTool(process.cwd());
      return (fresh as any).execute(toolCallId, params, signal, onUpdate, ctx);
    },
  } as any);
}

