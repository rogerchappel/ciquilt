import { readFileSync } from "node:fs";

interface PackageMetadata {
  version?: unknown;
}

const metadata = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
) as PackageMetadata;

if (typeof metadata.version !== "string" || metadata.version.length === 0) {
  throw new Error("package.json must define a non-empty version");
}

/** The version of the package that owns this runtime. */
export const PACKAGE_VERSION = metadata.version;
