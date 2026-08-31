import { promises as fs } from "node:fs";
import path from "node:path";
import { EVENT_ID, getScalarValue, load, parseEvents } from "js-yaml";
import type { Event } from "js-yaml";
import { collectWorkflowFiles, relativeTo } from "./fs.js";
import { normalizeJobs, normalizePermissions, normalizeTriggers } from "./normalize.js";
import type { WorkflowSummary } from "./types.js";

interface LocationNode {
  line: number;
  properties: Map<string, LocationNode>;
  items: LocationNode[];
}

export async function parseWorkflows(root: string): Promise<WorkflowSummary[]> {
  const absoluteRoot = path.resolve(root);
  const files = await collectWorkflowFiles(absoluteRoot);
  if (files.length === 0) {
    throw new Error(`No supported workflow files found in target: ${root}`);
  }
  const workflows: WorkflowSummary[] = [];
  for (const file of files) {
    const source = await fs.readFile(file, "utf8");
    const locations = parseLocations(source, file);
    const parsed = load(source, { filename: file }) as Record<string, unknown> | null;
    const raw = parsed && typeof parsed === "object" ? parsed : {};
    const jobs = normalizeJobs(raw.jobs);
    attachJobLocations(jobs, locations.properties.get("jobs"));
    workflows.push({
      file: relativeTo(absoluteRoot, file),
      sourceLine: locations.line,
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
  jobsLocation: LocationNode | undefined,
): void {
  for (const job of jobs) {
    const jobLocation = jobsLocation?.properties.get(job.id);
    job.sourceLine = jobLocation?.line;
    const stepsLocation = jobLocation?.properties.get("steps");
    for (const step of job.steps) {
      const stepLocation = stepsLocation?.items[step.index];
      step.sourceLine = stepLocation?.line;
      step.usesLine = stepLocation?.properties.get("uses")?.line;
      step.runLine = stepLocation?.properties.get("run")?.line;
    }
  }
}

function parseLocations(source: string, filename: string): LocationNode {
  const events = parseEvents(source, { filename });
  const lineStarts = [0];
  for (let index = 0; index < source.length; index += 1) {
    if (source[index] === "\n") lineStarts.push(index + 1);
  }
  const lineAt = (offset: number): number => {
    let low = 0;
    let high = lineStarts.length;
    while (low + 1 < high) {
      const middle = Math.floor((low + high) / 2);
      if (lineStarts[middle] <= offset) low = middle;
      else high = middle;
    }
    return low + 1;
  };
  let index = events[0]?.type === EVENT_ID.DOCUMENT ? 1 : 0;

  const readNode = (): LocationNode => {
    const event = events[index++];
    if (!event) return emptyLocation(1);
    if (event.type === EVENT_ID.MAPPING) {
      const node = emptyLocation(lineAt(event.start));
      while (events[index]?.type !== EVENT_ID.POP) {
        const key = events[index++] as Extract<Event, { type: typeof EVENT_ID.SCALAR }>;
        const value = readNode();
        node.properties.set(getScalarValue(source, key), { ...value, line: lineAt(key.valueStart) });
      }
      index += 1;
      return node;
    }
    if (event.type === EVENT_ID.SEQUENCE) {
      const node = emptyLocation(lineAt(event.start));
      while (events[index]?.type !== EVENT_ID.POP) node.items.push(readNode());
      index += 1;
      return node;
    }
    return emptyLocation(event.type === EVENT_ID.SCALAR ? lineAt(event.valueStart) : 1);
  };

  return readNode();
}

function emptyLocation(line: number): LocationNode {
  return { line, properties: new Map(), items: [] };
}
