# Releases

## Versioning (SemVer, per plugin)

Each plugin has its own version in `.claude-plugin/plugin.json`. The
marketplace itself is not versioned.

| Bump | When | Examples |
|---|---|---|
| **major** | A dependant or user must change something | removing or renaming a skill/agent, changing an output format other agents parse, raising the minimum Claude Code version, narrowing a dependency range incompatibly |
| **minor** | New backward-compatible behavior | new agent/skill, a stricter but compatible rule (e.g. `spec-creator` requires an AC per requirement), new eval cases |
| **patch** | Fixes with no behavior change for correct inputs | typo, clarified wording, script bug fix |

Setting `version` pins users until it changes. A merged change without a
version bump never reaches installed users.

## Tags

Claude Code resolves dependency ranges against git tags named
`<plugin>--v<version>` in this repository:

```
engineering-paved-path--v1.0.0
research-tools--v1.0.0
architecture-review--v1.0.0
sdd-engineering--v1.0.0
```

A tag is immutable. It must point at a commit on `main` that passed CI.
Never move or delete a released tag. Fix forward with a new version.

## Release procedure

Dependencies first, consumers last:
`engineering-paved-path` → `research-tools` → `architecture-review` →
`sdd-engineering`.

```bash
git checkout main && git pull
scripts/release.sh engineering-paved-path          # checks + `claude plugin tag --dry-run`
scripts/release.sh engineering-paved-path --push   # creates and pushes the tag
# …repeat for research-tools, architecture-review, sdd-engineering
```

`scripts/release.sh` refuses to tag unless:

- you are on `origin/main` with a clean tree;
- the tag doesn't exist yet;
- `CHANGELOG.md` has a `## [<version>]` section;
- `claude plugin validate` passes for the plugin and the marketplace;
- every versioned dependency is already tagged.

Before `--push`, check the CI run for that SHA (validate-harness,
build-site) and the eval results.

## Channels

| Channel | Marketplace name | File | Resolves to |
|---|---|---|---|
| latest | `dev-digest-ai-marketplace` | `.claude-plugin/marketplace.json` | `main` HEAD of each plugin directory; dependency ranges resolve against release tags |
| stable | `dev-digest-ai-marketplace-stable` | `channels/stable/marketplace.json` | each plugin pinned to a release tag **and** its commit SHA (`git-subdir` source) |

Pin a release into stable after it has been verified on latest:

```bash
node scripts/pin-stable.mjs sdd-engineering 1.0.0
claude plugin validate channels/stable/marketplace.json
# open a PR with the change
```

## Update (consumer)

Updating the catalog and updating a plugin are two separate steps:

```bash
claude plugin marketplace update dev-digest-ai-marketplace                 # refresh the catalog
claude plugin update sdd-engineering@dev-digest-ai-marketplace --scope project   # move the install
claude plugin list --json                                                  # check version, no errorDetails
```

Then `/reload-plugins` or a new session.

## Rollback

There is no `plugin rollback` command. A rollback switches the project to
the stable channel. All four plugins move together, because two enabled
copies of the same plugin name would collide on one namespace.

```bash
# from the consumer repository; prints the commands, --execute runs them
scripts/rollback.sh to-stable --scope project
scripts/rollback.sh to-stable --scope project --execute
```

Which runs:

1. `claude plugin marketplace add <raw URL of channels/stable/marketplace.json> --scope project`
2. `claude plugin marketplace update dev-digest-ai-marketplace-stable`
3. `claude plugin disable <p>@dev-digest-ai-marketplace --scope project` for all four
4. `claude plugin install sdd-engineering@dev-digest-ai-marketplace-stable --scope project` (dependencies come from the stable channel)
5. `claude plugin list --json` shows the pinned version
6. `/reload-plugins` (or a new session), then confirm the session loads the
   stable copy: `claude plugin list --json` shows the pinned version and the
   latest-channel copies disabled.
7. Smoke-test the pinned version from a marketplace checkout:
   `scripts/smoke.sh sdd-engineering <version>` (runs the `smoke` evals from a
   temporary worktree at the tag, threshold 0.66). Evaluating the installed
   copy (`plugin eval sdd-engineering@…-stable`) does not work, because eval
   cases load dependency plugins by relative path, which only exists in the
   repository layout.

Return to latest only after the fix is released and verified:
`scripts/rollback.sh to-latest --scope project --execute`. It disables the
stable copies and enables `sdd-engineering@dev-digest-ai-marketplace`, which
re-enables its dependencies.

Rehearsed 2026-10-22 in a consumer repository: 1.1.0 → stable 1.0.0 (new
session loaded `…-stable/sdd-engineering/1.0.0`, cache had no 1.1.0 rule,
smoke 3/3 from the tag) → back to latest 1.1.0. Specs, plans and the retro
ledger in the consumer repository were untouched.

### Data and external state

- These plugins keep no plugin data (`${CLAUDE_PLUGIN_DATA}` is unused).
  Switching channels loses nothing.
- Files the workflow wrote into the consumer repository (specs, plans,
  `INSIGHTS.md`, `docs/retro/ledger.md`) are ordinary tracked files. Review
  and revert them with git like any other change. A plugin version never
  rewrites them on install or rollback.
- No plugin calls external services. If a future plugin does, its README
  must describe how to undo its external effects, and that procedure
  becomes part of this rollback section.

## After an unsafe release

Follow [SECURITY.md](SECURITY.md#after-an-unsafe-release).
