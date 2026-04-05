---
estimated_steps: 22
estimated_files: 2
skills_used: []
---

# T02: Add ContextManagementConfig to preferences

Three files need purely additive changes. No logic changes.

**preferences-types.ts** (`src/resources/extensions/hx/preferences-types.ts`):
1. Add `ContextManagementConfig` interface before `HXPreferences` (or near the other config interfaces):
```typescript
export interface ContextManagementConfig {
  observation_masking?: boolean;          // default: true
  observation_mask_turns?: number;        // default: 8, range: 1-50
  compaction_threshold_percent?: number;  // default: 0.70, range: 0.5-0.95
  tool_result_max_chars?: number;         // default: 800, range: 200-10000
}
```
2. Add `'context_management'` to the `KNOWN_PREFERENCE_KEYS` Set
3. Add `context_management?: ContextManagementConfig` to the `HXPreferences` interface

**preferences.ts** (`src/resources/extensions/hx/preferences.ts`):
1. Import `ContextManagementConfig` from `./preferences-types.js` (it may already be in a barrel re-export — check first)
2. Add `context_management` merge to the `mergePreferences` function:
```typescript
context_management: (base.context_management || override.context_management)
  ? { ...(base.context_management ?? {}), ...(override.context_management ?? {}) } as ContextManagementConfig
  : undefined,
```

Note: `ContextManagementConfig` may already be exported via the preferences-types re-export in preferences.ts — check the existing export list before adding a new import.

## Inputs

- `src/resources/extensions/hx/preferences-types.ts`
- `src/resources/extensions/hx/preferences.ts`

## Expected Output

- `src/resources/extensions/hx/preferences-types.ts`
- `src/resources/extensions/hx/preferences.ts`

## Verification

npx tsc --noEmit && npm run test:unit -- --grep 'preferences' 2>&1 | tail -5
