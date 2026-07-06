import { accessSync } from 'node:fs';
import { readFile } from 'node:fs/promises';

const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));

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
