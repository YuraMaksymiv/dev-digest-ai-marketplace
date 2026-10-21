# Extraction inventory (temporary — delete after the first release)

Source: the course project's local `.claude/` harness (after L05; the L06
evals and L07 hooks/traces were not present in that checkout). Each row:
group (1 reusable · 2 project-specific · 3 optional integration · 4 local
leftover), destination, owner, consumer scenario.

| Source | Group | Destination | Consumer scenario / reason |
|---|---|---|---|
| agents/spec-creator.md | 1 | sdd-engineering/agents | SDD step 1. MCP tools removed (group 3) and replaced by "system state passed by the orchestrator" |
| agents/implementation-planner.md | 1 | sdd-engineering/agents | SDD step 2. Module list and test commands are discovered, missing test command → open question |
| agents/implementer.md | 1 | sdd-engineering/agents | run-plan implement/fix |
| agents/plan-verifier.md | 1 | sdd-engineering/agents | run-plan traceability gates |
| agents/test-runner.md | 1 | sdd-engineering/agents | run-plan test gate (needed by run-plan, not in the original lab list) |
| agents/researcher.md | 1 | research-tools/agents | delegated discovery + standalone research |
| agents/architecture-reviewer.md | 1 | architecture-review/agents | run-plan review gate + standalone review. Hard-coded product checks replaced by repository-doc discovery |
| skills/run-plan | 1 | sdd-engineering/skills | orchestrator, manual-only |
| skills/workflow-retro (+ retro.py, prices.json) | 1 | sdd-engineering/skills | manual retro. Script uses `${CLAUDE_SKILL_DIR}`, modules discovered, `--forbid` for repository-specific commands |
| skills/engineering-insights | 1 | sdd-engineering/skills | module memory. Module discovery replaces the fixed module list |
| skills/onion-architecture + frontend-ui-architecture | 1→merged | engineering-paved-path/skills/architecture | generic layering rules. Product-specific known drift / placement maps stay in the product |
| skills/typescript-expert, react-best-practices, react-testing-library, next-best-practices, fastify-best-practices, drizzle-orm-patterns, postgresql-table-design, zod, security, mermaid-diagram | 1 | engineering-paved-path/skills | assigned by implementation-planner, applied by implementer, read by spec-creator |
| agents/brainstorm.md, doc-writer.md, test-writer.md, security-reviewer.md | 1 | not in 1.0.0 | no consumer in the SDD 1.0.0 flow. Candidates for later plugins |
| skills/pr-self-review | 2 | stays in product | routes on product module paths and scripts |
| agents/README.md, root/module CLAUDE.md, INSIGHTS.md, specs/ | 2 | stays in product | product documentation |
| devdigest MCP server (`mcp__devdigest__*`) | 3 | not extracted | needs the product API. Optional integration |
| `.claude/settings.local.json`, `__pycache__/`, `evals/results`, `skill-evals/workspaces`, personal sound hooks in `~/.claude/settings.json` | 4 | nowhere | local leftovers |
