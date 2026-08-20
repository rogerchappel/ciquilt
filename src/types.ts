export type OutputFormat = "markdown" | "json" | "sarif";

export type Severity = "note" | "warning" | "error";

export interface ScanOptions {
  root: string;
}

export interface WorkflowTrigger {
  name: string;
  detail?: unknown;
}

export interface WorkflowPermission {
  scope: string;
  access: string;
  source: "workflow" | "job";
  jobId?: string;
}

export interface WorkflowJob {
  id: string;
  sourceLine?: number;
  name?: string;
  uses?: string;
  runsOn?: string[];
  needs: string[];
  timeoutMinutes?: number;
  permissions: Record<string, string> | string | null;
  matrix?: unknown;
  steps: WorkflowStep[];
}

export interface WorkflowStep {
  index: number;
  sourceLine?: number;
  usesLine?: number;
  runLine?: number;
  name?: string;
  uses?: string;
  run?: string;
  shell?: string;
  with?: Record<string, unknown>;
  env?: Record<string, unknown>;
}

export interface CacheUse {
  workflow: string;
  jobId: string;
  stepName: string;
  key?: string;
  restoreKeys: string[];
  path?: unknown;
}

export interface ArtifactUse {
  workflow: string;
  jobId: string;
  stepName: string;
  action: string;
  name?: unknown;
  path?: unknown;
}

export interface SecretReference {
  workflow: string;
  jobId?: string;
  stepName?: string;
  location: string;
  expression: string;
}

export interface Finding {
  ruleId: string;
  title: string;
  message: string;
  severity: Severity;
  workflow: string;
  jobId?: string;
  stepIndex?: number;
  sourceLine?: number;
  recommendation: string;
}

export interface WorkflowSummary {
  file: string;
  sourceLine?: number;
  name: string;
  triggers: WorkflowTrigger[];
  permissions: Record<string, string> | string | null;
  jobs: WorkflowJob[];
}

export interface ScanReport {
  tool: string;
  version: string;
  scannedAt: string;
  root: string;
  workflows: WorkflowSummary[];
  caches: CacheUse[];
  artifacts: ArtifactUse[];
  secrets: SecretReference[];
  findings: Finding[];
}
