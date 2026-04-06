---
estimated_steps: 9
estimated_files: 2
skills_used: []
---

# T04: Port repo-identity.ts project relocation recovery with .hx-id marker and upgrade migration

Port the upstream project relocation fix (#3080) that changes repoIdentity() to use remote-only hash for repos with remotes, adds .hx-id marker file for stable identity across moves, and includes upgrade migration logic in ensureHxSymlink().

**WARNING: This changes the identity hash computation — existing projects with remotes will get a different hash. The upgrade migration in ensureHxSymlink MUST be ported faithfully or users lose access to existing external state directories.**

Steps:
1. Read repo-identity.ts fully (482 lines), especially `repoIdentity()` (line 283) and `ensureHxSymlink()` (line 367).

2. **Modify `repoIdentity()`**: Change the hash computation for remote repos. Current: `sha256(remoteUrl + '\n' + root)`. New: If `remoteUrl` is not empty, use `sha256(remoteUrl)` only. If `remoteUrl` is empty (no remote), keep using `sha256('' + '\n' + root)` for local-only repos. This ensures projects can be relocated without changing identity.

3. **Add `.hx-id` marker file logic**: Add a function `readHxId(basePath)` that reads `<basePath>/.hx/.hx-id` if it exists and returns the stored hash. Add `writeHxId(basePath, id)` that writes the hash. Modify `repoIdentity()` to: first check `HX_PROJECT_ID` env var (existing), then check `.hx-id` marker, then compute hash. After computing, write `.hx-id` so future calls use the cached value.

4. **Add upgrade migration in `ensureHxSymlink()`**: Before creating the external directory, check if an old-format external dir exists (using the old hash = `sha256(remoteUrl + '\n' + root)`). If old dir exists and new dir doesn't, rename old → new. This preserves state across the hash algorithm change. Use `externalProjectsRoot()` to find the projects directory, then check for `<projectsRoot>/<oldHash>`.

5. **Add test**: Create `tests/project-relocation-recovery.test.ts` that verifies: (a) repoIdentity uses remote-only hash, (b) .hx-id marker persists identity, (c) local repos without remote still get stable hash.

GSD→HX: All file paths use `.hx/` and `.hx-id`. No GSD references.

## Inputs

- `src/resources/extensions/hx/repo-identity.ts`

## Expected Output

- `src/resources/extensions/hx/repo-identity.ts`
- `src/resources/extensions/hx/tests/project-relocation-recovery.test.ts`

## Verification

cd /Users/beratcan/Desktop/GithubProjects/hx-ai/.hx/worktrees/M002-yle1ri && npx tsc --noEmit && cd /Users/beratcan/Desktop/GithubProjects/hx-ai && node scripts/compile-tests.mjs && node --test dist-test/src/resources/extensions/hx/tests/project-relocation-recovery.test.js
