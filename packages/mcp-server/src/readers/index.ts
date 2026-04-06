/**
 * HX MCP Server — readers module barrel export.
 *
 * Re-exports all 6 read-only project reader functions and their types.
 */

// Filesystem path helpers
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
} from './paths.js';

// Progress reader
export { readProgress } from './state.js';
export type { ProgressResult, MilestoneProgress, SliceProgress, TaskProgress } from './state.js';

// Roadmap reader
export { readRoadmap } from './roadmap.js';
export type { RoadmapResult, MilestoneRoadmap, SliceEntry } from './roadmap.js';

// Metrics history reader
export { readHistory } from './metrics.js';
export type { HistoryResult, MetricEntry, MetricsSummary } from './metrics.js';

// Captures reader
export { readCaptures } from './captures.js';
export type { CapturesResult, CaptureEntry } from './captures.js';

// Knowledge reader
export { readKnowledge } from './knowledge.js';
export type { KnowledgeResult, KnowledgeEntry } from './knowledge.js';

// Doctor-lite health checker
export { runDoctorLite } from './doctor-lite.js';
export type { DoctorResult, CheckResult, CheckStatus } from './doctor-lite.js';
