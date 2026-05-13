import type { Finding, WorkflowSummary } from "../types.js";
import { finding } from "./util.js";

const FULL_SHA = /^[a-f0-9]{40}$/i;

export function checkActions(workflow: WorkflowSummary): Finding[] {
  const findings: Finding[] = [];
  for (const job of workflow.jobs) {
    for (const step of job.steps) {
      if (!step.uses) continue;
      const ref = step.uses.split("@")[1];
      if (!ref) {
        findings.push(makeFinding(workflow, job.id, step.index, step.uses, "no ref"));
        continue;
      }
      if (!FULL_SHA.test(ref)) {
        findings.push(makeFinding(workflow, job.id, step.index, step.uses, `mutable ref ${ref}`));
      }
    }
  }
  return findings;
}

function makeFinding(workflow: WorkflowSummary, jobId: string, stepIndex: number, uses: string, reason: string): Finding {
  return finding({
    ruleId: "unpinned-action",
    title: "Action is not pinned to a commit SHA",
    workflow,
    jobId,
    stepIndex,
    message: `${uses} uses ${reason}; tags and branches can move unexpectedly.`,
    recommendation: "Pin third-party and first-party actions to a full 40-character commit SHA where practical.",
  });
}
