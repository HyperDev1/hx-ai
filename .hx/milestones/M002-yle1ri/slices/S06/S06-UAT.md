# S06: Remaining Fixes (tools, windows, user-interaction, misc) — UAT

**Milestone:** M002-yle1ri
**Written:** 2026-04-04T22:31:47.199Z

## UAT Type
UAT mode: artifact-driven

## Overview
S06 delivered 9 upstream bugfix commits and 3 test infrastructure fixes. All checks are verifiable by examining source files and running the test suite.

## Preconditions
- Working directory: `/Users/beratcan/Desktop/GithubProjects/hx-ai`
- Node.js ≥ 22, TypeScript available via npx
- `npm install` has been run

## Test Cases

### TC-01: TypeScript typecheck clean
```bash
npx tsc --noEmit
```
**Expected:** exit 0, no output.

### TC-02: Full unit test suite passes
```bash
npm run test:unit
```
**Expected:** `N passed, 0 failed` (N ≥ 4113), exit 0.

### TC-03: read-tool offset clamping present
```bash
grep -n "offsetClamped\|Clamped to line\|beyond end of file" packages/pi-coding-agent/src/core/tools/read.ts
grep -n "offsetClamped\|Clamped to line\|beyond end of file" packages/pi-coding-agent/src/core/tools/hashline-read.ts
```
**Expected:** at least 2 matches in each file.

### TC-04: Windows shell guards present
```bash
grep -n 'process.platform.*win32' packages/pi-coding-agent/src/core/exec.ts
grep -n 'process.platform.*win32' packages/pi-coding-agent/src/core/lsp/index.ts
grep -n 'process.platform.*win32' packages/pi-coding-agent/src/core/lsp/lspmux.ts
```
**Expected:** at least 1 match per file.

### TC-05: windowsHide present in web-mode files
```bash
grep -c "windowsHide: true" src/web-mode.ts
grep -c "windowsHide" src/web/bridge-service.ts
```
**Expected:** ≥ 2 in web-mode.ts, ≥ 1 in bridge-service.ts.

### TC-06: ask-user-questions free-text follow-up
```bash
grep -n "user_note\|freeTextNote\|ctx.ui.input" src/resources/extensions/ask-user-questions.ts
```
**Expected:** matches for `user_note`, `freeTextNote`, and `ctx.ui.input`.

### TC-07: MCP server name normalization
```bash
grep -n "\.trim()\|\.toLowerCase()" src/resources/extensions/mcp-client/index.ts
```
**Expected:** at least 2 matches.

### TC-08: OAuth google_search shape
```bash
grep -n "alt=sse\|userAgent" src/resources/extensions/google-search/index.ts
```
**Expected:** matches for both `alt=sse` and `userAgent`.

### TC-09: Discord link canonicalization
```bash
grep "discord.gg/hx" docs/what-is-pi/15-pi-packages-the-ecosystem.md
grep -c "discord.com/invite/3cU7Bz4UPx" docs/what-is-pi/15-pi-packages-the-ecosystem.md
```
**Expected:** first grep finds the canonical URL; second grep returns 0.

### TC-10: npm tarball .git guard
```bash
grep -n "detectStalePackages\|existsSync.*\.git" scripts/ensure-workspace-builds.cjs | head -5
```
**Expected:** `detectStalePackages` function and `.git` guard present.

### TC-11: No stale gsd/ directory in dist-test
```bash
ls dist-test/src/resources/extensions/gsd 2>/dev/null && echo "FAIL: stale dir exists" || echo "PASS: no stale dir"
```
**Expected:** `PASS: no stale dir`

### TC-12: RTK tests pass with HX_RTK_DISABLED=1 set
```bash
HX_RTK_DISABLED=1 node --import ./scripts/dist-test-resolve.mjs --test dist-test/src/tests/rtk-session-stats.test.js dist-test/src/tests/rtk.test.js 2>&1 | grep "pass\|fail"
```
**Expected:** all tests pass, 0 failures.

