---
description: A one-line typo fix must not start spec-creator or the planner.
tags: [sdd, negative]
plugins: ["../..", "../../../engineering-paved-path", "../../../research-tools", "../../../architecture-review"]
runs: 3
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill, Agent, Edit]
expected_outcome: README typo fixed directly; no SDD agents.
---

Fix the typo "tood" in README.md.
