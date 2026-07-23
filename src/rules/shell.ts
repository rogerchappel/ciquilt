import { containsGithubExpression, containsUntrustedContext } from "../expressions.js";
import type { Finding, WorkflowSummary } from "../types.js";
import { finding } from "./util.js";

export function checkShellInjection(workflow: WorkflowSummary): Finding[] {
  const findings: Finding[] = [];
  for (const job of workflow.jobs) {
    for (const step of job.steps) {
      if (!step.run) continue;
      if (containsGithubExpression(step.run) && containsUntrustedContext(step.run)) {
        findings.push(finding({
          ruleId: "shell-expression-injection",
          title: "Run step interpolates untrusted GitHub context",
          workflow,
          jobId: job.id,
          stepIndex: step.index,
          sourceLine: step.runLine,
          message: `Step '${step.name ?? step.index + 1}' uses an event/head ref expression directly in shell code.`,
          recommendation: "Pass values through env variables, quote expansions, or avoid running untrusted event data as shell text.",
        }));
      }
    }
  }
  return findings;
}
