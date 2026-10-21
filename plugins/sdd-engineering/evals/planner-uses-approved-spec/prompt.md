---
description: implementation-planner reads the approved spec and plans against its AC-IDs only, with documented test commands, then asks for execution mode.
tags: [sdd, plan, positive, smoke]
plugins: ["../..", "../../../engineering-paved-path", "../../../research-tools", "../../../architecture-review"]
runs: 3
max_turns: 30
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill, Agent]
expected_outcome: a plan whose tasks map to AC-1..AC-5 and NFR-1, uses `npm test`, and ends asking multi vs single agent.
---

Create an implementation plan for specs/due-dates.md using the spec-driven workflow. Don't implement anything yet.
