export interface CliOptions {
  format?: string;
  output?: string;
  failOnFindings: boolean;
}

export function parseScanArgs(args: string[]): { target: string; options: CliOptions } {
  const options: CliOptions = { failOnFindings: false };
  const positionals: string[] = [];
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--format" || arg === "-f") options.format = requireValue(args, ++i, arg);
    else if (arg === "--output" || arg === "-o") options.output = requireValue(args, ++i, arg);
    else if (arg === "--fail-on-findings") options.failOnFindings = true;
    else if (arg.startsWith("-")) throw new Error(`Unknown option '${arg}'.`);
    else positionals.push(arg);
  }
  if (positionals.length > 1) {
    throw new Error(`scan accepts at most one workflow target; received ${positionals.length}.`);
  }
  return { target: positionals[0] ?? ".github/workflows", options };
}

function requireValue(args: string[], index: number, flag: string): string {
  const value = args[index];
  if (!value) throw new Error(`${flag} requires a value.`);
  return value;
}
