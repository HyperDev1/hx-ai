/**
 * Verification: Fix for worktree path resolution escaping to home directory
 *
 * Tests the FIXED resolveProjectRoot() against the same scenarios that
 * reproduced the bug. Copies the fixed function logic from worktree.ts.
 */

import {
  mkdirSync, symlinkSync, existsSync, readFileSync, realpathSync, writeFileSync, mkdtempSync,
} from "node:fs";
import { execSync } from "node:child_process";
import { join, resolve } from "node:path";
import { homedir, tmpdir } from "node:os";

// ── Fixed functions (copied from worktree.ts after fix) ─────────────────

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

  // Layer 2: Guard against resolving to the user's home directory.
  const hxHome = normalizePathForCompare(process.env.HX_HOME || join(homedir(), ".hx"));
  const candidateHxPath = normalizePathForCompare(join(candidate, ".hx"));

  if (candidateHxPath === hxHome || candidateHxPath.startsWith(hxHome + "/")) {
    const realRoot = resolveProjectRootFromGitFile(basePath);
    if (realRoot) return realRoot;
    return basePath;
  }

  return candidate;
}

// ── Set up filesystem layout ────────────────────────────────────────────

const HASH = "abc123def456";
const TEST_ROOT = mkdtempSync(join(tmpdir(), "hx-verify-fix-"));
const USER_HX = process.env.HX_HOME || join(TEST_ROOT, ".hx");
const USER_HOME = homedir();
const PROJECT_HX_STORAGE = `${USER_HX}/projects/${HASH}`;
const PROJECT_DIR = mkdtempSync(join(tmpdir(), "myproject-"));
const PROJECT_HX_LINK = `${PROJECT_DIR}/.hx`;
const PROJECT_REAL = normalizePathForCompare(PROJECT_DIR);
const EXPECTED_BUGGY_ROOT = normalizePathForCompare(resolve(USER_HX, ".."));

process.env.HX_HOME = USER_HX;

console.log("=== Setting up filesystem layout ===\n");

mkdirSync(`${PROJECT_HX_STORAGE}/worktrees`, { recursive: true });
mkdirSync(`${PROJECT_HX_STORAGE}/milestones`, { recursive: true });
mkdirSync(PROJECT_DIR, { recursive: true });
symlinkSync(PROJECT_HX_STORAGE, PROJECT_HX_LINK);

// Init git in project dir
execSync("git init -b main", { cwd: PROJECT_DIR, stdio: "pipe" });
execSync('git config user.name "Test"', { cwd: PROJECT_DIR, stdio: "pipe" });
execSync('git config user.email "test@test.com"', { cwd: PROJECT_DIR, stdio: "pipe" });
writeFileSync(join(PROJECT_DIR, "README.md"), "hello\n");
execSync("git add -A && git commit -m init", { cwd: PROJECT_DIR, stdio: "pipe" });

// Create a REAL git worktree (so .git file exists with gitdir pointer)
execSync("git worktree add .hx/worktrees/M001 -b worktree/M001", {
  cwd: PROJECT_DIR,
  stdio: "pipe",
});
console.log("Created real git worktree at .hx/worktrees/M001\n");

let passed = 0;
let failed = 0;

function test(name, actual, expected) {
  if (actual === expected) {
    console.log(`  ✅ ${name}`);
    passed++;
  } else {
    console.log(`  ❌ ${name}`);
    console.log(`     Expected: ${expected}`);
    console.log(`     Got:      ${actual}`);
    failed++;
  }
}

// ── Test 1: HX_PROJECT_ROOT env var (Layer 1) ──────────────────────────

console.log("=== Layer 1: HX_PROJECT_ROOT env var ===\n");

process.env.HX_PROJECT_ROOT = PROJECT_DIR;
const resolvedPath = realpathSync(`${PROJECT_DIR}/.hx/worktrees/M001`);
test(
  "HX_PROJECT_ROOT overrides path resolution",
  resolveProjectRoot(resolvedPath),
  PROJECT_DIR,
);
delete process.env.HX_PROJECT_ROOT;

// ── Test 2: Direct layout still works ────────────────────────────────────

console.log("\n=== Direct layout (no symlink collision) ===\n");

test(
  "Direct layout resolves correctly",
  resolveProjectRoot("/foo/.hx/worktrees/M001"),
  "/foo",
);

test(
  "Non-worktree path unchanged",
  resolveProjectRoot("/some/repo"),
  "/some/repo",
);

// ── Test 3: Symlink-resolved path with git fallback (Layer 2) ────────────

console.log("\n=== Layer 2: Symlink-resolved path with git fallback ===\n");

// chdir into worktree via symlink — process.cwd() resolves symlinks
process.chdir(`${PROJECT_DIR}/.hx/worktrees/M001`);
const workerCwd = process.cwd();
console.log(`  Worker cwd (resolved): ${workerCwd}`);
console.log(`  Expected project root: ${PROJECT_DIR}`);

const result = resolveProjectRoot(workerCwd);
console.log(`  resolveProjectRoot():  ${result}`);
test(
  "Symlink-resolved worktree path resolves to REAL project (not ~)",
  result,
  PROJECT_REAL,
);

// Verify it's NOT the home directory
test(
  "Result is not the home directory",
  result !== USER_HOME,
  true,
);

// ── Test 4: Verify the git file fallback works ──────────────────────────

console.log("\n=== Git file fallback detail ===\n");

const gitFileContent = readFileSync(join(workerCwd, ".git"), "utf8").trim();
console.log(`  .git file content: ${gitFileContent}`);
const gitDirResolved = resolve(workerCwd, gitFileContent.slice(8));
console.log(`  Resolved gitdir:   ${gitDirResolved}`);
const projectFromGit = resolve(gitDirResolved, "..", "..");
console.log(`  Project from git:  ${resolve(projectFromGit, "..")}`);

const gitFallback = resolveProjectRootFromGitFile(workerCwd);
test(
  "resolveProjectRootFromGitFile returns real project",
  gitFallback,
  PROJECT_REAL,
);

// ── Test 5: Old buggy path would have returned ~ ────────────────────────

console.log("\n=== Regression guard ===\n");

// Simulate what the OLD code did:
function oldResolveProjectRoot(basePath) {
  const normalizedPath = basePath.replaceAll("\\", "/");
  const seg = findWorktreeSegment(normalizedPath);
  if (!seg) return basePath;
  const sepChar = basePath.includes("\\") ? "\\" : "/";
  const hxMarker = `${sepChar}.hx${sepChar}`;
  const hxIdx = basePath.indexOf(hxMarker);
  if (hxIdx !== -1) return basePath.slice(0, hxIdx);
  return basePath.slice(0, seg.hxIdx);
}

const oldResult = oldResolveProjectRoot(workerCwd);
console.log(`  Old (buggy) code returns: ${oldResult}`);
test(
  "Old code returns parent of HX home (confirming bug existed)",
  oldResult,
  EXPECTED_BUGGY_ROOT,
);

test(
  "New code does NOT return home directory",
  result !== USER_HOME,
  true,
);

// ── Summary ──────────────────────────────────────────────────────────────

console.log(`\n${"=".repeat(60)}`);
console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.log("\n🔴 FIX VERIFICATION FAILED");
  process.exit(1);
} else {
  console.log("\n✅ ALL TESTS PASSED — Fix verified!");
  process.exit(0);
}
