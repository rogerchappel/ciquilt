import type { Finding, WorkflowSummary } from "../types.js";
import { finding } from "./util.js";

const FULL_SHA = /^[a-f0-9]{40}$/i;
const FULL_DOCKER_DIGEST = /@sha256:[a-f0-9]{64}$/i;

export function checkActions(workflow: WorkflowSummary): Finding[] {
  const findings: Finding[] = [];
  for (const job of workflow.jobs) {
    for (const step of job.steps) {
      if (!step.uses) continue;
      if (step.uses.startsWith("./")) continue;
      if (step.uses.startsWith("docker://")) {
        if (!FULL_DOCKER_DIGEST.test(step.uses)) {
          findings.push(makeDockerFinding(workflow, job.id, step.index, step.uses, step.usesLine));
        }
        continue;
      }
      const separator = step.uses.lastIndexOf("@");
      const ref = separator === -1 ? undefined : step.uses.slice(separator + 1);
      if (!ref) {
        findings.push(makeActionFinding(workflow, job.id, step.index, step.uses, "no ref", step.usesLine));
        continue;
      }
      if (!FULL_SHA.test(ref)) {
        findings.push(makeActionFinding(workflow, job.id, step.index, step.uses, `mutable ref ${ref}`, step.usesLine));
      }
    }
  }
  return findings;
}

function makeActionFinding(
  workflow: WorkflowSummary,
  jobId: string,
  stepIndex: number,
  uses: string,
  reason: string,
  sourceLine?: number,
): Finding {
  return finding({
    ruleId: "unpinned-action",
    title: "Action is not pinned to a commit SHA",
    workflow,
    jobId,
    stepIndex,
    sourceLine,
    message: `${uses} uses ${reason}; tags and branches can move unexpectedly.`,
    recommendation: "Pin third-party and first-party actions to a full 40-character commit SHA where practical.",
  });
}

function makeDockerFinding(
  workflow: WorkflowSummary,
  jobId: string,
  stepIndex: number,
  uses: string,
  sourceLine?: number,
): Finding {
  return finding({
    ruleId: "unpinned-action",
    title: "Docker image is not pinned to a digest",
    workflow,
    jobId,
    stepIndex,
    sourceLine,
    message: `${uses} uses a mutable Docker image reference; tags and implicit latest references can move unexpectedly.`,
    recommendation: "Pin Docker step images with an immutable @sha256 digest.",
  });
}
