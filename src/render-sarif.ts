import type { Finding, ScanReport } from "./types.js";

export function renderSarif(report: ScanReport): string {
  const rules = uniqueRules(report.findings);
  return `${JSON.stringify({
    version: "2.1.0",
    $schema: "https://json.schemastore.org/sarif-2.1.0.json",
    runs: [{
      tool: {
        driver: {
          name: report.tool,
          informationUri: "https://github.com/rogerchappel/ciquilt",
          version: report.version,
          rules,
        },
      },
      results: report.findings.map(toResult),
    }],
  }, null, 2)}\n`;
}

function uniqueRules(findings: Finding[]) {
  const byId = new Map<string, Finding>();
  for (const finding of findings) byId.set(finding.ruleId, finding);
  return [...byId.values()].map((finding) => ({
    id: finding.ruleId,
    name: finding.title,
    shortDescription: { text: finding.title },
    help: { text: finding.recommendation },
    defaultConfiguration: { level: sarifLevel(finding.severity) },
  }));
}

function toResult(finding: Finding) {
  return {
    ruleId: finding.ruleId,
    level: sarifLevel(finding.severity),
    message: { text: `${finding.message} ${finding.recommendation}` },
    locations: [{
      physicalLocation: {
        artifactLocation: { uri: finding.workflow },
        region: finding.sourceLine === undefined ? undefined : { startLine: finding.sourceLine },
      },
      logicalLocations: finding.jobId ? [{ name: finding.jobId, kind: "function" }] : [],
    }],
  };
}

function sarifLevel(severity: Finding["severity"]): "note" | "warning" | "error" {
  return severity;
}
