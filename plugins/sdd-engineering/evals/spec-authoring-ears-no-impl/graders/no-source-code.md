---
type: regex
target: { source: file, path: specs/due-dates.md }
pattern: '```\s*(js|javascript|ts|typescript|mjs)\b'
flags: i
match: not_contains
---
