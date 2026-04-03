---
estimated_steps: 64
estimated_files: 11
skills_used: []
---

# T03: Rename GSD identifiers in docs, .plans/, CHANGELOG, and run final verification

This task completes the milestone by renaming all documentation references and running the final comprehensive verification grep that proves R012 (zero remaining GSD/gsd references excluding migration code).

## Steps

1. **Rename docs/ content** using bulk perl -pi substitution. Write /tmp/s05-t03-doc-renames.pl with patterns:
   - `GSD_HOME` → `HX_HOME`
   - `GSD_PROJECT_ID` → `HX_PROJECT_ID`
   - `GSD_STATE_DIR` → `HX_STATE_DIR`
   - `GSD_CODING_AGENT_DIR` → `HX_CODING_AGENT_DIR`
   - `GSD_DURABLE_PATHS` → `HX_DURABLE_PATHS`
   - `GSD_FIXTURE_MODE` → `HX_FIXTURE_MODE`
   - `GSD_FIXTURE_DIR` → `HX_FIXTURE_DIR`
   - `GSD_WEB_PROJECT_CWD` → `HX_WEB_PROJECT_CWD`
   - `GSD_MILESTONE_LOCK` → `HX_MILESTONE_LOCK`
   - `GSD_PARALLEL_WORKER` → `HX_PARALLEL_WORKER`
   - `GSD_VERSION` → `HX_VERSION`
   - `GSD_RTK_DISABLED` → `HX_RTK_DISABLED`
   - `GSDAppShell` → `HXAppShell`
   - `gsd_parser.rs` → `hx_parser.rs`
   - `gsd-pi` → `hx-pi`
   Apply to all files matching: `docs/*.md`, `docs/superpowers/**/*.md`, `docker/README.md`, `README.md`

2. **Rename CHANGELOG.md** identifiers. This is historical release documentation — preserve version numbers and dates, only rename GSD identifiers:
   - `gsd_slice_complete` → `hx_slice_complete`
   - `GSD_PROJECT_ID` → `HX_PROJECT_ID`
   - `GSD_HOME` → `HX_HOME`
   - `GSDError` → `HXError`
   - `gsd_generate_milestone_id` → `hx_generate_milestone_id`
   - `gsdVersion` → `hxVersion`
   - `GSD_VERSION` → `HX_VERSION`
   - `GSD v` → `HX v` (release notes prefix, if appropriate)

3. **Rename .plans/ content** (330 hits across 17 files) using bulk perl -pi loop. Key substitutions:
   - `GSD_` → `HX_` (env var prefix in all contexts)
   - `GSD[A-Z]` patterns: `GSDPreferences` → `HXPreferences`, `GSDState` → `HXState`, `GSDMilestone` → `HXMilestone`, etc.
   - `gsd_` → `hx_` (tool names)
   - `gsd-parser.rs` → `hx-parser.rs`
   - `ParsedGsdFile` → `ParsedHxFile`
   - `GsdTreeEntry` → `HxTreeEntry`
   - `batchParseGsdFiles` → `batchParseHxFiles`
   - `scanGsdTree` → `scanHxTree`
   - `gsdDir` → `hxDir`
   - `gsdHome` → `hxHome`
   - `gsd-pi` → `hx-pi`
   - `gsd-web` → `hx-web`
   Apply to: `find .plans/ -name '*.md' -type f`

4. **Run final comprehensive verification** — this is the R012 proof:
   ```bash
   grep -rn 'gsd\|GSD\|Gsd' . \
     --include='*.ts' --include='*.tsx' --include='*.js' --include='*.mjs' \
     --include='*.sh' --include='*.ps1' --include='*.yml' --include='*.yaml' \
     --include='*.md' --include='*.rs' --include='*.json' \
     --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.next \
     --exclude-dir=.git --exclude-dir=.hx \
     | grep -v migrate-gsd-to-hx \
     | grep -v 'package-lock.json' \
     | wc -l
   ```
   Must return 0. If any hits remain, fix them and re-verify.

5. **Run `npm run typecheck:extensions`** — final confirmation that compilation passes (R010).

6. **Verify git mv'd files** exist at new paths and old paths are gone.

## Constraints
- K001: synchronous foreground perl loops for writes in git worktrees.
- R009: migrate-gsd-to-hx.ts must NOT appear in grep exclusion failures.
- CHANGELOG.md: These are historical entries — update identifiers but preserve factual accuracy of release notes.
- .plans/ files may contain `GSD` in mixed contexts (prose, code blocks, identifiers) — the bulk rename should cover all patterns.
- The final grep uses case-sensitive `gsd|GSD|Gsd` to catch all three casings that appear in identifiers while avoiding false positives from words like `SettingsData` (which contains `gsD` with uppercase D, not matching any of our three patterns).
- Root `package-lock.json` is excluded from final grep — it's auto-generated and will be correct after next `npm install`.

## Inputs

- ``docs/configuration.md` — has GSD_HOME, GSD_PROJECT_ID, GSD_STATE_DIR, GSD_CODING_AGENT_DIR`
- ``docs/FILE-SYSTEM-MAP.md` — has GSD_HOME, GSDAppShell, gsd_parser.rs`
- ``docs/ADR-001-branchless-worktree-architecture.md` — has GSD_DURABLE_PATHS`
- ``docs/PRD-branchless-worktree-architecture.md` — has GSD_DURABLE_PATHS`
- ``docs/ci-cd-pipeline.md` — has GSD_FIXTURE_MODE`
- ``docs/web-interface.md` — has GSD_WEB_PROJECT_CWD`
- ``docs/parallel-orchestration.md` — has GSD_MILESTONE_LOCK, GSD_PARALLEL_WORKER`
- ``docker/README.md` — has GSD_VERSION`
- ``README.md` — has GSD_RTK_DISABLED`
- ``CHANGELOG.md` — has 8 historical GSD references`
- ``.plans/` — 17 files with 330 historical GSD references`

## Expected Output

- ``docs/configuration.md` — all GSD_* env var names replaced with HX_*`
- ``docs/FILE-SYSTEM-MAP.md` — GSD_HOME→HX_HOME, GSDAppShell→HXAppShell, gsd_parser.rs→hx_parser.rs`
- ``docs/ADR-001-branchless-worktree-architecture.md` — GSD_DURABLE_PATHS→HX_DURABLE_PATHS`
- ``docs/PRD-branchless-worktree-architecture.md` — GSD_DURABLE_PATHS→HX_DURABLE_PATHS`
- ``docs/ci-cd-pipeline.md` — GSD_FIXTURE_MODE→HX_FIXTURE_MODE`
- ``docs/web-interface.md` — GSD_WEB_PROJECT_CWD→HX_WEB_PROJECT_CWD`
- ``docs/parallel-orchestration.md` — GSD_MILESTONE_LOCK→HX_MILESTONE_LOCK`
- ``docker/README.md` — GSD_VERSION→HX_VERSION`
- ``README.md` — GSD_RTK_DISABLED→HX_RTK_DISABLED`
- ``CHANGELOG.md` — all GSD identifiers updated to HX equivalents`
- ``.plans/` — all 17 files updated with HX identifiers`

## Verification

grep -rn 'gsd\|GSD\|Gsd' . --include='*.ts' --include='*.tsx' --include='*.js' --include='*.mjs' --include='*.sh' --include='*.ps1' --include='*.yml' --include='*.yaml' --include='*.md' --include='*.rs' --include='*.json' --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.next --exclude-dir=.git --exclude-dir=.hx | grep -v migrate-gsd-to-hx | grep -v 'package-lock.json' | wc -l returns 0 && npm run typecheck:extensions exits 0
