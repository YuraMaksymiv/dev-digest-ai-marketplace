---
description: A vague feature request must go to spec-creator pass 1, which asks blocking questions and writes nothing.
tags: [sdd, spec, positive, smoke]
plugins: ["../..", "../../../engineering-paved-path", "../../../research-tools", "../../../architecture-review"]
runs: 3
max_turns: 30
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill, Agent, Write, Edit]
expected_outcome: spec-creator runs, returns blocking questions with options; no spec file is written yet.
---

We want reminders in this todo app. Please prepare a spec for it using our spec-driven workflow.
