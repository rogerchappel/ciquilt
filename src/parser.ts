import { promises as fs } from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { collectWorkflowFiles, relativeTo } from "./fs.js";
import { normalizeJobs, normalizePermissions, normalizeTriggers } from "./normalize.js";
import type { WorkflowSummary } from "./types.js";

export async function parseWorkflows(root: string): Promise<WorkflowSummary[]> {
  const absoluteRoot = path.resolve(root);
  const files = await collectWorkflowFiles(absoluteRoot);
  const workflows: WorkflowSummary[] = [];
  for (const file of files) {
    const source = await fs.readFile(file, "utf8");
    const parsed = yaml.load(source, { filename: file }) as Record<string, unknown> | null;
    const raw = parsed && typeof parsed === "object" ? parsed : {};
    workflows.push({
      file: relativeTo(absoluteRoot, file),
      name: typeof raw.name === "string" ? raw.name : path.basename(file),
      triggers: normalizeTriggers(raw.on),
      permissions: normalizePermissions(raw.permissions),
      jobs: normalizeJobs(raw.jobs),
    });
  }
  return workflows;
}
