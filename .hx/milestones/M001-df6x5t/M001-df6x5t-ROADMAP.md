# M001-df6x5t: GSD → HX Complete Rename

## Vision
Eliminate all residual GSD identifiers from the codebase. Every type, env var, tool name, native binding, package name, variable, prompt, doc, and CI reference uses HX naming. The only surviving GSD references are in migrate-gsd-to-hx.ts (backward-compat migration code).

## Slice Overview
| ID | Slice | Risk | Depends | Done | After this |
|----|-------|------|---------|------|------------|
| S01 | TypeScript Types & Internal Variables | high | — | ✅ | After this: tsc compiles with zero GSD type references. All GSD* types are HX*, all gsdDir variables are hxDir. |
| S02 | Environment Variables & Web Module | medium | S01 | ✅ | After this: all GSD_WEB_*, GSD_DAEMON_CONFIG, and other GSD_* env vars are HX_*. Web components use HXAppShell. Package name is hx-web. |
| S03 | DB Tool Names & Prompts | medium | S01 | ✅ | After this: all gsd_plan_milestone etc. tool registrations are hx_plan_milestone. All 29 prompt files reference hx_* names. |
| S04 | Native Rust Engine & Bindings | high | S01 | ✅ | After this: Rust source is hx_parser.rs, binary is hx_engine.*.node, JS bindings call batchParseHxFiles/scanHxTree. |
| S05 | Docs, CI/CD, Tests & Final Verification | low | S01, S02, S03, S04 | ✅ | After this: grep -rni gsd returns zero hits outside migration code. All tests pass. All docs, CI, Docker use HX naming. |
