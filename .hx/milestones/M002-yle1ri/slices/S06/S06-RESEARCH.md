# S06 Research: Remaining Fixes (tools, windows, user-interaction, misc)

**Researched:** 2026-04-04
**Complexity:** Light-to-targeted — all work applies known patterns to known files. No novel architecture.

---

## Summary

S06 ports 9 upstream bugfix commits (counted by distinct commits; commit 7c00f53ef spans 18 files). All fixes are mechanical: clamp offsets, add spawn options, follow up with free-text input, fix function logic, update docs. The largest fix (windowsHide) touches 16+ files but each edit is identical (`windowsHide: true`). No new APIs, no risky integration points.

---

## Requirement Coverage

- **R013** — This slice owns all remaining fixes: read-tool offset, Windows shell/windowsHide guards, ask-user-questions free-text, MCP name spaces, OAuth shape, Discord links, community extension paths, npm tarball staleness.
- **R001** — Accounts for the final 9 commits, completing the 95-commit inventory.
- **R002** — All upstream `gsd`/`GSD`/`.gsd` references in ported test files must be adapted to `hx`/`HX`/`.hx`.
- **R014** — typecheck + test suite must pass after all fixes.

---

## Upstream Commits in Scope

| Commit | Fix | Files Changed |
|--------|-----|---------------|
| 96ff71870 | read-tool offset clamping (throw→clamp) | `read.ts`, `hashline-read.ts`, new test |
| 9d78e9e1e | Windows shell guard on 3 spawn sites | `exec.ts`, `lsp/index.ts`, `lsp/lspmux.ts`, new test |
| 7c00f53ef | windowsHide: true on all web-mode spawns | `web-mode.ts` + 14 web services + existing integration test + new integration test |
| b80eec619 | ask-user-questions free-text on None-of-above | `ask-user-questions.ts`, `shared/interview-ui.ts`, new test |
| 098970801 | MCP server name trim + case-insensitive matching | `mcp-client/index.ts`, new test dir + file, package.json |
| 8d32ca935 | OAuth google_search: ?alt=sse + userAgent | `google-search/index.ts`, new test, tsconfig.test.json |
| 01fbf7e25 | npm tarball staleness: .git-gated staleness check | `scripts/ensure-workspace-builds.cjs`, extend test, tsconfig.test.json |
| 0fda00b6c | Discord invite link canonicalization | README.md, docs markdown, new test |
| f7606c28d | Community extension install path documentation | skill SKILL.md, references, workflows, new test |

---

## Implementation Landscape

### Fix 1: read-tool offset clamping (96ff71870)
**Files:** `packages/pi-coding-agent/src/core/tools/read.ts`, `hashline-read.ts`

**Current state:** Both files throw `Error('Offset X is beyond end of file (Y lines total)')` when `startLine >= allLines.length`.

**Change:** Replace the throw with:
```typescript
let startLine = offset ? Math.max(0, offset - 1) : 0;
let offsetClamped = false;
if (startLine >= allLines.length) {
  startLine = Math.max(0, allLines.length - 1);
  offsetClamped = true;
}
const startLineDisplay = startLine + 1;
// ... at output time:
if (offsetClamped) {
  outputText = `[Offset ${offset} beyond end of file (${totalFileLines} lines). Clamped to line ${startLineDisplay}.]\n\n${outputText}`;
}
```
Note: `const startLine` → `let startLine`, move `startLineDisplay` assignment after clamping.

**New test:** `src/tests/read-tool-offset-clamp.test.ts` — imports `createReadTool` from `../../packages/pi-coding-agent/src/core/tools/read.ts`. Goes in `src/tests/`, compiled by compile-tests.mjs, run by `test:unit`. No naming adaptation needed.

---

### Fix 2: Windows shell guard (9d78e9e1e)
**Files:**
- `packages/pi-coding-agent/src/core/exec.ts`: line 42 `shell: false` → `shell: process.platform === "win32"`
- `packages/pi-coding-agent/src/core/lsp/index.ts`: line 340-343, spawn options missing `shell` → add `shell: process.platform === "win32"`
- `packages/pi-coding-agent/src/core/lsp/lspmux.ts`: line ~91, spawn options missing `shell` → add `shell: process.platform === "win32"`

**New test:** `packages/pi-coding-agent/src/core/tools/spawn-shell-windows.test.ts`

**CRITICAL ADAPTATION:** The test hardcodes `SPAWN_FILES_NEEDING_SHELL_GUARD` array including:
```typescript
join(coreDir, "..", "..", "..", "vscode-extension", "src", "gsd-client.ts")
```
In hx-ai this file is `vscode-extension/src/hx-client.ts`. Must change to `hx-client.ts`.

**Test run path:** This test compiles to `packages/pi-coding-agent/dist/core/tools/spawn-shell-windows.test.js` but `test:packages` only covers `packages/pi-coding-agent/dist/core/*.test.js`. The existing `bash-spawn-windows.test.ts` has the same issue — it's compiled but not in the standard test:unit or test:packages glob. 

**Resolution:** The test is still compiled by compile-tests.mjs (packages/*/src/ is included) and ends up in `dist-test/packages/pi-coding-agent/src/core/tools/`. To include it in test:unit we would need to extend the glob. However, looking at the existing `bash-spawn-windows.test.ts` which has the same situation — it's already in that directory and presumably runs via `test:packages` if we expand the glob. But currently `test:packages = node --test packages/pi-coding-agent/dist/core/*.test.js` (no subdirs). Options: (a) add a separate glob for tools tests, or (b) just let compile-tests.mjs compile it and rely on tsc for structural checking. Given the pattern already established by `bash-spawn-windows.test.ts`, we follow the same path — write the test to `packages/pi-coding-agent/src/core/tools/`. The test is structurally important (prevents regression) even if not in primary test:unit run.

---

### Fix 3: windowsHide for web-mode spawns (7c00f53ef)
**Files:** 18 changes across 17 files.

**web-mode.ts changes (2 spots):**
1. `execFile('powershell', [...], () => {})` → `execFile('powershell', [...], { windowsHide: true }, () => {})`
2. `launchWebMode` spawn options: add `windowsHide: true` after `stdio: 'ignore'`

**14 web service changes** — each has a `maxBuffer: ...` in execFile options; add `windowsHide: true` as new option after `maxBuffer`:
- `src/web/auto-dashboard-service.ts` (~line 155)
- `src/web/bridge-service.ts` (3 spots: ~line 774, 836, 1033, plus spawn ~line 1627)
- `src/web/captures-service.ts` (~lines 66, 138)
- `src/web/cleanup-service.ts` (~lines 80, 173)
- `src/web/doctor-service.ts` (~line 43)
- `src/web/export-service.ts` (~line 76)
- `src/web/forensics-service.ts` (~line 96)
- `src/web/history-service.ts` (~line 68)
- `src/web/hooks-service.ts` (~line 68)
- `src/web/recovery-diagnostics-service.ts` (~line 493)
- `src/web/settings-service.ts` (~line 144)
- `src/web/skill-health-service.ts` (~line 63)
- `src/web/undo-service.ts` (~line 197)
- `src/web/update-service.ts` (~line 73)
- `src/web/visualizer-service.ts` (~line 100)

**Test changes:**
- `src/tests/integration/web-mode-cli.test.ts`: add `windowsHide: true` in existing spawn options object (~line 164)
- `src/tests/integration/web-mode-windows-hide.test.ts` (new): **Adapt** `gsd-web-winhide-` temp prefixes → `hx-web-winhide-`, `.gsd/sessions` → `.hx/sessions`, `.gsd/agent` → `.hx/agent`

No naming adaptation needed for the web service files themselves (no GSD refs present).

---

### Fix 4: ask-user-questions free-text (b80eec619)
**Files:**
- `src/resources/extensions/ask-user-questions.ts` (~line 162): replace simple answer assignment with free-text follow-up logic
- `src/resources/extensions/shared/interview-ui.ts` (~line 108): update description string + add auto-open notes block

**ask-user-questions.ts change** (after `if (selected === undefined) return errorResult(...)`):
```typescript
let freeTextNote = "";
const selectedStr = Array.isArray(selected) ? selected[0] : selected;
if (!q.allowMultiple && selectedStr === OTHER_OPTION_LABEL) {
  const note = await ctx.ui.input(
    `${q.header}: Please explain in your own words`,
    "Type your answer here…",
  );
  if (note) { freeTextNote = note; }
}
const answerList = Array.isArray(selected) ? selected : [selected];
if (freeTextNote) { answerList.push(`user_note: ${freeTextNote}`); }
answers[q.id] = { answers: answerList };
```

**interview-ui.ts changes:**
1. `OTHER_OPTION_DESCRIPTION` string: `"Press TAB to add optional notes."` → `"Select to type your own answer."`
2. After `states[currentIdx].committedIndex = states[currentIdx].cursorIndex;` block, add auto-open notes:
```typescript
if (!isMultiSelect(currentIdx) && states[currentIdx].cursorIndex === noneOrDoneIdx(currentIdx)) {
  states[currentIdx].notesVisible = true;
  focusNotes = true;
  loadStateToEditor();
  refresh();
  return;
}
```

**New test:** `src/resources/extensions/shared/tests/ask-user-freetext.test.ts`
- Goes in `src/resources/extensions/shared/tests/` → picked up by test:unit glob already
- Imports `AskUserQuestions` from `../../ask-user-questions.js` (compiled path)
- No naming adaptation needed (no gsd references)

---

### Fix 5: MCP server name spaces (098970801)
**File:** `src/resources/extensions/mcp-client/index.ts`

**getServerConfig change** (~line 113):
```typescript
function getServerConfig(name: string): McpServerConfig | undefined {
  const trimmed = name.trim();
  return readConfigs().find((s) =>
    s.name === trimmed ||
    s.name.toLowerCase() === trimmed.toLowerCase(),
  );
}
```

**getOrConnect change** (~line 134):
1. Move `getServerConfig` call before `connections.get` check
2. Use `config.name` as canonical cache key
3. Fix `(_, name)` shadowing → `(_, varName)` in URL.replace
4. Use `config.name` in error messages and `connections.set`

**New test directory:** `src/resources/extensions/mcp-client/tests/server-name-spaces.test.ts`
- No gsd refs in test itself (reads source file to check `.trim()` and `.toLowerCase()`)

**package.json change:** Add `'dist-test/src/resources/extensions/mcp-client/tests/*.test.js'` to `test:unit` script.

---

### Fix 6: OAuth google_search shape (8d32ca935)
**File:** `src/resources/extensions/google-search/index.ts` (~line 82):
```typescript
// Before:
const url = `https://cloudcode-pa.googleapis.com/v1internal:streamGenerateContent`;
// After:
const url = `https://cloudcode-pa.googleapis.com/v1internal:streamGenerateContent?alt=sse`;
// Also add in body object (after existing `tools: [{ googleSearch: {} }]`):
userAgent: "pi-coding-agent",
```

**New test:** `src/tests/google-search-oauth-shape.test.ts`
- Import as `index.js` (compiled) — `src/tests/google-search-auth.repro.test.ts` uses `.ts` extension (correct for hx-ai compile-tests.mjs flow), so new test should also use `.ts` extension (NOT `.js` as in upstream)
- Minimal adaptation: references to `gsd-web-winhide` patterns (none; test is pure logic)

**tsconfig.test.json change:** Add `src/tests/google-search-oauth-shape.test.ts` to include array.

**Note on google-search-auth.repro.test.ts:** Upstream changes extension from `.ts` → `.js`. In hx-ai compile-tests.mjs flow, the test already works with `.ts` extension. Do NOT change the extension.

---

### Fix 7: npm tarball staleness fix (01fbf7e25)
**File:** `scripts/ensure-workspace-builds.cjs`
- Add `detectStalePackages(root, packages)` function that gates staleness check behind `existsSync(join(root, '.git'))`
- Replace inline stale-detection loop with `const stale = detectStalePackages(root, WORKSPACE_PACKAGES)`
- Update `module.exports` to include `detectStalePackages`

**File:** `src/tests/ensure-workspace-builds.test.ts`
- Already exists with `newestSrcMtime` tests
- Add import of `detectStalePackages` alongside `newestSrcMtime`
- Add new `describe("detectStalePackages", ...)` test suite
- No naming adaptation needed

**tsconfig.test.json change:** Add `src/tests/ensure-workspace-builds.test.ts` to include array.

---

### Fix 8: Discord invite links (0fda00b6c)
**Context:** In hx-ai:
- `README.md` uses `https://discord.gg/hx` (hx-ai's own vanity URL, established during M001 rebranding)
- `docs/what-is-pi/15-pi-packages-the-ecosystem.md` uses `https://discord.com/invite/3cU7Bz4UPx` (old GSD invite code, not changed in M001)

**Action:** Update the docs file to use `https://discord.gg/hx` (consistent with README). Do NOT use the upstream's `nKXTsAcmbT` code which is GSD's invite.

**New test:** `src/resources/extensions/hx/tests/discord-invite-links.test.ts`
- Adapt from upstream's `src/resources/extensions/gsd/tests/discord-invite-links.test.ts`
- Change `VALID_INVITE` to `"https://discord.gg/hx"` (hx-ai canonical URL)
- Check same two files: `README.md` and `docs/what-is-pi/15-pi-packages-the-ecosystem.md`
- Note: README has badge link `(https://discord.gg/hx)` — test regex must find it

**⚠️ Adaptation Note:** The test must use hx-ai's canonical invite URL, not GSD's. The regex `https?:\/\/(?:discord\.gg|discord\.com\/invite)\/[A-Za-z0-9]+` will match both formats.

---

### Fix 9: Community extension install paths (f7606c28d)
**Files:** `src/resources/skills/create-hx-extension/` (not `create-gsd-extension`)

**Current state:** `SKILL.md` already documents `~/.hx/agent/extensions/` correctly.

**Upstream fix essence:** Upstream changed `~/.gsd/agent/extensions/` → `~/.pi/agent/extensions/` because the former was reserved for bundled extensions. In hx-ai the analogy is: `~/.hx/agent/extensions/hx/` is the bundled HX extension, user community extensions live at `~/.hx/agent/extensions/my-ext.ts`. There's no separate "wrong" path confusion currently.

**Action:** Add a clarifying note to SKILL.md and key-rules-gotchas.md explaining the distinction between the bundled HX extension path (`~/.hx/agent/extensions/hx/`) and where user community extensions should be installed. Also add note about project-local `.hx/extensions/` as alternative. Update `workflows/add-capability.md` and `workflows/create-extension.md` if they have ambiguous paths.

**New test:** `src/tests/create-hx-extension-paths.test.ts`
- Adapt from upstream's `create-gsd-extension-paths.test.ts`
- Check `create-hx-extension` skill files reference `~/.hx/agent/extensions/` (not any old `~/.gsd/` paths)
- Verify no files instruct users to place extensions in `~/.hx/agent/extensions/hx/` (bundled-only directory)

---

## Test Infrastructure Notes

### test:unit coverage
Currently covers:
- `dist-test/src/tests/*.test.js`
- `dist-test/src/resources/extensions/hx/tests/*.test.js`
- `dist-test/src/resources/extensions/shared/tests/*.test.js`

New tests that ARE covered automatically:
- `src/tests/read-tool-offset-clamp.test.ts` ✅ (src/tests/)
- `src/tests/google-search-oauth-shape.test.ts` ✅ (src/tests/)
- `src/tests/ensure-workspace-builds.test.ts` ✅ (already exists + extended)
- `src/tests/discord-invite-links.test.ts` → goes in `src/resources/extensions/hx/tests/` ✅
- `src/tests/create-hx-extension-paths.test.ts` ✅ (src/tests/)
- `src/resources/extensions/shared/tests/ask-user-freetext.test.ts` ✅ (shared/tests/)

New tests that need package.json update:
- `src/resources/extensions/mcp-client/tests/server-name-spaces.test.ts` → add `'dist-test/src/resources/extensions/mcp-client/tests/*.test.js'` to test:unit

New tests NOT in test:unit (packages pattern):
- `packages/pi-coding-agent/src/core/tools/spawn-shell-windows.test.ts` → compiled by package tsc to `dist/core/tools/` but `test:packages` only covers `dist/core/*.test.js`. Test is structural (reads source files), very fast. Follow the existing `bash-spawn-windows.test.ts` pattern.

### tsconfig.test.json
Add to include: `src/tests/google-search-oauth-shape.test.ts`, `src/tests/ensure-workspace-builds.test.ts`

### integration tests
- `src/tests/integration/web-mode-windows-hide.test.ts` → runs via `test:integration` which covers `src/tests/integration/*.test.ts` ✅

---

## GSD→HX Naming Adaptation Map

| Upstream reference | hx-ai adaptation |
|---|---|
| `gsd-client.ts` (vscode-extension) | `hx-client.ts` |
| `.gsd/sessions/` in test fixtures | `.hx/sessions/` |
| `.gsd/agent/` in test fixtures | `.hx/agent/` |
| `gsd-web-winhide-` tmpdir prefix | `hx-web-winhide-` |
| `discord.gg/gsd` | `discord.gg/hx` |
| `discord.com/invite/3cU7Bz4UPx` | `discord.gg/hx` |
| `nKXTsAcmbT` (GSD invite) | do NOT use |
| `create-gsd-extension` skill | `create-hx-extension` skill |
| `~/.pi/agent/extensions/` (upstream new) | `~/.hx/agent/extensions/` (already correct in hx-ai) |
| `gsd-build/gsd-2#2699` issue ref | update to hx-build/hx-2 if referenced in comments |

---

## Recommended Task Decomposition

**T01: read-tool offset clamping** (96ff71870)
- Files: `packages/pi-coding-agent/src/core/tools/read.ts`, `hashline-read.ts`, new test `src/tests/read-tool-offset-clamp.test.ts`
- Risk: low, isolated
- Verify: `node scripts/compile-tests.mjs && node --test dist-test/src/tests/read-tool-offset-clamp.test.js`

**T02: Windows shell guard + spawn-shell-windows test** (9d78e9e1e)
- Files: `exec.ts`, `lsp/index.ts`, `lsp/lspmux.ts` + new test in tools/ (adapt gsd-client → hx-client)
- Risk: low
- Verify: `npx tsc --noEmit`, then rebuild packages and run `node --test packages/pi-coding-agent/dist/core/tools/spawn-shell-windows.test.js`

**T03: windowsHide for web-mode spawns** (7c00f53ef)
- Files: `web-mode.ts` + 14 web services + integration tests (adapt .gsd/ → .hx/ in new integration test)
- Risk: low — mechanical add of `windowsHide: true` option
- Verify: `npx tsc --noEmit`, test:integration run

**T04: ask-user-questions free-text** (b80eec619)
- Files: `ask-user-questions.ts`, `shared/interview-ui.ts` + new shared test
- Risk: low-medium — behavior change, must not break multi-select flow
- Verify: compile-tests + `node --test dist-test/src/resources/extensions/shared/tests/ask-user-freetext.test.js`

**T05: MCP + OAuth + npm tarball + Discord + extension paths** (5 commits bundled)
- Files: `mcp-client/index.ts` + new test dir, `google-search/index.ts` + new test, `ensure-workspace-builds.cjs` + test extension, `README.md` + docs + discord test, `create-hx-extension` skill + test, `package.json`, `tsconfig.test.json`
- Risk: low — all isolated fixes
- Verify: `npx tsc --noEmit`, full `npm run test:unit`

---

## Verification Commands

After all tasks:
```bash
npx tsc --noEmit                      # typecheck
npm run test:compile                  # compile test suite
npm run test:unit                     # full unit test suite (includes all new tests)
npm run test:integration              # integration tests (web-mode-windows-hide)
# Rebuild packages for spawn-shell-windows test:
npm run build -w @hyperlab/pi-coding-agent
node --test packages/pi-coding-agent/dist/core/tools/spawn-shell-windows.test.js
```

Expected: all pass, no new failures.
