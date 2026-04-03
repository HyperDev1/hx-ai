import test from "node:test";
import assert from "node:assert/strict";

import { registerHXCommand } from "../commands.ts";
import { handleHXCommand } from "../commands/dispatcher.ts";

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

test("/hx description includes discuss", () => {
  const pi = createMockPi();
  registerHXCommand(pi as any);

  const hxCmd = pi.commands.get("hx");
  assert.ok(hxCmd, "registerHXCommand should register /hx");
  assert.ok(
    hxCmd.description.includes("discuss"),
    "description should include discuss",
  );
});

test("/hx next completions include --debug", () => {
  const pi = createMockPi();
  registerHXCommand(pi as any);

  const hxCmd = pi.commands.get("hx");
  const completions = hxCmd.getArgumentCompletions("next ");
  const debug = completions.find((c: any) => c.value === "next --debug");
  assert.ok(debug, "next --debug should appear in completions");
});

test("/hx widget completions include full|small|min|off", () => {
  const pi = createMockPi();
  registerHXCommand(pi as any);

  const hxCmd = pi.commands.get("hx");
  const completions = hxCmd.getArgumentCompletions("widget ");
  const values = completions.map((c: any) => c.value);
  for (const expected of ["widget full", "widget small", "widget min", "widget off"]) {
    assert.ok(values.includes(expected), `missing completion: ${expected}`);
  }
});

test("bare /hx skip shows usage and does not fall through to unknown-command warning", async () => {
  const ctx = createMockCtx();

  await handleHXCommand("skip", ctx as any, {} as any);

  assert.ok(
    ctx.notifications.some((n) => n.message.includes("Usage: /hx skip <unit-id>")),
    "should show skip usage guidance",
  );
  assert.ok(
    !ctx.notifications.some((n) => n.message.startsWith("Unknown: /hx skip")),
    "should not emit unknown-command warning for bare skip",
  );
});

