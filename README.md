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
- Remote actions not pinned to a full 40-character commit SHA.
- Docker step images not pinned to a full `sha256` digest. Tags and implicit
  `latest` references are reported as mutable; repository-local `./...`
  actions are trusted from the checked-out workflow and do not require a ref.
- Broad cache restore keys.
- Jobs without `timeout-minutes`.
- Shell steps that interpolate untrusted GitHub event context.

## Install

The npm package will be available after the first tagged release is published.
Until then, install and run `ciquilt` from a clone:

```bash
git clone https://github.com/rogerchappel/ciquilt.git
cd ciquilt
npm ci
npm run build
npm link
```

After the first tagged release:

```bash
npm install -g ciquilt
```

To run directly from a clone without linking:

```bash
npm ci
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
JSON findings include `sourceLine`, Markdown locations include `:line`, and
SARIF results use that physical YAML line for code-scanning annotations.

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
- Scope: Run/steps jobs only. Reusable-workflow call jobs declared with job-level `uses` are excluded because GitHub Actions does not support `timeout-minutes` on those jobs.
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
npm run package:smoke
npm run release:check
bash scripts/validate.sh
```

## Release verification

Run `npm run release:check` before publishing or tagging. The package smoke
step builds the CLI, verifies the published `ciquilt` bin target, checks the
package metadata and files allowlist, then runs `npm pack --dry-run` so the
tarball contents are visible in review logs.

## Contributing

Small, focused PRs are easiest to review. Add fixtures for new rules, keep wording practical, and avoid rules that require network access or pretend to fully simulate GitHub Actions.

See [CONTRIBUTING.md](CONTRIBUTING.md) and [SECURITY.md](SECURITY.md).

## Releases

Pushing a semantic-version tag (`vX.Y.Z`) runs the complete release checks, packs
the npm artifact, and publishes it with trusted publishing using the pinned
`npm@11.5.1` prerequisite. The workflow captures the filename returned by
`npm pack`, publishes that exact file, and attaches the same file to the GitHub
release only after npm accepts the package. The release dry run installs the
same pinned npm version before checking this contract.
