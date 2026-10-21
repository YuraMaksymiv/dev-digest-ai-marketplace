#!/usr/bin/env bash
# Consumer-side rollback: switch a project from the latest channel to the
# pinned stable channel (or back). Prints the commands; pass --execute to run them.
# Usage:
#   scripts/rollback.sh to-stable [--scope project|user|local] [--execute]
#   scripts/rollback.sh to-latest [--scope project|user|local] [--execute]
# Run it from the CONSUMER repository (the project that installed the plugins).
set -euo pipefail

direction="${1:?usage: rollback.sh to-stable|to-latest [--scope S] [--execute]}"; shift
scope="project"; execute=0
while [ $# -gt 0 ]; do
  case "$1" in
    --scope) scope="$2"; shift 2 ;;
    --execute) execute=1; shift ;;
    *) echo "unknown option $1" >&2; exit 2 ;;
  esac
done

LATEST="dev-digest-ai-marketplace"
STABLE="dev-digest-ai-marketplace-stable"
STABLE_URL="https://raw.githubusercontent.com/YuraMaksymiv/dev-digest-ai-marketplace/main/channels/stable/marketplace.json"
# All four must move together: two enabled copies of the same plugin name from
# different marketplaces would collide on the same skill/agent namespace.
PLUGINS=(sdd-engineering architecture-review research-tools engineering-paved-path)

run() { echo "+ $*"; if [ "$execute" = 1 ]; then "$@"; fi; }

case "$direction" in
  to-stable)
    run claude plugin marketplace add "$STABLE_URL" --scope "$scope" || true
    run claude plugin marketplace update "$STABLE"
    for p in "${PLUGINS[@]}"; do run claude plugin disable "$p@$LATEST" --scope "$scope" || true; done
    run claude plugin install "sdd-engineering@$STABLE" --scope "$scope"
    ;;
  to-latest)
    run claude plugin marketplace update "$LATEST"
    for p in "${PLUGINS[@]}"; do run claude plugin disable "$p@$STABLE" --scope "$scope" || true; done
    for p in "${PLUGINS[@]}"; do run claude plugin enable "$p@$LATEST" --scope "$scope" || true; done
    run claude plugin update "sdd-engineering@$LATEST" --scope "$scope"
    ;;
  *) echo "direction must be to-stable or to-latest" >&2; exit 2 ;;
esac

run claude plugin list --json
cat <<MSG

Then, in Claude Code: /reload-plugins (or start a new session) and run the smoke eval:
  claude plugin eval sdd-engineering@$( [ "$direction" = to-stable ] && echo "$STABLE" || echo "$LATEST" ) --tag smoke --scaffold --trust-plugin --allow-tools Write Edit --runs 1 --no-publish
Check that 'claude plugin list --json' shows the expected version and no errorDetails.
MSG
