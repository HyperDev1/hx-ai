/**
 * web-mode-windows-hide.test.ts — Structural regression test for windowsHide: true.
 *
 * Verifies that web-mode.ts and every web service file include `windowsHide: true`
 * in their execFile/spawn call options. On Windows, omitting this option causes a
 * console window to flash open for each subprocess.
 *
 * Upstream: 7c00f53ef
 *
 * This is a static/structural test — it reads source files and asserts the
 * option is present. No subprocess is launched.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..", "..");

const WEB_MODE_FILE = join(ROOT, "src", "web-mode.ts");

const WEB_SERVICE_FILES = [
  join(ROOT, "src", "web", "auto-dashboard-service.ts"),
  join(ROOT, "src", "web", "bridge-service.ts"),
  join(ROOT, "src", "web", "captures-service.ts"),
  join(ROOT, "src", "web", "cleanup-service.ts"),
  join(ROOT, "src", "web", "doctor-service.ts"),
  join(ROOT, "src", "web", "export-service.ts"),
  join(ROOT, "src", "web", "forensics-service.ts"),
  join(ROOT, "src", "web", "history-service.ts"),
  join(ROOT, "src", "web", "hooks-service.ts"),
  join(ROOT, "src", "web", "recovery-diagnostics-service.ts"),
  join(ROOT, "src", "web", "settings-service.ts"),
  join(ROOT, "src", "web", "skill-health-service.ts"),
  join(ROOT, "src", "web", "undo-service.ts"),
  join(ROOT, "src", "web", "visualizer-service.ts"),
];

test("web-mode.ts contains windowsHide: true in spawn options", () => {
  const content = readFileSync(WEB_MODE_FILE, "utf-8");
  assert.ok(
    content.includes("windowsHide: true"),
    `web-mode.ts must contain 'windowsHide: true' in spawn/execFile options`,
  );
});

test("web-mode.ts powershell execFile includes windowsHide: true", () => {
  const content = readFileSync(WEB_MODE_FILE, "utf-8");
  // The powershell execFile call should have the options object with windowsHide
  assert.ok(
    /execFile\('powershell'.*windowsHide: true/.test(content.replace(/\n/g, " ")),
    `web-mode.ts powershell execFile call must include windowsHide: true`,
  );
});

test("all web service files contain windowsHide: true", () => {
  for (const file of WEB_SERVICE_FILES) {
    const content = readFileSync(file, "utf-8");
    assert.ok(
      content.includes("windowsHide: true"),
      `${file} must contain 'windowsHide: true' in execFile/spawn options`,
    );
  }
});

test("no web service file uses .hx/sessions path (not .gsd/sessions)", () => {
  // Regression guard: ensure migrated paths use .hx not .gsd
  for (const file of WEB_SERVICE_FILES) {
    const content = readFileSync(file, "utf-8");
    assert.ok(
      !content.includes(".gsd/sessions"),
      `${file} must not reference '.gsd/sessions' — use '.hx/sessions'`,
    );
  }
});

test("bridge-service.ts spawn call includes windowsHide: true", () => {
  const bridgeFile = join(ROOT, "src", "web", "bridge-service.ts");
  const content = readFileSync(bridgeFile, "utf-8");
  // Count windowsHide occurrences — should be 4 (3 execFile + 1 spawn)
  const matches = content.match(/windowsHide: true/g) ?? [];
  assert.ok(
    matches.length >= 4,
    `bridge-service.ts should have at least 4 'windowsHide: true' entries (3 execFile + 1 spawn), found ${matches.length}`,
  );
});
