#!/usr/bin/env bash
# Pre-release checks + tag for one plugin. Dry run by default.
# Usage: scripts/release.sh <plugin> [--push]
# Order: release dependencies first (engineering-paved-path, research-tools,
# architecture-review), then sdd-engineering.
set -euo pipefail

plugin="${1:?usage: scripts/release.sh <plugin> [--push]}"
push="${2:-}"
dir="plugins/$plugin"
manifest="$dir/.claude-plugin/plugin.json"

fail() { echo "✗ $*" >&2; exit 1; }
ok() { echo "✓ $*"; }

[ -f "$manifest" ] || fail "$manifest not found (run from the marketplace root)"
command -v claude >/dev/null || fail "claude CLI not found"

version="$(node -p "require('./$manifest').version")"
tag="${plugin}--v${version}"

[ "$(git rev-parse --abbrev-ref HEAD)" = "main" ] || fail "releases are tagged from main"
git fetch -q origin main --tags
[ "$(git rev-parse HEAD)" = "$(git rev-parse origin/main)" ] || fail "local main is not origin/main — pull first"
[ -z "$(git status --porcelain)" ] || fail "working tree is not clean"
ok "on origin/main $(git rev-parse --short HEAD), clean tree"

git rev-parse -q --verify "refs/tags/$tag" >/dev/null && fail "tag $tag already exists — bump the version"
grep -qE "^## \[$version\]" "$dir/CHANGELOG.md" || fail "$dir/CHANGELOG.md has no '## [$version]' section"
ok "CHANGELOG has $version"

claude plugin validate "$dir" --strict >/dev/null || fail "claude plugin validate $dir --strict failed"
claude plugin validate . >/dev/null || fail "marketplace validation failed"
ok "validation passed"

# Every versioned dependency must already have a released tag in range
# (exact check of the dependency's current version; ranges are ^x.y.z by policy).
node -e '
  const m = require("./'"$manifest"'");
  for (const d of m.dependencies ?? []) {
    if (typeof d === "string" || !d.version) continue;
    console.log(d.name + " " + require("./plugins/" + d.name + "/.claude-plugin/plugin.json").version);
  }' | while read -r dep depver; do
  git rev-parse -q --verify "refs/tags/${dep}--v${depver}" >/dev/null \
    || fail "dependency ${dep}@${depver} is not tagged yet — release it first"
  ok "dependency ${dep}--v${depver} is tagged"
done

echo
echo "Release checklist for $tag (confirm before --push):"
echo "  - CI is green for $(git rev-parse --short HEAD) (validate, build-site, evals smoke)"
echo "  - evals results recorded in docs/COST-BASELINE.md / PR description"
echo "  - CHANGELOG [$version] reviewed"
echo

(cd "$dir" && claude plugin tag --dry-run)
if [ "$push" = "--push" ]; then
  (cd "$dir" && claude plugin tag --push -m "$plugin %s")
  ok "pushed $tag → $(git rev-parse --short "$tag^{commit}")"
  echo "Next: node scripts/pin-stable.mjs $plugin $version  (when this version should become stable)"
else
  echo "Dry run only. Re-run with --push to create and push $tag."
fi
