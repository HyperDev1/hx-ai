/**
 * Reproduction: Parallel Worktree Path Resolution Escapes to Home Directory
 *
 * This script reproduces the bug where resolveProjectRoot() returns the
 * user's home directory (~) when the project .hx is a symlink into
 * ~/.hx/projects/<hash> and worktree isolation is enabled.
 *
 * Layout mimics pi's default:
 *   /root/.hx/projects/<hash>/          ← user-level HX storage
 *   /tmp/myproject/.hx → symlink to ↑   ← project's .hx
 *   /tmp/myproject/.hx/worktrees/M001/  ← worktree (logical path through symlink)
 *
 * When a worker spawns with cwd = /tmp/myproject/.hx/worktrees/M001,
 * process.cwd() resolves symlinks → /root/.hx/projects/<hash>/worktrees/M001.
 * findWorktreeSegment() then matches /.hx/ at the WRONG boundary (the
 * user-level ~/.hx), causing resolveProjectRoot() to return /root (home dir).
 */

import { mkdirSync, symlinkSync, existsSync, realpathSync, mkdtempSync } from "node:fs";
import { execSync } from "node:child_process";
import { join } from "node:path";
import { homedir, tmpdir } from "node:os";

// ── Reproduce the exact functions from worktree.ts ──────────────────────

function findWorktreeSegment(normalizedPath) {
  // Direct layout: /.hx/worktrees/<name>
  const directMarker = "/.hx/worktrees/";
  const idx = normalizedPath.indexOf(directMarker);
  if (idx !== -1) {
    return { hxIdx: idx, afterWorktrees: idx + directMarker.length };
  }
  // Symlink-resolved layout: /.hx/projects/<hash>/worktrees/<name>
  const symlinkRe = /\/\.hx\/projects\/[a-f0-9]+\/worktrees\//;
  const match = normalizedPath.match(symlinkRe);
  if (match && match.index !== undefined) {
    return { hxIdx: match.index, afterWorktrees: match.index + match[0].length };
  }
  return null;
}

function resolveProjectRoot(basePath) {
  const normalizedPath = basePath.replaceAll("\\", "/");
  const seg = findWorktreeSegment(normalizedPath);
  if (!seg) return basePath;
  // Return the original path up to the /.hx/ boundary
  const sep = basePath.includes("\\") ? "\\" : "/";
  const hxMarker = `${sep}.hx${sep}`;
  const hxIdx = basePath.indexOf(hxMarker);
  if (hxIdx !== -1) return basePath.slice(0, hxIdx);
  return basePath.slice(0, seg.hxIdx);
}

// ── Set up the filesystem layout ────────────────────────────────────────

const HASH = "abc123def456";
const TEST_ROOT = mkdtempSync(join(tmpdir(), "hx-repro-"));
const USER_HX = process.env.HX_HOME || join(TEST_ROOT, ".hx");
const USER_HOME = homedir();
const PROJECT_HX_STORAGE = `${USER_HX}/projects/${HASH}`;
const PROJECT_DIR = mkdtempSync(join(tmpdir(), "myproject-"));
const PROJECT_HX_LINK = `${PROJECT_DIR}/.hx`;

console.log("=== Setting up filesystem layout ===\n");

// 1. Create user-level HX structure
mkdirSync(`${PROJECT_HX_STORAGE}/worktrees/M001`, { recursive: true });
mkdirSync(`${PROJECT_HX_STORAGE}/milestones`, { recursive: true });
console.log(`Created: ${PROJECT_HX_STORAGE}/worktrees/M001`);

// 2. Create project directory
mkdirSync(PROJECT_DIR, { recursive: true });
console.log(`Created: ${PROJECT_DIR}`);

// 3. Create symlink: project/.hx → user-level storage
symlinkSync(PROJECT_HX_STORAGE, PROJECT_HX_LINK);
console.log(`Symlink: ${PROJECT_HX_LINK} → ${PROJECT_HX_STORAGE}`);

// 4. Init git in project dir
execSync("git init -b main", { cwd: PROJECT_DIR, stdio: "pipe" });
execSync('git config user.name "Test"', { cwd: PROJECT_DIR, stdio: "pipe" });
execSync('git config user.email "test@test.com"', { cwd: PROJECT_DIR, stdio: "pipe" });
execSync("git commit --allow-empty -m init", { cwd: PROJECT_DIR, stdio: "pipe" });
console.log(`Git init: ${PROJECT_DIR}`);

console.log("\n=== Path Resolution Tests ===\n");

// ── Test 1: Logical path (through symlink) ──────────────────────────────

const logicalPath = `${PROJECT_DIR}/.hx/worktrees/M001`;
console.log(`Test 1: Logical path (through symlink)`);
console.log(`  Input:    ${logicalPath}`);
console.log(`  Expected: ${PROJECT_DIR}`);
const result1 = resolveProjectRoot(logicalPath);
console.log(`  Got:      ${result1}`);
console.log(`  Status:   ${result1 === PROJECT_DIR ? "✅ PASS" : "❌ FAIL — BUG NOT TRIGGERED (logical path)"}`);

// ── Test 2: Resolved path (what process.cwd() returns) ──────────────────

const resolvedPath = realpathSync(logicalPath);
console.log(`\nTest 2: Resolved path (what process.cwd() returns after chdir to worktree)`);
console.log(`  Input:    ${resolvedPath}`);
console.log(`  Expected: ${PROJECT_DIR}`);
const result2 = resolveProjectRoot(resolvedPath);
console.log(`  Got:      ${result2}`);
const isBuggy = result2 !== PROJECT_DIR;
console.log(`  Status:   ${isBuggy ? "🐛 BUG REPRODUCED — resolves to wrong directory!" : "✅ PASS"}`);

// ── Test 3: Simulate what actually happens in a worker ──────────────────

console.log(`\nTest 3: Simulating worker process.cwd() resolution`);
process.chdir(logicalPath);
const workerCwd = process.cwd(); // This resolves symlinks!
console.log(`  chdir to: ${logicalPath}`);
console.log(`  cwd():    ${workerCwd}`);
console.log(`  Expected project root: ${PROJECT_DIR}`);
const result3 = resolveProjectRoot(workerCwd);
console.log(`  resolveProjectRoot():  ${result3}`);
const workerBuggy = result3 !== PROJECT_DIR;
console.log(`  Status:   ${workerBuggy ? "🐛 BUG REPRODUCED — worker would use wrong project root!" : "✅ PASS"}`);

// ── Test 4: Show the cascade ────────────────────────────────────────────

if (workerBuggy) {
  console.log(`\n=== Cascade Analysis ===\n`);
  console.log(`The worker thinks project root is: ${result3}`);
  console.log(`It would look for .hx at:         ${result3}/.hx`);
  console.log(`That path exists:                   ${existsSync(join(result3, ".hx"))}`);
  
  if (existsSync(join(result3, ".hx"))) {
    const resolvedHx = realpathSync(join(result3, ".hx"));
    console.log(`It resolves to:                    ${resolvedHx}`);
    console.log(`\nThis is the USER-LEVEL .hx directory!`);
    console.log(`The worker would:`);
    console.log(`  1. Write session status to ~/.hx/parallel/`);
    console.log(`  2. Write orchestrator.json to ~/.hx/`);
    console.log(`  3. Potentially git init in ${result3} (the home directory)`);
    console.log(`  4. Corrupt the user-level HX configuration`);
  }
}

// ── Test 5: Verify findWorktreeSegment matches at the wrong /.hx/ ──────

console.log(`\n=== Root Cause Detail ===\n`);
const seg = findWorktreeSegment(resolvedPath);
if (seg) {
  console.log(`findWorktreeSegment() matched:`);
  console.log(`  hxIdx:         ${seg.hxIdx}`);
  console.log(`  afterWorktrees: ${seg.afterWorktrees}`);
  console.log(`  Path before /.hx/: "${resolvedPath.slice(0, seg.hxIdx)}"`);
  console.log(`  This is: ${resolvedPath.slice(0, seg.hxIdx) === USER_HOME ? "THE HOME DIRECTORY (bug!)" : "some other directory"}`);
  
  // Show which regex matched
  const directMarker = "/.hx/worktrees/";
  const directIdx = resolvedPath.indexOf(directMarker);
  if (directIdx !== -1) {
    console.log(`\n  Matched by: direct marker "/.hx/worktrees/" at index ${directIdx}`);
    console.log(`  The /.hx/ it found is at: "${resolvedPath.slice(0, directIdx + 5)}"`);
    console.log(`  This /.hx/ is the USER-LEVEL ~/.hx, not the project .hx!`);
  } else {
    console.log(`\n  Matched by: symlink regex`);
  }
}

// ── Summary ─────────────────────────────────────────────────────────────

console.log(`\n${"=".repeat(60)}`);
if (workerBuggy) {
  console.log(`\n🐛 BUG CONFIRMED: resolveProjectRoot() returns "${result3}"`);
  console.log(`   when it should return "${PROJECT_DIR}"`);
  console.log(`   because findWorktreeSegment() matches the /.hx/ in the`);
  console.log(`   user-level ~/.hx path, not the project-level .hx symlink.`);
  process.exit(1);
} else {
  console.log(`\n✅ Bug not reproduced — may be fixed.`);
  process.exit(0);
}
