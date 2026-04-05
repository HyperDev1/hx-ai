/**
 * HX MCP Server — lightweight health checker for HX projects.
 *
 * Checks for common configuration issues and provides actionable remediation.
 * Run this when diagnosing why /hx status reports unexpected states.
 */

import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { resolveRootFile } from './paths.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CheckStatus = 'pass' | 'warn' | 'fail' | 'info';

export interface CheckResult {
  name: string;
  status: CheckStatus;
  message: string;
  remediation?: string;
}

export interface DoctorResult {
  projectDir: string;
  hxDir: string;
  overallStatus: 'healthy' | 'warnings' | 'errors';
  checks: CheckResult[];
  summary: string;
}

// ---------------------------------------------------------------------------
// Individual check helpers
// ---------------------------------------------------------------------------

function checkHxDirectory(projectDir: string): CheckResult {
  const hxDir = join(resolve(projectDir), '.hx');
  if (!existsSync(hxDir)) {
    return {
      name: 'hx-directory',
      status: 'fail',
      message: '.hx/ directory not found',
      remediation: 'Run /hx status in the project directory to initialise HX.',
    };
  }
  try {
    const s = statSync(hxDir);
    if (!s.isDirectory()) {
      return {
        name: 'hx-directory',
        status: 'fail',
        message: '.hx exists but is not a directory',
        remediation: 'Remove .hx file and run /hx status to reinitialise.',
      };
    }
  } catch {
    return {
      name: 'hx-directory',
      status: 'fail',
      message: '.hx/ directory stat failed',
    };
  }
  return { name: 'hx-directory', status: 'pass', message: '.hx/ directory exists' };
}

function checkProjectMd(projectDir: string): CheckResult {
  const projectPath = join(resolve(projectDir), '.hx', 'PROJECT.md');
  if (!existsSync(projectPath)) {
    return {
      name: 'project-md',
      status: 'warn',
      message: 'PROJECT.md not found',
      remediation: 'Create .hx/PROJECT.md describing what this project is.',
    };
  }
  try {
    const content = readFileSync(projectPath, 'utf-8').trim();
    if (content.length < 20) {
      return {
        name: 'project-md',
        status: 'warn',
        message: 'PROJECT.md exists but appears empty',
        remediation: 'Add a description of the project to .hx/PROJECT.md.',
      };
    }
  } catch {
    return { name: 'project-md', status: 'warn', message: 'PROJECT.md could not be read' };
  }
  return { name: 'project-md', status: 'pass', message: 'PROJECT.md exists and has content' };
}

function checkStateMd(projectDir: string): CheckResult {
  try {
    const statePath = resolveRootFile(projectDir, 'STATE.md');
    if (!existsSync(statePath)) {
      return {
        name: 'state-md',
        status: 'info',
        message: 'STATE.md not found — no active session',
      };
    }
    const content = readFileSync(statePath, 'utf-8').trim();
    if (content.length === 0) {
      return { name: 'state-md', status: 'warn', message: 'STATE.md is empty' };
    }
    return { name: 'state-md', status: 'pass', message: 'STATE.md exists' };
  } catch {
    return { name: 'state-md', status: 'info', message: 'No active session (STATE.md absent)' };
  }
}

function checkMilestonesDir(projectDir: string): CheckResult {
  try {
    const milestonesPath = resolveRootFile(projectDir, 'milestones');
    if (!existsSync(milestonesPath)) {
      return {
        name: 'milestones-dir',
        status: 'info',
        message: 'No milestones directory — project not yet started',
        remediation: 'Run /hx status to create the first milestone.',
      };
    }
    return { name: 'milestones-dir', status: 'pass', message: 'milestones/ directory exists' };
  } catch {
    return { name: 'milestones-dir', status: 'info', message: 'milestones/ directory absent' };
  }
}

function checkKnowledgeMd(projectDir: string): CheckResult {
  try {
    const knowledgePath = resolveRootFile(projectDir, 'KNOWLEDGE.md');
    if (!existsSync(knowledgePath)) {
      return {
        name: 'knowledge-md',
        status: 'info',
        message: 'KNOWLEDGE.md not found — will be created on first use',
      };
    }
    return { name: 'knowledge-md', status: 'pass', message: 'KNOWLEDGE.md exists' };
  } catch {
    return { name: 'knowledge-md', status: 'info', message: 'KNOWLEDGE.md absent' };
  }
}

function checkDecisionsMd(projectDir: string): CheckResult {
  try {
    const decisionsPath = resolveRootFile(projectDir, 'DECISIONS.md');
    if (!existsSync(decisionsPath)) {
      return {
        name: 'decisions-md',
        status: 'info',
        message: 'DECISIONS.md not found — will be created on first architectural decision',
      };
    }
    return { name: 'decisions-md', status: 'pass', message: 'DECISIONS.md exists' };
  } catch {
    return { name: 'decisions-md', status: 'info', message: 'DECISIONS.md absent' };
  }
}

function checkRequirementsMd(projectDir: string): CheckResult {
  try {
    const requirementsPath = resolveRootFile(projectDir, 'REQUIREMENTS.md');
    if (!existsSync(requirementsPath)) {
      return {
        name: 'requirements-md',
        status: 'warn',
        message: 'REQUIREMENTS.md not found',
        remediation: 'Run /hx status to create a requirements contract for this project.',
      };
    }
    return { name: 'requirements-md', status: 'pass', message: 'REQUIREMENTS.md exists' };
  } catch {
    return { name: 'requirements-md', status: 'warn', message: 'REQUIREMENTS.md absent' };
  }
}

function checkActiveMilestoneConsistency(projectDir: string): CheckResult {
  try {
    const statePath = resolveRootFile(projectDir, 'STATE.md');
    if (!existsSync(statePath)) {
      return { name: 'milestone-consistency', status: 'info', message: 'No active session to validate' };
    }

    const stateContent = readFileSync(statePath, 'utf-8');
    const milestoneMatch = stateContent.match(/\*\*Active Milestone\*\*[:\s]+([A-Z0-9-]+)/i) ??
      stateContent.match(/milestone[:\s]+([A-Z0-9-]+)/i);

    if (!milestoneMatch) {
      return { name: 'milestone-consistency', status: 'info', message: 'No active milestone in STATE.md' };
    }

    const milestoneId = milestoneMatch[1].trim();
    const milestoneDir = resolveRootFile(projectDir, 'milestones', milestoneId);

    if (!existsSync(milestoneDir)) {
      return {
        name: 'milestone-consistency',
        status: 'fail',
        message: `STATE.md references milestone ${milestoneId} but its directory does not exist`,
        remediation: `Run /hx status to repair state or manually create milestones/${milestoneId}/`,
      };
    }

    return {
      name: 'milestone-consistency',
      status: 'pass',
      message: `Active milestone ${milestoneId} directory exists`,
    };
  } catch {
    return { name: 'milestone-consistency', status: 'info', message: 'Could not validate milestone consistency' };
  }
}

// ---------------------------------------------------------------------------
// runDoctorLite
// ---------------------------------------------------------------------------

/**
 * Run lightweight health checks on a HX project directory.
 *
 * Returns structured check results. For a full diagnosis, run `/hx status`
 * in the project directory.
 */
export function runDoctorLite(projectDir: string): DoctorResult {
  const hxDir = join(resolve(projectDir), '.hx');

  const checks: CheckResult[] = [
    checkHxDirectory(projectDir),
    checkProjectMd(projectDir),
    checkStateMd(projectDir),
    checkMilestonesDir(projectDir),
    checkKnowledgeMd(projectDir),
    checkDecisionsMd(projectDir),
    checkRequirementsMd(projectDir),
    checkActiveMilestoneConsistency(projectDir),
  ];

  const failCount = checks.filter((c) => c.status === 'fail').length;
  const warnCount = checks.filter((c) => c.status === 'warn').length;

  let overallStatus: 'healthy' | 'warnings' | 'errors';
  let summary: string;

  if (failCount > 0) {
    overallStatus = 'errors';
    summary = `${failCount} error${failCount !== 1 ? 's' : ''}, ${warnCount} warning${warnCount !== 1 ? 's' : ''}. Run /hx status for full diagnostics.`;
  } else if (warnCount > 0) {
    overallStatus = 'warnings';
    summary = `${warnCount} warning${warnCount !== 1 ? 's' : ''}. Run /hx status for full diagnostics.`;
  } else {
    overallStatus = 'healthy';
    summary = 'All checks passed. Project is healthy.';
  }

  return {
    projectDir: resolve(projectDir),
    hxDir,
    overallStatus,
    checks,
    summary,
  };
}
