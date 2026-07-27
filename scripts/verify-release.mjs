import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { load } from "js-yaml";

const workflow = load(await readFile(".github/workflows/release.yml", "utf8"));
const steps = workflow.jobs.release.steps;
const stepIndex = (name) => steps.findIndex((step) => step.name === name);

const checks = stepIndex("Run release checks");
const pack = stepIndex("Build package");
const publish = stepIndex("Publish package to npm");
const githubRelease = stepIndex("Create GitHub release");

assert.ok(checks >= 0, "release workflow must run release checks");
assert.ok(pack > checks, "package must be built after release checks");
assert.ok(publish > pack, "npm publication must follow package creation");
assert.ok(
  githubRelease > publish,
  "GitHub release must only be created after npm publication succeeds",
);
assert.match(steps[publish].run, /^npm publish \*\.tgz$/m);

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
assert.equal(packageJson.publishConfig?.access, "public");
assert.equal(packageJson.publishConfig?.provenance, true);

const output = execFileSync(
  "npm",
  ["pack", "--dry-run", "--json", "--ignore-scripts"],
  { encoding: "utf8" },
);
const [{ files }] = JSON.parse(output);
const paths = new Set(files.map(({ path }) => path));

for (const required of [
  "dist/cli.js",
  "dist/index.js",
  "dist/index.d.ts",
  "README.md",
  "LICENSE",
]) {
  assert.ok(paths.has(required), `packed artifact must contain ${required}`);
}

console.log("release workflow and package contract verified");
