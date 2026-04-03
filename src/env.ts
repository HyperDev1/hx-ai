/**
 * HX Environment — .env file loader and startup validation.
 *
 * Loads variables from .env into process.env (does NOT overwrite existing values).
 * Optionally validates that required keys are present and logs warnings for
 * missing optional keys when HX_DEBUG is set.
 *
 * No external dependencies — uses a simple line-by-line parser that handles
 * comments, blank lines, quoted values, and inline comments.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

// ─── .env Parser ─────────────────────────────────────────────────────────────

/**
 * Parse a .env file string into a key-value map.
 * Handles:
 *   - Comments (lines starting with #)
 *   - Blank lines
 *   - KEY=value (unquoted)
 *   - KEY="value" (double-quoted, supports \n escapes)
 *   - KEY='value' (single-quoted, literal)
 *   - Inline comments after unquoted values (KEY=value # comment)
 *   - export KEY=value prefix
 */
export function parseDotenv(content: string): Record<string, string> {
  const result: Record<string, string> = {};

  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();

    // Skip blank lines and comments
    if (!line || line.startsWith("#")) continue;

    // Strip optional 'export ' prefix
    const stripped = line.startsWith("export ") ? line.slice(7) : line;

    const eqIdx = stripped.indexOf("=");
    if (eqIdx === -1) continue;

    const key = stripped.slice(0, eqIdx).trim();
    if (!key) continue;

    let value = stripped.slice(eqIdx + 1).trim();

    // Handle quoted values
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      const quote = value[0];
      value = value.slice(1, -1);
      // Only process escape sequences in double-quoted strings
      if (quote === '"') {
        value = value
          .replace(/\\n/g, "\n")
          .replace(/\\r/g, "\r")
          .replace(/\\t/g, "\t")
          .replace(/\\\\/g, "\\")
          .replace(/\\"/g, '"');
      }
    } else {
      // Strip inline comments from unquoted values
      const commentIdx = value.indexOf(" #");
      if (commentIdx !== -1) {
        value = value.slice(0, commentIdx).trimEnd();
      }
    }

    result[key] = value;
  }

  return result;
}

// ─── Loader ──────────────────────────────────────────────────────────────────

export interface LoadEnvResult {
  /** Number of variables loaded (set into process.env) */
  loaded: number;
  /** Keys that were already set and therefore skipped */
  skipped: string[];
  /** Path to the .env file that was loaded, or null if not found */
  path: string | null;
}

/**
 * Load a .env file into process.env. Does NOT overwrite existing values.
 *
 * @param basePath - Directory containing the .env file (default: cwd)
 * @param fileName - Name of the env file (default: ".env")
 * @returns LoadEnvResult with stats about what was loaded
 */
export function loadEnvFile(basePath?: string, fileName = ".env"): LoadEnvResult {
  const dir = basePath ?? process.cwd();
  const envPath = resolve(dir, fileName);

  if (!existsSync(envPath)) {
    return { loaded: 0, skipped: [], path: null };
  }

  let content: string;
  try {
    content = readFileSync(envPath, "utf-8");
  } catch {
    return { loaded: 0, skipped: [], path: null };
  }

  const parsed = parseDotenv(content);
  let loaded = 0;
  const skipped: string[] = [];

  for (const [key, value] of Object.entries(parsed)) {
    if (key in process.env) {
      skipped.push(key);
    } else {
      process.env[key] = value;
      loaded++;
    }
  }

  return { loaded, skipped, path: envPath };
}

// ─── Validation ──────────────────────────────────────────────────────────────

export interface EnvValidationResult {
  /** Whether at least one provider key is available */
  hasProvider: boolean;
  /** Missing keys from optional groups */
  missingOptional: Record<string, string[]>;
  /** Available provider keys */
  availableProviders: string[];
}

/** AI provider keys — at least one should be set for the agent to work */
const PROVIDER_KEYS = [
  "ANTHROPIC_API_KEY",
  "OPENAI_API_KEY",
  "GEMINI_API_KEY",
  "GROQ_API_KEY",
  "OLLAMA_API_KEY",
  "CUSTOM_OPENAI_API_KEY",
] as const;

/** Search/web tool keys */
const SEARCH_KEYS = [
  "BRAVE_API_KEY",
  "TAVILY_API_KEY",
  "JINA_API_KEY",
  "CONTEXT7_API_KEY",
] as const;

/** Integration keys */
const INTEGRATION_KEYS = [
  "GITHUB_TOKEN",
  "DISCORD_BOT_TOKEN",
  "SLACK_BOT_TOKEN",
  "TELEGRAM_BOT_TOKEN",
] as const;

/**
 * Validate that the environment has the minimum required configuration.
 * Does NOT throw — returns a result object for callers to act on.
 */
export function validateEnv(): EnvValidationResult {
  const availableProviders = PROVIDER_KEYS.filter((k) => !!process.env[k]);

  const missingOptional: Record<string, string[]> = {};

  const missingSearch = SEARCH_KEYS.filter((k) => !process.env[k]);
  if (missingSearch.length === SEARCH_KEYS.length) {
    missingOptional["search"] = [...missingSearch];
  }

  const missingIntegration = INTEGRATION_KEYS.filter((k) => !process.env[k]);
  if (missingIntegration.length > 0) {
    missingOptional["integrations"] = [...missingIntegration];
  }

  return {
    hasProvider: availableProviders.length > 0,
    availableProviders: [...availableProviders],
    missingOptional,
  };
}

/**
 * Log environment validation warnings to stderr.
 * Called during startup — only logs if HX_DEBUG is set or no provider is found.
 */
export function logEnvWarnings(result: EnvValidationResult): void {
  if (!result.hasProvider) {
    console.error(
      "[hx] ⚠ No AI provider API key found. Set at least one of: " +
        PROVIDER_KEYS.join(", ") +
        "\n     See .env.example for configuration details.",
    );
  }

  // Only log optional missing keys in debug mode
  if (process.env.HX_DEBUG) {
    if (result.missingOptional["search"]) {
      console.error(
        "[hx] debug: No search keys configured. Web search tools will be unavailable.",
      );
    }
  }
}
