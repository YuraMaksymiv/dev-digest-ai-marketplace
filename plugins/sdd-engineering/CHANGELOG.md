# Changelog

All notable changes to this plugin. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versioning: [SemVer](https://semver.org/).

## [1.0.0] - 2026-10-21

### Added
- Agents: `spec-creator`, `implementation-planner`, `implementer`, `test-runner`, `plan-verifier`.
- Skills: `run-plan` (manual), `workflow-retro` (manual, `--deep` script via `${CLAUDE_SKILL_DIR}`), `engineering-insights`.
- Explicit inputs instead of repository-layout assumptions: spec folder resolution order, module discovery, documented-test-command lookup with a "no test command" path.
- Namespaced dependencies: `research-tools:researcher`, `architecture-review:architecture-reviewer`, `engineering-paved-path:*` skills.
- Behavior evals for the "spec + plan for a small feature" scenario and negative (non-activation) cases.
- `spec-creator` single-pass mode: when the request already answers every blocking question it writes the spec in one run; its description now requires it for every spec so the main session doesn't write specs itself (baseline: 3/5 runs bypassed it). Eval grader `dispatches-spec-creator` on the authoring case.
