import type { Finding, WorkflowSummary } from "../types.js";
import { finding, permissionsEntries } from "./util.js";

const BROAD_WRITE_SCOPES = new Set(["contents", "actions", "checks", "deployments", "issues", "packages", "pull-requests", "security-events", "statuses"]);

export function checkPermissions(workflow: WorkflowSummary): Finding[] {
  const findings: Finding[] = [];
  for (const [scope, access] of permissionsEntries(workflow.permissions)) {
    if (isBroad(scope, access)) {
      findings.push(finding({
        ruleId: "broad-permissions",
        title: "Workflow grants broad write permissions",
        workflow,
        message: `Workflow-level permission ${scope}: ${access} can let every job write repository state.`,
        recommendation: "Move write permissions to the smallest job and prefer read-only defaults.",
      }));
    }
  }
  for (const job of workflow.jobs) {
    for (const [scope, access] of permissionsEntries(job.permissions)) {
      if (isBroad(scope, access)) {
        findings.push(finding({
          ruleId: "broad-permissions",
          title: "Job grants broad write permissions",
          workflow,
          jobId: job.id,
          message: `Job ${job.id} grants ${scope}: ${access}.`,
          recommendation: "Limit write scopes to the exact permission needed for this job.",
        }));
      }
    }
  }
  return findings;
}

function isBroad(scope: string, access: string): boolean {
  return access === "write-all" || access === "write" && (scope === "*" || BROAD_WRITE_SCOPES.has(scope));
}
