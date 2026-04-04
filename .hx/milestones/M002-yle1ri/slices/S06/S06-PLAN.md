# S06: Remaining Fixes (tools, windows, user-interaction, misc)

**Goal:** Port 9 remaining upstream v2.59.0 bugfix commits: read-tool offset clamping, Windows shell/windowsHide guards, ask-user-questions free-text, MCP server name spaces, OAuth google_search shape, npm tarball staleness, Discord links, and community extension path docs. All 95 upstream fixes accounted for after this slice.
**Demo:** After this: After this: read-tool offset clamping, Windows shell guards, ask-user-questions free-text, MCP server name handling, OAuth google_search shape, and miscellaneous fixes are applied. typecheck + tests pass. All 95 upstream fixes accounted for.

## Tasks
- [x] **T01: Ported read-tool offset clamping (throw→clamp+prefix) and Windows shell guard (shell: process.platform==="win32") across 5 source files with 8 new passing tests** — ## Why
Two clusters of fixes targeting packages/pi-coding-agent:
1. **read-tool offset clamping** (upstream 96ff71870): both `read.ts` and `hashline-read.ts` currently throw when offset > file length. Replace the throw with clamping: clamp startLine to last line, emit a `[Offset N beyond end of file…]` prefix on the output.
2. **Windows shell guard** (upstream 9d78e9e1e): three spawn sites use `shell: false` (exec.ts) or omit the `shell` option (lsp/index.ts, lsp/lspmux.ts). Fix: `shell: process.platform === 'win32'`.

## Files
- `packages/pi-coding-agent/src/core/tools/read.ts` — clamp logic
- `packages/pi-coding-agent/src/core/tools/hashline-read.ts` — identical clamp logic
- `packages/pi-coding-agent/src/core/exec.ts` — line 42: `shell: false` → `shell: process.platform === 'win32'`
- `packages/pi-coding-agent/src/core/lsp/index.ts` — spawn at line ~340: add `shell: process.platform === 'win32'`
- `packages/pi-coding-agent/src/core/lsp/lspmux.ts` — spawn at line ~91: add `shell: process.platform === 'win32'`
- `src/tests/read-tool-offset-clamp.test.ts` (new) — unit tests for clamping behaviour
- `packages/pi-coding-agent/src/core/tools/spawn-shell-windows.test.ts` (new) — structural test reading source files

## Steps
1. In `read.ts`: change `const startLine` → `let startLine`; after the `Math.max(0, offset - 1)` assignment, add:
   ```ts
   let offsetClamped = false;
   if (startLine >= allLines.length) {
     startLine = Math.max(0, allLines.length - 1);
     offsetClamped = true;
   }
   ```
   Move `const startLineDisplay = startLine + 1` to after the clamping block. At output time, prepend `[Offset ${offset} beyond end of file (${totalFileLines} lines). Clamped to line ${startLineDisplay}.]

` when `offsetClamped` is true.
2. Apply the identical change to `hashline-read.ts`.
3. In `exec.ts` line 42: `shell: false` → `shell: process.platform === "win32"`.
4. In `lsp/index.ts` spawn options (line ~340-343): add `shell: process.platform === "win32"` to the options object.
5. In `lsp/lspmux.ts` spawn options (line ~91-93): add `shell: process.platform === "win32"`.
6. Write `src/tests/read-tool-offset-clamp.test.ts` — import `createReadTool` from the compiled read.ts path. Test: (a) normal offset works, (b) offset = exact file length clamps to last line with prefix, (c) offset far beyond EOF clamps with prefix, (d) clamped output still contains last-line content.
7. Write `packages/pi-coding-agent/src/core/tools/spawn-shell-windows.test.ts` — reads exec.ts, lsp/index.ts, lsp/lspmux.ts source and asserts each contains `process.platform === "win32"` as the shell guard. Also checks no unconditional `shell: false` at the guarded sites. Adapt upstream: vscode-extension path is `hx-client.ts` not `gsd-client.ts`; use hx-client.ts in the array if referenced.
8. Run `npx tsc --noEmit` (from repo root) and verify read-tool test: `node scripts/compile-tests.mjs && node --test dist-test/src/tests/read-tool-offset-clamp.test.js`.
  - Estimate: 45m
  - Files: packages/pi-coding-agent/src/core/tools/read.ts, packages/pi-coding-agent/src/core/tools/hashline-read.ts, packages/pi-coding-agent/src/core/exec.ts, packages/pi-coding-agent/src/core/lsp/index.ts, packages/pi-coding-agent/src/core/lsp/lspmux.ts, src/tests/read-tool-offset-clamp.test.ts, packages/pi-coding-agent/src/core/tools/spawn-shell-windows.test.ts
  - Verify: npx tsc --noEmit && node scripts/compile-tests.mjs && node --test dist-test/src/tests/read-tool-offset-clamp.test.js
- [x] **T02: Added windowsHide: true to all 20 execFile/spawn call sites across web-mode.ts and 14 web service files, with updated integration test expectation and new 5-assertion structural test** — ## Why
Upstream commit 7c00f53ef adds `windowsHide: true` to every `execFile`/`spawn` call in web-mode and web service files. On Windows, omitting this option causes a console window to flash open for each subprocess — a UX regression. This is a mechanical addition of one option to existing options objects.

## Files
- `src/web-mode.ts` (2 spots)
- `src/web/auto-dashboard-service.ts` (1 execFile)
- `src/web/bridge-service.ts` (3 execFile + 1 spawn)
- `src/web/captures-service.ts` (2 execFile)
- `src/web/cleanup-service.ts` (2 execFile)
- `src/web/doctor-service.ts` (1 execFile)
- `src/web/export-service.ts` (1 execFile)
- `src/web/forensics-service.ts` (1 execFile)
- `src/web/history-service.ts` (1 execFile)
- `src/web/hooks-service.ts` (1 execFile)
- `src/web/recovery-diagnostics-service.ts` (1 execFile)
- `src/web/settings-service.ts` (1 execFile)
- `src/web/skill-health-service.ts` (1 execFile)
- `src/web/undo-service.ts` (1 execFile at line ~182)
- `src/web/visualizer-service.ts` (1 execFile)
- `src/tests/integration/web-mode-cli.test.ts` — add `windowsHide: true` to expected spawnInvocation options at line ~166
- `src/tests/integration/web-mode-windows-hide.test.ts` (new) — structural test verifying all web-mode files have windowsHide

## Steps
1. **web-mode.ts spot 1** (openBrowser on Windows, line ~17): `execFile('powershell', [...], () => {})` → `execFile('powershell', [...], { windowsHide: true }, () => {})`.
2. **web-mode.ts spot 2** (launchWebMode spawn options, line ~636-641): add `windowsHide: true` after `stdio: 'ignore'` in the options object.
3. For each web service file with `execFile`, add `windowsHide: true` after the existing `maxBuffer: ...` option inside the options object. Use Read to find the exact line for each file before editing.
4. For `bridge-service.ts` spawn (line ~1610): the `spawnChild` call passes options through `this.deps.spawn`; find the actual `spawn()` call site in the spawn options and add `windowsHide: true`.
5. Update `src/tests/integration/web-mode-cli.test.ts`: find the `assert.deepEqual(spawnInvocation, ...)` block (around line 160-175) and add `windowsHide: true` to the options sub-object.
6. Write `src/tests/integration/web-mode-windows-hide.test.ts` — adapted from upstream:
   - Use `hx-web-winhide-` as tmpdir prefix (not `gsd-web-winhide-`)
   - Use `.hx/sessions` (not `.gsd/sessions`)
   - Check that `web-mode.ts` and a sample of web service files contain `windowsHide: true` in their execFile/spawn calls
   - Keep the test structure static/structural (reads source, no subprocess)
7. Run `npx tsc --noEmit` to verify no type errors.
  - Estimate: 60m
  - Files: src/web-mode.ts, src/web/auto-dashboard-service.ts, src/web/bridge-service.ts, src/web/captures-service.ts, src/web/cleanup-service.ts, src/web/doctor-service.ts, src/web/export-service.ts, src/web/forensics-service.ts, src/web/history-service.ts, src/web/hooks-service.ts, src/web/recovery-diagnostics-service.ts, src/web/settings-service.ts, src/web/skill-health-service.ts, src/web/undo-service.ts, src/web/visualizer-service.ts, src/tests/integration/web-mode-cli.test.ts, src/tests/integration/web-mode-windows-hide.test.ts
  - Verify: npx tsc --noEmit
- [x] **T03: Ported 6 upstream bugfix commits: ask-user-questions free-text follow-up, MCP server name normalization, OAuth google_search ?alt=sse+userAgent, detectStalePackages .git guard, Discord link canonicalization, and create-hx-extension path clarification — with 8 new test files; 4101 pass, 10 pre-existing failures** — ## Why
Six isolated bugfix commits, each touching 1-3 files with no dependencies between them. Bundled as one task because they share verification (typecheck + test:unit) and all fit comfortably within one context window.

## Fixes

### Fix A: ask-user-questions free-text (b80eec619)
When the user selects "None of the above" in a single-select question, prompt for free-text follow-up.

**`src/resources/extensions/ask-user-questions.ts`** — after the `if (selected === undefined) return errorResult(...)` check, replace the simple `answers[q.id] = { answers: ... }` assignment with:
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

**`src/resources/extensions/shared/interview-ui.ts`** — two changes:
1. `OTHER_OPTION_DESCRIPTION` (line ~108): `"Press TAB to add optional notes."` → `"Select to type your own answer."`
2. After `states[currentIdx].committedIndex = states[currentIdx].cursorIndex;` (line ~295), add auto-open notes block:
```typescript
if (!isMultiSelect(currentIdx) && states[currentIdx].cursorIndex === noneOrDoneIdx(currentIdx)) {
  states[currentIdx].notesVisible = true;
  focusNotes = true;
  loadStateToEditor();
  refresh();
  return;
}
```

**New test `src/resources/extensions/shared/tests/ask-user-freetext.test.ts`** — mock ctx.ui.select (returns OTHER_OPTION_LABEL) and ctx.ui.input (returns a note string). Assert the round result contains `user_note:` in the answers. Also assert multi-select path does NOT call ctx.ui.input.

### Fix B: MCP server name trim + case-insensitive (098970801)
**`src/resources/extensions/mcp-client/index.ts`**:
- `getServerConfig(name)`: trim + case-insensitive lookup:
  ```typescript
  function getServerConfig(name: string): McpServerConfig | undefined {
    const trimmed = name.trim();
    return readConfigs().find((s) =>
      s.name === trimmed ||
      s.name.toLowerCase() === trimmed.toLowerCase(),
    );
  }
  ```
- `getOrConnect(name)`: reorder so `getServerConfig` runs before `connections.get` check; use `config.name` as canonical cache key; in the URL.replace lambda, rename `(_, name)` → `(_, varName)` to avoid shadowing the `name` param; use `config.name` in error messages and `connections.set`.

**New test dir + file: `src/resources/extensions/mcp-client/tests/server-name-spaces.test.ts`** — reads source of mcp-client/index.ts and asserts `.trim()` and `.toLowerCase()` appear in getServerConfig. No I/O required.

**`package.json`** — add `'dist-test/src/resources/extensions/mcp-client/tests/*.test.js'` to the `test:unit` script glob list.

### Fix C: OAuth google_search shape (8d32ca935)
**`src/resources/extensions/google-search/index.ts`** line ~82:
- URL: `streamGenerateContent` → `streamGenerateContent?alt=sse`
- In the body JSON object (after `tools: [{ googleSearch: {} }]`), add `userAgent: "pi-coding-agent"`

**New test `src/tests/google-search-oauth-shape.test.ts`** — reads source of google-search/index.ts and asserts it contains `?alt=sse` and `userAgent`. Keep as `.ts` extension (not `.js`) — compile-tests.mjs handles compilation.

**`tsconfig.test.json`** — add `"src/tests/google-search-oauth-shape.test.ts"` to the include array.

### Fix D: npm tarball staleness behind .git guard (01fbf7e25)
**`scripts/ensure-workspace-builds.cjs`**:
1. Extract the stale-detection loop into a `detectStalePackages(root, packages)` function that first checks `existsSync(join(root, '.git'))` and returns `[]` if not in a git repo.
2. Replace the inline loop in the main `if (require.main === module)` block with `const stale = detectStalePackages(root, WORKSPACE_PACKAGES)`.
3. Add `detectStalePackages` to `module.exports`.

**`src/tests/ensure-workspace-builds.test.ts`** — add import of `detectStalePackages` alongside existing `newestSrcMtime`. Add a new `describe("detectStalePackages", ...)` suite:
- returns [] when no .git directory exists
- returns stale packages when dist/ is missing
- returns [] when all dists are up to date
- uses a temp dir without .git to verify the guard

**`tsconfig.test.json`** — add `"src/tests/ensure-workspace-builds.test.ts"` to the include array.

### Fix E: Discord invite link canonicalization (0fda00b6c)
**`docs/what-is-pi/15-pi-packages-the-ecosystem.md`** line ~41: `https://discord.com/invite/3cU7Bz4UPx` → `https://discord.gg/hx` (consistent with README badge which already uses discord.gg/hx).

**New test `src/resources/extensions/hx/tests/discord-invite-links.test.ts`**:
- Define `VALID_INVITE = "https://discord.gg/hx"` (hx-ai canonical URL, NOT GSD's nKXTsAcmbT code)
- Read `README.md` and `docs/what-is-pi/15-pi-packages-the-ecosystem.md`
- Assert both files contain only `https://discord.gg/hx` (or no discord links in docs file after update)
- Assert neither file contains `discord.com/invite/3cU7Bz4UPx` or any other invite code

### Fix F: Community extension install path clarification (f7606c28d)
**`src/resources/skills/create-hx-extension/SKILL.md`** — add a clarifying note (after the existing global/project-local extension path lines ~11-12):
```
> **Note:** `~/.hx/agent/extensions/hx/` is the bundled HX system extension — do not install community extensions there. Place user extensions at `~/.hx/agent/extensions/my-ext.ts` or `~/.hx/agent/extensions/my-ext/index.ts`. Project-local extensions go in `.hx/extensions/`.
```

**New test `src/tests/create-hx-extension-paths.test.ts`** — reads SKILL.md and workflow files in create-hx-extension/. Asserts:
- No file instructs placing extensions in `~/.hx/agent/extensions/hx/` as a user install target
- Files reference `~/.hx/agent/extensions/` (user scope) and `.hx/extensions/` (project scope)
- No stale `~/.gsd/` paths present

## Verification
```bash
npx tsc --noEmit
node scripts/compile-tests.mjs
npm run test:unit
```
Expected: all pass; new tests are included in test:unit coverage.
  - Estimate: 90m
  - Files: src/resources/extensions/ask-user-questions.ts, src/resources/extensions/shared/interview-ui.ts, src/resources/extensions/shared/tests/ask-user-freetext.test.ts, src/resources/extensions/mcp-client/index.ts, src/resources/extensions/mcp-client/tests/server-name-spaces.test.ts, src/resources/extensions/google-search/index.ts, src/tests/google-search-oauth-shape.test.ts, scripts/ensure-workspace-builds.cjs, src/tests/ensure-workspace-builds.test.ts, docs/what-is-pi/15-pi-packages-the-ecosystem.md, src/resources/extensions/hx/tests/discord-invite-links.test.ts, src/resources/skills/create-hx-extension/SKILL.md, src/tests/create-hx-extension-paths.test.ts, package.json, tsconfig.test.json
  - Verify: npx tsc --noEmit && node scripts/compile-tests.mjs && npm run test:unit
