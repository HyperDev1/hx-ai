# Triage: Browser Tool Slowness

## Bug Description
Agent browser tool calls (browser_click, browser_type, browser_navigate, etc.) take excessively long, causing noticeable lag during UI verification workflows.

## Root Causes

### RC1: Hardcoded 300ms sleep in browser_navigate (navigation.ts:35)
```ts
await new Promise(resolve => setTimeout(resolve, 300));
```
A fixed 300ms delay after `networkidle` wait, on top of the adaptive settle that already handles DOM quiet detection. This is pure waste — settle already covers it.

### RC2: networkidle timeout too high (navigation.ts:34,113,157,192)
```ts
await p.waitForLoadState("networkidle", { timeout: 5000 });
```
4 call sites in navigation.ts all use 5000ms timeout. Pages with analytics, WebSocket, SSE, or long-polling connections regularly hit this full 5s wait since networkidle requires zero in-flight requests for 500ms. Caught and ignored anyway (`catch(() => {})`), so the timeout just wastes time.

### RC3: Redundant evaluate round-trips per action (interaction.ts)
Every `browser_click` makes **4 separate `evaluate()` calls** before settle:
1. `captureCompactPageState(before)` — 1 evaluate
2. `captureClickTargetState(before)` — 1 evaluate  
3. `captureCompactPageState(after)` — 1 evaluate
4. `captureClickTargetState(after)` — 1 evaluate

Before+after target state could be captured inside the respective compact state call, cutting 4 → 2 evaluates.

### RC4: Settle polling thresholds are conservative (settle.ts:105-115)
- `ZERO_MUTATION_THRESHOLD_MS = 60` — waits 60ms before even checking zero-mutation shortcut
- `ZERO_MUTATION_QUIET_MS = 30` — then requires 30ms additional quiet
- `baseQuietWindowMs = 100` — normal quiet window is 100ms
- `pollMs = 40` — poll interval of 40ms

Best-case settle: 40ms (first poll) + 60ms (threshold) + 30ms (quiet) = **130ms minimum**. For static pages where click doesn't cause any DOM changes, this is unnecessarily high.

### RC5: sharp metadata read on every screenshot (capture.ts:171)
```ts
const meta = await sharp(buffer).metadata();
```
Even small screenshots (800×600) hit `sharp(buffer).metadata()` to check dimensions before deciding to skip resize. This is a CPU-bound operation that adds ~5-10ms per screenshot call.

## Affected Files
- `src/resources/extensions/browser-tools/tools/navigation.ts` — RC1, RC2
- `src/resources/extensions/browser-tools/settle.ts` — RC4
- `src/resources/extensions/browser-tools/capture.ts` — RC5
- `src/resources/extensions/browser-tools/tools/interaction.ts` — RC3

## Blast Radius
All browser_* tool calls are affected. The fixes are purely performance — no behavior change for correct operations.

## Proposed Fix (scoped to low-risk, high-impact)
1. **Remove 300ms sleep** from browser_navigate (RC1) — zero risk
2. **Reduce networkidle timeout** 5000ms → 2000ms (RC2) — already caught, non-fatal
3. **Tighten settle thresholds** (RC4) — reduce zero-mutation path to ~60ms total
4. **Skip sharp metadata for small buffers** (RC5) — use buffer byte size heuristic
5. **Merge captureClickTargetState into captureCompactPageState** (RC3) — reduces evaluate round-trips

Items 1-4 are safe, surgical. Item 5 is slightly more involved (refactor), but mechanically straightforward.
