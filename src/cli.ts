#!/usr/bin/env node
import { promises as fs } from "node:fs";
import path from "node:path";
import { render, parseFormat } from "./render.js";
import { scan } from "./scan.js";

interface CliOptions {
  format?: string;
  output?: string;
  failOnFindings: boolean;
}

async function main(argv: string[]): Promise<number> {
  const [command, ...rest] = argv;
  if (!command || command === "--help" || command === "-h") {
    printHelp();
    return 0;
  }
  if (command === "--version" || command === "-v") {
    console.log("0.1.0");
    return 0;
  }
  if (command !== "scan") throw new Error(`Unknown command '${command}'.`);

  const { target, options } = parseScanArgs(rest);
  const report = await scan({ root: target });
  const output = render(report, parseFormat(options.format));
  if (options.output) {
    await fs.mkdir(path.dirname(options.output), { recursive: true });
    await fs.writeFile(options.output, output, "utf8");
  } else {
    process.stdout.write(output);
  }
  return options.failOnFindings && report.findings.length > 0 ? 2 : 0;
}

function parseScanArgs(args: string[]): { target: string; options: CliOptions } {
  const options: CliOptions = { failOnFindings: false };
  const positionals: string[] = [];
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--format" || arg === "-f") options.format = requireValue(args, ++i, arg);
    else if (arg === "--output" || arg === "-o") options.output = requireValue(args, ++i, arg);
    else if (arg === "--fail-on-findings") options.failOnFindings = true;
    else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else if (arg.startsWith("-")) throw new Error(`Unknown option '${arg}'.`);
    else positionals.push(arg);
  }
  return { target: positionals[0] ?? ".github/workflows", options };
}

function requireValue(args: string[], index: number, flag: string): string {
  const value = args[index];
  if (!value) throw new Error(`${flag} requires a value.`);
  return value;
}

function printHelp(): void {
  console.log(`ciquilt - stitch GitHub Actions workflows into readable risk reports\n\nUsage:\n  ciquilt scan [workflow-dir-or-file] [--format markdown|json|sarif] [--output file]\n\nOptions:\n  -f, --format            Output format (default: markdown)\n  -o, --output            Write report to a file\n      --fail-on-findings  Exit 2 when findings are present\n  -h, --help              Show help\n  -v, --version           Show version`);
}

main(process.argv.slice(2)).then((code) => {
  process.exitCode = code;
}).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
