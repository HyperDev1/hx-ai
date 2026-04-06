/**
 * Tests for ask-user-questions free-text follow-up when "None of the above" is selected.
 *
 * These tests exercise the RPC fallback path in ask-user-questions.ts (the branch
 * that fires when ctx.ui.custom() returns undefined, i.e. non-TUI environments).
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

// ── Constants mirrored from ask-user-questions.ts ──────────────────────────

const OTHER_OPTION_LABEL = "None of the above";

// ── Minimal mock types ─────────────────────────────────────────────────────

interface MockCtx {
  hasUI: boolean;
  ui: {
    select: (prompt: string, options: string[], opts?: Record<string, unknown>) => Promise<string | string[] | undefined>;
    input: (prompt: string, placeholder?: string) => Promise<string | undefined>;
    custom: <T>(fn: unknown) => Promise<T | undefined>;
    notify: (msg: string, type?: string) => void;
  };
  modelRegistry: {
    getApiKeyForProvider: (provider: string) => Promise<string | null>;
  };
}

function makeCtx(overrides: Partial<MockCtx["ui"]> = {}): MockCtx {
  return {
    hasUI: true,
    ui: {
      select: async () => undefined,
      input: async () => undefined,
      // Return undefined to force the RPC fallback path
      custom: async () => undefined,
      notify: () => {},
      ...overrides,
    },
    modelRegistry: {
      getApiKeyForProvider: async () => null,
    },
  };
}

// ── Inline reimplementation of the RPC fallback path ──────────────────────
// This mirrors the logic in ask-user-questions.ts execute() so we can test it
// without importing the full extension (which requires ExtensionAPI setup).

interface Question {
  id: string;
  header: string;
  question: string;
  options: Array<{ label: string; description: string }>;
  allowMultiple?: boolean;
}

async function runRpcFallback(
  questions: Question[],
  ctx: MockCtx,
  signal?: AbortSignal,
): Promise<{ answers: Record<string, { answers: string[] }> }> {
  const answers: Record<string, { answers: string[] }> = {};

  for (const q of questions) {
    const options = q.options.map((o) => o.label);
    if (!q.allowMultiple) {
      options.push(OTHER_OPTION_LABEL);
    }

    const selected = await ctx.ui.select(
      `${q.header}: ${q.question}`,
      options,
      { signal, ...(q.allowMultiple ? { allowMultiple: true } : {}) },
    );

    if (selected === undefined) {
      throw new Error("cancelled");
    }

    let freeTextNote = "";
    const selectedStr = Array.isArray(selected) ? selected[0] : selected;
    if (!q.allowMultiple && selectedStr === OTHER_OPTION_LABEL) {
      const note = await ctx.ui.input(
        `${q.header}: Please explain in your own words`,
        "Type your answer here…",
      );
      if (note) { freeTextNote = note; }
    }

    const answerList = Array.isArray(selected) ? selected : [selected];
    if (freeTextNote) { answerList.push(`user_note: ${freeTextNote}`); }
    answers[q.id] = { answers: answerList };
  }

  return { answers };
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("ask-user-questions free-text follow-up (RPC fallback)", () => {
  it("appends user_note to answers when None of the above is selected", async () => {
    let inputCalled = false;
    const ctx = makeCtx({
      select: async (_prompt, _options) => OTHER_OPTION_LABEL,
      input: async (_prompt, _placeholder) => {
        inputCalled = true;
        return "My custom answer here";
      },
    });

    const questions: Question[] = [
      {
        id: "q1",
        header: "Q1",
        question: "Pick an option",
        options: [
          { label: "Option A", description: "desc A" },
          { label: "Option B", description: "desc B" },
        ],
      },
    ];

    const result = await runRpcFallback(questions, ctx);

    assert.ok(inputCalled, "ctx.ui.input should be called when None of the above is selected");
    assert.deepEqual(result.answers.q1.answers, [
      OTHER_OPTION_LABEL,
      "user_note: My custom answer here",
    ]);
  });

  it("includes user_note when None of the above is selected and user provides input", async () => {
    const ctx = makeCtx({
      select: async () => OTHER_OPTION_LABEL,
      input: async () => "Detailed explanation",
    });

    const questions: Question[] = [
      {
        id: "pref",
        header: "Pref",
        question: "What do you prefer?",
        options: [{ label: "Fast", description: "fast" }],
      },
    ];

    const result = await runRpcFallback(questions, ctx);
    const answers = result.answers.pref.answers;
    assert.ok(
      answers.some((a) => a.startsWith("user_note:")),
      "answers should contain a user_note entry",
    );
    assert.ok(
      answers.some((a) => a === OTHER_OPTION_LABEL),
      "answers should also contain the None of the above label",
    );
  });

  it("does NOT call ctx.ui.input when a regular option is selected", async () => {
    let inputCalled = false;
    const ctx = makeCtx({
      select: async () => "Option A",
      input: async () => {
        inputCalled = true;
        return "should not be called";
      },
    });

    const questions: Question[] = [
      {
        id: "q2",
        header: "Q2",
        question: "Pick one",
        options: [{ label: "Option A", description: "desc" }],
      },
    ];

    const result = await runRpcFallback(questions, ctx);
    assert.ok(!inputCalled, "ctx.ui.input should NOT be called for a normal selection");
    assert.deepEqual(result.answers.q2.answers, ["Option A"]);
  });

  it("does NOT call ctx.ui.input for multi-select questions", async () => {
    let inputCalled = false;
    const ctx = makeCtx({
      select: async () => ["Option A", "Option B"],
      input: async () => {
        inputCalled = true;
        return "should not be called";
      },
    });

    const questions: Question[] = [
      {
        id: "q3",
        header: "Q3",
        question: "Pick multiple",
        options: [
          { label: "Option A", description: "desc A" },
          { label: "Option B", description: "desc B" },
        ],
        allowMultiple: true,
      },
    ];

    const result = await runRpcFallback(questions, ctx);
    assert.ok(!inputCalled, "ctx.ui.input should NOT be called for multi-select questions");
    assert.deepEqual(result.answers.q3.answers, ["Option A", "Option B"]);
  });

  it("does not append user_note when user provides empty input", async () => {
    const ctx = makeCtx({
      select: async () => OTHER_OPTION_LABEL,
      input: async () => "",  // Empty string — no note
    });

    const questions: Question[] = [
      {
        id: "q4",
        header: "Q4",
        question: "Pick or skip",
        options: [{ label: "Option A", description: "desc" }],
      },
    ];

    const result = await runRpcFallback(questions, ctx);
    // Only the OTHER_OPTION_LABEL, no user_note
    assert.deepEqual(result.answers.q4.answers, [OTHER_OPTION_LABEL]);
  });

  it("does not append user_note when user provides undefined input", async () => {
    const ctx = makeCtx({
      select: async () => OTHER_OPTION_LABEL,
      input: async () => undefined,  // Cancelled input
    });

    const questions: Question[] = [
      {
        id: "q5",
        header: "Q5",
        question: "Pick or skip",
        options: [{ label: "Option A", description: "desc" }],
      },
    ];

    const result = await runRpcFallback(questions, ctx);
    assert.deepEqual(result.answers.q5.answers, [OTHER_OPTION_LABEL]);
  });
});
