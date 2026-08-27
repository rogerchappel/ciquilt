import assert from "node:assert/strict";
import test from "node:test";
import { parseScanArgs } from "../cli-args.js";

test("scan defaults to the conventional workflow directory with no target", () => {
  assert.equal(parseScanArgs([]).target, ".github/workflows");
});

test("scan accepts one workflow target", () => {
  assert.equal(parseScanArgs(["tests/fixtures/workflows"]).target, "tests/fixtures/workflows");
});

test("scan rejects surplus workflow targets", () => {
  assert.throws(
    () => parseScanArgs(["tests/fixtures/workflows", "another-workflow.yml"]),
    /scan accepts at most one workflow target; received 2\./,
  );
});

for (const flag of ["--format", "-f", "--output", "-o"]) {
  test(`scan rejects an option token as the value for ${flag}`, () => {
    assert.throws(
      () => parseScanArgs(["tests/fixtures/workflows", flag, "--fail-on-findings"]),
      new RegExp(`${flag.replace("-", "\\-")} requires a value\\.`),
    );
  });
}
