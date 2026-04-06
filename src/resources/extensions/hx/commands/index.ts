import type { ExtensionAPI, ExtensionCommandContext } from "@hyperlab/hx-coding-agent";

import { HX_COMMAND_DESCRIPTION, getHxArgumentCompletions } from "./catalog.js";

export function registerHXCommand(pi: ExtensionAPI): void {
  pi.registerCommand("hx", {
    description: HX_COMMAND_DESCRIPTION,
    getArgumentCompletions: getHxArgumentCompletions,
    handler: async (args: string, ctx: ExtensionCommandContext) => {
      const { handleHXCommand } = await import("./dispatcher.js");
      await handleHXCommand(args, ctx, pi);
    },
  });
}
