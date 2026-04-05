# S04: Workflow-Logger Centralization + Auto-mode Hardening

**Goal:** Migrate all catch blocks in auto-mode files to workflow-logger; harden audit log persistence (errors-only, sanitized); port tool-call-loop-guard.ts; port auto-wrapup interrupt guard; port stop/backtrack capture classifications; port fail-closed stop guard + backtrack parsing hardening
**Demo:** After this: After this: workflow-logger-audit, silent-catch-diagnostics, tool-call-loop-guard, auto-wrapup-inflight-guard tests pass; no empty catch blocks in modified files

## Tasks
