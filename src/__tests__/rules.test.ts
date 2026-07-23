import assert from "node:assert/strict";
import { test } from "node:test";
import { checkShellInjection } from "../rules/shell.js";
import { scan } from "../scan.js";
import type { WorkflowSummary } from "../types.js";

test("scan emits core MVP risk findings", async () => {
  const report = await scan({ root: "tests/fixtures/workflows" });
  const ruleIds = report.findings.map((finding) => finding.ruleId);
  for (const rule of [
    "broad-permissions",
    "pull-request-target-risk",
    "unpinned-action",
    "broad-cache-restore-key",
    "missing-timeout",
    "shell-expression-injection",
  ]) {
    assert.ok(ruleIds.includes(rule), `expected ${rule}`);
  }
});

test("action source rules distinguish local Docker and remote references", async () => {
  const report = await scan({ root: "tests/fixtures/workflows" });
  const findings = report.findings.filter((finding) => finding.workflow.endsWith("action-sources.yml"));
  const pinning = findings.filter((finding) => finding.ruleId === "unpinned-action");
  assert.equal(pinning.length, 2);
  assert.deepEqual(pinning.map((finding) => finding.sourceLine), [12, 16]);
  assert.match(pinning[0].message, /mutable Docker image reference/);
  assert.match(pinning[1].message, /actions\/setup-node@v4 uses mutable ref v4/);
  assert.ok(findings.every((finding) => !finding.message.includes("./local-action")));

  const shell = findings.find((finding) => finding.ruleId === "shell-expression-injection");
  assert.equal(shell?.sourceLine, 20);
});

test("shell injection checks every consecutive expression", () => {
  const workflow: WorkflowSummary = {
    file: ".github/workflows/issues.yml",
    name: "Issue workflow",
    triggers: [],
    permissions: null,
    jobs: [{
      id: "report",
      needs: [],
      permissions: null,
      steps: [
        { index: 0, run: "echo ${{ github.event.issue.title }}" },
        { index: 1, run: "echo ${{ github.event.issue.title }}" },
      ],
    }],
  };

  const findings = checkShellInjection(workflow);

  assert.deepEqual(findings.map((finding) => finding.stepIndex), [0, 1]);
});
