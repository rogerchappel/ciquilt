import type { Finding, WorkflowSummary } from "../types.js";
import { finding } from "./util.js";

export function checkTimeouts(workflow: WorkflowSummary): Finding[] {
  const findings: Finding[] = [];
  for (const job of workflow.jobs) {
    if (job.timeoutMinutes === undefined) {
      findings.push(finding({
        ruleId: "missing-timeout",
        title: "Job has no timeout-minutes",
        workflow,
        jobId: job.id,
        severity: "note",
        message: `Job ${job.id} can run until GitHub's default timeout if it hangs.`,
        recommendation: "Set timeout-minutes for every job based on expected runtime plus margin.",
      }));
    }
  }
  return findings;
}
