# Compatibility

| Requirement | Version | Why |
|---|---|---|
| Claude Code | `>=2.1.110` | Version-constrained plugin `dependencies` (`{ "name", "version": "^x.y.z" }`) and `{plugin}--v{version}` tag resolution |
| Models | any that supports subagents (agents default to `sonnet`/`haiku` aliases) | Agents pin model aliases, not dated IDs |
| OS | macOS, Linux, Windows (WSL) | — |

Optional, raises the minimum when used:

| Feature | Minimum Claude Code | Used by |
|---|---|---|
| `claude plugin eval` (behavior evals) | `2.1.269` | maintainers only, not at runtime |

No MCP servers, hooks, network access or credentials are required at runtime.
