import { findSecretExpressions } from "./expressions.js";
import type { ArtifactUse, CacheUse, SecretReference, WorkflowSummary } from "./types.js";

export function extractCaches(workflows: WorkflowSummary[]): CacheUse[] {
  const caches: CacheUse[] = [];
  for (const workflow of workflows) {
    for (const job of workflow.jobs) {
      for (const step of job.steps) {
        if (!step.uses || !isAction(step.uses, "actions/cache")) continue;
        const withBlock = step.with ?? {};
        caches.push({
          workflow: workflow.file,
          jobId: job.id,
          stepName: step.name ?? `step ${step.index + 1}`,
          key: stringValue(withBlock.key),
          restoreKeys: restoreKeys(withBlock["restore-keys"]),
          path: withBlock.path,
        });
      }
    }
  }
  return caches;
}

export function extractArtifacts(workflows: WorkflowSummary[]): ArtifactUse[] {
  const artifacts: ArtifactUse[] = [];
  for (const workflow of workflows) {
    for (const job of workflow.jobs) {
      for (const step of job.steps) {
        if (!step.uses) continue;
        const action = step.uses.toLowerCase();
        if (!action.startsWith("actions/upload-artifact") && !action.startsWith("actions/download-artifact")) continue;
        artifacts.push({
          workflow: workflow.file,
          jobId: job.id,
          stepName: step.name ?? `step ${step.index + 1}`,
          action: step.uses,
          name: step.with?.name,
          path: step.with?.path,
        });
      }
    }
  }
  return artifacts;
}

export function extractSecrets(workflows: WorkflowSummary[]): SecretReference[] {
  const refs: SecretReference[] = [];
  for (const workflow of workflows) {
    for (const expression of findSecretExpressions(workflow.permissions)) {
      refs.push({ workflow: workflow.file, location: "workflow.permissions", expression });
    }
    for (const job of workflow.jobs) {
      for (const expression of findSecretExpressions(job.permissions)) {
        refs.push({ workflow: workflow.file, jobId: job.id, location: "job.permissions", expression });
      }
      for (const step of job.steps) {
        for (const expression of findSecretExpressions(step)) {
          refs.push({
            workflow: workflow.file,
            jobId: job.id,
            stepName: step.name ?? `step ${step.index + 1}`,
            location: `jobs.${job.id}.steps[${step.index}]`,
            expression,
          });
        }
      }
    }
  }
  return refs;
}

function isAction(uses: string, action: string): boolean {
  return uses.toLowerCase().startsWith(`${action.toLowerCase()}@`);
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function restoreKeys(value: unknown): string[] {
  if (typeof value === "string") return value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (Array.isArray(value)) return value.map(String);
  return [];
}
