---
description: With all answers supplied, spec-creator writes one spec in specs/ with EARS ACs and no implementation details.
tags: [sdd, spec, positive]
plugins: ["../..", "../../../engineering-paved-path", "../../../research-tools", "../../../architecture-review"]
runs: 3
max_turns: 40
timeout_seconds: 1200
allowed_tools: [Read, Glob, Grep, Skill, Agent, Write, Edit]
expected_outcome: specs/due-dates.md exists with AC-n EARS rows, Status clarified/draft, no code.
---

Use the spec-driven workflow to write the spec for this feature; name it `specs/due-dates.md`. All clarifications are already answered below — do not ask further questions, go straight to writing the spec.

Feature: optional due dates on todos and an overdue filter.
- `todo add <title> --due YYYY-MM-DD` stores a due date; the flag is optional.
- An invalid date prints an error, exits with code 1 and saves nothing.
- `todo list --overdue` shows only not-done todos whose due date is before today (local time).
- `todo list` prints the due date after the title when present.
- Existing todos without due dates keep working.
- No new runtime dependencies. No notifications, no time-of-day, no time zones beyond local date.
