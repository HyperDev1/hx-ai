/**
 * dev-workflow-engine.ts — DevWorkflowEngine implementation.
 *
 * Implements WorkflowEngine by delegating to existing HX state derivation
 * and dispatch logic. This is the "dev" engine — it wraps the current HX
 * auto-mode behavior behind the engine-polymorphic interface.
 */

import type { WorkflowEngine } from "./workflow-engine.js";
import type {
  EngineState,
  EngineDispatchAction,
  CompletedStep,
  ReconcileResult,
  DisplayMetadata,
} from "./engine-types.js";
import type { HXState } from "./types.js";
import type { DispatchAction, DispatchContext } from "./auto-dispatch.js";

import { deriveState } from "./state.js";
import { resolveDispatch } from "./auto-dispatch.js";
import { loadEffectiveHXPreferences } from "./preferences.js";

// ─── Bridge: DispatchAction → EngineDispatchAction ────────────────────────

/**
 * Map a HX-specific DispatchAction (which carries `matchedRule`, `unitType`,
 * etc.) to the engine-generic EngineDispatchAction discriminated union.
 *
 * Exported for unit testing.
 */
export function bridgeDispatchAction(da: DispatchAction): EngineDispatchAction {
  switch (da.action) {
    case "dispatch":
      return {
        action: "dispatch",
        step: {
          unitType: da.unitType,
          unitId: da.unitId,
          prompt: da.prompt,
        },
      };
    case "stop":
      return {
        action: "stop",
        reason: da.reason,
        level: da.level,
      };
    case "skip":
      return { action: "skip" };
  }
}

// ─── DevWorkflowEngine ───────────────────────────────────────────────────

export class DevWorkflowEngine implements WorkflowEngine {
  readonly engineId = "dev" as const;

  async deriveState(basePath: string): Promise<EngineState> {
    const hxState: HXState = await deriveState(basePath);
    return {
      phase: hxState.phase,
      currentMilestoneId: hxState.activeMilestone?.id ?? null,
      activeSliceId: hxState.activeSlice?.id ?? null,
      activeTaskId: hxState.activeTask?.id ?? null,
      isComplete: hxState.phase === "complete",
      raw: hxState,
    };
  }

  async resolveDispatch(
    state: EngineState,
    context: { basePath: string },
  ): Promise<EngineDispatchAction> {
    const hxState = state.raw as HXState;
    const mid = hxState.activeMilestone?.id ?? "";
    const midTitle = hxState.activeMilestone?.title ?? "";
    const loaded = loadEffectiveHXPreferences();
    const prefs = loaded?.preferences ?? undefined;

    const dispatchCtx: DispatchContext = {
      basePath: context.basePath,
      mid,
      midTitle,
      state: hxState,
      prefs,
    };

    const result = await resolveDispatch(dispatchCtx);
    return bridgeDispatchAction(result);
  }

  async reconcile(
    state: EngineState,
    _completedStep: CompletedStep,
  ): Promise<ReconcileResult> {
    return {
      outcome: state.isComplete ? "milestone-complete" : "continue",
    };
  }

  getDisplayMetadata(state: EngineState): DisplayMetadata {
    return {
      engineLabel: "HX Dev",
      currentPhase: state.phase,
      progressSummary: `${state.currentMilestoneId ?? "no milestone"} / ${state.activeSliceId ?? "—"} / ${state.activeTaskId ?? "—"}`,
      stepCount: null,
    };
  }
}
