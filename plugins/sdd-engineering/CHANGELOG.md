# Changelog

All notable changes to this plugin. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versioning: [SemVer](https://semver.org/).

## [1.1.1] - 2026-10-22

### Fixed
- Handoff integrity: `spec-creator`'s description tells the main session to pass the user's request verbatim under `User's words (verbatim)` and keep its own additions under `Orchestrator notes (not from the user)`. New Hard rule 9: orchestrator-added criteria are proposals and never make a requirement covered. Found in a 1.1.0 run where the main session added speed criteria "from the user" and the rule 8 check was bypassed.
- `implementation-planner`'s description: pass the spec path and the user's words only, never state the spec's Status. Found when the main session told the planner a draft spec was approved (the planner caught it).
- `workflow-retro`: `prices.json` adds `claude-haiku-5-5`, so Haiku-run agents get a cost.

### Added
- Evals: `handoff-keeps-user-words` (3/3) and a `no-status-claim-in-handoff` grader on `planner-refuses-draft-spec` (3/3). `spec-*` regressions 9/9.

## [1.1.0] - 2026-10-22

### Added
- `spec-creator` Hard rule 8: a spec is not finished until every mandatory requirement (user "must"/"should", Goals, behaviour-changing Decisions) maps to at least one testable AC/NFR. A criterion the agent proposed itself (e.g. a latency number for "must be fast") never counts as covered: such rows get a `:blocking` marker with the proposal as an option, and the spec stays in `draft`.
- Spec template §3a Requirement coverage, a self-check item, and a coverage line in the Spec Report.
- Eval `spec-every-requirement-has-ac` (3/3 on `sonnet`; `spec-authoring` and `spec-discovery` regressions 3/3; full suite 2 runs/case without regressions).

Backward compatible: specs written by 1.0.0 stay valid. A `clarified` spec without §3a is re-checked only when `spec-creator` next updates it.

## [1.0.0] - 2026-10-21

### Added
- Agents: `spec-creator`, `implementation-planner`, `implementer`, `test-runner`, `plan-verifier`.
- Skills: `run-plan` (manual), `workflow-retro` (manual, `--deep` script via `${CLAUDE_SKILL_DIR}`), `engineering-insights`.
- Explicit inputs instead of repository-layout assumptions: spec folder resolution order, module discovery, documented-test-command lookup with a "no test command" path.
- Namespaced dependencies: `research-tools:researcher`, `architecture-review:architecture-reviewer`, `engineering-paved-path:*` skills.
- Behavior evals for the "spec + plan for a small feature" scenario and negative (non-activation) cases.
- `spec-creator` single-pass mode: when the request already answers every blocking question it writes the spec in one run; its description now requires it for every spec so the main session doesn't write specs itself (baseline: 3/5 runs bypassed it). Eval grader `dispatches-spec-creator` on the authoring case.
