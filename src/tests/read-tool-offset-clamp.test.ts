/**
 * read-tool-offset-clamp.test.ts — Regression tests for offset clamping behaviour.
 *
 * When offset > file length, the read tool must clamp to the last line and
 * emit a `[Offset N beyond end of file…]` prefix instead of throwing.
 *
 * Upstream: 96ff71870
 */

import test from "node:test";
import assert from "node:assert/strict";
import { createReadTool } from "../../packages/pi-coding-agent/src/core/tools/read.ts";
import { writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomBytes } from "node:crypto";

// Helper: write a temp file with given lines, call read, return the text content
async function readWithOffset(
	lines: string[],
	offset: number,
	limit?: number,
): Promise<string> {
	const dir = tmpdir();
	const filename = `read-clamp-test-${randomBytes(4).toString("hex")}.txt`;
	const filepath = join(dir, filename);
	await writeFile(filepath, lines.join("\n"), "utf-8");

	try {
		const tool = createReadTool(dir);
		const result = await tool.execute("__test__", { path: filepath, offset, limit });
		const textBlock = result.content.find((c) => c.type === "text");
		assert.ok(textBlock && textBlock.type === "text", "Expected text content in result");
		return textBlock.text;
	} finally {
		await rm(filepath, { force: true });
	}
}

// ─── Tests ───────────────────────────────────────────────────────────────────

test("normal offset reads the correct line (no clamping)", async () => {
	const lines = ["line1", "line2", "line3", "line4", "line5"];
	const output = await readWithOffset(lines, 3); // 1-indexed → line3
	assert.ok(output.includes("line3"), `Expected 'line3' in output, got: ${output}`);
	// Must not contain the clamping prefix
	assert.ok(!output.includes("beyond end of file"), `Unexpected clamping prefix in output: ${output}`);
});

test("offset equal to exact file length clamps to last line with prefix", async () => {
	const lines = ["alpha", "beta", "gamma"]; // 3 lines
	// offset=3 is the last valid line (1-indexed). offset=4 is one beyond.
	const output = await readWithOffset(lines, 4); // 1 beyond end
	assert.ok(
		output.includes("beyond end of file"),
		`Expected clamping prefix, got: ${output}`,
	);
	assert.ok(
		output.includes("Clamped to line"),
		`Expected 'Clamped to line' in prefix, got: ${output}`,
	);
	// Content should include the last line
	assert.ok(output.includes("gamma"), `Expected last line content 'gamma', got: ${output}`);
});

test("offset far beyond EOF clamps to last line with correct prefix", async () => {
	const lines = ["first", "second", "third"];
	const output = await readWithOffset(lines, 999);
	assert.ok(
		output.includes("Offset 999 beyond end of file"),
		`Expected prefix mentioning offset 999, got: ${output}`,
	);
	assert.ok(
		output.includes("Clamped to line"),
		`Expected 'Clamped to line' in prefix, got: ${output}`,
	);
});

test("clamped output still contains last-line content", async () => {
	const lines = ["apple", "banana", "cherry"];
	const output = await readWithOffset(lines, 50); // way beyond
	// The file has 3 lines; the clamped last line should appear
	assert.ok(output.includes("cherry"), `Expected last line 'cherry' in clamped output, got: ${output}`);
	// Prefix should name the total lines
	assert.ok(
		output.includes("3 lines"),
		`Expected total line count (3 lines) in prefix, got: ${output}`,
	);
});
