import { promises as fs } from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { collectWorkflowFiles, relativeTo } from "./fs.js";
import { normalizeJobs, normalizePermissions, normalizeTriggers } from "./normalize.js";
import type { WorkflowSummary } from "./types.js";

interface SourceLocation {
  line: number;
  properties: Map<string, number>;
}

interface ParseNode {
  line: number;
  kind?: string;
  result?: unknown;
  children: ParseNode[];
}

export async function parseWorkflows(root: string): Promise<WorkflowSummary[]> {
  const absoluteRoot = path.resolve(root);
  const files = await collectWorkflowFiles(absoluteRoot);
  const workflows: WorkflowSummary[] = [];
  for (const file of files) {
    const source = await fs.readFile(file, "utf8");
    const locations = new WeakMap<object, SourceLocation>();
    const nodes: ParseNode[] = [];
    const parsed = yaml.load(source, {
      filename: file,
      listener(event, state) {
        if (event === "open") {
          nodes.push({ line: state.line + 1, children: [] });
          return;
        }
        const node = nodes.pop();
        if (!node) return;
        node.kind = state.kind;
        node.result = state.result;
        const parent = nodes.at(-1);
        if (parent) parent.children.push(node);
        if (!state.result || typeof state.result !== "object") return;
        const properties = new Map<string, number>();
        if (state.kind === "mapping") {
          for (let index = 0; index + 1 < node.children.length; index += 2) {
            const key = node.children[index];
            if (key.kind === "scalar" && typeof key.result === "string") {
              properties.set(key.result, key.line);
            }
          }
        }
        locations.set(state.result, { line: node.line, properties });
      },
    }) as Record<string, unknown> | null;
    const raw = parsed && typeof parsed === "object" ? parsed : {};
    const jobs = normalizeJobs(raw.jobs);
    attachJobLocations(jobs, raw.jobs, locations);
    workflows.push({
      file: relativeTo(absoluteRoot, file),
      sourceLine: locationOf(locations, raw)?.line,
      name: typeof raw.name === "string" ? raw.name : path.basename(file),
      triggers: normalizeTriggers(raw.on),
      permissions: normalizePermissions(raw.permissions),
      jobs,
    });
  }
  return workflows;
}

function attachJobLocations(
  jobs: WorkflowSummary["jobs"],
  jobsValue: unknown,
  locations: WeakMap<object, SourceLocation>,
): void {
  if (!jobsValue || typeof jobsValue !== "object") return;
  const rawJobs = jobsValue as Record<string, unknown>;
  const jobsLocation = locationOf(locations, rawJobs);
  for (const job of jobs) {
    const rawJob = rawJobs[job.id];
    job.sourceLine = jobsLocation?.properties.get(job.id) ?? locationOf(locations, rawJob)?.line;
    if (!rawJob || typeof rawJob !== "object") continue;
    const rawSteps = (rawJob as Record<string, unknown>).steps;
    if (!Array.isArray(rawSteps)) continue;
    for (const step of job.steps) {
      const rawStep = rawSteps[step.index];
      const stepLocation = locationOf(locations, rawStep);
      step.sourceLine = stepLocation?.line;
      step.usesLine = stepLocation?.properties.get("uses");
      step.runLine = stepLocation?.properties.get("run");
    }
  }
}

function locationOf(locations: WeakMap<object, SourceLocation>, value: unknown): SourceLocation | undefined {
  return value && typeof value === "object" ? locations.get(value) : undefined;
}
