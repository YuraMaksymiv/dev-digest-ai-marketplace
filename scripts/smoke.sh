#!/usr/bin/env bash
# Smoke-evals a released plugin version exactly as tagged.
# Usage (from the marketplace checkout): scripts/smoke.sh <plugin> <version> [--runs N]
# Runs the plugin's `smoke`-tagged eval cases from a temporary worktree at
# <plugin>--v<version>. Evaluating the installed copy (`plugin@marketplace`)
# does not work for plugins with dependencies: eval cases load dependency
# plugins by relative path, which only exists in the repository layout.
set -euo pipefail

plugin="${1:?usage: scripts/smoke.sh <plugin> <version> [--runs N]}"
version="${2:?usage: scripts/smoke.sh <plugin> <version> [--runs N]}"
runs=1
[ "${3:-}" = "--runs" ] && runs="${4:?--runs needs a number}"
tag="${plugin}--v${version}"

git fetch -q origin --tags
git rev-parse -q --verify "refs/tags/$tag" >/dev/null || { echo "✗ tag $tag not found"; exit 1; }

work="$(mktemp -d)"
cleanup() { git worktree remove --force "$work/tree" >/dev/null 2>&1 || true; rm -rf "$work"; }
trap cleanup EXIT

git worktree add -q --detach "$work/tree" "$tag"
echo "✓ $tag → $(git -C "$work/tree" rev-parse --short HEAD)"
if [ ! -d "$work/tree/plugins/$plugin/evals" ]; then
  echo "✗ $plugin@$version has no evals/ — nothing to smoke-test"; exit 1
fi

status=0
(cd "$work/tree" && claude plugin eval ./plugins --eval-dir "$plugin/evals" --tag smoke \
  --runs "$runs" --ablation none --scaffold --trust-plugin --allow-tools Write Edit \
  --no-publish --threshold 0.66 --output-dir "$work/results" --json "$work/smoke.json") || status=$?
node -e '
  const d = require(process.argv[1]);
  console.log(`plugins: ${d.suite.plugins.map((p) => p.name + "@" + p.version).join(", ")}`);
  console.log(`cases passed: ${d.aggregates.casesPassed}/${d.aggregates.casesTotal} · score ${d.aggregates.overallScore} · $${d.costUsd.toFixed(2)}`);' "$work/smoke.json"
d=$(node -e 'const d=require(process.argv[1]);for(const c of d.cases)for(const r of c.arms.with)for(const g of r.graders)if(!g.passed)console.log(`  ✗ ${c.name}: ${g.name} — ${g.explanation ?? ""}`)' "$work/smoke.json")
[ -n "$d" ] && echo "$d"
exit $status
