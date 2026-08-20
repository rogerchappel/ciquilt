import type { Finding, ScanReport, WorkflowJob } from "./types.js";

export function renderMarkdown(report: ScanReport): string {
  const lines: string[] = [];
  lines.push("# ciquilt report", "");
  lines.push(`Scanned \`${report.workflows.length}\` workflow(s). Findings: **${report.findings.length}**.`, "");
  lines.push("## Workflows", "");
  for (const workflow of report.workflows) {
    lines.push(`### ${workflow.name} (${workflow.file})`, "");
    lines.push(`- Triggers: ${workflow.triggers.map((trigger) => `\`${trigger.name}\``).join(", ") || "none"}`);
    lines.push(`- Workflow permissions: ${formatValue(workflow.permissions)}`);
    lines.push(`- Jobs: ${workflow.jobs.length}`);
    for (const job of workflow.jobs) lines.push(...renderJob(job));
    lines.push("");
  }
  lines.push("## Caches", "");
  if (report.caches.length === 0) lines.push("No cache actions found.");
  for (const cache of report.caches) {
    lines.push(`- ${cache.workflow} / ${cache.jobId} / ${cache.stepName}: key ${cache.key ?? "(missing)"}; restore ${cache.restoreKeys.join(", ") || "none"}`);
  }
  lines.push("", "## Artifacts", "");
  if (report.artifacts.length === 0) lines.push("No artifact actions found.");
  for (const artifact of report.artifacts) {
    lines.push(`- ${artifact.workflow} / ${artifact.jobId} / ${artifact.stepName}: ${artifact.action} name=${formatValue(artifact.name)} path=${formatValue(artifact.path)}`);
  }
  lines.push("", "## Secrets", "");
  if (report.secrets.length === 0) lines.push("No secret expressions found.");
  for (const secret of report.secrets) {
    lines.push(`- ${secret.workflow}${secret.jobId ? ` / ${secret.jobId}` : ""}: ${secret.location} uses \`${secret.expression}\``);
  }
  lines.push("", "## Findings", "");
  if (report.findings.length === 0) lines.push("No findings. Nice tidy quilt.");
  for (const finding of report.findings) lines.push(...renderFinding(finding));
  return `${lines.join("\n")}\n`;
}

function renderJob(job: WorkflowJob): string[] {
  return [
    `  - \`${job.id}\`${job.name ? ` (${job.name})` : ""}`,
    `    - uses: ${job.uses ? `\`${job.uses}\`` : "none"}`,
    `    - runs-on: ${job.runsOn?.map((runner) => `\`${runner}\``).join(", ") ?? "unspecified"}`,
    `    - needs: ${job.needs.map((need) => `\`${need}\``).join(", ") || "none"}`,
    `    - timeout-minutes: ${job.timeoutMinutes ?? "missing"}`,
    `    - matrix: ${formatValue(job.matrix)}`,
    `    - steps: ${job.steps.length}`,
  ];
}

function renderFinding(finding: Finding): string[] {
  return [
    `### ${finding.title}`,
    "",
    `- Rule: \`${finding.ruleId}\` (${finding.severity})`,
    `- Location: ${finding.workflow}${finding.sourceLine ? `:${finding.sourceLine}` : ""}${finding.jobId ? ` / ${finding.jobId}` : ""}${finding.stepIndex !== undefined ? ` / step ${finding.stepIndex + 1}` : ""}`,
    `- Problem: ${finding.message}`,
    `- Fix: ${finding.recommendation}`,
    "",
  ];
}

function formatValue(value: unknown): string {
  if (value === undefined || value === null) return "none";
  if (typeof value === "string") return `\`${value}\``;
  return `\`${JSON.stringify(value)}\``;
}
