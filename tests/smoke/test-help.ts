import { execFileSync } from "child_process";

const binary = process.env.GSD_SMOKE_BINARY || "npx";
const args = process.env.GSD_SMOKE_BINARY
  ? ["--help"]
  : ["hx-pi", "--help"];

const output = execFileSync(binary, args, {
  encoding: "utf8",
  timeout: 30_000,
});

const lower = output.toLowerCase();

if (!lower.includes("hx")) {
  console.error(`Help output does not contain "hx": "${output}"`);
  process.exit(1);
}

if (!lower.includes("usage")) {
  console.error(`Help output does not contain "usage": "${output}"`);
  process.exit(1);
}
