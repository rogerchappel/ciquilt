import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const tsconfig = JSON.parse(
  await readFile(new URL("../../tsconfig.json", import.meta.url), "utf8"),
) as { compilerOptions: { types?: string[] } };

// TypeScript 7 only loads @types/node for node: imports when tsconfig.json
// declares it explicitly, so guard against the "types" entry regressing and
// turning `npm run check` red with TS2591 diagnostics again.
test("tsconfig declares the node type package explicitly", () => {
  assert.ok(Array.isArray(tsconfig.compilerOptions.types));
  assert.ok(tsconfig.compilerOptions.types?.includes("node"));
});
