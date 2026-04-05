---
estimated_steps: 33
estimated_files: 4
skills_used: []
---

# T04: Migrate targeted silent catch blocks + write silent-catch-diagnostics.test.ts

Add logWarning calls to 5 specific empty/silent catch blocks across auto.ts, auto/phases.ts, and bootstrap/register-hooks.ts, then write a static analysis test that proves the migration.

## Steps

1. **auto.ts** — widen the workflow-logger import. Current: `import { setLogBasePath } from './workflow-logger.js'`. Change to: `import { setLogBasePath, logWarning } from './workflow-logger.js'`.

2. **auto.ts line ~664** — catch block after `milestoneComplete = wtSummaryPath !== null`:
   - Find the catch block: `} catch {` followed by `// Non-fatal — fall through to preserveBranch path`
   - Change to: `} catch (e) {\n  logWarning('engine', 'Failed to check milestone SUMMARY existence', { milestone: s.currentMilestoneId ?? 'unknown', error: String(e) });\n}`

3. **auto.ts line ~865** — catch block after `writeFileSync(join(runtimeDir, 'paused-session.json'), ...)`:
   - Find: `} catch {` followed by `// Non-fatal — resume will still work via full bootstrap, just without worktree context`
   - Change to: `} catch (e) {\n  logWarning('engine', 'Failed to write paused-session.json', { error: String(e) });\n}`

4. **auto.ts line ~873** — catch block around `closeoutUnit(...)` call:
   - Find: `} catch {` followed by `// Non-fatal — best-effort closeout on pause`
   - Change to: `} catch (e) {\n  logWarning('engine', 'Unit closeout on pause threw', { error: String(e) });\n}`

5. **auto/phases.ts line ~1214** — catch block after phase anchor write:
   - Find: `} catch { /* non-fatal — anchor is advisory */ }`
   - Change to: `} catch (e) { logWarning('engine', 'Phase anchor write failed', { error: String(e) }); }`
   - NOTE: phases.ts already imports `logWarning` from `'../workflow-logger.js'` at line 31 — no import change needed.

6. **bootstrap/register-hooks.ts line ~51** — preference load catch:
   - Find: `} catch { /* non-fatal */ }` in the preference load block (around the `show_token_cost` section)
   - Add import: `import { logWarning } from '../workflow-logger.js';` at the top of the file (after existing imports)
   - Change catch to: `} catch (e) { logWarning('engine', 'Failed to load preferences for show_token_cost', { error: String(e) }); }`

7. Create `src/resources/extensions/hx/tests/silent-catch-diagnostics.test.ts`:
   - Use `readFileSync` to read each modified source file
   - Assert the OLD silent catch patterns are GONE:
     - auto.ts: does NOT contain `catch {\n          // Non-fatal — fall through to preserveBranch path`
     - auto.ts: does NOT contain `catch {\n    // Non-fatal — resume will still work via full bootstrap`
     - auto.ts: does NOT contain `catch {\n      // Non-fatal — best-effort closeout on pause`
     - phases.ts: does NOT contain `catch { /* non-fatal — anchor is advisory */ }`
     - register-hooks.ts: does NOT contain first `catch { /* non-fatal */ }` in the preference block
   - Assert the NEW patterns ARE present:
     - phases.ts: contains `logWarning('engine', 'Phase anchor write failed'`
     - auto.ts: contains `logWarning('engine', 'Failed to check milestone SUMMARY existence'`
     - register-hooks.ts: contains `logWarning('engine', 'Failed to load preferences for show_token_cost'`

8. Run `npm run test:unit` and `npx tsc --noEmit`. Expect no regressions.

## Inputs

- ``src/resources/extensions/hx/auto.ts` — 3 catch blocks at ~lines 664, 865, 873`
- ``src/resources/extensions/hx/auto/phases.ts` — 1 catch block at ~line 1214`
- ``src/resources/extensions/hx/bootstrap/register-hooks.ts` — 1 catch block at ~line 51`

## Expected Output

- ``src/resources/extensions/hx/auto.ts` — logWarning import widened; 3 catch blocks now emit logWarning`
- ``src/resources/extensions/hx/auto/phases.ts` — anchor write catch now emits logWarning`
- ``src/resources/extensions/hx/bootstrap/register-hooks.ts` — workflow-logger imported; preference load catch now emits logWarning`
- ``src/resources/extensions/hx/tests/silent-catch-diagnostics.test.ts` — static analysis test with 8 assertions`

## Verification

npm run test:unit 2>&1 | grep -E 'silent-catch|passed|failed' | tail -5; npx tsc --noEmit; grep -c "logWarning.*Phase anchor write failed" src/resources/extensions/hx/auto/phases.ts

## Observability Impact

5 previously silent failure modes now emit [hx:engine] WARN to stderr — Failed to check milestone SUMMARY existence, Failed to write paused-session.json, Unit closeout on pause threw, Phase anchor write failed, Failed to load preferences for show_token_cost
