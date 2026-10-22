---
description: (1.1.0) Every mandatory requirement maps to a testable AC/NFR; vague ones get a blocking marker and the spec stays draft.
tags: [sdd, spec, positive, v1.1]
plugins: ["../..", "../../../engineering-paved-path", "../../../research-tools", "../../../architecture-review"]
runs: 3
max_turns: 40
timeout_seconds: 1200
allowed_tools: [Read, Glob, Grep, Skill, Agent, Write, Edit]
expected_outcome: specs/due-dates.md has a Requirement coverage table; R for "fast" and "user-friendly" carry blocking markers; Status draft.
---

Use the spec-driven workflow to write the spec for this feature; name it `specs/due-dates.md`. These are all the answers I have — don't ask questions, write the spec now.

Mandatory requirements:
- `todo add <title> --due YYYY-MM-DD` must store an optional due date.
- An invalid date must print an error, exit with code 1 and save nothing.
- `todo list --overdue` must show only not-done todos due before today (local date).
- The overdue listing must be fast.
- Error messages must be user-friendly.
