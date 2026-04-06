import { existsSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { resolveTypeStrippingFlag } from "./ts-subprocess-flags.ts";

export interface HxCliEntry {
  command: string;
  args: string[];
  cwd: string;
}

export interface ResolveHxCliEntryOptions {
  packageRoot: string;
  cwd: string;
  execPath?: string;
  hostKind?: string;
  mode?: "interactive" | "rpc";
  sessionDir?: string;
  messages?: string[];
  existsSync?: (path: string) => boolean;
}

function buildExtraArgs(options: ResolveHxCliEntryOptions): string[] {
  if (options.mode !== "rpc") return [];

  if (!options.sessionDir) {
    throw new Error("RPC CLI entry requires sessionDir");
  }

  return ["--mode", "rpc", "--continue", "--session-dir", options.sessionDir];
}

export function resolveHxCliEntry(options: ResolveHxCliEntryOptions): HxCliEntry {
  const checkExists = options.existsSync ?? existsSync;
  const execPath = options.execPath ?? process.execPath;
  const extraArgs = buildExtraArgs(options);
  const messageArgs = options.mode === "interactive" ? options.messages ?? [] : [];

  const sourceEntry = join(options.packageRoot, "src", "loader.ts");
  const resolveTsLoader = join(options.packageRoot, "src", "resources", "extensions", "hx", "tests", "resolve-ts.mjs");
  const builtEntry = join(options.packageRoot, "dist", "loader.js");

  const sourceCliEntry =
    checkExists(sourceEntry) && checkExists(resolveTsLoader)
      ? {
          command: execPath,
          args: [
            "--import",
            pathToFileURL(resolveTsLoader).href,
            resolveTypeStrippingFlag(options.packageRoot),
            sourceEntry,
            ...extraArgs,
            ...messageArgs,
          ],
          cwd: options.cwd,
        } satisfies HxCliEntry
      : null;

  const builtCliEntry = checkExists(builtEntry)
    ? {
        command: execPath,
        args: [builtEntry, ...extraArgs, ...messageArgs],
        cwd: options.cwd,
      } satisfies HxCliEntry
    : null;

  if (options.hostKind === "packaged-standalone") {
    if (builtCliEntry) return builtCliEntry;
    if (sourceCliEntry) return sourceCliEntry;
  } else {
    if (sourceCliEntry) return sourceCliEntry;
    if (builtCliEntry) return builtCliEntry;
  }

  throw new Error(`HX CLI entry not found; checked=${sourceEntry},${builtEntry}`);
}
