---
estimated_steps: 7
estimated_files: 5
skills_used: []
---

# T03: Apply data safety guards: workflow-manifest coercion, migrate-external worktree guard, dynamic-tools symlink layout, auto-post-unit retry guard

Port four small upstream fixes that prevent data loss and infinite loops in edge cases.

Steps:
1. **workflow-manifest.ts column coercion (#2962):** Add a `toNumeric(val: unknown): number` helper at the top of workflow-manifest.ts that safely converts SQLite TEXT columns to numbers (handles string, null, undefined → returns `Number(val) || 0`). Apply it to `sequence`, `exit_code`, `duration_ms` fields in the `snapshotState()` function's row mapping (around lines 60-170). The fields `r['sequence'] as number`, `r['exit_code'] as number`, `r['duration_ms'] as number` become `toNumeric(r['sequence'])`, etc. Add test cases to `tests/workflow-manifest.test.ts` verifying coercion of string '42' → 42, null → 0, undefined → 0.

2. **migrate-external.ts worktree guard (#2970):** At the top of `migrateToExternalState()` (after line 36, before the `existsSync(localHx)` check), add: `import { isInsideWorktree } from './repo-identity.js'` and an early return `if (isInsideWorktree(basePath)) return { migrated: false };`. This prevents migration from running inside worktrees where it would corrupt shared state.

3. **bootstrap/dynamic-tools.ts symlink layout (#2517):** In `resolveProjectRootDbPath()`, add detection for the `/.hx/projects/<hash>/worktrees/` symlink layout pattern. After the existing worktree detection (lines 21-34), add a check: if `basePath` contains `/.hx/projects/` followed by `/worktrees/`, resolve to the project root's `hx.db` under the external state dir. Also in `ensureDbOpen()`, add structured stderr diagnostics on failure: `process.stderr.write('hx-db: ensureDbOpen failed: ' + reason + '\n')` in the catch block.

4. **auto-post-unit.ts retry guard (#2517):** Around line 123 in auto-post-unit.ts, where the code checks `if (!isDbAvailable()) return [];`, verify this guard exists. If the retry loop (search for retry/backoff logic) doesn't skip when DB is unavailable, add `if (!isDbAvailable()) { process.stderr.write('hx-db: skipping post-unit retry — DB unavailable\n'); return; }` before the retry.

GSD→HX: `isInsideWorktree` import from `./repo-identity.js` (already HX-named). All stderr messages use `hx-db:` prefix.

## Inputs

- `src/resources/extensions/hx/workflow-manifest.ts`
- `src/resources/extensions/hx/migrate-external.ts`
- `src/resources/extensions/hx/bootstrap/dynamic-tools.ts`
- `src/resources/extensions/hx/auto-post-unit.ts`
- `src/resources/extensions/hx/tests/workflow-manifest.test.ts`

## Expected Output

- `src/resources/extensions/hx/workflow-manifest.ts`
- `src/resources/extensions/hx/migrate-external.ts`
- `src/resources/extensions/hx/bootstrap/dynamic-tools.ts`
- `src/resources/extensions/hx/auto-post-unit.ts`
- `src/resources/extensions/hx/tests/workflow-manifest.test.ts`

## Verification

cd /Users/beratcan/Desktop/GithubProjects/hx-ai/.hx/worktrees/M002-yle1ri && npx tsc --noEmit && cd /Users/beratcan/Desktop/GithubProjects/hx-ai && node scripts/compile-tests.mjs && node --test dist-test/src/resources/extensions/hx/tests/workflow-manifest.test.js
