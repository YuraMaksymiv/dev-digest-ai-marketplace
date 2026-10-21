# Engineering Paved Path

The team's shared engineering practices, packaged as **reference skills**.
Other plugins depend on this one instead of copying the same rules into
every agent. There is one source of truth, and changes ship as one versioned
release.

```
/plugin install engineering-paved-path@dev-digest-ai-marketplace
```

These skills perform no actions. Claude loads them as context when a task
matches the description, or when an agent or plan names them explicitly,
e.g. `engineering-paved-path:react-best-practices`.

## Skills

| Skill | Use it for | Notable files |
|---|---|---|
| `architecture` | Which layer owns a piece of code, which way imports may point, review checklist. Defers to the repository's own `ARCHITECTURE.md`/ADRs/checker config. | `SKILL.md` |
| `typescript-expert` | Type-level programming, tsconfig, performance, migrations | `references/`, `scripts/ts_diagnostic.py` |
| `react-best-practices` | Component design, hooks, state, anti-patterns | `examples.md` |
| `react-testing-library` | RTL + Vitest: queries, `userEvent`, async, mocking | — |
| `next-best-practices` | Next.js App Router: RSC boundaries, data patterns, metadata, route handlers | 19 topic files |
| `fastify-best-practices` | Fastify routes, plugins, schemas, hooks, errors, TypeScript | `rules/` |
| `drizzle-orm-patterns` | Drizzle schema, relations, queries, transactions, migrations | `references/` |
| `postgresql-table-design` | PostgreSQL types, constraints, indexes, partitioning | — |
| `zod` | Schemas, parsing, error handling, `z.infer` | `references/`, `assets/templates/` |
| `security` | OWASP Top 10:2025, auth, input handling, secrets, agentic-AI risks | `checklists.md`, `examples.md` |
| `mermaid-diagram` | Flowcharts, sequence/ER/state diagrams in Markdown | `examples.md` |

## Who uses it

| Consumer | How |
|---|---|
| `architecture-review` | `architecture-reviewer` falls back to `engineering-paved-path:architecture` when a repository has no architecture docs |
| `sdd-engineering` | `implementation-planner` assigns these skills per task; `implementer` loads them; `spec-creator` reads `architecture`, `security`, `mermaid-diagram` |

## Adding or removing a skill

Each skill increases discovery context (its description is always listed)
and support burden. A skill belongs here only if the SDD workflow needs it
or it has another named consumer. See the root
[CONTRIBUTING.md](../../CONTRIBUTING.md). Removing a skill is a **major**
version bump, because dependants may reference it by name.

## Provenance

Extracted from the course project's local `.claude/skills/` and made
repository-agnostic. `fastify-best-practices` comes from
`mcollina/fastify-best-practices`. Other skills keep their original
frontmatter and attribution.
