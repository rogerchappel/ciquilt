const SECRET_PATTERN = /\$\{\{\s*secrets\.([A-Za-z0-9_:-]+)\s*\}\}/g;
const EXPRESSION_PATTERN = /\$\{\{[^}]+\}\}/;

export function findSecretExpressions(value: unknown): string[] {
  const found = new Set<string>();
  visit(value, (text) => {
    for (const match of text.matchAll(SECRET_PATTERN)) {
      found.add(match[0]);
    }
  });
  return [...found].sort();
}

export function containsGithubExpression(value: string): boolean {
  return EXPRESSION_PATTERN.test(value);
}

export function containsUntrustedContext(value: string): boolean {
  return /github\.event\.(pull_request|issue|comment|head_commit|commits)|github\.head_ref|github\.ref_name/.test(value);
}

export function visit(value: unknown, visitor: (text: string) => void): void {
  if (typeof value === "string") {
    visitor(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) visit(item, visitor);
    return;
  }
  if (value && typeof value === "object") {
    for (const item of Object.values(value as Record<string, unknown>)) visit(item, visitor);
  }
}
