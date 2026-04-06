---
estimated_steps: 18
estimated_files: 3
skills_used: []
---

# T03: Forensics context persistence across follow-up turns

Apply upstream fix #2e90c244f: write a marker file after forensics completes so follow-up turns can inject the saved report as context.

**Steps:**

1. First, read `src/resources/extensions/hx/bootstrap/system-context.ts` to understand current `buildBeforeAgentStartResult` shape and existing customType strings (check if `hx-guided-context` or `gsd-guided-context` is used).

2. **`src/resources/extensions/hx/forensics.ts`** — marker support:
   - Add `ForensicsMarker` interface: `{ savedPath: string; content: string; writtenAt: string }`
   - Add `writeForensicsMarker(basePath: string, savedPath: string, content: string): void` — writes marker JSON to `.hx/runtime/forensics-marker.json` (using `hxRoot` → `.hx/runtime/` path)
   - Add `readForensicsMarker(basePath: string): ForensicsMarker | null` — reads and parses the marker file, returns null on any error
   - In `handleForensics()`: at the end (after `sendMessage`), call `writeForensicsMarker(basePath, savedPath, promptContent)` where `savedPath` is the path where the forensics report was saved.

3. **`src/resources/extensions/hx/bootstrap/system-context.ts`** — context injection:
   - Add `unlinkSync` to the `fs` imports (or use `fs.unlinkSync`).
   - Import `readForensicsMarker` from `../forensics.js`.
   - Add `buildForensicsContextInjection(basePath: string): string | null` — calls `readForensicsMarker`, returns formatted context string if marker exists, null otherwise.
   - Add `clearForensicsMarker(basePath: string): void` — calls `unlinkSync` on the marker path, ignores ENOENT.
   - In `buildBeforeAgentStartResult()`: when there is no existing `injection` (i.e., no guided-context injection), check for forensics marker. If found, build a `forensicsInjection` with `customType: "hx-forensics"` and the content from the marker, then clear the marker. Add this injection to the result.
   - Use `hxRoot` (not `gsdRoot`) for the basePath.

4. **Create** `src/resources/extensions/hx/tests/forensics-context-persist.test.ts`: Source-read style test (~129 lines). Assert: (a) `ForensicsMarker` interface exported from forensics.ts; (b) `writeForensicsMarker` and `readForensicsMarker` exported; (c) `handleForensics` source calls `writeForensicsMarker`; (d) system-context.ts imports `readForensicsMarker`; (e) system-context.ts has `hx-forensics` customType string; (f) system-context.ts has `clearForensicsMarker` or equivalent `unlinkSync` call; (g) marker path uses `.hx/runtime/` directory.

**Important naming note:** Check what customType is currently used for guided context in system-context.ts. If it's already `hx-guided-context` (not `gsd-guided-context`), use `hx-forensics` for consistency. If guided context still says `gsd-guided-context`, adapt forensics to `hx-forensics` regardless (forensics is new, guided is legacy).

**Verify:** After `node scripts/compile-tests.mjs`: run `node --test dist-test/src/resources/extensions/hx/tests/forensics-context-persist.test.js`. Also run `npx tsc --noEmit` to confirm no type errors from the new imports.

## Inputs

- ``src/resources/extensions/hx/forensics.ts``
- ``src/resources/extensions/hx/bootstrap/system-context.ts``

## Expected Output

- ``src/resources/extensions/hx/forensics.ts``
- ``src/resources/extensions/hx/bootstrap/system-context.ts``
- ``src/resources/extensions/hx/tests/forensics-context-persist.test.ts``

## Verification

cd /Users/beratcan/Desktop/GithubProjects/hx-ai/.hx/worktrees/M002-yle1ri && npx tsc --noEmit && node scripts/compile-tests.mjs && node --test dist-test/src/resources/extensions/hx/tests/forensics-context-persist.test.js
