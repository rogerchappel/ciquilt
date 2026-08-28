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

collision_dir="$(mktemp -d "${TMPDIR:-/tmp}/ciquilt-collision.XXXXXX")"
trap 'rm -rf "$collision_dir"' EXIT
cp tests/fixtures/workflows/risky.yml "$collision_dir/workflow.yml"
workflow_hash="$(shasum -a 256 "$collision_dir/workflow.yml" | cut -d ' ' -f 1)"

if node dist/cli.js scan "$collision_dir/workflow.yml" --format json --output "$collision_dir/./workflow.yml" >"$collision_dir/stdout" 2>"$collision_dir/stderr"; then
  echo "expected relative output alias to be rejected" >&2
  exit 1
fi
grep -q "Output file must not overwrite a scanned workflow" "$collision_dir/stderr"
test "$workflow_hash" = "$(shasum -a 256 "$collision_dir/workflow.yml" | cut -d ' ' -f 1)"

(
  cd "$collision_dir"
  if node "$ROOT/dist/cli.js" scan workflow.yml --format json --output "$collision_dir/workflow.yml" >stdout 2>stderr; then
    echo "expected absolute output alias to be rejected" >&2
    exit 1
  fi
)
grep -q "Output file must not overwrite a scanned workflow" "$collision_dir/stderr"
test "$workflow_hash" = "$(shasum -a 256 "$collision_dir/workflow.yml" | cut -d ' ' -f 1)"

node dist/cli.js scan "$collision_dir/workflow.yml" --format json --output "$collision_dir/report.json"
node -e "const r=require(process.argv[1]); if (r.workflows.length !== 1) process.exit(1)" "$collision_dir/report.json"
if node dist/cli.js scan tests/fixtures/workflows definitely-not-a-workflow-path >tmp/surplus.out 2>tmp/surplus.err; then
  echo "expected surplus workflow targets to fail" >&2
  exit 1
fi
grep -q "scan accepts at most one workflow target; received 2" tmp/surplus.err

for flag in --format -f --output -o; do
  rejected_output="tmp/rejected-option-value-${flag#-}"
  rm -f "$rejected_output"
  if node dist/cli.js scan tests/fixtures/workflows "$flag" --fail-on-findings --output "$rejected_output" >tmp/missing-value.out 2>tmp/missing-value.err; then
    echo "expected $flag without a value to fail" >&2
    exit 1
  fi
  grep -q -- "$flag requires a value" tmp/missing-value.err
  test ! -e "$rejected_output"
done
