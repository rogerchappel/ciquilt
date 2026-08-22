import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { load } from "js-yaml";

const workflow = load(await readFile(".github/workflows/release.yml", "utf8"));
const dryRunWorkflow = load(
  await readFile(".github/workflows/release-dry-run.yml", "utf8"),
);
const steps = workflow.jobs.release.steps;
const stepIndex = (name) => steps.findIndex((step) => step.name === name);

assert.equal(workflow.permissions["id-token"], "write");
const setupNode = steps.find((step) => step.uses?.startsWith("actions/setup-node@"));
assert.equal(setupNode?.with?.["registry-url"], "https://registry.npmjs.org");

const checks = stepIndex("Run release checks");
const pack = stepIndex("Build package");
const npmUpgrade = stepIndex("Install trusted publishing npm");
const publish = stepIndex("Publish package to npm");
const githubRelease = stepIndex("Create GitHub release");

assert.ok(checks >= 0, "release workflow must run release checks");
assert.ok(npmUpgrade > -1, "release workflow must install the pinned npm CLI");
assert.ok(checks > npmUpgrade, "release checks must use the pinned npm CLI");
assert.ok(pack > checks, "package must be built after release checks");
assert.ok(publish > pack, "npm publication must follow package creation");
assert.ok(
  githubRelease > publish,
  "GitHub release must only be created after npm publication succeeds",
);
assert.equal(steps[npmUpgrade].run, "npm install --global npm@11.5.1");
assert.equal(steps[pack].id, "pack");
assert.match(steps[pack].run, /npm pack --json/);
assert.match(steps[pack].run, /echo "filename=\$package_file" >> "\$GITHUB_OUTPUT"/);

const artifactReference = "${{ steps.pack.outputs.filename }}";
assert.equal(steps[publish].run, `npm publish "${artifactReference}"`);
assert.match(steps[githubRelease].run, new RegExp(`"\\$\\{\\{ steps\\.pack\\.outputs\\.filename \\}\\}"$`));
assert.doesNotMatch(steps[publish].run, /\*/);
assert.doesNotMatch(steps[githubRelease].run, /\*\.tgz/);

const dryRunSteps = dryRunWorkflow.jobs["dry-run"].steps;
const dryRunUpgrade = dryRunSteps.findIndex(
  (step) => step.name === "Install trusted publishing npm",
);
const dryRunChecks = dryRunSteps.findIndex(
  (step) => step.name === "Run release checks",
);
assert.ok(dryRunUpgrade > -1, "dry run must install the pinned npm CLI");
assert.equal(
  dryRunSteps[dryRunUpgrade].run,
  "npm install --global npm@11.5.1",
);
assert.ok(dryRunChecks > dryRunUpgrade, "dry-run checks must use pinned npm");

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
