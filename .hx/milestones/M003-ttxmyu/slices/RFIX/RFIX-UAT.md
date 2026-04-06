# RFIX: Build Error Remediation: triage-ui.ts + ask-user-questions.ts — UAT

**Milestone:** M003-ttxmyu
**Written:** 2026-04-05T20:35:37.761Z

## UAT Type
UAT mode: artifact-driven

## Preconditions
- Working directory: `/Users/beratcan/Desktop/GithubProjects/hx-ai`
- All S01–S06 slice work completed
- Node.js + TypeScript toolchain available

## Test Cases

### TC-01: TypeScript resources project compiles clean
**Command:** `npx tsc --project tsconfig.resources.json --noEmit`
**Expected:** Exit code 0, no output

### TC-02: TypeScript extensions project compiles clean
**Command:** `npx tsc --project tsconfig.extensions.json --noEmit`
**Expected:** Exit code 0, no output

### TC-03: npm run build exits 0
**Command:** `npm run build 2>&1 | tail -5`
**Expected:** Exit code 0; no TypeScript errors in output

### TC-04: triage-ui.ts contains stop and backtrack labels
**Command:** `grep -A2 '"stop"' src/resources/extensions/hx/triage-ui.ts`
**Expected:** Matches `label: "Stop"` and description text

**Command:** `grep -A2 '"backtrack"' src/resources/extensions/hx/triage-ui.ts`
**Expected:** Matches `label: "Backtrack"` and description text

### TC-05: ALL_CLASSIFICATIONS includes stop and backtrack
**Command:** `grep 'ALL_CLASSIFICATIONS' src/resources/extensions/hx/triage-ui.ts -A 10`
**Expected:** Array contains both `"stop"` and `"backtrack"` entries

### TC-06: ask-user-questions.ts uses `as const` on text literals
**Command:** `grep 'type: "text" as const' src/resources/extensions/ask-user-questions.ts`
**Expected:** At least 2 matching lines (cancelled-path and success-path returns)

### TC-07: REQUIREMENTS.md has 11 validated requirements
**Command:** `grep -ic 'Status: validated' .hx/REQUIREMENTS.md`
**Expected:** Outputs `11`

### TC-08: REQUIREMENTS.md has 0 active requirements
**Command:** `grep -ic 'Status: active' .hx/REQUIREMENTS.md`
**Expected:** Outputs `0` (grep -c exits 1 with zero matches — this is correct)

### TC-09: Coverage Summary reflects Active: 0, Validated: 11
**Command:** `grep 'Active requirements\|Validated:' .hx/REQUIREMENTS.md | tail -4`
**Expected:** Lines showing `Active requirements: 0` and `Validated: 11`

### TC-10: R011–R016 all in Validated section (not Active)
**Command:** `awk '/## Validated/,/## Deferred/' .hx/REQUIREMENTS.md | grep -E '^### R01[1-6]'`
**Expected:** Matches R011, R012, R013, R015, R016 (R014 also present)

## Edge Cases

- **grep -c exits 1 on zero matches:** The gate command `grep -c 'status: active'` (lowercase) returns exit 1 when count is 0. This is a false negative — the correct check is case-insensitive `grep -ic 'Status: active'`. Use TC-08 instead.
- **Classification union completeness:** If new entries are added to the `Classification` type in captures.ts, they must be mirrored in CLASSIFICATION_LABELS and ALL_CLASSIFICATIONS in triage-ui.ts or the build will break again.
