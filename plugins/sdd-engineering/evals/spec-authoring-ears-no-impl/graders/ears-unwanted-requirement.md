---
type: regex
target: { source: file, path: specs/due-dates.md }
pattern: '\|\s*AC-\d+\s*\|[^\n]*\bIf\b[^\n]*\bthen the CLI shall\b'
flags: i
---
