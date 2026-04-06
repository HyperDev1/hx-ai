# M004-erchk5: 

## Vision
Port all ~58 actionable upstream gsd-2 commits between v2.63.0 and v2.64.0 into hx-ai with GSD→HX naming adaptation. Covers the LLM safety harness (7-file new subsystem), Ollama native /api/chat provider, requirements DB auto-seeding, slice context injection, DB bash-access protection, 13 auto-mode loop stability fixes, and ~20 misc bugfixes across 5 slices.

## Slice Overview
| ID | Slice | Risk | Depends | Done | After this |
|----|-------|------|---------|------|------------|
| S01 | LLM Safety Harness | high | — | ✅ | After this: src/resources/extensions/hx/safety/ has 7 files; safety harness wired; tsc clean baseline for S02–S05 |
| S02 | Ollama Native Provider + Flat-rate Routing Guard | medium | S01 | ⬜ | After this: Ollama native provider registered; flat-rate guard active; model fallback race fixed; tsc clean |
| S03 | Requirements Seed + Slice Context Injection + DB Guard | medium | S01 | ⬜ | After this: requirements seed active; context injection in 5 builders; hx_milestone_status callable; 14 new tests pass |
| S04 | Auto-mode Loop Stability (13 bugfix cluster) | medium | S01 | ⬜ | After this: 13 stability bugs fixed; tsc clean; test count maintained ≥4298 |
| S05 | MCP OAuth + Resource Sync + Misc + Final Verification | low | S01, S02, S03, S04 | ⬜ | After this: all 58 upstream commits accounted for; npm run build exits 0; tsc clean; ≥4298 tests pass; 0 GSD regressions; milestone complete |
