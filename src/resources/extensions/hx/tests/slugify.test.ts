/**
 * Tests for the slugify() function used to generate branch & artifact names.
 *
 * Verifies that non-ASCII input (Turkish, German, Scandinavian, etc.)
 * produces clean, readable ASCII slugs.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { slugify } from "../commands-workflow-templates.ts";

describe("slugify", () => {
  // ─── Basic ASCII ───────────────────────────────────────────────────────

  it("handles plain ASCII text", () => {
    assert.strictEqual(slugify("fix login button"), "fix-login-button");
  });

  it("strips leading/trailing dashes", () => {
    assert.strictEqual(slugify("  hello world  "), "hello-world");
  });

  it("truncates to 40 chars", () => {
    const long = "this is a very long description that should be truncated at forty characters";
    const result = slugify(long);
    assert.ok(result.length <= 40, `slug too long: ${result.length}`);
    assert.ok(!result.endsWith("-"), "should not end with dash after truncation");
  });

  it("collapses multiple non-alnum chars into one dash", () => {
    assert.strictEqual(slugify("a!!!b???c"), "a-b-c");
  });

  // ─── Turkish characters ────────────────────────────────────────────────

  it("transliterates Turkish ş → s", () => {
    assert.strictEqual(slugify("oluşturulan"), "olusturulan");
  });

  it("transliterates Turkish ğ → g", () => {
    assert.strictEqual(slugify("değişiklik"), "degisiklik");
  });

  it("transliterates Turkish ı → i", () => {
    assert.strictEqual(slugify("anlamsız"), "anlamsiz");
  });

  it("transliterates Turkish ç → c", () => {
    assert.strictEqual(slugify("çalışma"), "calisma");
  });

  it("transliterates Turkish ö → o, ü → u", () => {
    assert.strictEqual(slugify("gönüllü"), "gonullu");
  });

  it("handles a full Turkish sentence (the original bug)", () => {
    const input = "bugfix komutu ile oluşturulan branch ve worktree isimleri anlamsız oluyor";
    const result = slugify(input);
    // Should NOT contain broken fragments like "olu-turulan"
    assert.ok(result.includes("olusturulan"), `expected 'olusturulan' in: ${result}`);
    // The full sentence gets truncated at 40 chars, so "anlamsiz" may not appear
    assert.ok(!result.includes("--"), `should not have double dashes: ${result}`);
    // Verify no dash-broken Turkish words (the original bug symptom)
    assert.ok(!result.includes("olu-turulan"), `should NOT have broken 'olu-turulan': ${result}`);
  });

  // ─── Other non-ASCII scripts ───────────────────────────────────────────

  it("transliterates German ß → ss", () => {
    assert.strictEqual(slugify("straße"), "strasse");
  });

  it("transliterates accented Latin (NFD path): é → e, ñ → n", () => {
    assert.strictEqual(slugify("café"), "cafe");
    assert.strictEqual(slugify("señor"), "senor");
  });

  it("transliterates Scandinavian ø → o, æ → ae", () => {
    assert.strictEqual(slugify("fjørd"), "fjord");
    assert.strictEqual(slugify("bæk"), "baek");
  });

  it("transliterates Polish ł → l", () => {
    assert.strictEqual(slugify("łódź"), "lodz");
  });

  // ─── Edge cases ────────────────────────────────────────────────────────

  it("returns empty string for all non-Latin characters with no mapping", () => {
    // CJK characters have no transliteration — they get stripped
    const result = slugify("日本語テスト");
    assert.strictEqual(result, "");
  });

  it("handles mixed ASCII and non-ASCII", () => {
    assert.strictEqual(slugify("fix: oluşturulan branch"), "fix-olusturulan-branch");
  });
});
