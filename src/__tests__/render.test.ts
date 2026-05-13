import assert from "node:assert/strict";
import { test } from "node:test";
import { render } from "../render.js";
import { scan } from "../scan.js";

test("renderers emit markdown json and sarif", async () => {
  const report = await scan({ root: "tests/fixtures/workflows" });
  const markdown = render(report, "markdown");
  const json = JSON.parse(render(report, "json"));
  const sarif = JSON.parse(render(report, "sarif"));
  assert.match(markdown, /# ciquilt report/);
  assert.equal(json.tool, "ciquilt");
  assert.equal(sarif.version, "2.1.0");
  assert.ok(sarif.runs[0].results.length > 0);
});
