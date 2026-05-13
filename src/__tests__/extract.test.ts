import assert from "node:assert/strict";
import { test } from "node:test";
import { extractArtifacts, extractCaches, extractSecrets } from "../extract.js";
import { parseWorkflows } from "../parser.js";

test("extractors find caches artifacts and secrets", async () => {
  const workflows = await parseWorkflows("tests/fixtures/workflows");
  const caches = extractCaches(workflows);
  const artifacts = extractArtifacts(workflows);
  const secrets = extractSecrets(workflows);
  assert.equal(caches.length, 1);
  assert.deepEqual(caches[0].restoreKeys, ["npm-"]);
  assert.equal(artifacts.length, 1);
  assert.equal(artifacts[0].name, "logs");
  assert.equal(secrets.length, 1);
  assert.equal(secrets[0].expression, "${{ secrets.NPM_TOKEN }}");
});
