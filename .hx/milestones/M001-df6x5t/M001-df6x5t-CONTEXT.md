# M001-df6x5t: GSD → HX Complete Rename

**Gathered:** 2026-04-03
**Status:** Ready for planning

## Project Description

Complete rename of all residual `gsd` / `GSD` identifiers to `hx` / `HX` across the entire HX codebase. The project was originally named "GSD" and has been partially rebranded. ~160 unique identifiers remain across ~280 files with ~2525 total references.

## Why This Milestone

Inconsistent naming creates confusion for contributors, pollutes grep results, and presents an unprofessional public surface through env vars, tool names, component names, and package identifiers. The rename has been discussed and inventoried — now it needs execution.

## User-Visible Outcome

### When this milestone is complete, the user can:

- Run `grep -rni "gsd" . --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.next --exclude-dir=.git` and see zero hits outside of `migrate-gsd-to-hx.ts` and its callers
- See `HX_*` env vars in all configuration surfaces (docker, CI, web)
- See `hx_*` tool names in agent prompts and DB tool registrations
- See `HX*` type names in all TypeScript interfaces

### Entry point / environment

- Entry point: CLI (`hx-dev`), web (`npm run dev` in web/), tests (`npm test`)
- Environment: local dev
- Live dependencies involved: none (pure rename, no external services)

## Completion Class

- Contract complete means: TypeScript compiles, all tests pass, zero gsd grep hits
- Integration complete means: native Rust engine builds and loads correctly with new names
- Operational complete means: none (no runtime behavior change)

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- `tsc` and `npm run typecheck:extensions` pass with zero errors
- `npm run test:unit` and `npm run test:integration` pass
- `grep -rni "gsd" . --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.next --exclude-dir=.git | grep -v migrate-gsd-to-hx | wc -l` returns 0

## Risks and Unknowns

- TypeScript type renames across ~80 files could break compilation if any reference is missed — high volume but mechanically checkable
- Native Rust engine file/function rename requires rebuild and could break N-API bindings if Rust export names don't match JS expectations
- Env var renames in CI/CD could break pipeline if not matched with actual CI environment configuration
- Some env vars may be set by external systems (Docker, CI runners) — renaming in source doesn't rename in environment

## Existing Codebase / Prior Art

- `src/resources/extensions/hx/preferences-types.ts` — defines `GSDPreferences` and related types (central hub)
- `src/resources/extensions/hx/state.ts` — defines `GSDState`, uses `nativeBatchParseGsdFiles`
- `native/crates/engine/src/gsd_parser.rs` — Rust parser with N-API exports
- `packages/native/src/native.ts` — JS binding layer loading `gsd_engine.*.node`
- `src/resources/extensions/hx/migrate-gsd-to-hx.ts` — backward-compat migration (DO NOT RENAME)
- `web/proxy.ts` — uses `GSD_WEB_*` env vars
- `docker/entrypoint.sh` — uses `GSD_USER`, `GSD_HOME`, `GSD_DIR`

> See `.hx/DECISIONS.md` for all architectural and pattern decisions — it is an append-only register; read it during planning, append to it during execution.

## Relevant Requirements

- R001-R008 — specific rename categories
- R009 — migration code preservation constraint
- R010-R011 — compilation and test pass requirements
- R012 — zero residual gsd references

## Scope

### In Scope

- All TypeScript type/interface renames (GSD* → HX*)
- All environment variable renames (GSD_* → HX_*)
- All DB tool name renames (gsd_* → hx_*)
- Native Rust engine file/function/binary renames
- Web component and package name renames
- Internal variable name renames (gsdDir → hxDir etc.)
- Prompt, skill, agent file content updates
- Docker, CI/CD, docs, changelog updates
- Test file updates (both test names and test content)
- File renames (gsd_parser.rs → hx_parser.rs etc.)

### Out of Scope / Non-Goals

- npm registry package rename or publish
- GitHub org/repo rename
- Any behavioral or feature changes
- migrate-gsd-to-hx.ts content changes

## Technical Constraints

- Rust native engine requires `cargo build` after rename — cannot verify without build toolchain
- `package-lock.json` files are generated — rename `package.json` entries and regenerate
- `.next/` build cache will be stale after web renames — needs rebuild
- Test verification requires full test suite to run (not just compilation)

## Integration Points

- Native Rust ↔ Node.js N-API boundary: function export names must match between Rust `#[napi]` exports and JS `native.batchParseGsdFiles` calls
- Prompt files ↔ DB tool registration: tool names in prompts must match registered tool names exactly
- Docker entrypoint ↔ application code: env var names must match between shell scripts and `process.env.*` reads
- CI workflows ↔ npm registry: package names in publish steps (informational — actual publish is out of scope)

## Open Questions

- Native platform packages (`@gsd-build/engine-*`) — rename to `@hyperlab/engine-*` or defer? Current thinking: rename in source, no registry publish.
