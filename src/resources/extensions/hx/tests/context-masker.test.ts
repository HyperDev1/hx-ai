/**
 * Tests for context-masker.ts
 *
 * Covers: isMaskableMessage predicate, findTurnBoundary scanning,
 * and createObservationMask behaviour across 7 scenarios.
 */

import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { createObservationMask } from "../context-masker.ts";

// ─── Helpers ─────────────────────────────────────────────────────────────────

type Msg = Record<string, unknown>;

function toolResultMsg(text: string): Msg {
  return { role: "toolResult", content: [{ type: "text", text }] };
}

function assistantMsg(): Msg {
  return { role: "assistant", content: [{ type: "text", text: "reply" }] };
}

function bashResultMsg(text: string): Msg {
  return { role: "user", content: [{ type: "text", text: `Ran \`${text}\`` }] };
}

function plainUserMsg(text: string): Msg {
  return { role: "user", content: [{ type: "text", text }] };
}

const MASK_TEXT = "[result masked — within summarized history]";

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("context-masker", () => {
  test("masks nothing when all messages are within keepRecentTurns", () => {
    // 2 assistant turns, keepRecentTurns=8 — everything is recent
    const messages: Msg[] = [
      toolResultMsg("old tool output"),
      assistantMsg(),
      toolResultMsg("newer tool output"),
      assistantMsg(),
    ];
    const mask = createObservationMask(8);
    const result = mask(messages);
    // No message should be masked
    for (const m of result) {
      const content = m.content as Array<{ text?: string }>;
      assert.notEqual(content[0]?.text, MASK_TEXT);
    }
  });

  test("masks tool results older than keepRecentTurns boundary", () => {
    // Build a conversation with 3 assistant turns; keepRecentTurns=2
    // → messages before the 2nd-from-last assistant turn should be masked
    const messages: Msg[] = [
      toolResultMsg("very old result"),   // 0 — should be masked
      assistantMsg(),                      // 1 — assistant turn 1 from end = 3rd
      toolResultMsg("middle result"),      // 2 — should be masked
      assistantMsg(),                      // 3 — assistant turn 2 from end
      toolResultMsg("recent result"),      // 4 — inside window, should NOT be masked
      assistantMsg(),                      // 5 — assistant turn 1 from end
    ];
    const mask = createObservationMask(2);
    const result = mask(messages);

    // Index 0: toolResult before boundary — should be masked
    assert.equal(
      (result[0].content as Array<{ text: string }>)[0].text,
      MASK_TEXT,
      "old tool result should be masked"
    );
    // Index 2: toolResult before boundary — should be masked
    assert.equal(
      (result[2].content as Array<{ text: string }>)[0].text,
      MASK_TEXT,
      "middle tool result should be masked"
    );
    // Index 4: toolResult inside window — should NOT be masked
    assert.notEqual(
      (result[4].content as Array<{ text: string }>)[0].text,
      MASK_TEXT,
      "recent tool result should not be masked"
    );
  });

  test("never masks assistant messages", () => {
    const messages: Msg[] = [
      assistantMsg(),
      assistantMsg(),
      assistantMsg(),
    ];
    const mask = createObservationMask(1);
    const result = mask(messages);
    for (const m of result) {
      assert.equal(m.role, "assistant");
      const content = m.content as Array<{ text: string }>;
      assert.equal(content[0].text, "reply");
    }
  });

  test("never masks plain user messages without Ran ` prefix", () => {
    const messages: Msg[] = [
      plainUserMsg("what is the weather?"),
      assistantMsg(),
      assistantMsg(),
      assistantMsg(),
    ];
    const mask = createObservationMask(1);
    const result = mask(messages);
    const firstContent = (result[0].content as Array<{ text: string }>)[0].text;
    assert.equal(firstContent, "what is the weather?");
  });

  test("masks bash result user messages (Ran ` prefix)", () => {
    // 3 assistant turns, keepRecentTurns=1 — everything before last assistant is old
    const messages: Msg[] = [
      bashResultMsg("ls -la"),   // 0 — bash result before boundary
      assistantMsg(),             // 1
      bashResultMsg("pwd"),       // 2 — bash result before boundary
      assistantMsg(),             // 3
      bashResultMsg("echo hi"),   // 4 — bash result before boundary
      assistantMsg(),             // 5 — boundary is here (1 turn from end)
    ];
    const mask = createObservationMask(1);
    const result = mask(messages);

    // Indices 0, 2, 4 are bash results before the boundary — should be masked
    for (const idx of [0, 2, 4]) {
      assert.equal(
        (result[idx].content as Array<{ text: string }>)[0].text,
        MASK_TEXT,
        `bash result at index ${idx} should be masked`
      );
    }
  });

  test("returns same array length after masking", () => {
    const messages: Msg[] = [
      toolResultMsg("a"),
      assistantMsg(),
      toolResultMsg("b"),
      assistantMsg(),
      toolResultMsg("c"),
      assistantMsg(),
    ];
    const mask = createObservationMask(1);
    const result = mask(messages);
    assert.equal(result.length, messages.length);
  });

  test("masks toolResult by role, not by type field — user role with type:toolResult is NOT masked", () => {
    // A message with role:'user' and a type field of 'toolResult' should NOT be
    // masked because isMaskableMessage checks role, not type.
    const fakeToolResult: Msg = {
      role: "user",
      type: "toolResult",
      content: [{ type: "text", text: "I look like a tool result but am a user message" }],
    };
    const messages: Msg[] = [
      fakeToolResult,             // 0 — role:user, should NOT be masked
      assistantMsg(),             // 1
      assistantMsg(),             // 2
      assistantMsg(),             // 3
    ];
    const mask = createObservationMask(1);
    const result = mask(messages);

    const content = (result[0].content as Array<{ text: string }>)[0].text;
    assert.notEqual(
      content,
      MASK_TEXT,
      "user message with type:toolResult should not be masked"
    );
  });
});
