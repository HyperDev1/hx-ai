/**
 * Utilities for repairing malformed tool-call JSON from AI responses.
 *
 * Some AI providers wrap parameters in XML tags or truncate JSON
 * mid-number. These helpers surgically fix the most common cases.
 */

/**
 * Strip XML <parameter> wrapper tags that some providers emit around
 * JSON parameter values.
 *
 * Example input:
 *   {"path": "<parameter>src/index.ts</parameter>"}
 * Example output:
 *   {"path": "src/index.ts"}
 */
export function stripXmlParameterTags(json: string): string {
  // Strip opening and closing <parameter> / </parameter> tags
  // Use a simple string-replace loop rather than regex with dotAll
  // to avoid backtracking on very large inputs.
  return json
    .replace(/<parameter>/g, "")
    .replace(/<\/parameter>/g, "");
}

/**
 * Repair JSON that ends mid-number (truncation artefact).
 *
 * If the JSON string ends with a partial number and is missing the closing
 * brace(s), this function appends them so JSON.parse() can succeed.
 *
 * Example input:  {"count": 42
 * Example output: {"count": 42}
 *
 * This is intentionally conservative: it only appends closing braces when
 * the last non-whitespace character is a digit (indicating a truncated
 * number literal). It does not attempt to repair truncated strings, arrays,
 * or nested objects.
 */
export function repairTruncatedNumber(json: string): string {
  const trimmed = json.trimEnd();
  if (!trimmed) return json;

  const lastChar = trimmed[trimmed.length - 1];
  // Only repair when the JSON ends mid-number
  if (!/\d/.test(lastChar)) return json;

  // Count unmatched opening braces and brackets to determine what to append
  let braces = 0;
  let brackets = 0;
  let inString = false;
  let escape = false;

  for (const ch of trimmed) {
    if (escape) { escape = false; continue; }
    if (ch === "\\" && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;

    if (ch === "{") braces++;
    else if (ch === "}") braces--;
    else if (ch === "[") brackets++;
    else if (ch === "]") brackets--;
  }

  if (braces <= 0 && brackets <= 0) return json;

  // Append closing brackets then braces
  const closing = "]".repeat(Math.max(0, brackets)) + "}".repeat(Math.max(0, braces));
  return trimmed + closing;
}
