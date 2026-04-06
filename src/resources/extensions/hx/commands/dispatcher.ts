import type { ExtensionAPI, ExtensionCommandContext } from "@hyperlab/hx-coding-agent";

import { handleAutoCommand } from "./handlers/auto.js";
import { handleCoreCommand } from "./handlers/core.js";
import { handleOpsCommand } from "./handlers/ops.js";
import { handleParallelCommand } from "./handlers/parallel.js";
import { handleWorkflowCommand } from "./handlers/workflow.js";

export async function handleHXCommand(
  args: string,
  ctx: ExtensionCommandContext,
  pi: ExtensionAPI,
): Promise<void> {
  const trimmed = (typeof args === "string" ? args : "").trim();

  const handlers = [
    () => handleCoreCommand(trimmed, ctx),
    () => handleAutoCommand(trimmed, ctx, pi),
    () => handleParallelCommand(trimmed, ctx, pi),
    () => handleWorkflowCommand(trimmed, ctx, pi),
    () => handleOpsCommand(trimmed, ctx, pi),
  ];

  for (const handler of handlers) {
    if (await handler()) {
      return;
    }
  }

  ctx.ui.notify(`Unknown: /hx ${trimmed}. Run /hx help for available commands.`, "warning");
}

