# S05: MCP Server Readers + Misc Features — UAT

**Milestone:** M003-ttxmyu
**Written:** 2026-04-05T18:29:04.588Z

## UAT Type

UAT mode: artifact-driven

## Overview

Verify that S05 delivered: (1) 6 MCP read-only tools registered in mcp-server/server.ts, (2) /btw skill present and correct, (3) /hx codebase subsystem wired end-to-end, (4) CODEBASE.md injection in system-context.ts, (5) codebase auto-generation on init.

## Preconditions

- Working directory: `/Users/beratcan/Desktop/GithubProjects/hx-ai`
- `packages/mcp-server/dist/` must be built (`cd packages/mcp-server && npm run build`)
- Node.js ≥18 available

## Test Cases

### TC01 — MCP readers module: 8 files exist

**Steps:**
1. `ls packages/mcp-server/src/readers/`

**Expected:** paths.ts, state.ts, roadmap.ts, metrics.ts, captures.ts, knowledge.ts, doctor-lite.ts, index.ts, readers.test.ts all present (9 files total).

---

### TC02 — MCP readers: 0 GSD refs in source files

**Steps:**
1. `grep -rn 'gsd\|GSD' packages/mcp-server/src/readers/ | grep -v '.test.' | wc -l`

**Expected:** Output is `0`.

---

### TC03 — MCP readers tests pass

**Steps:**
1. `cd packages/mcp-server && npm run build`
2. `node --test dist/readers/readers.test.js`

**Expected:** `pass 31`, `fail 0`.

---

### TC04 — MCP server registers 12 tools (6 original + 6 new readers)

**Steps:**
1. `grep -c 'server\.tool(' packages/mcp-server/dist/server.js`

**Expected:** `12`

---

### TC05 — 6 reader tool names present in compiled server.js

**Steps:**
1. `grep -o 'hx_progress\|hx_roadmap\|hx_history\|hx_captures\|hx_knowledge\|hx_doctor' packages/mcp-server/dist/server.js | sort -u | wc -l`

**Expected:** `6`

---

### TC06 — /btw skill file present and well-formed

**Steps:**
1. `ls src/resources/skills/btw/SKILL.md`
2. `head -5 src/resources/skills/btw/SKILL.md`

**Expected:** File exists. First line is `---` (YAML frontmatter). Contains `name: btw`.

---

### TC07 — /btw skill has no GSD references

**Steps:**
1. `grep -in 'gsd' src/resources/skills/btw/SKILL.md | wc -l`

**Expected:** `0`

---

### TC08 — codebase-generator.ts and commands-codebase.ts exist with correct exports

**Steps:**
1. `grep -c 'export function\|export interface\|export const\|export type' src/resources/extensions/hx/codebase-generator.ts`
2. `grep -c 'export function\|export async function' src/resources/extensions/hx/commands-codebase.ts`

**Expected:** codebase-generator.ts exports ≥6 items; commands-codebase.ts exports ≥1 function.

---

### TC09 — CodebaseMapPreferences in preferences-types.ts

**Steps:**
1. `grep 'CodebaseMapPreferences\|codebase?' src/resources/extensions/hx/preferences-types.ts`

**Expected:** Lines showing `interface CodebaseMapPreferences` and `codebase?: CodebaseMapPreferences` in HXPreferences.

---

### TC10 — CODEBASE key in paths.ts HX_ROOT_FILES

**Steps:**
1. `grep 'CODEBASE' src/resources/extensions/hx/paths.ts`

**Expected:** Two hits — one in HX_ROOT_FILES (`CODEBASE: 'CODEBASE.md'`) and one in LEGACY_HX_ROOT_FILES (`CODEBASE: 'codebase.md'`).

---

### TC11 — /hx codebase wired in catalog, ops, bootstrap

**Steps:**
1. `grep 'codebase' src/resources/extensions/hx/commands/catalog.ts | head -3`
2. `grep 'codebase' src/resources/extensions/hx/commands/handlers/ops.ts | head -3`
3. `grep 'codebase' src/resources/extensions/hx/commands-bootstrap.ts`

**Expected:** catalog.ts shows nested completions for codebase subcommands; ops.ts shows handleCodebase import and dispatch; commands-bootstrap.ts shows the `codebase` entry in TOP_LEVEL_SUBCOMMANDS.

---

### TC12 — system-context.ts injects codebaseBlock

**Steps:**
1. `grep 'codebaseBlock\|CODEBASE MAP\|8000' src/resources/extensions/hx/bootstrap/system-context.ts`

**Expected:** Lines showing codebaseBlock assignment, `[CODEBASE MAP]` injection string, and `8000` char cap.

---

### TC13 — init-wizard.ts calls generateCodebaseMap + writeCodebaseMap

**Steps:**
1. `grep 'generateCodebaseMap\|writeCodebaseMap' src/resources/extensions/hx/init-wizard.ts`

**Expected:** Two hits showing the import and the generate+write call within a try/catch.

---

### TC14 — typecheck clean

**Steps:**
1. `npx tsc --noEmit 2>&1 | grep -v hx-rpc-client | grep error | wc -l`

**Expected:** `0` (only pre-existing hx-rpc-client errors are allowed).

---

### TC15 — Full unit test suite passes

**Steps:**
1. `npm run test:unit 2>&1 | tail -3`

**Expected:** `✔ 4215 passed, 0 failed, 5 skipped` (or higher if S06 adds more).

---

## Edge Cases

### EC01 — codebase injection is non-fatal when CODEBASE.md absent

**Steps:**
1. Confirm `src/resources/extensions/hx/bootstrap/system-context.ts` wraps the codebaseBlock read in `try { } catch { }`.
2. `grep -A5 'codebasePath' src/resources/extensions/hx/bootstrap/system-context.ts | grep catch`

**Expected:** `catch` block present — injection failure does not throw.

### EC02 — codebase generation on init is non-fatal

**Steps:**
1. `grep -A3 'writeCodebaseMap' src/resources/extensions/hx/init-wizard.ts | grep catch`

**Expected:** `catch` block present — codebase generation failure does not block /hx init.

### EC03 — reader modules return structured null-safe results

**Steps:**
1. Check readers.test.ts for tests that invoke readers against empty or missing directories.
2. `grep 'null\|undefined\|{}' packages/mcp-server/src/readers/readers.test.ts | wc -l`

**Expected:** ≥1 tests covering absent optional files without throwing.

