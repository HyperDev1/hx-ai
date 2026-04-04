---
estimated_steps: 30
estimated_files: 7
skills_used: []
---

# T01: read-tool offset clamping + Windows shell guard

## Why
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

## Inputs

- ``packages/pi-coding-agent/src/core/tools/read.ts``
- ``packages/pi-coding-agent/src/core/tools/hashline-read.ts``
- ``packages/pi-coding-agent/src/core/exec.ts``
- ``packages/pi-coding-agent/src/core/lsp/index.ts``
- ``packages/pi-coding-agent/src/core/lsp/lspmux.ts``

## Expected Output

- ``packages/pi-coding-agent/src/core/tools/read.ts` — offset clamping instead of throw`
- ``packages/pi-coding-agent/src/core/tools/hashline-read.ts` — offset clamping instead of throw`
- ``packages/pi-coding-agent/src/core/exec.ts` — shell guard on line 42`
- ``packages/pi-coding-agent/src/core/lsp/index.ts` — shell guard on spawn`
- ``packages/pi-coding-agent/src/core/lsp/lspmux.ts` — shell guard on spawn`
- ``src/tests/read-tool-offset-clamp.test.ts` — new unit test (≥4 assertions)`
- ``packages/pi-coding-agent/src/core/tools/spawn-shell-windows.test.ts` — new structural test`

## Verification

npx tsc --noEmit && node scripts/compile-tests.mjs && node --test dist-test/src/tests/read-tool-offset-clamp.test.js
