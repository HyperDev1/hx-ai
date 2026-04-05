# S05 Research: MCP Server Readers + Misc Features

## Summary

S05 is a low-risk porting slice with clearly scoped work across five distinct areas. All upstream source is available in git history, all target locations in hx-ai are identified. No new dependencies. The hardest part is the test placement decision for readers.test.ts (package-scoped vs test:unit-scoped).

**Recommendation:** Execute in task order — (T01) readers module, (T02) server.ts wiring + index.ts exports, (T03) /btw skill, (T04) codebase-generator + commands-codebase + preferences integration, (T05) system-context.ts CODEBASE injection + init-wizard auto-init. Treat codebase-generator.test.ts as a test:unit-scoped test in `src/resources/extensions/hx/tests/`. Place readers.test.ts alongside `packages/mcp-server/src/` with separate build verification (not test:unit).

---

## Implementation Landscape

### Area 1: MCP Server Readers Module

**Source commits:** `206ebf8c9` (feat: add 6 read-only tools for project state queries)

**New files to create** (all under `packages/mcp-server/src/readers/`):
- `paths.ts` — `.hx/` root resolution: `resolveGsdRoot` (→ `resolveHxRoot`), `resolveRootFile`, `milestonesDir`, `findMilestoneIds`, `resolveMilestoneDir`, `resolveMilestoneFile`, `findSliceIds`, `resolveSliceDir`, `resolveSliceFile`, `findTaskFiles`. **Key rename:** all occurrences of `.gsd` string literals become `.hx` (e.g., `existsSync(join(resolved, '.gsd'))` → `.hx`). Function names should be `resolveHxRoot`/`resolveRootFile` etc. (~217 lines in upstream).
- `state.ts` — `readProgress()` function that parses STATE.md and walks filesystem. All `.gsd/` path references → `.hx/`. `ProgressResult` interface stays unchanged. (~223 lines)
- `roadmap.ts` — `readRoadmap()` function parsing ROADMAP.md tables and checkpoint lists. All `.gsd/` → `.hx/`. (~263 lines)
- `metrics.ts` — `readHistory()` function reading `metrics.json`. No `.gsd` refs in this file — clean port. (~118 lines)
- `captures.ts` — `readCaptures()` function parsing CAPTURES.md. No `.gsd` refs — clean port. Includes `stop` and `backtrack` classification types. (~119 lines)
- `knowledge.ts` — `readKnowledge()` function parsing KNOWLEDGE.md. No `.gsd` refs — clean port. (~111 lines)
- `doctor-lite.ts` — `runDoctorLite()` structural health checker. References `/gsd status` in one message string → `/hx status`. All `.gsd` file path refs → `.hx`. (~225 lines)
- `index.ts` — barrel re-export of all 6 readers + types (~16 lines)
- `readers.test.ts` — 33 test cases. All `.gsd/` fixture paths → `.hx/`. Tool names in test strings don't need renaming (they test internal types not tool names). **Placement:** in `packages/mcp-server/src/readers/readers.test.ts` — NOT in `src/resources/extensions/hx/tests/` because it imports from sibling `.ts` files using relative paths specific to the package.

**GSD→HX renames in paths.ts:**
- `'.gsd'` string literal → `'.hx'`
- `'STATE.md'` message string mentioning `/gsd status` → `/hx status`
- Function `resolveGsdRoot` → `resolveHxRoot` (exported name in index.ts changes too)
- Comment headers (copyright blurbs) — update `GSD MCP Server` → `HX MCP Server`

**Doctor-lite message strings:** One message says `"run /gsd status to regenerate"` → `"run /hx status to regenerate"`.

### Area 2: server.ts + index.ts Wiring

**Source commit:** same `206ebf8c9`

**server.ts changes:**
- Add 6 imports at top: `readProgress`, `readRoadmap`, `readHistory`, `readCaptures`, `readKnowledge`, `runDoctorLite` from `./readers/state.js`, `.../roadmap.js`, etc.
- Update doc comment: 6 session tools (already named `hx_*`) + 6 new read-only tools
- Add 6 new `server.tool()` registrations after existing `hx_resolve_blocker`. Tool names in upstream are `gsd_progress`, `gsd_roadmap`, `gsd_history`, `gsd_doctor`, `gsd_captures`, `gsd_knowledge` → rename to `hx_progress`, `hx_roadmap`, `hx_history`, `hx_doctor`, `hx_captures`, `hx_knowledge`.
- Tool descriptions: replace "gsd" in text → "hx" (e.g. "reads directly from .gsd/ on disk" → ".hx/")
- `SERVER_VERSION`: upstream bumps to `2.53.0` — use same version or keep existing `2.51.0` (keeping existing is fine, version is cosmetic)

**index.ts changes:**
- Add reader exports after existing `MAX_EVENTS, INIT_TIMEOUT_MS` exports
- Update doc comment to mention project state readers

### Area 3: /btw Skill

**Source commit:** `7a046098b` (feat: add /btw skill)

**Upstream location:** `src/resources/skills/btw/SKILL.md`
**Target location in hx-ai:** `src/resources/skills/btw/SKILL.md`

The SKILL.md is self-contained — no GSD references. One mention of `Claude Code` in the commit message but not in the file itself. The file content is clean for direct copy. No code changes; it ships via the existing `copy-resources.cjs` pipeline that syncs `src/resources/skills/` to `~/.hx/agent/skills/` at startup.

**Verification:** `ls src/resources/skills/btw/SKILL.md` exists.

### Area 4: /hx codebase Command (commands-codebase.ts + codebase-generator.ts)

This is the largest new subsystem. Three upstream commits cover it:
1. `1b50a9477` — initial codebase map (adds `codebase-generator.ts`, `commands-codebase.ts`, test)
2. `6b0c48945` — harden codebase-map (bug fixes, expanded tests, `--collapse-threshold` not yet)
3. `45a48c4ae` — enhance with preferences, `--collapse-threshold`, auto-init

**Files to create:**
- `src/resources/extensions/hx/codebase-generator.ts` — ~351 lines (post-harden). Imports from `./paths.js` using `hxRoot` (not `gsdRoot`). `CodebaseMapOptions` interface, `parseCodebaseMap`, `generateCodebaseMap`, `updateCodebaseMap`, `writeCodebaseMap`, `readCodebaseMap`, `getCodebaseMapStats`. Default exclude list includes `.gsd/` → `.hx/`.
- `src/resources/extensions/hx/commands-codebase.ts` — ~192 lines (post-enhance). Imports `loadEffectiveHXPreferences` (not `loadEffectiveGSDPreferences`). Usage string references `/hx codebase` (not `/gsd codebase`). `resolveCodebaseOptions` merges `prefs.preferences.codebase` with CLI flags.

**Files to modify:**
- `src/resources/extensions/hx/preferences-types.ts`:
  - Add `"codebase"` to `KNOWN_PREFERENCE_KEYS` Set
  - Add `CodebaseMapPreferences` interface (3 fields: `exclude_patterns`, `max_files`, `collapse_threshold`)
  - Add `codebase?: CodebaseMapPreferences` to `HXPreferences` interface
- `src/resources/extensions/hx/paths.ts`:
  - Add `CODEBASE: "CODEBASE.md"` to `HX_ROOT_FILES` const
  - Add `CODEBASE: "codebase.md"` to `LEGACY_HX_ROOT_FILES`
- `src/resources/extensions/hx/commands/catalog.ts`:
  - Add `codebase` entries to `NESTED_COMPLETIONS` map (generate/update/stats/help + `--collapse-threshold`)
- `src/resources/extensions/hx/commands/handlers/ops.ts`:
  - Add `codebase` handler registration (import `handleCodebase` from `../../commands-codebase.js`, add `if (trimmed === "codebase" || trimmed.startsWith("codebase "))` block)
- `src/resources/extensions/hx/init-wizard.ts`:
  - Import `generateCodebaseMap, writeCodebaseMap` from `./codebase-generator.js`
  - Add try/catch codebase auto-generation block just before the final `ctx.ui.notify("HX initialized...")` call
- `src/resources/extensions/hx/bootstrap/system-context.ts`:
  - Import `readFileSync`, `existsSync` from `node:fs` (may already be imported)
  - Add `resolveHxRootFile(process.cwd(), "CODEBASE")` lookup before constructing `fullSystem`
  - Add `codebaseBlock` variable injected into `fullSystem` between `knowledgeBlock` and `memoryBlock`
  - Cap injection at 8000 chars with staleness notice (from harden commit)
- `src/resources/extensions/hx/commands-bootstrap.ts`:
  - Add `{ cmd: "codebase", desc: "Generate and manage codebase map (.hx/CODEBASE.md)" }` to `TOP_LEVEL_SUBCOMMANDS`

**Test file:**
- `src/resources/extensions/hx/tests/codebase-generator.test.ts` — port from upstream `src/resources/extensions/gsd/tests/codebase-generator.test.ts`. All imports change: `from "../codebase-generator.ts"` (upstream uses `.ts` extension because it ran directly, hx-ai tests run compiled — use `.js` extension or `.ts` which compile-tests rewrites). The `makeTmpRepo` uses `.gsd` dir? No — upstream creates a bare tmp dir with `git init`; the `.gsd` dir is never referenced in the test (only the project root). Total tests: ~29 (14 from initial + 15 from harden commit).

**Codebase-generator GSD→HX renames:**
- Default excludes array: `".gsd/"` → `".hx/"` (do NOT exclude `.gsd/` in the hx version)
- `gsdRoot(basePath)` import → `hxRoot(basePath)` from `./paths.js`
- `writeFileSync(join(gsdRoot(basePath), "CODEBASE.md"))` → uses `hxRoot`
- Comments mentioning `GSD` → `HX`

### Area 5: system-context.ts CODEBASE Injection

Already documented in Area 4 (system-context.ts changes). Specifically from `6b0c48945`:
- Source: `resolveHxRootFile(process.cwd(), "CODEBASE")` (using HX naming)
- Inject between `knowledgeBlock` and `memoryBlock` in `fullSystem` string
- 8000 char cap with staleness notice (from harden commit `6b0c48945`)

---

## Constraints and Risks

1. **readers.test.ts placement:** The test imports relative sibling files (`./state.js`, `./roadmap.js` etc.) from within `packages/mcp-server/src/readers/`. It cannot be placed in `src/resources/extensions/hx/tests/` because the import paths would be wrong. It must stay in the package. Verification is: `cd packages/mcp-server && npm run build && node --test dist/readers/readers.test.js`. The test:unit count won't increase from readers.test.ts.

2. **codebase-generator.test.ts does count toward test:unit:** It goes in `src/resources/extensions/hx/tests/` and gets compiled into `dist-test/`. The 29 tests will increment test:unit count.

3. **`HX_ROOT_FILES` CODEBASE addition:** The `resolveHxRootFile(cwd, "CODEBASE")` call in system-context.ts will fail tsc if `CODEBASE` is not added to `HX_ROOT_FILES` first. Add to paths.ts before touching system-context.ts.

4. **codebase-generator.ts imports `hxRoot` from `./paths.js`:** In upstream it imports `gsdRoot` from `./paths.js`. The hx-ai `paths.ts` already exports `hxRoot`. This is a clean 1:1 rename.

5. **commands-codebase.ts uses `loadEffectiveHXPreferences().preferences.codebase`:** The `CodebaseMapPreferences` type must exist in `preferences-types.ts` before `commands-codebase.ts` is compiled. Add to preferences-types.ts in T4 before creating commands-codebase.ts.

6. **commands-bootstrap.ts `TOP_LEVEL_SUBCOMMANDS`:** The `codebase` command must appear here for tab-completion in the TUI. Not blocking for functionality but needed for the help text.

7. **system-context.ts `existsSync` / `readFileSync` imports:** Check current imports in the file before adding — they may already be imported for other purposes.

8. **No `repairToolJson` work in S05:** The S05 plan mentions it but the milestone context assigns repairToolJson XML/truncated-number handling to S06. Leave it out of S05.

---

## Task Decomposition (Recommended)

**T01 — MCP readers module** (~7 files in packages/mcp-server/src/readers/)
- Create `paths.ts`, `state.ts`, `roadmap.ts`, `metrics.ts`, `captures.ts`, `knowledge.ts`, `doctor-lite.ts`, `index.ts`
- All `.gsd` path strings → `.hx`; `resolveGsdRoot` → `resolveHxRoot`
- Verify: `grep -rn 'gsd\|GSD' packages/mcp-server/src/readers/ → 0 hits`

**T02 — server.ts + index.ts wiring**
- Add 6 reader imports to server.ts
- Add 6 `server.tool()` registrations (names: `hx_progress`, `hx_roadmap`, `hx_history`, `hx_doctor`, `hx_captures`, `hx_knowledge`)
- Export readers from index.ts
- Build and run readers.test.ts via package-level `npm test`
- Verify: `cd packages/mcp-server && npm run build && node --test dist/readers/readers.test.js`

**T03 — /btw skill**
- Create `src/resources/skills/btw/SKILL.md` with the 42-line file from upstream (clean port, no GSD refs)
- Verify: file exists, no GSD refs

**T04 — codebase-generator + preferences + catalog + ops handler**
- Add `CodebaseMapPreferences` + `"codebase"` to `preferences-types.ts`
- Add `CODEBASE` to `HX_ROOT_FILES` in `paths.ts`
- Create `codebase-generator.ts` (~351 lines)
- Create `commands-codebase.ts` (~192 lines)
- Add codebase command to `commands/catalog.ts` completions
- Add codebase handler to `commands/handlers/ops.ts`
- Add codebase entry to `commands-bootstrap.ts` TOP_LEVEL_SUBCOMMANDS
- Create `tests/codebase-generator.test.ts` (~29 tests)
- Verify: tsc clean, `npm run test:unit` includes codebase tests

**T05 — system-context.ts CODEBASE injection + init-wizard auto-init**
- Add codebaseBlock injection in `bootstrap/system-context.ts`
- Add generateCodebaseMap call in `init-wizard.ts`
- Final tsc + test:unit verification
- GSD grep across all modified files

---

## Key Files

### Read (existing, to understand patterns):
- `packages/mcp-server/src/server.ts` — existing 6-tool server, add 6 more here
- `packages/mcp-server/src/index.ts` — add reader exports
- `src/resources/extensions/hx/preferences-types.ts` — add `CodebaseMapPreferences`
- `src/resources/extensions/hx/paths.ts` — add `CODEBASE` to `HX_ROOT_FILES`
- `src/resources/extensions/hx/bootstrap/system-context.ts` — add codebaseBlock injection
- `src/resources/extensions/hx/init-wizard.ts` — add auto-init call
- `src/resources/extensions/hx/commands/catalog.ts` — add codebase completions
- `src/resources/extensions/hx/commands/handlers/ops.ts` — add codebase dispatch
- `src/resources/extensions/hx/commands-bootstrap.ts` — add codebase to TOP_LEVEL_SUBCOMMANDS

### Write (new):
- `packages/mcp-server/src/readers/paths.ts`
- `packages/mcp-server/src/readers/state.ts`
- `packages/mcp-server/src/readers/roadmap.ts`
- `packages/mcp-server/src/readers/metrics.ts`
- `packages/mcp-server/src/readers/captures.ts`
- `packages/mcp-server/src/readers/knowledge.ts`
- `packages/mcp-server/src/readers/doctor-lite.ts`
- `packages/mcp-server/src/readers/index.ts`
- `packages/mcp-server/src/readers/readers.test.ts`
- `src/resources/skills/btw/SKILL.md`
- `src/resources/extensions/hx/codebase-generator.ts`
- `src/resources/extensions/hx/commands-codebase.ts`
- `src/resources/extensions/hx/tests/codebase-generator.test.ts`

---

## Verification Strategy

Per task:
- T01/T02: `grep -rn 'gsd\|GSD' packages/mcp-server/src/readers/ → 0`; `cd packages/mcp-server && npm run build`; `node --test dist/readers/readers.test.js → 33 passed`
- T03: `ls src/resources/skills/btw/SKILL.md`; `grep -i 'gsd\|GSD' src/resources/skills/btw/SKILL.md → 0`
- T04/T05: `npx tsc --noEmit → exit 0`; `npm run test:unit → 4187+29 = 4216+ passed, 0 failed`; `grep -rn 'gsd\|GSD' <all touched files> → 0`

Final slice check:
```
grep -rn '\bgsd\b|\bGSD\b' packages/mcp-server/src/readers/ src/resources/skills/btw/ src/resources/extensions/hx/codebase-generator.ts src/resources/extensions/hx/commands-codebase.ts
```
Must return 0.
