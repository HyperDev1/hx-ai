import test from "node:test";
import assert from "node:assert/strict";

import { registerGSDCommand } from "../commands.ts";

function createMockPi() {
  const commands = new Map<string, any>();
  return {
    registerCommand(name: string, options: any) {
      commands.set(name, options);
    },
    registerTool() {},
    registerShortcut() {},
    on() {},
    sendMessage() {},
    commands,
  };
}

function createMockCtx() {
  const notifications: { message: string; level: string }[] = [];
  return {
    notifications,
    ui: {
      notify(message: string, level: string) {
        notifications.push({ message, level });
      },
      custom: async () => {},
    },
    shutdown: async () => {},
  };
}

test("/hx update appears in subcommand completions", () => {
  const pi = createMockPi();
  registerGSDCommand(pi as any);

  const hx = pi.commands.get("hx");
  assert.ok(hxCmd, "registerGSDCommand should register /hx");

  const completions = hxCmd.getArgumentCompletions("update");
  const updateEntry = completions.find((c: any) => c.value === "update");
  assert.ok(updateEntry, "update should appear in completions");
  assert.equal(updateEntry.label, "update");
});

test("/hx update appears in help description", () => {
  const pi = createMockPi();
  registerGSDCommand(pi as any);

  const hx = pi.commands.get("hx");
  assert.ok(hxCmd?.description?.includes("update"), "description should mention update");
});

test("/hx update is listed in completions with correct description", () => {
  const pi = createMockPi();
  registerGSDCommand(pi as any);

  const hx = pi.commands.get("hx");
  const completions = hxCmd.getArgumentCompletions("");
  const updateEntry = completions.find((c: any) => c.value === "update");
  assert.ok(updateEntry, "update should appear in full completion list");
  assert.ok(
    updateEntry.description.toLowerCase().includes("update"),
    "completion description should mention updating",
  );
});
