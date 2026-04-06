/**
 * HX Slice Parallel Orchestrator — Engine for parallel slice execution within a milestone.
 *
 * Manages slice worker lifecycle. Workers are separate processes spawned via
 * child_process, each running with HX_SLICE_LOCK=MID/SID env var set. Unlike
 * the milestone orchestrator, slice workers share the milestone's filesystem
 * (no worktree creation). The coordinator tracks workers in-process via the
 * module-level `workers` Map.
 */

import { spawn, type ChildProcess } from "node:child_process";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  isDbAvailable,
  _getAdapter,
  acquireSliceLock,
  releaseSliceLock,
  cleanExpiredSliceLocks,
} from "./hx-db.js";
import { getErrorMessage } from "./error-utils.js";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface SliceWorkerInfo {
  milestoneId: string;
  sliceId: string;
  pid: number;
  process: ChildProcess | null; // null after process exits or before spawn
  startedAt: number;
  state: "running" | "stopped" | "error";
  cleanup?: () => void;
}

// ─── Module State ──────────────────────────────────────────────────────────

/** Map from sliceId → SliceWorkerInfo for all tracked slice workers. */
const workers = new Map<string, SliceWorkerInfo>();

// ─── Bin Resolution ────────────────────────────────────────────────────────

/**
 * Resolve the HX CLI binary path.
 * Uses HX_BIN_PATH env var (set by loader.ts) or falls back to
 * finding loader.js relative to the current module.
 */
function resolveHxBin(): string | null {
  if (process.env.HX_BIN_PATH && existsSync(process.env.HX_BIN_PATH)) {
    return process.env.HX_BIN_PATH;
  }

  let thisDir: string;
  try {
    thisDir = dirname(fileURLToPath(import.meta.url));
  } catch {
    thisDir = process.cwd();
  }

  const candidates = [
    join(thisDir, "..", "..", "..", "loader.js"),
    join(thisDir, "..", "..", "..", "..", "dist", "loader.js"),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }

  return null;
}

// ─── Lock helpers ──────────────────────────────────────────────────────────

/** Default TTL for slice locks: 4 hours (slices can be long-running). */
const SLICE_LOCK_TTL_MS = 4 * 60 * 60 * 1000;

/**
 * Try to acquire the slice lock for a given slice. Returns true when the lock
 * was newly acquired (this process wins); false when already held.
 */
function tryAcquireSliceLock(milestoneId: string, sliceId: string, pid: number): boolean {
  const db = _getAdapter();
  if (!db) return false;

  // Clean any expired locks before attempting acquisition
  try {
    cleanExpiredSliceLocks(db);
  } catch {
    // Non-fatal — proceed to acquire anyway
  }

  try {
    return acquireSliceLock(db, milestoneId, sliceId, pid, SLICE_LOCK_TTL_MS);
  } catch {
    return false;
  }
}

/**
 * Release the slice lock held by this process for a given slice.
 */
function tryReleaseSliceLock(milestoneId: string, sliceId: string, pid: number): void {
  const db = _getAdapter();
  if (!db) return;
  try {
    releaseSliceLock(db, milestoneId, sliceId, pid);
  } catch {
    // Non-fatal — lock will expire on its own
  }
}

// ─── Internal Spawn ────────────────────────────────────────────────────────

/**
 * Spawn a worker process for a single slice.
 *
 * The worker runs in `basePath` (no separate worktree) with HX_SLICE_LOCK set
 * to `milestoneId/sliceId`. HX_PARALLEL_DEPTH is incremented to prevent
 * nested slice spawning.
 *
 * Returns true if the worker was successfully spawned, false otherwise.
 */
export function spawnSliceWorker(
  basePath: string,
  milestoneId: string,
  sliceId: string,
): boolean {
  const worker = workers.get(sliceId);
  if (!worker) return false;
  if (worker.process) return true; // already spawned

  const binPath = resolveHxBin();
  if (!binPath) {
    process.stderr.write(`hx-slice-orchestrator: cannot resolve HX binary for slice ${sliceId}\n`);
    return false;
  }

  const currentDepth = parseInt(process.env.HX_PARALLEL_DEPTH ?? "0", 10);

  let child: ChildProcess;
  try {
    child = spawn(process.execPath, [binPath, "headless", "--json", "auto"], {
      cwd: basePath,
      env: {
        ...process.env,
        HX_SLICE_LOCK: `${milestoneId}/${sliceId}`,
        HX_PROJECT_ROOT: basePath,
        // Prevent nested slice-parallel spawning
        HX_PARALLEL_DEPTH: String(currentDepth + 1),
      },
      stdio: ["ignore", "pipe", "pipe"],
      detached: false,
    });
  } catch (err) {
    process.stderr.write(
      `hx-slice-orchestrator: failed to spawn worker for ${sliceId}: ${getErrorMessage(err)}\n`,
    );
    tryReleaseSliceLock(milestoneId, sliceId, worker.pid);
    return false;
  }

  // Handle spawn-level errors (e.g., ENOENT)
  child.on("error", () => {
    const w = workers.get(sliceId);
    if (w) {
      w.process = null;
    }
  });

  worker.process = child;
  worker.pid = child.pid ?? 0;

  if (!child.pid) {
    worker.process = null;
    tryReleaseSliceLock(milestoneId, sliceId, worker.pid);
    return false;
  }

  // Drain stderr to prevent buffer fill; log notable output
  if (child.stderr) {
    child.stderr.on("data", (data: Buffer) => {
      process.stderr.write(`[slice-worker:${sliceId}] ${data.toString()}`);
    });
  }

  // Discard stdout — workers emit NDJSON but slice orchestrator doesn't track cost
  child.stdout?.resume();

  // Cleanup removes all child listeners to avoid closure accumulation
  worker.cleanup = () => {
    child.stdout?.removeAllListeners();
    child.stderr?.removeAllListeners();
    child.removeAllListeners();
  };

  // Handle worker exit
  child.on("exit", (code) => {
    const w = workers.get(sliceId);
    if (!w) return;

    w.cleanup?.();
    w.cleanup = undefined;
    w.process = null;

    if (w.state === "stopped") return; // graceful stop

    if (code === 0) {
      w.state = "stopped";
    } else {
      w.state = "error";
      process.stderr.write(
        `hx-slice-orchestrator: worker for ${sliceId} exited with code ${code ?? "null"}\n`,
      );
    }

    // Always release the lock when the worker exits
    tryReleaseSliceLock(milestoneId, sliceId, w.pid);
  });

  return true;
}

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * Start parallel slice execution for the given slices within a milestone.
 *
 * For each sliceId in `sliceIds`:
 * 1. Attempts to acquire the slice lock. Skips slices where the lock is held.
 * 2. Spawns a worker process with HX_SLICE_LOCK=milestoneId/sliceId.
 *
 * Returns the list of successfully started slices and any errors encountered.
 */
export async function startSliceParallel(
  basePath: string,
  milestoneId: string,
  sliceIds: string[],
): Promise<{ started: string[]; errors: Array<{ sid: string; error: string }> }> {
  // Prevent nested slice-parallel sessions
  if (process.env.HX_PARALLEL_DEPTH && parseInt(process.env.HX_PARALLEL_DEPTH, 10) > 0) {
    return {
      started: [],
      errors: [{ sid: "all", error: "Cannot start slice-parallel from within a parallel worker" }],
    };
  }

  if (!isDbAvailable()) {
    return {
      started: [],
      errors: [{ sid: "all", error: "Database not available — cannot acquire slice locks" }],
    };
  }

  const started: string[] = [];
  const errors: Array<{ sid: string; error: string }> = [];

  for (const sliceId of sliceIds) {
    // Use a placeholder PID of 0 during lock acquisition; real PID assigned after spawn
    const pid = process.pid;

    const acquired = tryAcquireSliceLock(milestoneId, sliceId, pid);
    if (!acquired) {
      process.stderr.write(
        `hx-slice-orchestrator: lock already held for ${milestoneId}/${sliceId} — skipping\n`,
      );
      errors.push({ sid: sliceId, error: "Lock already held by another worker" });
      continue;
    }

    // Register worker entry before spawning (spawnSliceWorker checks workers Map)
    const workerInfo: SliceWorkerInfo = {
      milestoneId,
      sliceId,
      pid,
      process: null,
      startedAt: Date.now(),
      state: "running",
    };
    workers.set(sliceId, workerInfo);

    const spawned = spawnSliceWorker(basePath, milestoneId, sliceId);
    if (!spawned) {
      workers.delete(sliceId);
      errors.push({ sid: sliceId, error: "Failed to spawn worker process" });
      continue;
    }

    started.push(sliceId);
  }

  return { started, errors };
}

/**
 * Stop one or all running slice workers.
 *
 * If `sliceId` is provided, stops only that slice worker.
 * If omitted, stops all tracked workers.
 *
 * Sends SIGTERM to the child process and releases the slice lock.
 */
export async function stopSliceParallel(
  basePath: string,
  sliceId?: string,
): Promise<void> {
  const targets = sliceId ? [sliceId] : [...workers.keys()];

  for (const sid of targets) {
    const worker = workers.get(sid);
    if (!worker) continue;

    worker.state = "stopped";

    if (worker.process) {
      try {
        worker.process.kill("SIGTERM");
      } catch {
        // Process may have already exited
      }
    }

    // Release lock on behalf of the worker
    tryReleaseSliceLock(worker.milestoneId, sid, worker.pid);

    // Clean up listeners
    worker.cleanup?.();
    worker.cleanup = undefined;
    worker.process = null;

    workers.delete(sid);
  }

  // Suppress unused-variable lint for basePath — kept for API symmetry
  void basePath;
}

/**
 * Return a snapshot of all tracked slice workers as an array.
 */
export function getSliceWorkerStatuses(): SliceWorkerInfo[] {
  return [...workers.values()];
}

/**
 * Clear all tracked workers. Intended for use in tests to reset module state.
 * Does NOT release locks or send signals — use stopSliceParallel for graceful shutdown.
 */
export function _resetSliceWorkers(): void {
  workers.clear();
}
