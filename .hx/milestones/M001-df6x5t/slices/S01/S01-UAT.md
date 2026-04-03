# S01: TypeScript Types & Internal Variables — UAT

**Milestone:** M001-df6x5t
**Written:** 2026-04-03T20:16:23.924Z

# S01 UAT: TypeScript Types & Internal Variables

## UAT Type
UAT mode: artifact-driven

## Preconditions

- Working directory: root of M001-df6x5t worktree
- Node.js and npm installed
- TypeScript compiler available via `npm run typecheck:extensions`
- Git available for diff verification

## Test Cases

### TC-01: Zero GSD TypeScript Identifiers Remain

**Purpose:** Verify that no GSD*/Gsd*/gsd* TypeScript identifiers exist outside the explicitly allowed exceptions.

**Steps:**
1. Run: `grep -rn 'GSD[A-Za-z]\|Gsd[A-Z]\|gsd[A-Z]' --include='*.ts' --include='*.tsx' . | grep -v node_modules | grep -v dist | grep -v .next | grep -v migrate-gsd-to-hx | grep -v '.hx/' | grep -v 'gsd_engine' | grep -v batchParseGsdFiles | wc -l`

**Expected:** Output is `0`

**Evidence:** T03 verification confirmed count=0 (exit code 1 from grep, meaning no matches)

---

### TC-02: TypeScript Compilation Passes With Zero Errors

**Purpose:** Verify that all renamed identifiers are consistent — no broken references or missing imports.

**Steps:**
1. Run: `npm run typecheck:extensions`

**Expected:** Exit code 0, zero error lines in output

**Evidence:** T02 verified exit 0; T03 re-verified exit 0 (97s run)

---

### TC-03: migrate-gsd-to-hx.ts Is Unchanged

**Purpose:** Verify that the backward-compat migration file was not modified (R009 constraint).

**Steps:**
1. Run: `git diff src/resources/extensions/hx/migrate-gsd-to-hx.ts | wc -l`

**Expected:** Output is `0`

**Evidence:** All three tasks confirmed 0 diff lines

---

### TC-04: HXState Type Exported and Importable

**Purpose:** Verify that the core HXState type is correctly defined and exported.

**Steps:**
1. Run: `grep -n 'export.*HXState\|interface HXState\|type HXState' src/resources/extensions/hx/types.ts`

**Expected:** At least one line showing HXState definition/export (no GSDState references)

---

### TC-05: HXPreferences Type Exported

**Purpose:** Verify that HXPreferences and related preference types are correctly renamed.

**Steps:**
1. Run: `grep -n 'HXPreferences\|HXModelConfig\|HXSkillRule' src/resources/extensions/hx/preferences-types.ts`

**Expected:** Multiple hits with HX* names; zero GSD* names on the same lines

---

### TC-06: Native Parser Bridge Preserves Rust N-API Call Strings

**Purpose:** Verify that native.scanGsdTree and the batchParseGsdFiles runtime call string are preserved for S04.

**Steps:**
1. Run: `grep -n 'batchParseGsdFiles\|scanGsdTree' packages/native/src/hx-parser/index.ts`

**Expected:** The runtime call `(native as Record<string, Function>).batchParseGsdFiles(` is present

---

### TC-07: HXWorkspaceStore Used in Web Layer

**Purpose:** Verify that web/ components use HXWorkspaceStore (not GSDWorkspaceStore).

**Steps:**
1. Run: `grep -rn 'HXWorkspaceStore\|GSDWorkspaceStore' web/lib/hx-workspace-store.tsx`

**Expected:** Lines with HXWorkspaceStore; zero lines with GSDWorkspaceStore

---

### TC-08: VSCode Extension Classes Use Hx* Naming

**Purpose:** Verify vscode-extension class names are renamed.

**Steps:**
1. Run: `grep -n 'HxSidebarProvider\|HxBashTerminal\|HxSessionTreeProvider\|GsdSidebarProvider\|GsdBashTerminal' vscode-extension/src/extension.ts`

**Expected:** Hx* class names present; zero Gsd* class names

---

### TC-09: Neighbor Extensions Updated

**Purpose:** Verify that all 6 neighbor extension files use HX naming.

**Steps:**
1. Run: `grep -rn 'GSDPreferences\|GSDState\|gsdHome\|getGsdHome' src/resources/extensions/cmux/ src/resources/extensions/ttsr/ src/resources/extensions/search-the-web/ src/resources/extensions/subagent/ src/resources/extensions/remote-questions/`

**Expected:** Zero matches

---

### TC-10: gsd_engine Binary Path Strings Preserved in packages/native

**Purpose:** Verify that S04-scope binary artifact path strings were not renamed.

**Steps:**
1. Run: `grep -n 'gsd_engine' packages/native/src/hx-parser/index.ts`

**Expected:** One or more lines showing gsd_engine path references (intentionally preserved for S04)

## Edge Cases

- **Import aliasing:** `guided-flow.ts` and `auto-start.ts` import `migrateProjectGsdToHx as migrateProject` — verify these aliases compile correctly (covered by TC-02).
- **Duplicate const in migration test:** `migrate-gsd-to-hx.test.ts` uses `legacyHome` (not `hxHome`) for the source directory — verify no TS2451 errors (covered by TC-02).
- **Over-rename revert:** `ops.ts` should import `handleGsdToHxMigration` (not handleHxToHxMigration) — verify by checking the import line compiles (covered by TC-02).

