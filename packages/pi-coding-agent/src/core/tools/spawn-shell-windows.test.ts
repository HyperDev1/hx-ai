/**
 * spawn-shell-windows.test.ts — Structural regression test for Windows shell guard.
 *
 * Verifies that exec.ts, lsp/index.ts, and lsp/lspmux.ts use
 * `shell: process.platform === "win32"` at every spawn call site, rather than
 * an unconditional `shell: false` or omitting the shell option entirely.
 *
 * Upstream: 9d78e9e1e
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Paths relative to this file (packages/pi-coding-agent/src/core/tools/)
const CORE_DIR = join(__dirname, "..");
const LSP_DIR = join(CORE_DIR, "lsp");

const SPAWN_FILES = [
	join(CORE_DIR, "exec.ts"),
	join(LSP_DIR, "index.ts"),
	join(LSP_DIR, "lspmux.ts"),
];

test("all spawn sites use platform-guarded shell option", () => {
	for (const file of SPAWN_FILES) {
		const content = readFileSync(file, "utf-8");
		assert.ok(
			content.includes('process.platform === "win32"'),
			`${file} must contain 'process.platform === "win32"' shell guard`,
		);
	}
});

test("exec.ts does not have unconditional shell: false at spawn site", () => {
	const file = SPAWN_FILES[0]!;
	const content = readFileSync(file, "utf-8");
	// The shell option must not be the literal `false` value
	const hasUnconditionalFalse = /shell:\s*false/.test(content);
	assert.ok(
		!hasUnconditionalFalse,
		`${file} must not have unconditional 'shell: false' — use 'shell: process.platform === "win32"'`,
	);
});

test("lsp/index.ts does not omit shell option from spawn call", () => {
	const file = SPAWN_FILES[1]!;
	const content = readFileSync(file, "utf-8");
	assert.ok(
		content.includes('shell: process.platform === "win32"'),
		`${file} must have 'shell: process.platform === "win32"' in spawn options`,
	);
});

test("lsp/lspmux.ts does not omit shell option from spawn call", () => {
	const file = SPAWN_FILES[2]!;
	const content = readFileSync(file, "utf-8");
	assert.ok(
		content.includes('shell: process.platform === "win32"'),
		`${file} must have 'shell: process.platform === "win32"' in spawn options`,
	);
});
