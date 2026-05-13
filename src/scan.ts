import path from "node:path";
import { extractArtifacts, extractCaches, extractSecrets } from "./extract.js";
import { parseWorkflows } from "./parser.js";
import { runRules } from "./rules/index.js";
import type { ScanOptions, ScanReport } from "./types.js";

export async function scan(options: ScanOptions): Promise<ScanReport> {
  const root = path.resolve(options.root);
  const workflows = await parseWorkflows(root);
  const caches = extractCaches(workflows);
  const artifacts = extractArtifacts(workflows);
  const secrets = extractSecrets(workflows);
  const findings = runRules(workflows, caches);
  return {
    tool: "ciquilt",
    version: "0.1.0",
    scannedAt: new Date().toISOString(),
    root,
    workflows,
    caches,
    artifacts,
    secrets,
    findings,
  };
}
