import { Type } from "@sinclair/typebox";
import type { ExtensionAPI } from "@hyperlab/hx-coding-agent";

import {
  getActiveMilestoneIdFromDb,
  getMilestone,
  getMilestoneSlices,
  getSliceTasks,
  getSliceStatusSummary,
  getSliceTaskCounts,
} from "../hx-db.js";
import { ensureDbOpen } from "./dynamic-tools.js";

export function registerQueryTools(pi: ExtensionAPI): void {
  pi.registerTool({
    name: "hx_milestone_status",
    label: "Milestone Status",
    description:
      "Read-only query tool for inspecting milestone, slice, and task status from the HX database. " +
      "Returns structured JSON. Use milestoneId='active' to resolve the current active milestone automatically.",
    promptSnippet: "Query milestone/slice/task status from the HX DB without bash access",
    promptGuidelines: [
      "Use milestoneId='active' to resolve the current active milestone automatically.",
      "Omit sliceId to get all slices for the milestone with total/complete/pending counts.",
      "Provide sliceId to get all tasks for that slice with task counts.",
    ],
    parameters: Type.Object({
      milestoneId: Type.String({
        description: "Milestone ID (e.g. 'M001' or 'active' to resolve the current active milestone)",
      }),
      sliceId: Type.Optional(
        Type.String({ description: "Slice ID (e.g. 'S01'). Omit to get slice-level overview." }),
      ),
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      try {
        const dbReady = await ensureDbOpen();
        if (!dbReady) {
          return {
            content: [{ type: "text" as const, text: "DB not open — run hx command first" }],
            details: { operation: "milestone_status", error: "db_not_open" } as any,
          };
        }

        // Resolve 'active' to the real milestone ID
        let milestoneId = params.milestoneId;
        if (milestoneId === "active") {
          const active = getActiveMilestoneIdFromDb();
          if (!active) {
            return {
              content: [{ type: "text" as const, text: "No active milestone" }],
              details: { operation: "milestone_status", milestoneId: "active", result: null } as any,
            };
          }
          milestoneId = active.id;
        }

        // Verify the milestone exists
        const milestone = getMilestone(milestoneId);
        if (!milestone) {
          return {
            content: [{ type: "text" as const, text: `Milestone '${milestoneId}' not found` }],
            details: { operation: "milestone_status", milestoneId, result: null } as any,
          };
        }

        // Slice-level query (with sliceId)
        if (params.sliceId) {
          const tasks = getSliceTasks(milestoneId, params.sliceId);
          const counts = getSliceTaskCounts(milestoneId, params.sliceId);

          const result = {
            milestoneId,
            sliceId: params.sliceId,
            tasks: tasks.map((t) => ({ id: t.id, status: t.status, title: t.title })),
            counts,
          };

          return {
            content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
            details: { operation: "milestone_status", milestoneId, sliceId: params.sliceId, taskCount: tasks.length } as any,
          };
        }

        // Milestone-level query (slices overview)
        const slices = getMilestoneSlices(milestoneId);
        const summary = getSliceStatusSummary(milestoneId);

        const total = summary.length;
        const complete = summary.filter((s) => s.status === "complete").length;
        const pending = total - complete;

        const result = {
          milestoneId,
          title: milestone.title,
          status: milestone.status,
          slices: slices.map((s) => ({ id: s.id, status: s.status, title: s.title })),
          counts: { total, complete, pending },
        };

        return {
          content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
          details: { operation: "milestone_status", milestoneId, sliceCount: slices.length } as any,
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        process.stderr.write(`hx-query: hx_milestone_status tool failed: ${msg}\n`);
        return {
          content: [{ type: "text" as const, text: `Error querying milestone status: ${msg}` }],
          details: { operation: "milestone_status", error: msg } as any,
        };
      }
    },
  });
}
