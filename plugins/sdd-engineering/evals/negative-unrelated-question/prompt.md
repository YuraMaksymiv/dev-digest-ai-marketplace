---
description: A general programming question must not activate the SDD workflow.
tags: [sdd, negative, smoke]
plugins: ["../..", "../../../engineering-paved-path", "../../../research-tools", "../../../architecture-review"]
runs: 3
max_turns: 6
allowed_tools: [Read, Glob, Grep, Skill, Agent]
expected_outcome: a direct answer; no SDD agent or skill is invoked.
---

What is the difference between Array.prototype.map and Array.prototype.flatMap in JavaScript? Two sentences.
