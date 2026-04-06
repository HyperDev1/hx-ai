/**
 * Ollama native /api/chat provider.
 * Uses NDJSON streaming (one JSON object per line, no SSE envelope).
 * No API key required — Ollama runs locally.
 */

import { calculateCost } from "../models.js";
import type {
	AssistantMessage,
	Context,
	ImageContent,
	Message,
	Model,
	SimpleStreamOptions,
	StopReason,
	StreamFunction,
	StreamOptions,
	TextContent,
	ToolCall,
	ToolResultMessage,
} from "../types.js";
import { AssistantMessageEventStream } from "../utils/event-stream.js";

// ─── Message conversion ───────────────────────────────────────────────────────

interface OllamaMessage {
	role: "system" | "user" | "assistant" | "tool";
	content: string | Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }>;
	images?: string[]; // base64 image data (Ollama-specific)
	tool_calls?: OllamaToolCall[];
	tool_call_id?: string;
	name?: string;
}

interface OllamaToolCall {
	function: {
		name: string;
		arguments: Record<string, unknown>;
	};
}

interface OllamaToolDefinition {
	type: "function";
	function: {
		name: string;
		description: string;
		parameters: unknown;
	};
}

function convertMessages(context: Context): OllamaMessage[] {
	const messages: OllamaMessage[] = [];

	if (context.systemPrompt) {
		messages.push({ role: "system", content: context.systemPrompt });
	}

	for (const msg of context.messages) {
		if (msg.role === "user") {
			if (typeof msg.content === "string") {
				messages.push({ role: "user", content: msg.content });
			} else {
				// Mixed content: text + images
				const textParts: string[] = [];
				const images: string[] = [];

				for (const part of msg.content) {
					if (part.type === "text") {
						textParts.push(part.text);
					} else if (part.type === "image") {
						images.push(part.data);
					}
				}

				const userMsg: OllamaMessage = {
					role: "user",
					content: textParts.join("\n"),
				};
				if (images.length > 0) {
					userMsg.images = images;
				}
				messages.push(userMsg);
			}
		} else if (msg.role === "assistant") {
			const textParts: string[] = [];
			const toolCalls: OllamaToolCall[] = [];

			for (const block of msg.content) {
				if (block.type === "text") {
					textParts.push(block.text);
				} else if (block.type === "thinking") {
					// Skip thinking blocks — Ollama doesn't understand them
				} else if (block.type === "toolCall") {
					toolCalls.push({
						function: {
							name: block.name,
							arguments: block.arguments,
						},
					});
				}
			}

			const assistantMsg: OllamaMessage = {
				role: "assistant",
				content: textParts.join(""),
			};
			if (toolCalls.length > 0) {
				assistantMsg.tool_calls = toolCalls;
			}
			messages.push(assistantMsg);
		} else if (msg.role === "toolResult") {
			const toolResult = msg as ToolResultMessage;
			const textContent = toolResult.content
				.filter((c): c is TextContent => c.type === "text")
				.map((c) => c.text)
				.join("\n");

			messages.push({
				role: "tool",
				content: textContent,
				tool_call_id: toolResult.toolCallId,
				name: toolResult.toolName,
			});
		}
	}

	return messages;
}

function convertTools(tools: Context["tools"]): OllamaToolDefinition[] {
	if (!tools || tools.length === 0) return [];
	return tools.map((tool) => ({
		type: "function",
		function: {
			name: tool.name,
			description: tool.description,
			parameters: tool.parameters,
		},
	}));
}

// ─── NDJSON streaming ─────────────────────────────────────────────────────────

interface OllamaChatChunk {
	model?: string;
	message?: {
		role?: string;
		content?: string;
		tool_calls?: Array<{
			function: {
				name: string;
				arguments: Record<string, unknown> | string;
			};
		}>;
	};
	done: boolean;
	done_reason?: string;
	prompt_eval_count?: number;
	eval_count?: number;
}

function mapStopReason(doneReason: string | undefined): StopReason {
	if (!doneReason) return "stop";
	switch (doneReason) {
		case "stop":
			return "stop";
		case "length":
			return "length";
		case "tool_calls":
			return "toolUse";
		default:
			return "stop";
	}
}

// ─── Stream function ──────────────────────────────────────────────────────────

export interface OllamaChatOptions extends StreamOptions {
	// No extra Ollama-specific options needed for basic streaming
}

let toolCallCounter = 0;

export const streamOllamaChat: StreamFunction<"ollama-chat", OllamaChatOptions> = (
	model: Model<"ollama-chat">,
	context: Context,
	options?: OllamaChatOptions,
): AssistantMessageEventStream => {
	const stream = new AssistantMessageEventStream();

	(async () => {
		const output: AssistantMessage = {
			role: "assistant",
			content: [],
			api: "ollama-chat",
			provider: model.provider,
			model: model.id,
			usage: {
				input: 0,
				output: 0,
				cacheRead: 0,
				cacheWrite: 0,
				totalTokens: 0,
				cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
			},
			stopReason: "stop",
			timestamp: Date.now(),
		};

		try {
			const baseUrl = model.baseUrl?.replace(/\/$/, "") || "http://localhost:11434";
			const url = `${baseUrl}/api/chat`;

			const messages = convertMessages(context);
			const tools = convertTools(context.tools);

			const body: Record<string, unknown> = {
				model: model.id,
				messages,
				stream: true,
			};

			if (tools.length > 0) {
				body.tools = tools;
			}
			if (options?.temperature !== undefined) {
				body.options = { temperature: options.temperature };
			}
			if (options?.maxTokens !== undefined) {
				body.options = { ...(body.options as object), num_predict: options.maxTokens };
			}

			let requestBody = body;
			if (options?.onPayload) {
				const next = await options.onPayload(body, model);
				if (next !== undefined) {
					requestBody = next as Record<string, unknown>;
				}
			}

			const headers: Record<string, string> = {
				"Content-Type": "application/json",
				...options?.headers,
			};

			const response = await fetch(url, {
				method: "POST",
				headers,
				body: JSON.stringify(requestBody),
				signal: options?.signal,
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`Ollama API error (${response.status}): ${errorText}`);
			}

			if (!response.body) {
				throw new Error("No response body from Ollama");
			}

			// Emit start event
			stream.push({ type: "start", partial: output });

			// Read NDJSON stream
			const reader = response.body.getReader();
			const decoder = new TextDecoder();
			let buffer = "";

			let currentTextBlock: TextContent | null = null;
			const blockIndex = () => output.content.length - 1;

			const abortHandler = () => {
				void reader.cancel().catch(() => {});
			};
			options?.signal?.addEventListener("abort", abortHandler);

			try {
				while (true) {
					if (options?.signal?.aborted) {
						throw new Error("Request was aborted");
					}

					const { done, value } = await reader.read();
					if (done) break;

					buffer += decoder.decode(value, { stream: true });
					const lines = buffer.split("\n");
					buffer = lines.pop() ?? "";

					for (const line of lines) {
						const trimmed = line.trim();
						if (!trimmed) continue;

						let chunk: OllamaChatChunk;
						try {
							chunk = JSON.parse(trimmed);
						} catch {
							// Skip unparseable lines
							continue;
						}

						const messageContent = chunk.message?.content;
						const toolCalls = chunk.message?.tool_calls;

						// Handle text content
						if (messageContent) {
							if (!currentTextBlock) {
								currentTextBlock = { type: "text", text: "" };
								output.content.push(currentTextBlock);
								stream.push({ type: "text_start", contentIndex: blockIndex(), partial: output });
							}
							currentTextBlock.text += messageContent;
							stream.push({
								type: "text_delta",
								contentIndex: blockIndex(),
								delta: messageContent,
								partial: output,
							});
						}

						// Handle tool calls (typically arrive in the done=true chunk)
						if (toolCalls && toolCalls.length > 0) {
							// Close current text block if open
							if (currentTextBlock) {
								stream.push({
									type: "text_end",
									contentIndex: blockIndex(),
									content: currentTextBlock.text,
									partial: output,
								});
								currentTextBlock = null;
							}

							for (const tc of toolCalls) {
								const tcId = `${tc.function.name}_${Date.now()}_${++toolCallCounter}`;
								let parsedArgs: Record<string, unknown>;
								if (typeof tc.function.arguments === "string") {
									try {
										parsedArgs = JSON.parse(tc.function.arguments);
									} catch {
										parsedArgs = {};
									}
								} else {
									parsedArgs = tc.function.arguments ?? {};
								}

								const toolCall: ToolCall = {
									type: "toolCall",
									id: tcId,
									name: tc.function.name,
									arguments: parsedArgs,
								};

								output.content.push(toolCall);
								stream.push({ type: "toolcall_start", contentIndex: blockIndex(), partial: output });
								stream.push({
									type: "toolcall_delta",
									contentIndex: blockIndex(),
									delta: JSON.stringify(parsedArgs),
									partial: output,
								});
								stream.push({
									type: "toolcall_end",
									contentIndex: blockIndex(),
									toolCall,
									partial: output,
								});
							}
						}

						// Handle done chunk
						if (chunk.done) {
							// Close any open text block
							if (currentTextBlock) {
								stream.push({
									type: "text_end",
									contentIndex: blockIndex(),
									content: currentTextBlock.text,
									partial: output,
								});
								currentTextBlock = null;
							}

							// Determine stop reason
							if (output.content.some((b) => b.type === "toolCall")) {
								output.stopReason = "toolUse";
							} else {
								output.stopReason = mapStopReason(chunk.done_reason);
							}

							// Record token usage
							if (chunk.prompt_eval_count !== undefined || chunk.eval_count !== undefined) {
								const inputTokens = chunk.prompt_eval_count ?? 0;
								const outputTokens = chunk.eval_count ?? 0;
								output.usage = {
									input: inputTokens,
									output: outputTokens,
									cacheRead: 0,
									cacheWrite: 0,
									totalTokens: inputTokens + outputTokens,
									cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
								};
								calculateCost(model, output.usage);
							}
						}
					}
				}
			} finally {
				options?.signal?.removeEventListener("abort", abortHandler);
			}

			if (options?.signal?.aborted) {
				throw new Error("Request was aborted");
			}

			stream.push({ type: "done", reason: output.stopReason as Extract<StopReason, "stop" | "length" | "toolUse">, message: output });
			stream.end();
		} catch (error) {
			output.stopReason = options?.signal?.aborted ? "aborted" : "error";
			output.errorMessage = error instanceof Error ? error.message : String(error);
			stream.push({ type: "error", reason: output.stopReason, error: output });
			stream.end();
		}
	})();

	return stream;
};

export const streamSimpleOllamaChat: StreamFunction<"ollama-chat", SimpleStreamOptions> = (
	model: Model<"ollama-chat">,
	context: Context,
	options?: SimpleStreamOptions,
): AssistantMessageEventStream => {
	// Ollama doesn't need an API key; pass through without apiKey
	const { apiKey: _, ...opts } = options ?? {};
	return streamOllamaChat(model, context, opts);
};
