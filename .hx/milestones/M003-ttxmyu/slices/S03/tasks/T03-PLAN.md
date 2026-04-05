---
estimated_steps: 57
estimated_files: 1
skills_used: []
---

# T03: Expand before_provider_request hook with observation masking and tool truncation

Rewrite the `before_provider_request` handler in `register-hooks.ts` to add observation masking and tool-result truncation before the existing service tier logic.

**Critical constraint:** The current handler ends with `return payload` only after the service-tier block. After this change, the entire handler must return `payload` (not bare `return`) at the end. Bare `return` drops the mutation — the service tier won't apply after masking.

The full new handler body (replace everything between `pi.on('before_provider_request', async (event) => {` and its closing `});`):

```typescript
pi.on("before_provider_request", async (event) => {
  const payload = event.payload as Record<string, unknown> | null;
  if (!payload || typeof payload !== "object") return;

  // ── Observation Masking ──────────────────────────────────────────
  if (isAutoActive()) {
    try {
      const { loadEffectiveHXPreferences } = await import("../preferences.js");
      const prefs = loadEffectiveHXPreferences();
      const cmConfig = prefs?.preferences.context_management;

      if (cmConfig?.observation_masking !== false) {
        const keepTurns = cmConfig?.observation_mask_turns ?? 8;
        const { createObservationMask } = await import("../context-masker.js");
        const mask = createObservationMask(keepTurns);
        const messages = payload.messages;
        if (Array.isArray(messages)) {
          payload.messages = mask(messages);
        }
      }

      // Tool result truncation (immutable — create new objects)
      const maxChars = cmConfig?.tool_result_max_chars ?? 800;
      const msgs = payload.messages;
      if (Array.isArray(msgs)) {
        payload.messages = msgs.map((msg: Record<string, unknown>) => {
          if (msg?.role === "toolResult" && Array.isArray(msg.content)) {
            const blocks = msg.content as Array<Record<string, unknown>>;
            const totalLen = blocks.reduce((sum: number, b) =>
              sum + (typeof b.text === "string" ? b.text.length : 0), 0);
            if (totalLen > maxChars) {
              const truncated = blocks.map(b => {
                if (typeof b.text === "string" && b.text.length > maxChars) {
                  return { ...b, text: b.text.slice(0, maxChars) + "\n…[truncated]" };
                }
                return b;
              });
              return { ...msg, content: truncated };
            }
          }
          return msg;
        });
      }
    } catch { /* non-fatal */ }
  }

  // ── Service Tier ─────────────────────────────────────────────────
  const modelId = event.model?.id;
  if (!modelId) return payload;
  const { getEffectiveServiceTier, supportsServiceTier } = await import("../service-tier.js");
  const tier = getEffectiveServiceTier();
  if (!tier || !supportsServiceTier(modelId)) return payload;
  payload.service_tier = tier;
  return payload;
});
```

The original handler structure to replace spans from the `pi.on('before_provider_request'` line through its closing `});` — read the file first to get exact text for the Edit tool.

## Inputs

- `src/resources/extensions/hx/bootstrap/register-hooks.ts`
- `src/resources/extensions/hx/context-masker.ts`
- `src/resources/extensions/hx/preferences.ts`

## Expected Output

- `src/resources/extensions/hx/bootstrap/register-hooks.ts`

## Verification

npx tsc --noEmit && grep -c 'createObservationMask' src/resources/extensions/hx/bootstrap/register-hooks.ts && grep -rn '\bGSD\b\|\bgsd\b' src/resources/extensions/hx/bootstrap/register-hooks.ts

## Observability Impact

Masking and truncation are wrapped in try/catch (non-fatal). Service tier still applies via return payload. No new logs.
