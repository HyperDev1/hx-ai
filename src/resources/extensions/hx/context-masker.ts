/**
 * Context masker — reduces token cost of older tool-call results in HX auto-mode.
 *
 * For long sessions, observation messages (toolResult blocks and bash-result
 * user messages) older than `keepRecentTurns` assistant turns are replaced with
 * a single compact placeholder. The message structure is preserved so the
 * provider never sees a malformed conversation.
 */

// ─── Constants ─────────────────────────────────────────────────────────────

const MASK_CONTENT_BLOCK = [
  { type: "text", text: "[result masked — within summarized history]" },
];

// ─── Message predicate helpers ─────────────────────────────────────────────

type Message = Record<string, unknown>;
type ContentBlock = { type?: string; text?: string };

/**
 * Returns true if `m` is a user message whose first content block text starts
 * with `Ran \`` — the signature emitted by the bash tool result renderer.
 */
function isBashResultUserMessage(m: Message): boolean {
  if (m.role !== "user") return false;
  const content = m.content as ContentBlock[] | undefined;
  if (!Array.isArray(content) || content.length === 0) return false;
  const first = content[0];
  return typeof first.text === "string" && first.text.startsWith("Ran `");
}

/**
 * Returns true if the message should be masked when it falls outside the
 * recent-turns window. Masking is role-based:
 *   - role === 'toolResult'         → maskable
 *   - isBashResultUserMessage(m)    → maskable
 * A message with role 'user' but type 'toolResult' is NOT maskable by this
 * function — role takes precedence over any type field.
 */
function isMaskableMessage(m: Message): boolean {
  return m.role === "toolResult" || isBashResultUserMessage(m);
}

// ─── Boundary scanner ─────────────────────────────────────────────────────

/**
 * Scan messages from the end and return the index of the first message that
 * falls outside the `keepRecentTurns` assistant-turn window.
 *
 * Returns 0 (mask everything) if there are no assistant turns at all.
 * Returns messages.length (mask nothing) when all messages fit within the window.
 */
function findTurnBoundary(
  messages: Message[],
  keepRecentTurns: number
): number {
  let assistantTurnsSeen = 0;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "assistant") {
      assistantTurnsSeen++;
      if (assistantTurnsSeen >= keepRecentTurns) {
        return i;
      }
    }
  }
  // Fewer than keepRecentTurns assistant turns — nothing falls outside the window
  return 0;
}

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * Create an observation-masking function that, when called with a messages
 * array, returns a new array with maskable messages older than the
 * `keepRecentTurns` boundary replaced by a compact placeholder.
 *
 * The returned function is pure — it never mutates the input array or its
 * elements. A new array (with new message objects where content was replaced)
 * is always returned.
 *
 * @param keepRecentTurns Number of recent assistant turns to keep unmasked.
 *                        Defaults to 8.
 */
export function createObservationMask(
  keepRecentTurns: number = 8
): (messages: Message[]) => Message[] {
  return (messages: Message[]): Message[] => {
    const boundary = findTurnBoundary(messages, keepRecentTurns);
    // If boundary is 0 and there are no assistant turns, nothing is masked
    // (boundary 0 means everything from index 0 onward is in the window)
    if (boundary === 0) return messages;

    return messages.map((m, i) => {
      if (i < boundary && isMaskableMessage(m)) {
        return { ...m, content: MASK_CONTENT_BLOCK };
      }
      return m;
    });
  };
}
