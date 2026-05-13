import type { CacheUse, Finding, WorkflowSummary } from "../types.js";
import { finding } from "./util.js";

export function checkCaches(workflow: WorkflowSummary, caches: CacheUse[]): Finding[] {
  const workflowCaches = caches.filter((cache) => cache.workflow === workflow.file);
  const findings: Finding[] = [];
  for (const cache of workflowCaches) {
    for (const restoreKey of cache.restoreKeys) {
      if (isBroadRestoreKey(restoreKey)) {
        findings.push(finding({
          ruleId: "broad-cache-restore-key",
          title: "Cache restore key is broad",
          workflow,
          jobId: cache.jobId,
          message: `Cache step '${cache.stepName}' restore key '${restoreKey}' may restore unrelated dependencies.`,
          recommendation: "Include OS, runtime, package manager, and lockfile hash components in restore keys.",
        }));
      }
    }
  }
  return findings;
}

function isBroadRestoreKey(key: string): boolean {
  const trimmed = key.trim();
  return trimmed.length <= 8 || /^[A-Za-z0-9_-]+-$/.test(trimmed) || !trimmed.includes("${{");
}
