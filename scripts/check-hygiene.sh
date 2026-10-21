#!/usr/bin/env bash
# Repository hygiene gate (CI + local). Fails on things `claude plugin validate`
# does not catch: absolute paths, secrets, product-specific leftovers,
# non-English text, and caches that must never ship inside a plugin.
set -uo pipefail
status=0
report() { echo "✗ $1"; echo "$2" | head -20; status=1; }

scan_paths=(plugins channels .claude-plugin docs CONTRIBUTING.md README.md)

hits="$(grep -rnE '(/Users/[A-Za-z]|/home/[a-z][a-z0-9_-]+/|C:\\\\Users\\\\)' "${scan_paths[@]}" \
  --exclude-dir=results --exclude-dir=temp 2>/dev/null)"
[ -n "$hits" ] && report "absolute user paths" "$hits"

hits="$(grep -rnE '(sk-ant-[A-Za-z0-9_-]{10,}|sk-[A-Za-z0-9]{32,}|ghp_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----|xox[baprs]-[A-Za-z0-9-]{10,})' \
  . --exclude-dir=.git --exclude-dir=node_modules --exclude-dir=dist 2>/dev/null)"
[ -n "$hits" ] && report "possible secrets" "$hits"

hits="$(grep -rniE '(devdigest|dev-digest[^-]|reviewer-core|@devdigest/|server/src/|client/src/|mcp__devdigest)' plugins \
  --exclude-dir=results 2>/dev/null)"
[ -n "$hits" ] && report "DevDigest-specific references inside plugins" "$hits"

hits="$(python3 - "${scan_paths[@]}" scripts site/src <<'PY'
import os, re, sys
cyr = re.compile('[\u0400-\u04FF]')
skip = {'node_modules', 'temp', 'results', 'dist', '.git'}
for root in sys.argv[1:]:
    if os.path.isfile(root):
        files = [root]
    elif os.path.isdir(root):
        files = [os.path.join(d, f) for d, ds, fs in os.walk(root) if not ds.__setitem__(slice(None), [x for x in ds if x not in skip]) for f in fs]
    else:
        continue
    for f in files:
        try:
            for n, line in enumerate(open(f, encoding='utf-8'), 1):
                if cyr.search(line):
                    print(f"{f}:{n}: {line.strip()[:120]}")
        except (UnicodeDecodeError, OSError):
            pass
PY
)"
[ -n "$hits" ] && report "non-English (Cyrillic) text — everything in this repository is English" "$hits"

hits="$(find plugins \( -name '__pycache__' -o -name '.DS_Store' -o -name 'node_modules' -o -name '*.pyc' \) -print)"
[ -n "$hits" ] && report "caches inside plugins" "$hits"

for f in plugins/*/.claude-plugin/plugin.json; do
  d="$(dirname "$(dirname "$f")")"
  for req in README.md CHANGELOG.md COMPATIBILITY.md; do
    [ -f "$d/$req" ] || report "missing $d/$req" "every plugin ships README, CHANGELOG and COMPATIBILITY"
  done
done

[ $status = 0 ] && echo "✓ hygiene checks passed"
exit $status
