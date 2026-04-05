---
estimated_steps: 24
estimated_files: 1
skills_used: []
---

# T06: Final Verification + Requirement Status Updates

Run the full verification pass and update requirement statuses.

Steps:
1. Run `npx tsc --noEmit` — must exit 0. Fix any remaining type errors.
2. Run `npm run test:unit` — must pass ≥ 4215 (new tests increase count), 0 failed, 5 skipped. Fix any failures.
3. Run GSD grep across all modified files:
   ```bash
   grep -rn '\bgsd\b|\bGSD\b' \
     src/resources/extensions/hx/ \
     src/resources/extensions/ask-user-questions.ts \
     src/resources/extensions/shared/interview-ui.ts \
     src/security-overrides.ts \
     src/cli.ts \
     packages/pi-coding-agent/src/core/settings-manager.ts \
     packages/pi-coding-agent/src/core/resolve-config-value.ts \
     | grep -v 'node_modules' | grep -v '.test.' | wc -l
   ```
   Must return 0. Fix any GSD leaks.
4. Verify the 2 security env vars use HX_ prefix: `grep -n 'HX_ALLOWED_COMMAND_PREFIXES\|HX_FETCH_ALLOWED_URLS' src/security-overrides.ts` — must return 2 hits.
5. Update `.hx/REQUIREMENTS.md` requirement statuses to validated:
   - R010: All upstream v2.59.0→v2.63.0 changes applied — validated
   - R014: GSD→HX naming — 0 new GSD hits introduced in S06 — validated
   - R017: All S06 bugfixes applied — validated
   - R018: Final tsc clean + test pass — validated
   Note: Update REQUIREMENTS.md directly (the DB may not have these requirements seeded; check with `sqlite3 .hx/hx.db 'SELECT COUNT(*) FROM requirements;'` first — if > 0, use hx_requirement_update tool; if 0, edit REQUIREMENTS.md directly).

## Inputs

- `src/security-overrides.ts`
- `src/resources/extensions/hx/tests/ask-user-questions-dedup.test.ts`
- `src/resources/extensions/hx/tests/tool-call-loop-guard.test.ts`
- `src/resources/extensions/hx/tests/worktree-db-respawn-truncation.test.ts`
- `src/resources/extensions/hx/tests/deferred-slice-dispatch.test.ts`
- `src/resources/extensions/hx/tests/steer-worktree-path.test.ts`
- `src/resources/extensions/hx/tests/dashboard-model-label-ordering.test.ts`
- `.hx/REQUIREMENTS.md`

## Expected Output

- `.hx/REQUIREMENTS.md`

## Verification

npx tsc --noEmit && npm run test:unit -- --reporter=dot 2>&1 | tail -3 && grep -rn '\bgsd\b|\bGSD\b' src/resources/extensions/hx/ src/security-overrides.ts packages/pi-coding-agent/src/core/settings-manager.ts packages/pi-coding-agent/src/core/resolve-config-value.ts | grep -v node_modules | grep -v '.test.' | wc -l
