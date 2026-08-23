import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import test from "node:test";
import { scan } from "../scan.js";

const execFileAsync = promisify(execFile);
const packageJson = JSON.parse(
  await readFile(new URL("../../package.json", import.meta.url), "utf8"),
) as { version: string };

test("CLI version matches the package version", async () => {
  const { stdout } = await execFileAsync(process.execPath, [
    new URL("../cli.js", import.meta.url).pathname,
    "--version",
  ]);

  assert.equal(stdout, `${packageJson.version}\n`);
});

test("scan report version matches the package version", async () => {
  const report = await scan({
    root: new URL("../../tests/fixtures/workflows", import.meta.url).pathname,
  });

  assert.equal(report.version, packageJson.version);
});
