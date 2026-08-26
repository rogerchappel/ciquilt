import { renderJson } from "./render-json.js";
import { renderMarkdown } from "./render-markdown.js";
import { renderSarif } from "./render-sarif.js";
import type { OutputFormat, ScanReport } from "./types.js";

export function render(report: ScanReport, format: OutputFormat): string {
  switch (format) {
    case "markdown": return renderMarkdown(report);
    case "json": return renderJson(report);
    case "sarif": return renderSarif(report);
    default:
      throw new Error(`Unsupported format '${String(format)}'. Use markdown, json, or sarif.`);
  }
}

export function parseFormat(value: string | undefined): OutputFormat {
  if (value === undefined) return "markdown";
  if (value === "markdown" || value === "json" || value === "sarif") return value;
  throw new Error(`Unsupported format '${value}'. Use markdown, json, or sarif.`);
}
