---
estimated_steps: 32
estimated_files: 17
skills_used: []
---

# T02: windowsHide: true for all web-mode spawns

## Why
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

## Inputs

- ``src/web-mode.ts``
- ``src/web/auto-dashboard-service.ts``
- ``src/web/bridge-service.ts``
- ``src/web/captures-service.ts``
- ``src/web/cleanup-service.ts``
- ``src/web/doctor-service.ts``
- ``src/web/export-service.ts``
- ``src/web/forensics-service.ts``
- ``src/web/history-service.ts``
- ``src/web/hooks-service.ts``
- ``src/web/recovery-diagnostics-service.ts``
- ``src/web/settings-service.ts``
- ``src/web/skill-health-service.ts``
- ``src/web/undo-service.ts``
- ``src/web/visualizer-service.ts``
- ``src/tests/integration/web-mode-cli.test.ts``

## Expected Output

- ``src/web-mode.ts` — windowsHide: true in both execFile and spawn calls`
- ``src/web/auto-dashboard-service.ts` — windowsHide: true in execFile`
- ``src/web/bridge-service.ts` — windowsHide: true in 3 execFile calls + spawn`
- ``src/web/captures-service.ts` — windowsHide: true in 2 execFile calls`
- ``src/web/cleanup-service.ts` — windowsHide: true in 2 execFile calls`
- ``src/web/doctor-service.ts` — windowsHide: true in execFile`
- ``src/web/export-service.ts` — windowsHide: true in execFile`
- ``src/web/forensics-service.ts` — windowsHide: true in execFile`
- ``src/web/history-service.ts` — windowsHide: true in execFile`
- ``src/web/hooks-service.ts` — windowsHide: true in execFile`
- ``src/web/recovery-diagnostics-service.ts` — windowsHide: true in execFile`
- ``src/web/settings-service.ts` — windowsHide: true in execFile`
- ``src/web/skill-health-service.ts` — windowsHide: true in execFile`
- ``src/web/undo-service.ts` — windowsHide: true in execFile`
- ``src/web/visualizer-service.ts` — windowsHide: true in execFile`
- ``src/tests/integration/web-mode-cli.test.ts` — windowsHide: true in expected spawnInvocation`
- ``src/tests/integration/web-mode-windows-hide.test.ts` — new structural integration test`

## Verification

npx tsc --noEmit
