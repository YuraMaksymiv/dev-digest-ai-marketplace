---
type: llm
focus: { source: file, path: specs/due-dates.md }
---
Judge the spec file. PASS only if ALL hold:
1. Functional requirements have stable IDs `AC-<n>` and are EARS sentences ("When …, the CLI shall …", "If …, then the CLI shall …", "The CLI shall …"), each with one "shall" and a concrete system; the invalid-date case is an "If …, then …" requirement.
2. All six supplied facts are covered (optional --due on add; invalid date → error, exit 1, nothing saved; list --overdue = not done and due before today, local date; due date shown after the title; todos without due dates keep working; no new runtime dependencies), and no extra feature (notifications, time zones, times of day) is added as a requirement.
3. No implementation details: no JavaScript/source-code blocks and no step-by-step implementation tasks. Mentioning which files/modules are likely affected in a traceability table is allowed.
4. Status is `draft` or `clarified`, never `approved`.
