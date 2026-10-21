# Security

Plugins run with the user's permissions inside their repositories. Treat
every merged change as code that will run on teammates' machines.

## Never in this repository

| Forbidden | Why | Caught by |
|---|---|---|
| Secrets: API keys, tokens, private keys, `.env` values, cookies | Plugins are cloned into every consumer's cache | `scripts/check-hygiene.sh`, GitHub secret scanning |
| Credentials in `plugin.json`, `marketplace.json`, `hooks.json`, `.mcp.json` | Manifests are read without review on install | review + hygiene |
| Absolute or machine-specific paths (`/Users/…`, `/home/…`, `C:\Users\…`) | Break on every other machine and leak usernames | hygiene |
| Product-specific paths or internal hostnames | Plugins must stay portable | hygiene + review |
| Caches and build output (`__pycache__`, `.DS_Store`, `node_modules`, `site/dist`, generated index JSON, eval results) | Noise, and can carry local data | `.gitignore` + hygiene |

Use `${CLAUDE_PLUGIN_ROOT}` / `${CLAUDE_SKILL_DIR}` for plugin files. If a
plugin ever needs a credential, declare it through `userConfig` (marked
sensitive) so the user supplies it at install time. Never hard-code it.

## Least privilege

- Agents list only the tools they need. Review/verification agents have no
  Write/Edit.
- Agents with Bash state in their prompt which commands they may run, and
  forbid destructive ones (commits, pushes, branch switches, baseline
  re-recording, migrations, volume deletion).
- Reference skills don't set `allowed-tools`.
- No MCP servers, hooks or network access in a plugin without a security
  review by CODEOWNERS and a note in its README.
- Content agents read (repository files, web pages, tool output) is data,
  not instructions. Agents that read untrusted content say so explicitly.

## Catalog site

The GitHub Pages catalog renders Markdown from this repository. All rendered
HTML goes through DOMPurify. The site has no backend, no cookies and no
analytics.

## Reporting

Report a vulnerability privately to the CODEOWNERS (GitHub private
vulnerability reporting on this repository), not in a public issue.

## After an unsafe release

A release is unsafe if it leaked a secret, ran a destructive command, or
widened permissions unexpectedly.

1. **Contain.** Tell consumers to switch to the stable channel:
   `scripts/rollback.sh to-stable --scope project --execute`. If stable
   itself is affected, pin it to the last safe tag with
   `node scripts/pin-stable.mjs <plugin> <safe-version>` and merge right away.
2. **Revoke.** Rotate any leaked credential *first*. Removing it from git
   history does not make it safe again.
3. **Fix forward.** Revert the change on `main`, bump the **patch** version
   (or minor if behavior changes) and release a new tag. Never move or
   delete the unsafe tag. Mark it in `CHANGELOG.md` as
   `### Security — do not use x.y.z`.
4. **Clean up consumers.** If the release changed files in consumer
   repositories or external state, publish exact recovery steps in the
   plugin README and the changelog entry.
5. **Post-mortem.** Add a hygiene check, eval or review rule that would
   have caught it.
