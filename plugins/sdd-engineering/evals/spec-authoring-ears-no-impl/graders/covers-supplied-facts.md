---
type: llm
focus: { source: file, path: specs/due-dates.md }
---
Check only the acceptance-criteria and NFR tables of this spec. PASS if requirements cover all six supplied facts:
(1) `--due YYYY-MM-DD` on add is optional and stores the date; (2) an invalid date prints an error, exits with code 1 and saves nothing; (3) `list --overdue` shows only not-done todos due before today's local date; (4) `list` prints the due date after the title; (5) todos without a due date keep working; (6) no new runtime dependencies.
FAIL only if one of the six is missing or contradicted, or if notifications, time zones or times of day are added as requirements. Extra edge-case requirements consistent with the facts are fine.
