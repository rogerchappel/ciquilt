import type { Finding, WorkflowSummary } from "../types.js";
import { finding } from "./util.js";

export function checkTriggers(workflow: WorkflowSummary): Finding[] {
  const risky = workflow.triggers.find((trigger) => trigger.name === "pull_request_target");
  if (!risky) return [];
  return [finding({
    ruleId: "pull-request-target-risk",
    title: "pull_request_target needs extra care",
    workflow,
    message: "pull_request_target runs with base repository privileges and can expose secrets to unsafe checkout patterns.",
    recommendation: "Avoid checking out untrusted head code, pin actions, and keep secrets away from pull request code paths.",
  })];
}
