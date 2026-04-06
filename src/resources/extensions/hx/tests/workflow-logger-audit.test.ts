// HX Extension — Workflow Logger Audit Tests
// Verifies that audit-log.jsonl only receives error-severity entries.
// The severity guard was added in M003-ttxmyu/S04/T01 to keep the on-disk
// audit log free of noisy warn entries — only actionable errors are persisted.

import { describe, test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { makeTempDir, cleanup } from "./test-utils.ts";
import {
  logWarning,
  logError,
  readAuditLog,
  setLogBasePath,
  _resetLogs,
} from "../workflow-logger.ts";

describe("workflow-logger-audit", () => {
  let dir: string;

  beforeEach(() => {
    dir = makeTempDir("wl-audit-guard-");
    _resetLogs();
    setLogBasePath(dir);
  });

  afterEach(() => {
    setLogBasePath("");
    cleanup(dir);
  });

  test("logWarning does NOT write to audit-log.jsonl", () => {
    logWarning("engine", "this is a warning");

    const auditPath = join(dir, ".hx", "audit-log.jsonl");
    assert.equal(
      existsSync(auditPath),
      false,
      "audit-log.jsonl should NOT exist after a warning-only log",
    );
  });

  test("logError DOES write to audit-log.jsonl", () => {
    logError("engine", "this is an error", { detail: "something went wrong" });

    const auditPath = join(dir, ".hx", "audit-log.jsonl");
    assert.ok(existsSync(auditPath), "audit-log.jsonl should exist after logError");

    const entries = readAuditLog(dir);
    assert.equal(entries.length, 1);
    assert.equal(entries[0].severity, "error");
    assert.equal(entries[0].component, "engine");
    assert.equal(entries[0].message, "this is an error");
    assert.deepEqual(entries[0].context, { detail: "something went wrong" });
  });

  test("mixed log sequence: readAuditLog returns only the error entries", () => {
    logWarning("engine", "warn 1");
    logError("intercept", "error 1");
    logWarning("projection", "warn 2");
    logError("tool", "error 2");
    logWarning("manifest", "warn 3");

    const entries = readAuditLog(dir);
    assert.equal(entries.length, 2, "only 2 error entries should be on disk");
    assert.equal(entries[0].severity, "error");
    assert.equal(entries[0].message, "error 1");
    assert.equal(entries[1].severity, "error");
    assert.equal(entries[1].message, "error 2");
  });

  test("readAuditLog returns [] when no errors logged (only warnings)", () => {
    logWarning("engine", "warn only 1");
    logWarning("projection", "warn only 2");

    const auditPath = join(dir, ".hx", "audit-log.jsonl");
    assert.equal(
      existsSync(auditPath),
      false,
      "audit-log.jsonl should not be created for warnings",
    );

    const entries = readAuditLog(dir);
    assert.deepEqual(entries, [], "readAuditLog should return empty array when no errors exist");
  });
});
