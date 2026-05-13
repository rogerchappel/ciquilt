import { promises as fs } from "node:fs";
import path from "node:path";

const WORKFLOW_EXTENSIONS = new Set([".yml", ".yaml"]);

export async function pathExists(target: string): Promise<boolean> {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

export async function collectWorkflowFiles(root: string): Promise<string[]> {
  const stat = await fs.stat(root);
  if (stat.isFile()) {
    return WORKFLOW_EXTENSIONS.has(path.extname(root)) ? [root] : [];
  }

  const entries = await fs.readdir(root, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) {
      const nested = await collectWorkflowFiles(full);
      files.push(...nested);
      continue;
    }
    if (entry.isFile() && WORKFLOW_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(full);
    }
  }
  return files.sort((a, b) => a.localeCompare(b));
}

export function relativeTo(base: string, target: string): string {
  const relative = path.relative(base, target);
  return relative === "" ? path.basename(target) : relative.split(path.sep).join("/");
}
