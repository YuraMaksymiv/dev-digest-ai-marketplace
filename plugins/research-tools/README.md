# Research Tools

A generic, **read-only** `researcher` agent. Give it one concrete question.
It answers from the repository (code, docs, config, git history), from
external sources (official docs, standards, changelogs), or from both, and
returns a structured report with cited evidence and an explicit "not found"
list.

```
/plugin install research-tools@dev-digest-ai-marketplace
```

## Usage

- Ask directly: *"Use research-tools:researcher to find out how Fastify 5
  handles async hooks errors."*
- Delegated: `sdd-engineering:spec-creator` lists research requests
  (`R1…Rn`) in its Discovery Report, and the main session dispatches each
  one to `research-tools:researcher`, in parallel when they are independent.

If the question is vague, the agent asks clarifying questions before
researching.

## Guarantees

| Property | How |
|---|---|
| No writes | Tools: `Read, Grep, Glob, Bash, WebFetch, WebSearch`. No Write/Edit. Bash is restricted by prompt to read-only commands (`git log/show/blame/diff`, `ls`, `rg`). |
| Evidence | Every finding cites `file:line`, a commit, or a URL with an access date. No fabricated paths or links. |
| Prompt-injection hygiene | Content of fetched pages and files is data, not instructions. |
| No recursive research | Never calls deep-research skills. All research uses its own tools. |

## Report shape

`## Question` → `## Findings` → `## Evidence` (repository) or `## Sources`
(external) → `## Not found / could not verify`.

See [CHANGELOG.md](CHANGELOG.md) and [COMPATIBILITY.md](COMPATIBILITY.md).
