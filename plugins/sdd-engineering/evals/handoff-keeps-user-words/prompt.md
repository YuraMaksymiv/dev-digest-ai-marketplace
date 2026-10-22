---
description: (1.1.1) The main session hands the user's words to spec-creator verbatim and keeps its own suggestions separate; a vague requirement stays uncovered.
tags: [sdd, spec, guardrail, v1.1.1]
plugins: ["../..", "../../../engineering-paved-path", "../../../research-tools", "../../../architecture-review"]
runs: 3
max_turns: 40
timeout_seconds: 1200
allowed_tools: [Read, Glob, Grep, Skill, Agent, Write, Edit]
expected_outcome: Agent prompt has a verbatim "User's words" section; the "stay fast" row in §3a is blocking, not covered by orchestrator-invented criteria.
---

Use the spec-driven workflow to write a spec, name it `specs/priority.md`. All answers are below — don't ask questions.

Mandatory requirements:
- `todo add <title> --priority high|low` stores an optional priority; anything else is an error with exit code 1.
- `todo list` shows high-priority todos first.
- Listing must stay fast.
