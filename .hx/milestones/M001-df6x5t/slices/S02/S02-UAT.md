# S02: Environment Variables & Web Module — UAT

**Milestone:** M001-df6x5t
**Written:** 2026-04-03T20:37:00.016Z

# S02 UAT: Environment Variables & Web Module

## UAT Type

UAT mode: artifact-driven

## Preconditions

- Working directory: `/Users/beratcan/Desktop/GithubProjects/hx-ai/.hx/worktrees/M001-df6x5t`
- Node.js available, `npm run typecheck:extensions` runnable
- No build step required — all checks are grep/file inspection

---

## Test Cases

### TC-01: Web module has zero GSD_ env var references

**Purpose:** Confirm all GSD_WEB_* and related GSD_ env vars are gone from the web/ Next.js module.

**Command:**
```bash
grep -rn 'GSD_\|gsd_help\|gsd-web' --include='*.ts' --include='*.tsx' --include='*.json' web/ | grep -v node_modules | grep -v .next | wc -l
```

**Expected:** `0`

---

### TC-02: web/package-lock.json shows hx-web package name

**Purpose:** Confirm the package name was updated in both name fields.

**Command:**
```bash
grep '"name"' web/package-lock.json | head -2
```

**Expected:** Both lines output `"name": "hx-web"` — no "gsd-web" present.

---

### TC-03: pty-manager.ts prefix filter uses HX_WEB_ (not GSD_WEB_)

**Purpose:** Confirm the critical prefix filter that gates PTY environment variable forwarding uses the correct HX_WEB_ prefix.

**Command:**
```bash
grep 'startsWith' web/lib/pty-manager.ts
```

**Expected:** Output contains `HX_WEB_` — no `GSD_WEB_` present.

---

### TC-04: rpc-mode.ts reads HX_WEB_BRIDGE_TUI (embedded terminal bug fix)

**Purpose:** Confirm the critical bug fix — the read side now matches the write side in bridge-service.ts.

**Command:**
```bash
grep 'BRIDGE_TUI' packages/pi-coding-agent/src/modes/rpc/rpc-mode.ts
```

**Expected:** Output contains only `HX_WEB_BRIDGE_TUI` — no `GSD_WEB_BRIDGE_TUI`.

---

### TC-05: daemon.test.ts sets HX_DAEMON_CONFIG (test correctness fix)

**Purpose:** Confirm the daemon test now sets the correct env var that production code reads.

**Command:**
```bash
grep 'DAEMON_CONFIG' packages/daemon/src/daemon.test.ts
```

**Expected:** Output contains only `HX_DAEMON_CONFIG` — no `GSD_DAEMON_CONFIG`.

---

### TC-06: packages/ and src/loader.ts have zero GSD_ env var references

**Purpose:** Confirm all pi-coding-agent, daemon, mcp-server, and src/loader.ts GSD_ references are gone.

**Command:**
```bash
grep -rn 'GSD_' --include='*.ts' packages/ src/loader.ts | grep -v node_modules | wc -l
```

**Expected:** `0`

---

### TC-07: Tests, scripts, CI, and Docker have zero GSD_ references

**Purpose:** Confirm all GSD_ references in test files, scripts, CI workflows, and Docker configuration are renamed.

**Command:**
```bash
grep -rn 'GSD_' --include='*.ts' --include='*.js' --include='*.sh' --include='*.yml' --include='*.yaml' tests/ scripts/ .github/workflows/ docker/ | wc -l
```

**Expected:** `0`

---

### TC-08: Exhaustive full-codebase GSD_ grep returns zero hits

**Purpose:** Comprehensive final check — no GSD_ env var references anywhere in source.

**Command:**
```bash
grep -rn 'GSD_' --include='*.ts' --include='*.tsx' --include='*.js' --include='*.sh' --include='*.yml' --include='*.yaml' --include='*.json' . | grep -v node_modules | grep -v dist | grep -v .next | grep -v '.hx/' | grep -v '.git/' | wc -l
```

**Expected:** `0`

---

### TC-09: TypeScript compilation passes after all renames

**Purpose:** Confirm no type errors were introduced by the env var renames.

**Command:**
```bash
npm run typecheck:extensions
```

**Expected:** Exit code 0, no TypeScript errors.

---

## Edge Cases

### EC-01: HX_WEB_HOST_KIND not confused with HX_WEB_HOST

In T01, GSD_WEB_HOST_KIND had to be substituted before GSD_WEB_HOST to avoid partial matches creating `HX_WEB_HOST_KIND` → `HX_HOST_KIND`. Verify the longer form is correct:

```bash
grep 'WEB_HOST' web/ -r --include='*.ts' --include='*.tsx' | grep -v node_modules | grep -v .next
```

Expected: Lines show `HX_WEB_HOST` and `HX_WEB_HOST_KIND` — no partial mutations like `HX_HOST_KIND`.

### EC-02: gsd_help type union member fully renamed

```bash
grep -rn 'gsd_help' web/ --include='*.ts' --include='*.tsx' | grep -v node_modules
```

Expected: `0` hits — type union member and string literal both renamed to `hx_help`.

### EC-03: NEXT_PUBLIC_GSD_DEV fully replaced

```bash
grep -rn 'NEXT_PUBLIC_GSD_DEV' web/ --include='*.ts' --include='*.tsx' | grep -v node_modules
```

Expected: `0` hits — replaced by `NEXT_PUBLIC_HX_DEV` in both dev-overrides.tsx and api/dev-mode/route.ts.
