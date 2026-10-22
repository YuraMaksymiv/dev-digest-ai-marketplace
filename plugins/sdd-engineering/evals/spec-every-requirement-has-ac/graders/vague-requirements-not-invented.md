---
type: llm
focus: { source: file, path: specs/due-dates.md }
---
Look only at the Requirement coverage table (§3a) and the AC/NFR tables. PASS only if ALL hold:
1. The coverage table has a row for each of the five mandatory requirements in the request.
2. The three concrete requirements (store due date, invalid date → error + exit 1 + nothing saved, overdue filter) each map to at least one AC/NFR ID.
3. "The overdue listing must be fast" and "Error messages must be user-friendly" are NOT given an invented numeric threshold or invented wording standard presented as agreed by the user; each is marked `[NEEDS CLARIFICATION:blocking …]` (a proposed option inside the marker is fine).
