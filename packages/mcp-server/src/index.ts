/**
 * @hyperlab/hx-mcp-server — MCP server for HX orchestration and project state readers.
 */

export { SessionManager } from './session-manager.js';
export { createMcpServer } from './server.js';
export type {
  SessionStatus,
  ManagedSession,
  ExecuteOptions,
  PendingBlocker,
  CostAccumulator,
} from './types.js';
export { MAX_EVENTS, INIT_TIMEOUT_MS } from './types.js';

// Project state readers
export {
  resolveHxRoot,
  resolveRootFile,
  milestonesDir,
  findMilestoneIds,
  resolveMilestoneDir,
  resolveMilestoneFile,
  findSliceIds,
  resolveSliceDir,
  resolveSliceFile,
  findTaskFiles,
  readProgress,
  readRoadmap,
  readHistory,
  readCaptures,
  readKnowledge,
  runDoctorLite,
} from './readers/index.js';
export type {
  ProgressResult,
  MilestoneProgress,
  SliceProgress,
  TaskProgress,
  RoadmapResult,
  MilestoneRoadmap,
  SliceEntry,
  HistoryResult,
  MetricEntry,
  MetricsSummary,
  CapturesResult,
  CaptureEntry,
  KnowledgeResult,
  KnowledgeEntry,
  DoctorResult,
  CheckResult,
  CheckStatus,
} from './readers/index.js';
