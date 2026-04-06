---
estimated_steps: 88
estimated_files: 15
skills_used: []
---

# T03: ask-user-questions free-text, MCP name spaces, OAuth shape, npm staleness, Discord links, extension paths

## Why
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

## Inputs

- ``src/resources/extensions/ask-user-questions.ts``
- ``src/resources/extensions/shared/interview-ui.ts``
- ``src/resources/extensions/mcp-client/index.ts``
- ``src/resources/extensions/google-search/index.ts``
- ``scripts/ensure-workspace-builds.cjs``
- ``src/tests/ensure-workspace-builds.test.ts``
- ``docs/what-is-pi/15-pi-packages-the-ecosystem.md``
- ``src/resources/skills/create-hx-extension/SKILL.md``
- ``package.json``
- ``tsconfig.test.json``

## Expected Output

- ``src/resources/extensions/ask-user-questions.ts` — free-text follow-up when None of the above selected`
- ``src/resources/extensions/shared/interview-ui.ts` — updated description + auto-open notes block`
- ``src/resources/extensions/shared/tests/ask-user-freetext.test.ts` — new unit test`
- ``src/resources/extensions/mcp-client/index.ts` — trim + case-insensitive getServerConfig; reordered getOrConnect`
- ``src/resources/extensions/mcp-client/tests/server-name-spaces.test.ts` — new structural test`
- ``src/resources/extensions/google-search/index.ts` — ?alt=sse URL + userAgent in body`
- ``src/tests/google-search-oauth-shape.test.ts` — new test asserting oauth shape`
- ``scripts/ensure-workspace-builds.cjs` — detectStalePackages() with .git guard; exported`
- ``src/tests/ensure-workspace-builds.test.ts` — extended with detectStalePackages suite`
- ``docs/what-is-pi/15-pi-packages-the-ecosystem.md` — discord.gg/hx canonical link`
- ``src/resources/extensions/hx/tests/discord-invite-links.test.ts` — new link check test`
- ``src/resources/skills/create-hx-extension/SKILL.md` — bundled vs user path clarification note`
- ``src/tests/create-hx-extension-paths.test.ts` — new structural test for extension paths`
- ``package.json` — mcp-client/tests glob added to test:unit`
- ``tsconfig.test.json` — google-search-oauth-shape and ensure-workspace-builds tests added to include`

## Verification

npx tsc --noEmit && node scripts/compile-tests.mjs && npm run test:unit
