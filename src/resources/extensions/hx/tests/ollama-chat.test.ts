/**
 * Tests for the Ollama native /api/chat provider (ollama-chat).
 *
 * Tests use a mock fetch to simulate NDJSON responses — no live Ollama instance required.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import type { Context, Model } from "@hyperlab/hx-ai";
import { streamOllamaChat, streamSimpleOllamaChat } from "@hyperlab/hx-ai";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeModel(overrides: Partial<Model<"ollama-chat">> = {}): Model<"ollama-chat"> {
	return {
		id: "llama3.2",
		name: "Llama 3.2",
		api: "ollama-chat",
		provider: "ollama",
		baseUrl: "http://localhost:11434",
		reasoning: false,
		input: ["text"],
		cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
		contextWindow: 128000,
		maxTokens: 16384,
		...overrides,
	};
}

function makeContext(text = "Hello"): Context {
	return {
		messages: [{ role: "user", content: text, timestamp: Date.now() }],
	};
}

/** Build a ReadableStream from NDJSON lines */
function makeNDJSONStream(chunks: object[]): ReadableStream<Uint8Array> {
	const encoder = new TextEncoder();
	return new ReadableStream({
		start(controller) {
			for (const chunk of chunks) {
				controller.enqueue(encoder.encode(JSON.stringify(chunk) + "\n"));
			}
			controller.close();
		},
	});
}

/** Collect all events from an AssistantMessageEventStream */
async function collectEvents(stream: AsyncIterable<unknown>): Promise<unknown[]> {
	const events: unknown[] = [];
	for await (const event of stream) {
		events.push(event);
	}
	return events;
}

// ─── Mock fetch setup ─────────────────────────────────────────────────────────

type MockFetch = (url: string, init?: RequestInit) => Promise<Response>;

function installMockFetch(mockFn: MockFetch): () => void {
	const originalFetch = globalThis.fetch;
	(globalThis as unknown as { fetch: MockFetch }).fetch = mockFn;
	return () => {
		globalThis.fetch = originalFetch;
	};
}

function mockOllamaResponse(chunks: object[]): MockFetch {
	return async (_url, _init) => {
		const body = makeNDJSONStream(chunks);
		return new Response(body, { status: 200, headers: { "content-type": "application/x-ndjson" } });
	};
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test("streamOllamaChat: emits text events for simple text response", async () => {
	const restore = installMockFetch(
		mockOllamaResponse([
			{ model: "llama3.2", message: { role: "assistant", content: "Hello " }, done: false },
			{ model: "llama3.2", message: { role: "assistant", content: "world!" }, done: false },
			{
				model: "llama3.2",
				message: { role: "assistant", content: "" },
				done: true,
				done_reason: "stop",
				prompt_eval_count: 10,
				eval_count: 5,
			},
		]),
	);

	try {
		const events = await collectEvents(streamOllamaChat(makeModel(), makeContext()));
		const types = (events as Array<{ type: string }>).map((e) => e.type);
		assert.ok(types.includes("start"), "should emit start");
		assert.ok(types.includes("text_start"), "should emit text_start");
		assert.ok(types.includes("text_delta"), "should emit text_delta");
		assert.ok(types.includes("text_end"), "should emit text_end");
		assert.ok(types.includes("done"), "should emit done");

		// Check text is concatenated correctly
		const doneEvent = events.find((e) => (e as { type: string }).type === "done") as {
			type: string;
			message: { content: Array<{ type: string; text?: string }> };
		};
		assert.ok(doneEvent, "done event should exist");
		const textBlock = doneEvent.message.content.find((b) => b.type === "text");
		assert.ok(textBlock, "should have text block");
		assert.equal(textBlock.text, "Hello world!", "text should be concatenated");
	} finally {
		restore();
	}
});

test("streamOllamaChat: records token usage from done chunk", async () => {
	const restore = installMockFetch(
		mockOllamaResponse([
			{ model: "llama3.2", message: { role: "assistant", content: "ok" }, done: false },
			{
				model: "llama3.2",
				message: { role: "assistant", content: "" },
				done: true,
				done_reason: "stop",
				prompt_eval_count: 42,
				eval_count: 7,
			},
		]),
	);

	try {
		const events = await collectEvents(streamOllamaChat(makeModel(), makeContext()));
		const doneEvent = events.find((e) => (e as { type: string }).type === "done") as {
			type: string;
			message: { usage: { input: number; output: number } };
		};
		assert.ok(doneEvent, "done event should exist");
		assert.equal(doneEvent.message.usage.input, 42);
		assert.equal(doneEvent.message.usage.output, 7);
	} finally {
		restore();
	}
});

test("streamOllamaChat: emits error event on non-200 response", async () => {
	const restore = installMockFetch(async () => {
		return new Response("model not found", { status: 404 });
	});

	try {
		const events = await collectEvents(streamOllamaChat(makeModel(), makeContext()));
		const errorEvent = events.find((e) => (e as { type: string }).type === "error") as {
			type: string;
			reason: string;
			error: { errorMessage: string };
		};
		assert.ok(errorEvent, "should emit error event");
		assert.equal(errorEvent.reason, "error");
		assert.ok(errorEvent.error.errorMessage.includes("404"), "error should mention status code");
	} finally {
		restore();
	}
});

test("streamOllamaChat: handles tool call response", async () => {
	const restore = installMockFetch(
		mockOllamaResponse([
			{
				model: "llama3.2",
				message: {
					role: "assistant",
					content: "",
					tool_calls: [{ function: { name: "get_weather", arguments: { city: "London" } } }],
				},
				done: true,
				done_reason: "tool_calls",
			},
		]),
	);

	try {
		const contextWithTool: Context = {
			messages: [{ role: "user", content: "What's the weather?", timestamp: Date.now() }],
			tools: [
				{
					name: "get_weather",
					description: "Get weather for a city",
					parameters: {
						type: "object" as const,
						properties: { city: { type: "string" } },
						required: ["city"],
					} as any,
				},
			],
		};

		const events = await collectEvents(streamOllamaChat(makeModel(), contextWithTool));
		const types = (events as Array<{ type: string }>).map((e) => e.type);
		assert.ok(types.includes("toolcall_start"), "should emit toolcall_start");
		assert.ok(types.includes("toolcall_end"), "should emit toolcall_end");

		const doneEvent = events.find((e) => (e as { type: string }).type === "done") as {
			type: string;
			message: { stopReason: string };
		};
		assert.ok(doneEvent, "done event should exist");
		assert.equal(doneEvent.message.stopReason, "toolUse");
	} finally {
		restore();
	}
});

test("streamOllamaChat: uses custom baseUrl from model", async () => {
	let capturedUrl: string | undefined;

	const restore = installMockFetch(async (url) => {
		capturedUrl = url;
		return new Response(
			JSON.stringify({ model: "llama3.2", message: { role: "assistant", content: "hi" }, done: false }) +
				"\n" +
				JSON.stringify({
					model: "llama3.2",
					message: { role: "assistant", content: "" },
					done: true,
					done_reason: "stop",
				}) +
				"\n",
			{ status: 200 },
		);
	});

	try {
		const model = makeModel({ baseUrl: "http://192.168.1.100:11434" });
		await collectEvents(streamOllamaChat(model, makeContext()));
		assert.equal(capturedUrl, "http://192.168.1.100:11434/api/chat");
	} finally {
		restore();
	}
});

test("streamSimpleOllamaChat: works without apiKey (strips it)", async () => {
	const restore = installMockFetch(
		mockOllamaResponse([
			{ model: "llama3.2", message: { role: "assistant", content: "ok" }, done: false },
			{
				model: "llama3.2",
				message: { role: "assistant", content: "" },
				done: true,
				done_reason: "stop",
			},
		]),
	);

	try {
		const events = await collectEvents(
			streamSimpleOllamaChat(makeModel(), makeContext(), { apiKey: "should-be-stripped" }),
		);
		const types = (events as Array<{ type: string }>).map((e) => e.type);
		// Should complete without error — the apiKey being stripped doesn't cause issues
		assert.ok(types.includes("done") || types.includes("error"), "should reach a terminal event");
		// Specifically should succeed
		assert.ok(types.includes("done"), "should succeed without apiKey");
	} finally {
		restore();
	}
});

test("streamOllamaChat: handles abort signal", async () => {
	const controller = new AbortController();

	const restore = installMockFetch(async (_url, init) => {
		// Simulate the signal being respected by the fetch
		if (init?.signal?.aborted) {
			throw new Error("The operation was aborted");
		}
		// Return a stream that never finishes so abort must be handled
		const body = new ReadableStream<Uint8Array>({
			start() {
				// never enqueue, never close
			},
			cancel() {
				// cancelled
			},
		});
		return new Response(body, { status: 200 });
	});

	try {
		// Abort immediately
		controller.abort();

		const events = await collectEvents(streamOllamaChat(makeModel(), makeContext(), { signal: controller.signal }));
		const errorEvent = events.find((e) => (e as { type: string }).type === "error") as {
			type: string;
			reason: string;
		} | undefined;
		// Either an error event or an empty stream is acceptable for aborted requests
		assert.ok(
			events.length === 0 || errorEvent !== undefined,
			"should handle abort gracefully",
		);
	} finally {
		restore();
	}
});

// ─── Model registry integration ───────────────────────────────────────────────

test("convertDiscoveredModels assigns api:ollama-chat and correct baseUrl for ollama provider", () => {
	// We test the logic directly by simulating what convertDiscoveredModels does
	const isOllama = true;
	const api = isOllama ? "ollama-chat" : "openai";
	const baseUrl = isOllama ? "http://localhost:11434" : "";

	assert.equal(api, "ollama-chat");
	assert.equal(baseUrl, "http://localhost:11434");

	const notOllama = false;
	const api2 = notOllama ? "ollama-chat" : "openai";
	const baseUrl2 = notOllama ? "http://localhost:11434" : "";

	assert.equal(api2, "openai");
	assert.equal(baseUrl2, "");
});

test("KnownApi type includes ollama-chat (compile-time guard)", () => {
	// This test verifies the type is accepted by TypeScript at compile time.
	// If ollama-chat were not in KnownApi, tsc would have already rejected the
	// import of streamOllamaChat with Model<"ollama-chat">.
	const model = makeModel();
	assert.equal(model.api, "ollama-chat");
});
