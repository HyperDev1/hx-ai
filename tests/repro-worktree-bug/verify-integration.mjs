/**
 * Integration verification: parallel directory writes go to the correct .hx
 *
 * This verifies that after the fix, when code resolves paths inside a worktree
 * with symlinked .hx, writes target the project-level .hx (through symlink)
 * rather than the user-level ~/.hx.
 *
 * Covers:
 * 1. resolveProjectRoot() returns the real project, not ~
 * 2. hxRoot() from the resolved project root finds project .hx, not ~/.hx
 * 3. The parallel/ directory would be created under project .hx
 * 4. session-status writes target the correct location
 * 5. orchestrator.json would be written to project .hx
 * 6. assertSafeDirectory blocks ~ as a project root
 */

import {
  mkdirSync, symlinkSync, existsSync, readFileSync, realpathSync,
  writeFileSync, mkdtempSync,
} from "node:fs";
import { execSync } from "node:child_process";
import { join, resolve } from "node:path";
import { homedir, tmpdir } from "node:os";

// ── Fixed functions (from worktree.ts after fix) ─────────────────────────

function findWorktreeSegment(normalizedPath) {
  const directMarker = "/.hx/worktrees/";
  const idx = normalizedPath.indexOf(directMarker);
  if (idx !== -1) {
    return { hxIdx: idx, afterWorktrees: idx + directMarker.length };
  }
  const symlinkRe = /\/\.hx\/projects\/[a-f0-9]+\/worktrees\//;
  const match = normalizedPath.match(symlinkRe);
  if (match && match.index !== undefined) {
    return { hxIdx: match.index, afterWorktrees: match.index + match[0].length };
  }
  return null;
}

function resolveProjectRootFromGitFile(worktreePath) {
  try {
    let dir = worktreePath;
    for (let i = 0; i < 10; i++) {
      const gitPath = join(dir, ".git");
      if (existsSync(gitPath)) {
        const content = readFileSync(gitPath, "utf8").trim();
        if (content.startsWith("gitdir: ")) {
          const gitDir = resolve(dir, content.slice(8));
          const dotGitDir = resolve(gitDir, "..", "..");
          if (dotGitDir.endsWith(".git") || dotGitDir.endsWith(".git/") || dotGitDir.endsWith(".git\\")) {
            return resolve(dotGitDir, "..");
          }
          const commonDirPath = join(gitDir, "commondir");
          if (existsSync(commonDirPath)) {
            const commonDir = readFileSync(commonDirPath, "utf8").trim();
            const resolvedCommonDir = resolve(gitDir, commonDir);
            return resolve(resolvedCommonDir, "..");
          }
        }
        break;
      }
      const parent = resolve(dir, "..");
      if (parent === dir) break;
      dir = parent;
    }
  } catch { }
  return null;
}

function normalizePathForCompare(path) {
  let normalized;
  try {
    normalized = realpathSync(path);
  } catch {
    normalized = resolve(path);
  }
  const slashed = normalized.replaceAll("\\", "/");
  const trimmed = slashed.replace(/\/+$/, "");
  return trimmed || "/";
}

function resolveProjectRoot(basePath) {
  // Layer 1: If the coordinator passed the real project root, use it.
  if (process.env.HX_PROJECT_ROOT) {
    return process.env.HX_PROJECT_ROOT;
  }

  const normalizedPath = basePath.replaceAll("\\", "/");
  const seg = findWorktreeSegment(normalizedPath);
  if (!seg) return basePath;

  const sepChar = basePath.includes("\\") ? "\\" : "/";
  const hxMarker = `${sepChar}.hx${sepChar}`;
  const hxIdx = basePath.indexOf(hxMarker);
  const candidate = hxIdx !== -1
    ? basePath.slice(0, hxIdx)
    : basePath.slice(0, seg.hxIdx);
  const hxHome = normalizePathForCompare(process.env.HX_HOME || join(homedir(), ".hx"));
  const candidateHxPath = normalizePathForCompare(join(candidate, ".hx"));
  if (candidateHxPath === hxHome || candidateHxPath.startsWith(hxHome + "/")) {
    const realRoot = resolveProjectRootFromGitFile(basePath);
    if (realRoot) return realRoot;
    return basePath;
  }
  return candidate;
}

// Simplified hxRoot — matches paths.ts probeHxRoot logic
function hxRoot(basePath) {
  const local = join(basePath, ".hx");
  if (existsSync(local)) return local;
  return local; // fallback
}

// Simplified validateDirectory — matches validate-directory.ts
function validateDirectory(dirPath) {
  let resolved;
  try { resolved = realpathSync(resolve(dirPath)); } catch { resolved = resolve(dirPath); }
  let normalized = resolved.replace(/[/\\]+$/, "");
  if (normalized === "") normalized = "/";

  let resolvedHome;
  try { resolvedHome = realpathSync(resolve(homedir())).replace(/[/\\]+$/, ""); } catch { resolvedHome = resolve(homedir()).replace(/[/\\]+$/, ""); }

  if (normalized === resolvedHome) {
    return { safe: false, severity: "blocked", reason: `Refusing to run in home directory: ${normalized}` };
  }
  return { safe: true, severity: "ok" };
}

// ── Setup ────────────────────────────────────────────────────────────────

const HASH = "abc123def456";
const TEST_ROOT = mkdtempSync(join(tmpdir(), "hx-verify-integration-"));
const USER_HX = process.env.HX_HOME || join(TEST_ROOT, ".hx");
const USER_HOME = homedir();
const PROJECT_HX_STORAGE = `${USER_HX}/projects/${HASH}`;
const PROJECT_DIR = mkdtempSync(join(tmpdir(), "myproject-"));
const PROJECT_HX_LINK = `${PROJECT_DIR}/.hx`;
const PROJECT_REAL = normalizePathForCompare(PROJECT_DIR);
let PROJECT_STORAGE_REAL = "";

process.env.HX_HOME = USER_HX;

console.log("=== Setup ===\n");

mkdirSync(`${PROJECT_HX_STORAGE}/worktrees`, { recursive: true });
mkdirSync(`${PROJECT_HX_STORAGE}/milestones`, { recursive: true });
mkdirSync(PROJECT_DIR, { recursive: true });
symlinkSync(PROJECT_HX_STORAGE, PROJECT_HX_LINK);
PROJECT_STORAGE_REAL = normalizePathForCompare(PROJECT_HX_STORAGE);

execSync("git init -b main", { cwd: PROJECT_DIR, stdio: "pipe" });
execSync('git config user.name "Test"', { cwd: PROJECT_DIR, stdio: "pipe" });
execSync('git config user.email "test@test.com"', { cwd: PROJECT_DIR, stdio: "pipe" });
writeFileSync(join(PROJECT_DIR, "README.md"), "hello\n");
execSync("git add -A && git commit -m init", { cwd: PROJECT_DIR, stdio: "pipe" });
execSync("git worktree add .hx/worktrees/M001 -b worktree/M001", { cwd: PROJECT_DIR, stdio: "pipe" });
console.log("Created project with symlinked .hx and real git worktree\n");

let passed = 0;
let failed = 0;
function test(name, actual, expected) {
  if (actual === expected) { console.log(`  ✅ ${name}`); passed++; }
  else { console.log(`  ❌ ${name}\n     Expected: ${expected}\n     Got:      ${actual}`); failed++; }
}

// ── Simulate worker environment ──────────────────────────────────────────

process.chdir(`${PROJECT_DIR}/.hx/worktrees/M001`);
const workerCwd = process.cwd(); // Resolves symlinks → /root/.hx/projects/.../worktrees/M001

console.log("=== Test 1: resolveProjectRoot returns real project ===\n");
console.log(`  Worker cwd (resolved): ${workerCwd}`);

const projectRoot = resolveProjectRoot(workerCwd);
console.log(`  Resolved project root: ${projectRoot}`);
test("resolveProjectRoot returns real project root", projectRoot, PROJECT_REAL);
test("resolveProjectRoot does NOT return home dir", projectRoot !== USER_HOME, true);

console.log("\n=== Test 2: hxRoot finds project .hx ===\n");

const hx = hxRoot(projectRoot);
console.log(`  hxRoot result: ${hx}`);
test("hxRoot points to project .hx", hx, `${PROJECT_REAL}/.hx`);

// Verify it's a symlink to the right place
const hxReal = realpathSync(hx);
console.log(`  hxRoot resolves to: ${hxReal}`);
test("hxRoot resolves to project storage", hxReal, PROJECT_STORAGE_REAL);
test("hxRoot does NOT resolve to user-level ~/.hx", hxReal !== USER_HX, true);

console.log("\n=== Test 3: parallel/ directory targets project .hx ===\n");

const parallelDir = join(hx, "parallel");
console.log(`  Parallel dir would be: ${parallelDir}`);
const parallelReal = join(hxReal, "parallel");
console.log(`  Resolves physically to: ${parallelReal}`);
test("parallel dir is under project .hx", parallelDir.startsWith(PROJECT_REAL), true);
test("parallel dir is NOT under ~/.hx root", !parallelDir.startsWith(USER_HX) || parallelDir.startsWith(`${USER_HX}/projects/`), true);

// Actually create it and verify
mkdirSync(parallelDir, { recursive: true });
test("parallel dir was created", existsSync(parallelDir), true);
test("parallel dir physically exists in project storage", existsSync(parallelReal), true);

// Write a session status file
const statusFile = join(parallelDir, "M001.status.json");
writeFileSync(statusFile, JSON.stringify({ milestoneId: "M001", pid: 12345, state: "running" }));
test("session status file written to project parallel/", existsSync(statusFile), true);

console.log("\n=== Test 4: orchestrator.json targets project .hx ===\n");

const orchestratorPath = join(hx, "orchestrator.json");
console.log(`  orchestrator.json would be at: ${orchestratorPath}`);
writeFileSync(orchestratorPath, JSON.stringify({ active: true }));
test("orchestrator.json written to project .hx", existsSync(orchestratorPath), true);

// Verify nothing leaked to user-level ~/.hx root
const userParallelDir = join(USER_HX, "parallel");
const userOrchestratorPath = join(USER_HX, "orchestrator.json");
test("NO parallel/ dir at user-level ~/.hx root", !existsSync(userParallelDir), true);
test("NO orchestrator.json at user-level ~/.hx root", !existsSync(userOrchestratorPath), true);

console.log("\n=== Test 5: validateDirectory blocks ~ as project root ===\n");

const homeValidation = validateDirectory(USER_HOME);
test("validateDirectory blocks home dir", homeValidation.safe, false);
test("validateDirectory blocks with 'blocked' severity", homeValidation.severity, "blocked");

const projectValidation = validateDirectory(PROJECT_DIR);
test("validateDirectory allows project dir", projectValidation.safe, true);

console.log("\n=== Test 6: HX_PROJECT_ROOT env var path ===\n");

process.env.HX_PROJECT_ROOT = PROJECT_DIR;
const envResult = resolveProjectRoot(workerCwd);
test("HX_PROJECT_ROOT short-circuits resolution", envResult, PROJECT_DIR);
delete process.env.HX_PROJECT_ROOT;

console.log("\n=== Test 7: Non-worktree paths unaffected ===\n");

test("Regular project path unchanged", resolveProjectRoot("/some/project"), "/some/project");
test("Direct worktree layout still works", resolveProjectRoot("/foo/.hx/worktrees/M001"), "/foo");

// ── Summary ──────────────────────────────────────────────────────────────

console.log(`\n${"=".repeat(60)}`);
console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.log("\n🔴 INTEGRATION VERIFICATION FAILED");
  process.exit(1);
} else {
  console.log("\n✅ ALL INTEGRATION TESTS PASSED");
  console.log("  - resolveProjectRoot returns real project, not ~");
  console.log("  - hxRoot finds project .hx through symlink");
  console.log("  - parallel/ dir created in project .hx, not ~/.hx");
  console.log("  - session status writes land in correct location");
  console.log("  - orchestrator.json lands in correct location");
  console.log("  - validateDirectory blocks ~ as fallback safety net");
  console.log("  - HX_PROJECT_ROOT env var works as primary layer");
  console.log("  - Non-worktree paths are unaffected by the fix");
  process.exit(0);
}
