# Plugin guidelines

How to decide what goes into a plugin, and which plugin it goes into.

## 1. Classify before you extract

Every candidate file falls into exactly one group:

| Group | Examples | Goes where |
|---|---|---|
| **Reusable** | skills, agents, hooks, evals with no product-specific paths | a plugin in this marketplace |
| **Project-specific** | a product's `CLAUDE.md`, its specs, module names, rules that only apply to one product | stays in the product repository |
| **Optional integration** | MCP servers, anything with network access or credentials | its own plugin with a security review, never bundled into a workflow plugin |
| **Local leftovers** | caches, personal memory, experiments, absolute paths, personal notification hooks | nowhere; delete or keep locally |

For each file you add, you should be able to name its owner, its consumer
scenario, and why it is released together with the rest of its plugin.

## 2. Boundaries

- **One plugin, one job, one owner.** A plugin is released as a unit, so
  everything in it should change for the same reasons.
- **Shared practice → `engineering-paved-path`.** A technical skill used by
  more than one agent or plugin lives there once. Only add a skill that a
  workflow needs or that has another named consumer. Every skill's
  description is always in the discovery context.
- **Useful on its own → its own plugin.** `researcher` and
  `architecture-reviewer` are workflow steps, but people use them alone too,
  so they live in `research-tools` and `architecture-review`.
- **Workflow → consumer plugin.** `sdd-engineering` composes the others
  through namespaced references and dependency ranges.

## 3. Making a component portable

1. Remove product paths and names. Replace assumptions about repository
   layout with **explicit inputs** plus a documented discovery order (what
   the agent reads, and the default when nothing is found).
2. Document where the component writes, and only write there.
3. Describe the behavior when a prerequisite is missing (e.g. no documented
   test command). Ask the user, never invent.
4. Review tools and permissions (see [SECURITY.md](SECURITY.md)).
5. Replace local references with namespaced ones: `plugin:skill`,
   `plugin:agent`.
6. Use `${CLAUDE_PLUGIN_ROOT}` for plugin files and `${CLAUDE_SKILL_DIR}`
   for a script inside a skill.
7. Remove duplicated instructions between agent prompts and skills.
8. The project's own instructions override the plugin's generic defaults.
   Say so in the component.

## 4. Naming

| Thing | Convention | Example |
|---|---|---|
| Plugin | kebab-case noun phrase, no product name | `architecture-review` |
| Skill / agent | kebab-case, role or topic | `implementation-planner`, `react-best-practices` |
| Reference in prompts | fully qualified | `engineering-paved-path:architecture` |
| Tag | `<plugin>--v<version>` | `sdd-engineering--v1.1.0` |
| Eval case | `<area>-<behavior>`; negative cases start with `negative-` | `planner-refuses-draft-spec` |

## 5. Evals

Schema validation checks file shapes. Behavior evals check that the
composition does the right job. Both are required:

- positive cases for the main scenario;
- guardrail cases for refusals and missing prerequisites;
- negative cases where the plugin must **not** activate
  (`tool_used … max: 0`, `arm: both`);
- a new behavior ships with a new case.
