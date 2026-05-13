import type { CacheUse, Finding, WorkflowSummary } from "../types.js";
import { checkActions } from "./actions.js";
import { checkCaches } from "./cache.js";
import { checkPermissions } from "./permissions.js";
import { checkShellInjection } from "./shell.js";
import { checkTimeouts } from "./timeouts.js";
import { checkTriggers } from "./triggers.js";

export function runRules(workflows: WorkflowSummary[], caches: CacheUse[]): Finding[] {
  return workflows.flatMap((workflow) => [
    ...checkPermissions(workflow),
    ...checkTriggers(workflow),
    ...checkActions(workflow),
    ...checkCaches(workflow, caches),
    ...checkTimeouts(workflow),
    ...checkShellInjection(workflow),
  ]).sort(compareFindings);
}

function compareFindings(a: Finding, b: Finding): number {
  return a.workflow.localeCompare(b.workflow) || (a.jobId ?? "").localeCompare(b.jobId ?? "") || a.ruleId.localeCompare(b.ruleId);
}
