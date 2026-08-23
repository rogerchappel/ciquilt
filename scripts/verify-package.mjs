import { accessSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));

const cliVersion = execFileSync(process.execPath, [
  new URL('../dist/cli.js', import.meta.url).pathname,
  '--version',
], { encoding: 'utf8' }).trim();
const { scan } = await import('../dist/index.js');
const report = await scan({ root: new URL('../tests/fixtures/workflows', import.meta.url).pathname });

if (cliVersion !== pkg.version || report.version !== pkg.version) {
  throw new Error(
    `built version mismatch: package=${pkg.version} cli=${cliVersion} report=${report.version}`,
  );
}

console.log(`verified built CLI and scan report version ${pkg.version}`);

for (const [name, target] of Object.entries(pkg.bin ?? {})) {
  accessSync(new URL(`../${target}`, import.meta.url));
  console.log(`verified bin ${name} -> ${target}`);
}

for (const entry of ['dist', 'examples', 'README.md', 'LICENSE', 'SECURITY.md', 'CHANGELOG.md', 'CONTRIBUTING.md']) {
  if (!pkg.files?.includes(entry)) {
    throw new Error(`package files allowlist is missing ${entry}`);
  }
}

for (const field of ['repository', 'bugs', 'homepage', 'license']) {
  if (!pkg[field]) {
    throw new Error(`package metadata is missing ${field}`);
  }
}

console.log('verified package metadata and files allowlist');
