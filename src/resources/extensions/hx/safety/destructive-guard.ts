// HX Extension — Destructive Guard
// Classifies shell commands as destructive/safe and warns when the agent
// issues commands that could irreversibly corrupt the working tree.

// ─── Destructive patterns ─────────────────────────────────────────────────────

const DESTRUCTIVE_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\brm\s+-rf?\b/, label: "rm -rf" },
  { pattern: /\bgit\s+reset\s+--hard\b/, label: "git reset --hard" },
  { pattern: /\bgit\s+clean\s+-[a-z]*f/, label: "git clean -f" },
  { pattern: /\bgit\s+push\s+.*--force/, label: "git push --force" },
  { pattern: /\bgit\s+push\s+-f\b/, label: "git push -f" },
  { pattern: /\bdrop\s+table\b/i, label: "DROP TABLE" },
  { pattern: /\btruncate\s+table\b/i, label: "TRUNCATE TABLE" },
  { pattern: /\bdelete\s+from\b/i, label: "DELETE FROM (unqualified)" },
  { pattern: />\s*\/dev\/null\s*&&\s*rm/, label: "redirect-and-delete pattern" },
  { pattern: /\bchmod\s+-R\s+[0-6]{3,4}\s+\//, label: "chmod -R on root path" },
];

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CommandClassification {
  isDestructive: boolean;
  label: string | null;
  command: string;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Classify a shell command as destructive or safe.
 * Returns the matching pattern label if destructive, null otherwise.
 */
export function classifyCommand(command: string): CommandClassification {
  for (const { pattern, label } of DESTRUCTIVE_PATTERNS) {
    if (pattern.test(command)) {
      return { isDestructive: true, label, command };
    }
  }
  return { isDestructive: false, label: null, command };
}

/**
 * Returns a human-readable warning string for a destructive command,
 * or null if the command is safe.
 */
export function destructiveWarning(command: string): string | null {
  const classification = classifyCommand(command);
  if (!classification.isDestructive) return null;
  return `Destructive command detected [${classification.label}]: ${command.slice(0, 120)}`;
}
