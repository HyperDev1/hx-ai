/**
 * /hx codebase — Generate and manage the project codebase map (.hx/CODEBASE.md).
 *
 * Sub-commands:
 *   generate          Generate a new codebase map from scratch
 *   update            Update the existing map (adds new files, removes stale ones)
 *   stats             Show statistics about the current map
 *   help              Show usage information
 */

import type { ExtensionCommandContext } from "@hyperlab/hx-coding-agent";
import {
  generateCodebaseMap,
  updateCodebaseMap,
  writeCodebaseMap,
  readCodebaseMap,
  getCodebaseMapStats,
  type CodebaseMapOptions,
} from "./codebase-generator.js";
import { loadEffectiveHXPreferences } from "./preferences.js";
import { projectRoot } from "./commands/context.js";

// ---------------------------------------------------------------------------
// Options resolution
// ---------------------------------------------------------------------------

function resolveCodebaseOptions(args: string): CodebaseMapOptions {
  const prefs = loadEffectiveHXPreferences();
  const prefCodebase = prefs?.preferences?.codebase ?? {};

  const opts: CodebaseMapOptions = {
    excludePatterns: prefCodebase.exclude_patterns ?? [],
    maxFiles: prefCodebase.max_files ?? 500,
    collapseThreshold: prefCodebase.collapse_threshold ?? 3,
  };

  // Parse --collapse-threshold <n> from CLI args
  const collapseMatch = args.match(/--collapse-threshold[=\s]+(\d+)/);
  if (collapseMatch) {
    opts.collapseThreshold = parseInt(collapseMatch[1], 10);
  }

  // Parse --max-files <n>
  const maxFilesMatch = args.match(/--max-files[=\s]+(\d+)/);
  if (maxFilesMatch) {
    opts.maxFiles = parseInt(maxFilesMatch[1], 10);
  }

  return opts;
}

// ---------------------------------------------------------------------------
// Subcommand handlers
// ---------------------------------------------------------------------------

async function handleGenerate(args: string, ctx: ExtensionCommandContext): Promise<void> {
  const root = projectRoot();
  const opts = resolveCodebaseOptions(args);

  ctx.ui.notify("Generating codebase map…", "info");

  try {
    const entries = generateCodebaseMap(root, opts);
    writeCodebaseMap(root, entries);
    const stats = getCodebaseMapStats(entries);
    ctx.ui.notify(
      `Codebase map generated: ${stats.totalFiles} files, ${stats.totalDirs} directories → .hx/CODEBASE.md`,
      "info",
    );
  } catch (err) {
    ctx.ui.notify(
      `Codebase map generation failed: ${err instanceof Error ? err.message : String(err)}`,
      "error",
    );
  }
}

async function handleUpdate(args: string, ctx: ExtensionCommandContext): Promise<void> {
  const root = projectRoot();
  const opts = resolveCodebaseOptions(args);

  const existing = readCodebaseMap(root);
  if (!existing) {
    // No existing map — generate from scratch
    await handleGenerate(args, ctx);
    return;
  }

  ctx.ui.notify("Updating codebase map…", "info");

  try {
    const fresh = generateCodebaseMap(root, opts);
    const merged = updateCodebaseMap(existing, fresh);
    writeCodebaseMap(root, merged);
    const stats = getCodebaseMapStats(merged);
    ctx.ui.notify(
      `Codebase map updated: ${stats.totalFiles} files, ${stats.totalDirs} directories → .hx/CODEBASE.md`,
      "info",
    );
  } catch (err) {
    ctx.ui.notify(
      `Codebase map update failed: ${err instanceof Error ? err.message : String(err)}`,
      "error",
    );
  }
}

async function handleStats(_args: string, ctx: ExtensionCommandContext): Promise<void> {
  const root = projectRoot();
  const entries = readCodebaseMap(root);

  if (!entries) {
    ctx.ui.notify(
      "No codebase map found. Run `/hx codebase generate` to create one.",
      "warning",
    );
    return;
  }

  const stats = getCodebaseMapStats(entries);
  const extLines = Object.entries(stats.filesByExtension)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([ext, count]) => `  ${ext}: ${count}`)
    .join("\n");

  ctx.ui.notify(
    `Codebase Map Statistics\n` +
    `  Files: ${stats.totalFiles}\n` +
    `  Directories: ${stats.totalDirs}\n` +
    `  Top-level entries: ${stats.topLevelEntries}\n` +
    `\nTop file types:\n${extLines}`,
    "info",
  );
}

function showHelp(ctx: ExtensionCommandContext): void {
  ctx.ui.notify(
    `Usage: /hx codebase <subcommand> [options]\n\n` +
    `Subcommands:\n` +
    `  generate                 Generate a new codebase map from scratch\n` +
    `  update                   Update the existing map (adds new, removes stale)\n` +
    `  stats                    Show statistics about the current map\n` +
    `  help                     Show this help message\n\n` +
    `Options:\n` +
    `  --collapse-threshold <n> Collapse dirs with N or fewer files (default: 3)\n` +
    `  --max-files <n>          Maximum files to include (default: 500)\n\n` +
    `The map is written to .hx/CODEBASE.md and automatically injected into\n` +
    `the agent context on each turn.`,
    "info",
  );
}

// ---------------------------------------------------------------------------
// handleCodebase — main entry point
// ---------------------------------------------------------------------------

export async function handleCodebase(args: string, ctx: ExtensionCommandContext): Promise<void> {
  const trimmed = args.trim();

  if (!trimmed || trimmed === "generate") {
    await handleGenerate(trimmed, ctx);
    return;
  }

  if (trimmed.startsWith("update")) {
    await handleUpdate(trimmed.replace(/^update\s*/, "").trim(), ctx);
    return;
  }

  if (trimmed === "stats") {
    await handleStats(trimmed, ctx);
    return;
  }

  if (trimmed === "help") {
    showHelp(ctx);
    return;
  }

  // Unknown subcommand — show help
  ctx.ui.notify(
    `Unknown codebase subcommand: "${trimmed}". Run \`/hx codebase help\` for usage.`,
    "warning",
  );
}
