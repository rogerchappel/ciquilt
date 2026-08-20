import type { WorkflowJob, WorkflowStep, WorkflowTrigger } from "./types.js";

export function normalizeTriggers(onValue: unknown): WorkflowTrigger[] {
  if (typeof onValue === "string") return [{ name: onValue }];
  if (Array.isArray(onValue)) return onValue.map((name) => ({ name: String(name) }));
  if (onValue && typeof onValue === "object") {
    return Object.entries(onValue as Record<string, unknown>).map(([name, detail]) => ({ name, detail }));
  }
  return [];
}

export function normalizeJobs(jobsValue: unknown): WorkflowJob[] {
  if (!jobsValue || typeof jobsValue !== "object") return [];
  return Object.entries(jobsValue as Record<string, unknown>).map(([id, value]) => normalizeJob(id, value));
}

function normalizeJob(id: string, value: unknown): WorkflowJob {
  const raw = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  return {
    id,
    name: stringOrUndefined(raw.name),
    uses: stringOrUndefined(raw.uses),
    runsOn: normalizeRunsOn(raw["runs-on"]),
    needs: normalizeNeeds(raw.needs),
    timeoutMinutes: numberOrUndefined(raw["timeout-minutes"]),
    permissions: normalizePermissions(raw.permissions),
    matrix: extractMatrix(raw.strategy),
    steps: normalizeSteps(raw.steps),
  };
}

function normalizeSteps(value: unknown): WorkflowStep[] {
  if (!Array.isArray(value)) return [];
  return value.map((step, index) => {
    const raw = (step && typeof step === "object" ? step : {}) as Record<string, unknown>;
    return {
      index,
      name: stringOrUndefined(raw.name),
      uses: stringOrUndefined(raw.uses),
      run: stringOrUndefined(raw.run),
      shell: stringOrUndefined(raw.shell),
      with: objectOrUndefined(raw.with),
      env: objectOrUndefined(raw.env),
    };
  });
}

export function normalizePermissions(value: unknown): Record<string, string> | string | null {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, String(v)]));
  }
  return null;
}

function normalizeRunsOn(value: unknown): string[] | undefined {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.map(String);
  return undefined;
}

function normalizeNeeds(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.map(String);
  return [];
}

function extractMatrix(strategy: unknown): unknown {
  if (strategy && typeof strategy === "object") return (strategy as Record<string, unknown>).matrix;
  return undefined;
}

function stringOrUndefined(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function numberOrUndefined(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}

function objectOrUndefined(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined;
}
