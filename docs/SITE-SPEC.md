# Catalog site — specification (v1)

Static catalog of this marketplace's plugins and their artifacts (skills,
agents, commands, hooks, MCP servers). Published to
<https://yuramaksymiv.github.io/dev-digest-ai-marketplace/>. No backend:
everything is generated from repository content at build time.

## Routes (hash routing, works on GitHub Pages without rewrites)

| Route | Page |
|---|---|
| `#/` | Hero with search and top-keyword chips, counts by kind, "What's new" (latest 4 releases), "Browse by type". Empty-catalog state when there are no plugins. |
| `#/search?q=&kind=&kw=&author=&sort=` | Faceted results as cards. `kind`/`kw`/`author` are comma-separated multi-selects; `sort` = `relevance` (default) \| `name` \| `updated`. "Nothing found" state with reset. |
| `#/plugin/<name>` | Plugin detail (see below). |
| `#/artifact/<plugin>:<kind>:<name>` | Artifact detail. Agents in subfolders keep their colon segments: `p:agent:review:security`. |
| `#/whats-new` | All releases from every plugin's `CHANGELOG.md`, newest first. |
| `#/getting-started` | Add marketplace → install → update → reload → roll back via the stable channel. |

Global: sticky header with search, ⌘K / Ctrl+K command palette (searches
everything + pages), dark-first theme toggle persisted in `localStorage`
(`catalog-theme`, every access in try/catch), "Copied to clipboard" toast,
responsive down to 375 px.

## Data — `scripts/build-index.mjs`

Zero-dependency Node ≥ 22 script. Reads only real repo content:
`.claude-plugin/marketplace.json` → each local `source` →
`.claude-plugin/plugin.json`, `README.md`, `CHANGELOG.md`
(`## [x.y.z] - YYYY-MM-DD` + bullets, `###` sections kept),
`COMPATIBILITY.md`, `skills/*/SKILL.md`, `agents/**/*.md`, `commands/**/*.md`,
`hooks/hooks.json`, `.mcp.json`, and `channels/stable/marketplace.json` (for
rollback commands). Frontmatter is parsed by a small built-in YAML-subset
parser. Not indexed: `evals/`, `scripts/`, `references/`, `docs/temp/`.

Fails with exit 1 when a marketplace entry points to a missing directory, a
`plugin.json` name differs from its marketplace entry, names are duplicated,
or JSON is invalid. A missing `marketplace.json` produces an empty catalog
plus a warning. Non-local sources are skipped with a warning.

Output (gitignored) in `site/public/`:

| File | Fields |
|---|---|
| `index.json` | `schemaVersion`, `generatedAt`, `marketplace` {`name`, `displayName`, `description`, `owner`, `repo`, `repoUrl`, `commands` {add/update/install/reload templates, `rollback[]`}, `stableChannel`}, `plugins[]`, `artifacts[]` |
| `plugins[]` | `id`(=name), `kind`:"plugin", `name`, `displayName`, `version`, `description`, `author`, `authorUrl`, `homepage`, `license`, `category`, `keywords[]`, `dependencies[]` {`name`, `marketplace`, `version` range, `internal`}, `usedBy[]` {`name`, `version`}, `updated` (latest changelog date, else last git commit), `sourcePath`, `repoUrl`, `install` {`slash`, `cli`, `update`}, `compatibility` (short summary), `compatibilityFile`, `readmeFile`, `releases[]`, `counts` by kind, `artifactIds[]`, `searchText` (README excerpt ≤ 1500 chars) |
| `artifacts[]` | `id` (`plugin:kind:name`), `kind` (`skill`\|`agent`\|`command`\|`hook`\|`mcp`), `name`, `description`, `invocation` (`/plugin:skill`, `/plugin:command`, `plugin:agent`, or null), `tools[]` (tools / allowed-tools / hook matchers), `model`, `argumentHint`, `disableModelInvocation`, `userInvocable`, `transport` (mcp), `path`, `bodyFile`, `searchText` (body excerpt), plus inherited `plugin`, `pluginDisplayName`, `keywords`, `author`, `updated`, `version`, `install` |
| `releases.json` | `releases[]` {`plugin`, `displayName`, `version`, `date`, `summary` (first bullet), `items[]` {`section`, `text`}}, sorted newest first |
| `stats.json` | `gitSha` (short), `generatedAt`, `pluginCount`, `artifactCount`, `byKind` {kind: count}, `warnings[]` |
| `bodies/<id>.md` | Full markdown (frontmatter stripped) of each SKILL/agent/command, README, COMPATIBILITY; hook/MCP config rendered as a JSON block (MCP `env`/`headers` values masked). Loaded lazily on detail pages. |

Only real data is shown — no fallback or mock data. Kinds with zero
artifacts are hidden from facets and "Browse by type".

## Search

MiniSearch, fully client-side, over `name`, `displayName`, `description`,
`keywords`, `body` (README / artifact body excerpt). Boosts: name 4 >
displayName 3 > description 2 > keywords 1.5 > body 1. Prefix + fuzzy (0.2),
terms combined with AND, falling back to OR when AND finds nothing. Empty
query lists everything (plugins first, then by kind and name). Facet counts
are computed against the other active facets.

## Detail pages

- **Plugin:** name, version, compatibility badge, author / marketplace owner,
  license, updated date, keywords; install commands (`/plugin install …` and
  CLI) with Copy; GitHub link. Sections: Composition (artifacts grouped by
  kind, each linking to its page), Dependencies (version ranges, internal ones
  link to the plugin page, external ones marked) + Used by (reverse deps),
  README (rendered), Compatibility details, Changelog.
- **Artifact:** breadcrumb, kind, invocation, description, parent plugin,
  model, argument hint, manual-only / model-only note, tools; install command
  of the parent plugin; rendered body with frontmatter stripped; link to the
  source file.

## Theming, i18n, accessibility

- Colours only via CSS variables (`--bg*`, `--text*`, `--accent`,
  `--kind-<kind>`, `--term-*`) defined for `[data-theme=dark]` (default) and
  `[data-theme=light]`. Fonts: IBM Plex Sans / Mono.
- All UI copy lives in `site/src/i18n/en.json`, read through `t(key, vars)`.
  Components never hard-code user-visible strings.
- Buttons are `<button>`, navigation is `<a href="#/…">`; visible
  `:focus-visible` outline; palette is a modal dialog that traps Tab, supports
  ↑/↓/Enter and closes on Esc, restoring focus.

## Security

Repository markdown is untrusted. It is rendered with `marked` and ALWAYS
passed through DOMPurify before `dangerouslySetInnerHTML` (no `style`, forms
or inline handlers). External links get `target="_blank"
rel="noopener noreferrer"`; relative links/images are resolved to GitHub;
in-page anchors are rewritten to prefixed heading ids. Changelog bullets use
an inline-only allowlist.

## Build & deploy

| Where | What |
|---|---|
| Local | `npm run dev` / `npm run build` in `site/` run the index build first (`predev` / `prebuild`). |
| CI (`.github/workflows/site.yml`) | Job `build-site` on every PR and push to `main`: index → `npm ci` → typecheck → build. Reported separately from harness validation. |
| Deploy (`.github/workflows/pages.yml`) | On push to `main` (after merge) or manual dispatch: same build, upload `site/dist`, `actions/deploy-pages`. |

Generated JSON, `bodies/` and `dist/` are never committed. Reindexing happens
automatically on every build — there is no manual reindex step. Vite uses
`base: './'`, so the same build works locally and under the Pages sub-path.

```
node scripts/build-index.mjs
cd site && npm ci && npm run dev      # local dev server
cd site && npm run build && npm run preview
```

## Out of scope for v1

Backend or API, ratings/reviews, download or install counters, auth/accounts,
RSS feed, server-side search, localisation beyond English.
