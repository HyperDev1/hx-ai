import type { ExtensionAPI, ExtensionCommandContext } from "@hyperlab/hx-coding-agent";

import { HX_COMMAND_DESCRIPTION, getGsdArgumentCompletions } from "./catalog.js";

export function registerGSDCommand(pi: ExtensionAPI): void {
  pi.registerCommand("hx", {
    description: HX_COMMAND_DESCRIPTION,
    getArgumentCompletions: getGsdArgumentCompletions,
    handler: async (args: string, ctx: ExtensionCommandContext) => {
      const { handleGSDCommand } = await import("./dispatcher.js");
      await handleGSDCommand(args, ctx, pi);
    },
  });
}
