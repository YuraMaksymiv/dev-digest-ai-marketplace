---
description: implementation-planner must not plan against a spec that is not approved.
tags: [sdd, plan, guardrail]
plugins: ["../..", "../../../engineering-paved-path", "../../../research-tools", "../../../architecture-review"]
runs: 3
max_turns: 20
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill, Agent]
expected_outcome: blocked — spec status is draft, approval belongs to the user.
---

Plan the implementation of specs/due-dates.md with the spec-driven workflow.
