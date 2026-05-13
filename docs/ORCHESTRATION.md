# ciquilt orchestration

`ciquilt` is intentionally local-first. A typical agent or maintainer loop is:

1. Collect workflow YAML from `.github/workflows`.
2. Run `ciquilt scan .github/workflows --format markdown` for a human-readable review.
3. Run `ciquilt scan .github/workflows --format sarif --output ciquilt.sarif.json` for code scanning ingestion.
4. Triage findings as comprehension notes first; not every warning is a blocker.
5. Apply workflow changes, then rerun `npm run smoke` or the project CI.

## Exit codes

- `0`: scan completed.
- `1`: CLI, input, or rendering error.
- `2`: scan completed and findings exist when `--fail-on-findings` is set.

## Agent guidance

Prefer Markdown for planning, JSON for automated transforms, and SARIF for repository security dashboards. Do not auto-fix workflows without a repository-specific understanding of release and secret boundaries.
