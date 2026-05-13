# ciquilt PRD

Status: in-progress

## One-liner
`ciquilt` stitches GitHub Actions workflows into a readable dependency/cache/secrets risk report for humans and agents. 🧵

## Problem
Workflow YAML grows organically. Cache keys drift, permissions are too broad, secrets appear in unsafe contexts, and agent reviewers miss the shape of the pipeline.

## Users
- OSS maintainers reviewing CI before release.
- Agents asked to improve tests without breaking workflows.
- Security-conscious developers auditing small repos.

## MVP
- Node/TypeScript CLI.
- `ciquilt scan .github/workflows` parses workflow YAML.
- Summarize jobs, triggers, matrices, permissions, caches, artifacts, and secret references.
- Rules for broad `contents: write`, pull_request_target risk, unpinned actions, cache restore-key broadness, missing timeouts, and shell injection footguns.
- Emit Markdown, JSON, and SARIF-lite JSON.
- Fixture-backed unit tests and CLI smoke fixtures.

## Non-goals
- Full GitHub Actions execution simulator.
- Blocking policies that require network access.

## Differentiation
Less noisy than generic linters: optimized for local repo comprehension and agent-friendly summaries.

## Sources / attribution
Inspired by GitHub documentation for Actions secrets and dependency caching, reframed as a local-first workflow comprehension/reporting tool.
