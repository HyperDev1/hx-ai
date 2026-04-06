# S06: Remaining Bugfixes, Security + Final Verification — UAT

**Milestone:** M003-ttxmyu
**Written:** 2026-04-05T19:58:12.406Z

## UAT Type

UAT mode: artifact-driven

## Preconditions

- Repository at `/Users/beratcan/Desktop/GithubProjects/hx-ai`
- Node.js installed, dependencies installed (`npm install` done)
- TypeScript compiler available (`npx tsc`)

---

## Test Cases

### TC-01: TypeScript typecheck passes clean

**What it verifies:** All S06 changes typecheck correctly; no new type errors introduced.

```bash
cd /Users/beratcan/Desktop/GithubProjects/hx-ai
npx tsc --noEmit
echo "EXIT:$?"
```

**Expected:** `EXIT:0` with no error output.

---

### TC-02: Full test suite passes

**What it verifies:** All 4298 tests pass, 0 failures; S06 new tests (security overrides, dedup cache, DB fixes, orchestration patches, misc clusters) are included.

```bash
cd /Users/beratcan/Desktop/GithubProjects/hx-ai
npm run test:unit -- --reporter=dot 2>&1 | tail -3
```

**Expected:** `✔ 4298 passed, 0 failed, 5 skipped` (or more passed if tests were added since T06).

---

### TC-03: GSD naming regression check — no GSD leaks in S06-modified source files

**What it verifies:** All S06 source changes maintain HX naming conventions; no GSD strings introduced.

```bash
cd /Users/beratcan/Desktop/GithubProjects/hx-ai
grep -rn '\bgsd\b|\bGSD\b' \
  src/resources/extensions/hx/ \
  src/resources/extensions/ask-user-questions.ts \
  src/resources/extensions/shared/interview-ui.ts \
  src/security-overrides.ts \
  src/cli.ts \
  packages/pi-coding-agent/src/core/settings-manager.ts \
  packages/pi-coding-agent/src/core/resolve-config-value.ts \
  | grep -v 'node_modules' | grep -v '\.test\.' | wc -l
```

**Expected:** `0`

---

### TC-04: Security env vars use HX_ prefix

**What it verifies:** Security override env var names are HX_ALLOWED_COMMAND_PREFIXES and HX_FETCH_ALLOWED_URLS (not GSD_*).

```bash
grep -n 'HX_ALLOWED_COMMAND_PREFIXES\|HX_FETCH_ALLOWED_URLS' \
  /Users/beratcan/Desktop/GithubProjects/hx-ai/src/security-overrides.ts
```

**Expected:** 4 hits: comment lines + process.env reads for both variables.

---

### TC-05: GLOBAL_ONLY_KEYS enforcement present in settings-manager

**What it verifies:** allowedCommandPrefixes and fetchAllowedUrls are declared as global-only (cannot be overridden by project settings).

```bash
grep -n 'GLOBAL_ONLY_KEYS\|allowedCommandPrefixes\|fetchAllowedUrls' \
  /Users/beratcan/Desktop/GithubProjects/hx-ai/packages/pi-coding-agent/src/core/settings-manager.ts | head -20
```

**Expected:** GLOBAL_ONLY_KEYS Set declared containing 'allowedCommandPrefixes' and 'fetchAllowedUrls'. stripGlobalOnlyKeys function present.

---

### TC-06: ask-user-questions dedup cache exports present

**What it verifies:** resetAskUserQuestionsCache and questionSignature are exported from ask-user-questions.ts for hook wiring.

```bash
grep -n 'export.*resetAskUserQuestionsCache\|export.*questionSignature\|turnCache' \
  /Users/beratcan/Desktop/GithubProjects/hx-ai/src/resources/extensions/ask-user-questions.ts
```

**Expected:** At least 2 hits — the turnCache declaration and the resetAskUserQuestionsCache export.

---

### TC-07: STRICT_LOOP_TOOLS guard present for ask_user_questions

**What it verifies:** ask_user_questions has a strict threshold of 1 in the loop guard (blocks on 2nd consecutive call).

```bash
grep -n 'STRICT_LOOP_TOOLS\|MAX_CONSECUTIVE_STRICT\|ask_user_questions' \
  /Users/beratcan/Desktop/GithubProjects/hx-ai/src/resources/extensions/hx/bootstrap/tool-call-loop-guard.ts
```

**Expected:** STRICT_LOOP_TOOLS Set containing "ask_user_questions", MAX_CONSECUTIVE_STRICT = 1.

---

### TC-08: WAL/SHM orphan cleanup present in auto-worktree

**What it verifies:** syncProjectRootToWorktree deletes hx.db-wal and hx.db-shm alongside hx.db.

```bash
grep -n 'wal\|shm\|-wal\|-shm' \
  /Users/beratcan/Desktop/GithubProjects/hx-ai/src/resources/extensions/hx/auto-worktree.ts
```

**Expected:** Lines showing suffix loop iterating over ['-wal', '-shm'] and unlinkSync calls.

---

### TC-09: Atomic decision ID transaction in db-writer

**What it verifies:** Decision ID assignment is wrapped in a DB transaction to prevent TOCTOU race.

```bash
grep -n 'transaction\|nextDecisionId\|saveDecisionToDb' \
  /Users/beratcan/Desktop/GithubProjects/hx-ai/src/resources/extensions/hx/db-writer.ts | head -15
```

**Expected:** transaction() wrapper around the decision ID assignment + upsertDecision calls.

---

### TC-10: COALESCE(NULLIF) pattern in upsertMilestonePlanning

**What it verifies:** Milestone re-plan preserves existing title/status when new values are empty.

```bash
grep -n 'COALESCE\|NULLIF\|title.*=.*COALESCE\|status.*=.*COALESCE' \
  /Users/beratcan/Desktop/GithubProjects/hx-ai/src/resources/extensions/hx/hx-db.ts | head -10
```

**Expected:** COALESCE(NULLIF(:title,''),title) and COALESCE(NULLIF(:status,''),status) in the UPDATE SET clause.

---

### TC-11: sanitize-complete-milestone.ts exists and is wired into db-tools

**What it verifies:** Complete-milestone input sanitization is in place.

```bash
ls /Users/beratcan/Desktop/GithubProjects/hx-ai/src/resources/extensions/hx/bootstrap/sanitize-complete-milestone.ts
grep -n 'sanitize\|sanitizeCompleteMilestoneParams' \
  /Users/beratcan/Desktop/GithubProjects/hx-ai/src/resources/extensions/hx/bootstrap/db-tools.ts | head -5
```

**Expected:** File exists; db-tools.ts imports and applies sanitizeCompleteMilestoneParams.

---

### TC-12: isInsideWorktreesDir safety gate present

**What it verifies:** Worktree teardown cannot rmSync paths outside the .hx/worktrees/ directory.

```bash
grep -n 'isInsideWorktreesDir' \
  /Users/beratcan/Desktop/GithubProjects/hx-ai/src/resources/extensions/hx/worktree-manager.ts \
  /Users/beratcan/Desktop/GithubProjects/hx-ai/src/resources/extensions/hx/auto-worktree.ts
```

**Expected:** Function declared in worktree-manager.ts and applied as guard before rmSync in both files.

---

### TC-13: repair-tool-json utilities present in pi-ai

**What it verifies:** stripXmlParameterTags and repairTruncatedNumber exist as pi-ai utilities.

```bash
ls /Users/beratcan/Desktop/GithubProjects/hx-ai/packages/pi-ai/src/utils/repair-tool-json.ts
grep -n 'stripXmlParameterTags\|repairTruncatedNumber' \
  /Users/beratcan/Desktop/GithubProjects/hx-ai/packages/pi-ai/src/utils/repair-tool-json.ts | head -4
```

**Expected:** File exists; both functions declared and exported.

---

### TC-14: REQUIREMENTS.md shows R010/R014/R017/R018 as validated

**What it verifies:** Final requirement promotion is recorded.

```bash
grep -A 2 'R010\|R017\|R018' /Users/beratcan/Desktop/GithubProjects/hx-ai/.hx/REQUIREMENTS.md | grep 'Status:' | head -8
```

**Expected:** All four requirements show `Status: validated`.

---

### TC-15: Interview-ui notes loop fix present

**What it verifies:** The #3502 regression fix (notes don't re-open when cursor returns to 'None of the above' with notes already filled) is in place.

```bash
grep -n 'notesVisible\|notes\]' \
  /Users/beratcan/Desktop/GithubProjects/hx-ai/src/resources/extensions/shared/interview-ui.ts | head -10
```

**Expected:** The auto-open condition includes `&& !states[currentIdx].notes` guard.

---

### TC-16: ~/.claude/skills added to skill-discovery

**What it verifies:** Claude Code skill directory is scanned for skills.

```bash
grep -n 'claude/skills\|claude.*skills' \
  /Users/beratcan/Desktop/GithubProjects/hx-ai/src/resources/extensions/hx/skill-discovery.ts \
  /Users/beratcan/Desktop/GithubProjects/hx-ai/src/resources/extensions/hx/preferences-skills.ts
```

**Expected:** `~/.claude/skills` present in both files.

---

## Edge Cases

### EC-01: Empty allowedCommandPrefixes env var doesn't override defaults

```bash
grep -n 'filter(Boolean)\|\.length > 0' \
  /Users/beratcan/Desktop/GithubProjects/hx-ai/src/security-overrides.ts
```

**Expected:** Both guards present — empty string after split/trim is filtered out, and the array must be non-empty before calling the setter.

### EC-02: Deferred-slice regex handles both M/S slash and verb pattern

```bash
grep -n 'extractDeferredSliceRef\|M\d\+.*S\d\+\|defer.*S\d\+' \
  /Users/beratcan/Desktop/GithubProjects/hx-ai/src/resources/extensions/hx/db-writer.ts | head -10
```

**Expected:** Two regex patterns in extractDeferredSliceRef — one for M/S slash notation, one for 'defer Sxx from Mxx' verb form.
