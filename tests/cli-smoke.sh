#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
mkdir -p tmp
node dist/cli.js scan tests/fixtures/workflows --format markdown --output tmp/cli-smoke.md
grep -q "ciquilt report" tmp/cli-smoke.md
node dist/cli.js scan tests/fixtures/workflows --format json --output tmp/cli-smoke.json
node -e "const r=require('./tmp/cli-smoke.json'); if (!r.findings.length) process.exit(1)"
node dist/cli.js scan tests/fixtures/workflows --format sarif --output tmp/cli-smoke.sarif.json
node -e "const r=require('./tmp/cli-smoke.sarif.json'); if (r.version !== '2.1.0') process.exit(1)"
