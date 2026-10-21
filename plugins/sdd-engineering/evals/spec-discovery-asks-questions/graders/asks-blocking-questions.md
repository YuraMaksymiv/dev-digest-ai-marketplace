---
type: llm
---
The final reply is the result of spec discovery for a vague "reminders" request. PASS only if ALL hold:
1. It asks the user at least two clarifying questions about the scope or behaviour of reminders (e.g. what a reminder is, when it shows, syntax, time formats), each with concrete options or a recommended default.
2. It says, or makes clear, that the spec is not written yet and will be written after the user answers.
3. It does not present an implementation plan (a task list of code changes to make) and contains no source-code blocks.
Citing the existing code as evidence (file:line, current data shape) is allowed and is not an implementation detail.
