# Architecture Review

An independent, **read-only** architecture-boundary reviewer. It checks a
diff or a module for layering and dependency-direction violations and
reports cited findings. It never fixes them.

```
/plugin install architecture-review@dev-digest-ai-marketplace
```

Installs `engineering-paved-path@^1.0.0` as a dependency.

## How it decides what "correct" means

The rule set comes from **your repository first**:

1. Paths you pass in the request.
2. `ARCHITECTURE.md`, `docs/architecture*`, `docs/adr/*`, `docs/decisions/*`.
3. Layering sections in root/module `CLAUDE.md`, `AGENTS.md`, `CONTRIBUTING.md`.
4. Architecture skills your repository ships in `.claude/skills/`.
5. Fallback: `engineering-paved-path:architecture`. The report then says
   generic defaults were applied.

If the repository documents a mechanical checker (dependency-cruiser,
eslint boundary rules, import-linter, Nx module boundaries), the agent runs
that documented command. It **never** runs a baseline/accept command,
because re-recording a baseline would hide a new violation.

## Usage

- Directly: *"Run architecture-review:architecture-reviewer on my
  uncommitted changes."*
- As a gate: `/sdd-engineering:run-plan` calls it after implementation and
  loops fixes through `sdd-engineering:implementer` (max `--rounds`).
- Faster review: pass the implementer's **Diff digest**. The agent opens
  only the files listed there.

## Report

`Scope reviewed` · `Rule sources` · `Findings` (rule, severity, from → to,
new vs baseline, why, suggested direction) · `Frontend layering notes` ·
`Commands run` · `Not checked / could not verify`.

## Make it precise for your repository

Add an `ARCHITECTURE.md` with your layers and allowed import directions, and
document your checker script in `CLAUDE.md` (e.g. `npm run arch`). The more
specific your docs, the fewer generic findings you get.

See [CHANGELOG.md](CHANGELOG.md) and [COMPATIBILITY.md](COMPATIBILITY.md).
