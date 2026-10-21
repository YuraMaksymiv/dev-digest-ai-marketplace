---
description: When the repository documents no test command, the plan asks the user instead of inventing one.
tags: [sdd, plan, guardrail]
plugins: ["../..", "../../../engineering-paved-path", "../../../research-tools", "../../../architecture-review"]
runs: 3
max_turns: 30
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill, Agent]
expected_outcome: plan lists an open question about the test command; no invented `npm test`.
---

Create an implementation plan for specs/due-dates.md using the spec-driven workflow.
