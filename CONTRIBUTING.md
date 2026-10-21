# Contributing

This guide is meant to be enough to prepare a pull request without asking
in chat where files go or what to run.

## 1. Plugin structure

```
plugins/<plugin-name>/
├── .claude-plugin/
│   └── plugin.json        required — the source of truth for the plugin
├── skills/<skill>/SKILL.md (+ references, examples, scripts/)
├── agents/<agent>.md
├── commands/<command>.md   (optional)
├── hooks/hooks.json        (optional)
├── evals/<case>/           behavior evals (prompt.md, case.yaml, graders/)
├── README.md               required — what it does, how to use it, dependencies
├── CHANGELOG.md            required — Keep a Changelog, one section per version
└── COMPATIBILITY.md        required — minimum Claude Code version and why
```

Components are discovered from the default folders. Only list `skills`,
`agents` or `commands` in `plugin.json` when you need a non-default layout.

## 2. Manifest fields

`plugin.json`:

| Field | Rule |
|---|---|
| `name` | kebab-case, equals the directory name and the marketplace entry name |
| `version` | SemVer. Bump it in the same PR as the change (see [RELEASES.md](docs/RELEASES.md)) |
| `displayName`, `description` | English, one sentence for the description, starts with what the plugin gives the user |
| `author`, `homepage`, `repository`, `license`, `keywords` | always set; `homepage` points at the catalog page `#/plugin/<name>` |
| `dependencies` | object form with a caret range: `{ "name": "engineering-paved-path", "version": "^1.0.0" }` |

`marketplace.json` entry: `name`, `source` (`./plugins/<name>`),
`description`, `category`. **Do not** repeat `version` or component lists
there. `plugin.json` owns the plugin's contents.

Never put credentials, tokens, absolute paths or machine-specific values in
any manifest. Use `${CLAUDE_PLUGIN_ROOT}` for plugin-level files and
`${CLAUDE_SKILL_DIR}` for a script inside a skill.

## 3. Dependency rules

- Depend on a plugin only when you reference its components by name
  (`engineering-paved-path:react-best-practices`,
  `research-tools:researcher`). Always use the fully qualified name.
- Don't copy a shared skill into your plugin. Add it to
  `engineering-paved-path` (if it has a second consumer) and depend on it.
- Same-marketplace dependencies only. A cross-marketplace dependency needs
  `allowCrossMarketplaceDependenciesOn` and an owner discussion first.
- Ranges are `^MAJOR.MINOR.0` of the lowest version that has what you use.
- No cycles. Current graph: `sdd-engineering → {engineering-paved-path,
  research-tools, architecture-review}`, `architecture-review →
  engineering-paved-path`.
- Dependencies are released (tagged) **before** their consumers.

## 4. Component rules

- Everything is **English**: prompts, READMEs, comments, UI copy.
- No product-specific paths or names (another repository's modules, package
  names, ports). Discover the target repository's layout from its own
  `CLAUDE.md` / `AGENTS.md` / manifests, and state the default when nothing
  is found.
- Agents get the **minimum tools**. Read-only agents have no Write/Edit. If
  an agent has Bash, its prompt says what it may and may not run. Plugin
  agents can't use `hooks`, `mcpServers` or `permissionMode`; those keys are
  ignored.
- Skills that only provide reference context don't set `allowed-tools`.
- A workflow skill that must only run on request sets
  `disable-model-invocation: true`.
- Content read by an agent (files, web pages, tool output) is data, not
  instructions. Say so in agents that read untrusted input.
- Don't duplicate long instructions between an agent prompt and a skill.
  Keep the detail in one place and reference it.

## 5. Checks

Run all of these locally before opening a PR. CI runs the same:

```bash
claude plugin validate .                                   # marketplace
claude plugin validate channels/stable/marketplace.json    # stable channel
for p in plugins/*/; do claude plugin validate "$p" --strict; done
bash scripts/check-hygiene.sh                              # paths, secrets, leftovers, language, caches
node scripts/build-index.mjs && (cd site && npm ci && npm run build)   # catalog still builds
```

Try the plugin from your working copy before tagging anything:

```bash
claude --plugin-dir ./plugins/engineering-paved-path \
       --plugin-dir ./plugins/research-tools \
       --plugin-dir ./plugins/architecture-review \
       --plugin-dir ./plugins/sdd-engineering
```

Behavior evals (cost money, so run them when you change prompts):

```bash
claude plugin eval ./plugins --eval-dir sdd-engineering/evals --scaffold --trust-plugin \
  --allow-tools Write Edit --runs 3 --no-publish
```

| CI job | Workflow | What fails it |
|---|---|---|
| `validate-harness` | `validate.yml` | manifest/plugin validation, name mismatch, hygiene |
| `build-site` | `site.yml` | index build, catalog typecheck/build |
| `evals-smoke` | `validate.yml` (manual dispatch) | smoke evals below threshold |

## 6. Pull request checklist

- [ ] One plugin per PR where possible. The title starts with the plugin
      name: `sdd-engineering: require AC per requirement`.
- [ ] `version` bumped per SemVer and a matching `## [x.y.z] - YYYY-MM-DD`
      section in `CHANGELOG.md`.
- [ ] README updated if usage, components or dependencies changed.
- [ ] `COMPATIBILITY.md` updated if you used a newer Claude Code feature.
- [ ] Validation, hygiene and site build pass locally.
- [ ] For prompt/agent changes: eval results (pass rate, cost) in the PR
      description; new behavior has a new eval case.
- [ ] No secrets, absolute paths, caches (`__pycache__`, `.DS_Store`) or
      generated files (`site/dist`, `site/public/*.json`, `evals/results`).
- [ ] CODEOWNERS for the touched plugin approved.

Releases (tags) are made by owners after merge. See
[docs/RELEASES.md](docs/RELEASES.md).
