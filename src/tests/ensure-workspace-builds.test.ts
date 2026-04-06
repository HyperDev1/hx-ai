import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync, utimesSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { newestSrcMtime, detectStalePackages } = require("../../scripts/ensure-workspace-builds.cjs");

describe("newestSrcMtime", () => {
  let tmp: string;

  beforeEach(() => { tmp = mkdtempSync(join(tmpdir(), "hx-mtime-test-")); });
  afterEach(() => { rmSync(tmp, { recursive: true, force: true }); });

  it("returns 0 for a non-existent directory", () => {
    assert.equal(newestSrcMtime(join(tmp, "does-not-exist")), 0);
  });

  it("returns 0 when directory has no .ts files", () => {
    writeFileSync(join(tmp, "index.js"), "");
    writeFileSync(join(tmp, "config.json"), "");
    assert.equal(newestSrcMtime(tmp), 0);
  });

  it("returns the mtime of a single .ts file", () => {
    const file = join(tmp, "index.ts");
    writeFileSync(file, "");
    const mtime = new Date("2024-01-15T10:00:00Z");
    utimesSync(file, mtime, mtime);
    assert.equal(newestSrcMtime(tmp), mtime.getTime());
  });

  it("returns the max mtime across multiple .ts files", () => {
    const older = join(tmp, "a.ts");
    const newer = join(tmp, "b.ts");
    writeFileSync(older, "");
    writeFileSync(newer, "");
    utimesSync(older, new Date("2024-01-01T00:00:00Z"), new Date("2024-01-01T00:00:00Z"));
    utimesSync(newer, new Date("2024-06-01T00:00:00Z"), new Date("2024-06-01T00:00:00Z"));
    assert.equal(newestSrcMtime(tmp), new Date("2024-06-01T00:00:00Z").getTime());
  });

  it("recurses into subdirectories", () => {
    const subdir = join(tmp, "nested", "deep");
    mkdirSync(subdir, { recursive: true });
    const file = join(subdir, "util.ts");
    writeFileSync(file, "");
    const mtime = new Date("2024-03-01T00:00:00Z");
    utimesSync(file, mtime, mtime);
    assert.equal(newestSrcMtime(tmp), mtime.getTime());
  });

  it("skips node_modules entirely", () => {
    const nm = join(tmp, "node_modules", "some-pkg");
    mkdirSync(nm, { recursive: true });
    const nmFile = join(nm, "index.ts");
    writeFileSync(nmFile, "");
    const future = new Date("2099-01-01T00:00:00Z");
    utimesSync(nmFile, future, future);
    assert.equal(newestSrcMtime(tmp), 0);
  });
});

describe("detectStalePackages", () => {
  let tmp: string;

  beforeEach(() => { tmp = mkdtempSync(join(tmpdir(), "hx-stale-test-")); });
  afterEach(() => { rmSync(tmp, { recursive: true, force: true }); });

  it("returns [] when no .git directory exists (npm tarball guard)", () => {
    // No .git in tmp — simulates a published npm tarball install
    const packages = mkdirSync(join(tmp, "packages"), { recursive: true });
    const result = detectStalePackages(tmp, ["some-pkg"]);
    assert.deepEqual(result, [], "Should return empty array when there is no .git directory");
  });

  it("returns stale packages when dist/index.js is missing", () => {
    // Create .git to pass the guard
    mkdirSync(join(tmp, ".git"), { recursive: true });
    mkdirSync(join(tmp, "packages", "my-pkg", "src"), { recursive: true });
    // No dist/ — package is stale
    const result = detectStalePackages(tmp, ["my-pkg"]);
    assert.deepEqual(result, ["my-pkg"]);
  });

  it("returns [] when all dists are up to date", () => {
    mkdirSync(join(tmp, ".git"), { recursive: true });
    mkdirSync(join(tmp, "packages", "my-pkg", "src"), { recursive: true });
    mkdirSync(join(tmp, "packages", "my-pkg", "dist"), { recursive: true });

    // Write src file with old timestamp
    const srcFile = join(tmp, "packages", "my-pkg", "src", "index.ts");
    writeFileSync(srcFile, "");
    const oldDate = new Date("2024-01-01T00:00:00Z");
    utimesSync(srcFile, oldDate, oldDate);

    // Write dist file with newer timestamp
    const distFile = join(tmp, "packages", "my-pkg", "dist", "index.js");
    writeFileSync(distFile, "");
    const newDate = new Date("2024-06-01T00:00:00Z");
    utimesSync(distFile, newDate, newDate);

    const result = detectStalePackages(tmp, ["my-pkg"]);
    assert.deepEqual(result, []);
  });

  it("returns stale packages when src/ is newer than dist/index.js", () => {
    mkdirSync(join(tmp, ".git"), { recursive: true });
    mkdirSync(join(tmp, "packages", "my-pkg", "src"), { recursive: true });
    mkdirSync(join(tmp, "packages", "my-pkg", "dist"), { recursive: true });

    // Write dist file with old timestamp
    const distFile = join(tmp, "packages", "my-pkg", "dist", "index.js");
    writeFileSync(distFile, "");
    const oldDate = new Date("2024-01-01T00:00:00Z");
    utimesSync(distFile, oldDate, oldDate);

    // Write src file with newer timestamp
    const srcFile = join(tmp, "packages", "my-pkg", "src", "index.ts");
    writeFileSync(srcFile, "");
    const newDate = new Date("2024-06-01T00:00:00Z");
    utimesSync(srcFile, newDate, newDate);

    const result = detectStalePackages(tmp, ["my-pkg"]);
    assert.deepEqual(result, ["my-pkg"]);
  });
});
