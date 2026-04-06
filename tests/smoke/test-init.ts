import { execFileSync } from "child_process";
import { mkdtempSync, existsSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

// Skip in non-TTY environments (CI containers) — init requires interactive mode
if (!process.stdin.isTTY && process.env.CI) {
  console.log("  SKIP  test-init (no TTY in CI)");
  process.exit(0);
}

const tmpDir = mkdtempSync(join(tmpdir(), "hx-smoke-init-"));

try {
  const binary = process.env.HX_SMOKE_BINARY || "npx";
  const args = process.env.HX_SMOKE_BINARY
    ? ["init"]
    : ["hx-pi", "init"];

  execFileSync(binary, args, {
    encoding: "utf8",
    timeout: 30_000,
    cwd: tmpDir,
    env: { ...process.env, HX_NON_INTERACTIVE: "1" },
  });

  const hxDir = join(tmpDir, ".hx");
  if (!existsSync(hxDir)) {
    console.error(`.hx directory not created in ${tmpDir}`);
    process.exit(1);
  }
} finally {
  rmSync(tmpDir, { recursive: true, force: true });
}
