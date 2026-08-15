import assert from "node:assert/strict";
import { test } from "node:test";
import { parseWorkflows } from "../parser.js";

test("parseWorkflows summarizes triggers jobs matrices and permissions", async () => {
  const workflows = await parseWorkflows("tests/fixtures/workflows");
  assert.equal(workflows.length, 4);
  const risky = workflows.find((workflow) => workflow.name === "Risky Quilt");
  assert.ok(risky);
  assert.deepEqual(risky.triggers.map((trigger) => trigger.name).sort(), ["pull_request_target", "push"]);
  assert.equal(risky.jobs[0].id, "test");
  assert.deepEqual(risky.jobs[0].runsOn, ["ubuntu-latest"]);
  assert.deepEqual(risky.jobs[0].matrix, { node: [20, 22] });
  assert.deepEqual(risky.permissions, { contents: "write" });
  assert.equal(risky.sourceLine, 1);
  assert.equal(risky.jobs[0].sourceLine, 9);
  assert.equal(risky.jobs[0].steps[0].sourceLine, 15);
  assert.equal(risky.jobs[0].steps[0].usesLine, 16);
  assert.equal(risky.jobs[0].steps[2].runLine, 25);
});

test("parseWorkflows preserves locations for quoted keys and sequence steps", async () => {
  const workflows = await parseWorkflows("tests/fixtures/workflows");
  const workflow = workflows.find((candidate) => candidate.name === "Location coverage");
  assert.ok(workflow);
  assert.equal(workflow.sourceLine, 1);
  assert.equal(workflow.jobs[0].sourceLine, 4);
  assert.equal(workflow.jobs[0].steps[0].sourceLine, 7);
  assert.equal(workflow.jobs[0].steps[0].usesLine, 8);
  assert.equal(workflow.jobs[0].steps[1].sourceLine, 9);
  assert.equal(workflow.jobs[0].steps[1].runLine, 9);
});
