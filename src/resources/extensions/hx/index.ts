import type { ExtensionAPI } from "@hyperlab/hx-coding-agent";

export {
  isDepthVerified,
  isQueuePhaseActive,
  setQueuePhaseActive,
  shouldBlockContextWrite,
} from "./bootstrap/write-gate.js";

export default async function registerExtension(pi: ExtensionAPI) {
  const { registerHxExtension } = await import("./bootstrap/register-extension.js");
  registerHxExtension(pi);
}
