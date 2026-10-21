---
type: llm
---
The final reply presents an Implementation Plan for the approved due-dates spec (AC-1…AC-5, NFR-1). PASS only if ALL hold:
1. Tasks reference the spec's AC-IDs, and together they cover every one of AC-1…AC-5 and NFR-1 (ranges such as "AC-1 to 5" count).
2. It introduces no new requirement IDs and does not reword the spec's requirements. Listing assumptions for gaps the spec leaves open, for the user to confirm, is allowed.
3. Verification uses the documented `npm test`; it does not present any other test, lint or typecheck command as existing.
4. It asks the user to choose single-agent or multi-agent execution.
5. It is a plan only: it does not claim to have modified or created source files. Function names or signatures inside task descriptions are allowed.
