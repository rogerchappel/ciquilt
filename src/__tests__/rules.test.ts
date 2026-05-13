import assert from "node:assert/strict";
import { test } from "node:test";
import { scan } from "../scan.js";

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
