# Triage: Workflow Branch Names Are Meaningless for Non-ASCII Input

## Root Cause

The `slugify()` function in `src/resources/extensions/hx/commands-workflow-templates.ts` uses a regex that strips **all non-ASCII characters**:

```ts
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")  // ← strips ş, ö, ü, ğ, ç, ı etc.
    .replace(/^-|-$/g, "")
    .slice(0, 40)
    .replace(/-$/, "");
}
```

When the user enters Turkish (or any non-Latin) text like `"bugfix komutu ile oluşturulan branch ve worktree isimleri"`, the result is `bugfix-komutu-ile-olu-turulan-branch-ve` — the `ş` in `oluşturulan` becomes a dash, producing a broken, hard-to-read slug.

## Reproduction

Input: `/hx start bugfix bugfix komutu ile oluşturulan branch ve worktree isimleri anlamsız oluyor`

Expected branch: `hx/bugfix/bugfix-komutu-ile-olusturulan-branch-ve`
Actual branch: `hx/bugfix/bugfix-komutu-ile-olu-turulan-branch-ve`

## Affected Files

- `src/resources/extensions/hx/commands-workflow-templates.ts` — `slugify()` function (line ~24)

## Proposed Fix

Use Unicode normalization (NFD) + diacritic stripping to transliterate accented/special characters to their ASCII equivalents before the slug regex:

1. `str.normalize('NFD')` — decomposes `ö` → `o` + combining diacritical mark
2. Strip combining diacritical marks (U+0300–U+036F)
3. Handle special cases not covered by NFD (Turkish `ı` → `i`, `ş` → `s`, `ğ` → `g`, etc.)
4. Then apply the existing `[^a-z0-9]+` → `-` replacement

This produces clean, readable ASCII slugs from any Unicode input.
