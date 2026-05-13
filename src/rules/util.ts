import type { Finding, Severity, WorkflowSummary } from "../types.js";

export function finding(input: {
  ruleId: string;
  title: string;
  message: string;
  severity?: Severity;
  workflow: WorkflowSummary;
  jobId?: string;
  stepIndex?: number;
  recommendation: string;
}): Finding {
  return {
    severity: input.severity ?? "warning",
    workflow: input.workflow.file,
    ruleId: input.ruleId,
    title: input.title,
    message: input.message,
    jobId: input.jobId,
    stepIndex: input.stepIndex,
    recommendation: input.recommendation,
  };
}

export function permissionsEntries(value: Record<string, string> | string | null): Array<[string, string]> {
  if (!value) return [];
  if (typeof value === "string") return [["*", value]];
  return Object.entries(value);
}
