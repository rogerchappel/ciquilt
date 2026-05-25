# ciquilt 🧵

`ciquilt` stitches GitHub Actions workflow YAML into a readable dependency/cache/secrets risk report for humans and agents.

It is not a stern policy robot. It is a careful quilt inspector: it shows how the CI fabric is sewn together, points at risky seams, and leaves final judgment to the maintainer.

## What it summarizes

- Workflow names and triggers.
- Jobs, `needs`, runners, matrices, and timeouts.
- Workflow and job permissions.
- `actions/cache` keys and restore keys.
- Upload/download artifact usage.
- Secret expression references.

## Built-in risk notes

- Broad write permissions such as `contents: write`.
- `pull_request_target` workflows that need extra caution.
- Actions not pinned to a full commit SHA.
- Broad cache restore keys.
- Jobs without `timeout-minutes`.
- Shell steps that interpolate untrusted GitHub event context.

## Install

```bash
npm install -g ciquilt
```

From a clone:

```bash
npm install
npm run build
node dist/cli.js scan tests/fixtures/workflows
```

## Usage

```bash
ciquilt scan .github/workflows
ciquilt scan .github/workflows --format json --output ciquilt.json
ciquilt scan .github/workflows --format sarif --output ciquilt.sarif.json
ciquilt scan .github/workflows --fail-on-findings
```

`--fail-on-findings` exits `2` when findings exist. Without it, findings are reported but the scan exits successfully.

Try the included risky workflow fixture when you want to see the advisory report without pointing ciquilt at a real repository:

```bash
node dist/cli.js scan examples --format markdown
node dist/cli.js scan examples --format json --output /tmp/ciquilt-example.json
```

## Example

```markdown
# ciquilt report

Scanned `2` workflow(s). Findings: **6**.

## Findings

### Job has no timeout-minutes
- Rule: `missing-timeout` (note)
- Fix: Set timeout-minutes for every job based on expected runtime plus margin.
```

## Safety posture

`ciquilt` is local-first and does not need network access. It reads workflow files and only writes when `--output` is provided. Findings are advisory because CI workflows are release machinery; humans should review changes before applying them.

## Development

```bash
npm install
npm test
npm run check
npm run build
npm run smoke
bash scripts/validate.sh
```

## Contributing

Small, focused PRs are easiest to review. Add fixtures for new rules, keep wording practical, and avoid rules that require network access or pretend to fully simulate GitHub Actions.

See [CONTRIBUTING.md](CONTRIBUTING.md) and [SECURITY.md](SECURITY.md).
