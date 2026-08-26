import assert from "node:assert/strict";
import { test } from "node:test";
import { render } from "../render.js";
import { scan } from "../scan.js";
import type { OutputFormat } from "../types.js";

test("renderers emit markdown json and sarif", async () => {
  const report = await scan({ root: "tests/fixtures/workflows" });
  const markdown = render(report, "markdown");
  const json = JSON.parse(render(report, "json"));
  const sarif = JSON.parse(render(report, "sarif"));
  assert.match(markdown, /# ciquilt report/);
  assert.equal(json.tool, "ciquilt");
  assert.equal(sarif.version, "2.1.0");
  assert.ok(sarif.runs[0].results.length > 0);

  const actionFindings = json.findings.filter(
    (finding: { workflow: string }) => finding.workflow.endsWith("action-sources.yml"),
  );
  assert.deepEqual(
    actionFindings
      .filter((finding: { ruleId: string }) => finding.ruleId === "unpinned-action")
      .map((finding: { sourceLine: number }) => finding.sourceLine),
    [12, 16],
  );
  assert.match(markdown, /action-sources\.yml:20 \/ scan \/ step 6/);
  assert.match(markdown, /uses: `rogerchappel\/shared-workflows\/\.github\/workflows\/test\.yml@main`/);
  assert.doesNotMatch(markdown, /Job invoke-shared can run until GitHub's default timeout/);

  const actionResults = sarif.runs[0].results.filter(
    (result: { locations: Array<{ physicalLocation: { artifactLocation: { uri: string } } }> }) =>
      result.locations[0].physicalLocation.artifactLocation.uri.endsWith("action-sources.yml"),
  );
  assert.deepEqual(
    actionResults.map(
      (result: { locations: Array<{ physicalLocation: { region: { startLine: number } } }> }) =>
        result.locations[0].physicalLocation.region.startLine,
    ).sort((left: number, right: number) => left - right),
    [12, 16, 20],
  );
});

test("render rejects unsupported formats instead of returning undefined", async () => {
  const report = await scan({ root: "tests/fixtures/workflows" });
  assert.throws(
    () => render(report, "invalid" as OutputFormat),
    /Unsupported format 'invalid'\. Use markdown, json, or sarif\./,
  );
});
