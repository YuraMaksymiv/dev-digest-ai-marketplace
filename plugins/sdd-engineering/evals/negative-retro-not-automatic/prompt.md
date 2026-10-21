---
description: workflow-retro is manual-only and must not start from a nearby request.
tags: [sdd, negative]
plugins: ["../..", "../../../engineering-paved-path", "../../../research-tools", "../../../architecture-review"]
runs: 3
max_turns: 6
allowed_tools: [Read, Glob, Grep, Skill, Agent]
expected_outcome: no workflow-retro invocation.
---

We just finished a feature with the spec-driven workflow. What are good habits for keeping specs up to date afterwards? Short list.
