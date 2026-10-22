---
type: llm
focus: { source: file, path: specs/priority.md }
---
Look at the Requirement coverage table (§3a) and the NFR table. The user's only words about speed were "Listing must stay fast."
PASS only if: (1) the row for that requirement is NOT marked covered/testable ("yes"), and carries a `[NEEDS CLARIFICATION:blocking …]` marker (proposed thresholds or structural criteria inside the marker are fine); and (2) the spec does not quote any speed criterion (a number, "single pass", "no extra regex", "no measurable regression", etc.) as the user's own words.
