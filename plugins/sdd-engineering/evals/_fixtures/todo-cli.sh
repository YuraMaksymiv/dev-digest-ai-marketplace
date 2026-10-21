#!/usr/bin/env bash
# Fixture: a tiny Node CLI repository with its own instructions and test command.
# Usage (from a case's fixture.sh): SPEC_STATUS=<approved|draft|none> NO_TESTS=<0|1> source this file.
set -euo pipefail
mkdir -p src test
cat > CLAUDE.md <<'EOF'
# todo-cli

Single-package Node 22 CLI that stores todos in `todos.json`.

## Modules
- `src/` — `store.js` (persistence), `cli.js` (argument parsing + output).
- `test/` — `node:test` unit tests.

## Commands
- Tests: `npm test`
- Lint: none

## Conventions
- Specs live in `specs/`; plans are saved next to them as `<slug>.plan.md`.
- No runtime dependencies.
EOF
if [ "${NO_TESTS:-0}" = "1" ]; then
  sed -i.bak -e 's/^- Tests: `npm test`$/- Tests: not set up yet/' CLAUDE.md && rm CLAUDE.md.bak
  printf '{\n  "name": "todo-cli",\n  "version": "0.1.0",\n  "type": "module",\n  "bin": { "todo": "src/cli.js" }\n}\n' > package.json
else
  printf '{\n  "name": "todo-cli",\n  "version": "0.1.0",\n  "type": "module",\n  "bin": { "todo": "src/cli.js" },\n  "scripts": { "test": "node --test" }\n}\n' > package.json
  cat > test/store.test.js <<'EOF'
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addTodo, listTodos } from '../src/store.js';

test('adds and lists a todo', () => {
  const todos = addTodo([], 'buy milk');
  assert.equal(listTodos(todos).length, 1);
});
EOF
fi
cat > src/store.js <<'EOF'
export function addTodo(todos, title) {
  return [...todos, { id: todos.length + 1, title, done: false }];
}

export function completeTodo(todos, id) {
  return todos.map((t) => (t.id === id ? { ...t, done: true } : t));
}

export function listTodos(todos, { includeDone = true } = {}) {
  return includeDone ? todos : todos.filter((t) => !t.done);
}
EOF
cat > src/cli.js <<'EOF'
#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { addTodo, completeTodo, listTodos } from './store.js';

const FILE = 'todos.json';
const load = () => (existsSync(FILE) ? JSON.parse(readFileSync(FILE, 'utf8')) : []);
const save = (todos) => writeFileSync(FILE, JSON.stringify(todos, null, 2));

const [cmd, ...args] = process.argv.slice(2);
if (cmd === 'add') save(addTodo(load(), args.join(' ')));
else if (cmd === 'done') save(completeTodo(load(), Number(args[0])));
else if (cmd === 'list') for (const t of listTodos(load())) console.log(`${t.done ? 'x' : ' '} ${t.id} ${t.title}`);
else console.log('usage: todo add <title> | done <id> | list');
EOF
printf '# todo-cli\n\nA tiny tood list for the terminal.\n' > README.md
if [ "${SPEC_STATUS:-none}" != "none" ]; then
  mkdir -p specs
  printf '# Specs\n\n| Spec | Status |\n|---|---|\n| [due-dates.md](due-dates.md) — due dates and overdue filter | %s |\n' "$SPEC_STATUS" > specs/README.md
  cat > specs/due-dates.md <<EOF
# Spec — Due dates and overdue filter

Status: **${SPEC_STATUS}** (2026-10-20) · Scope: \`src/\` · Location: \`specs/due-dates.md\`

## 1. Summary
Users can give a todo an optional due date and list only overdue todos.

## 11. Acceptance criteria (EARS)
| ID | Pattern | Requirement | Category |
|---|---|---|---|
| AC-1 | Event-driven | When the user runs \`todo add <title> --due YYYY-MM-DD\`, the CLI shall store the due date on the new todo. | C1 |
| AC-2 | Unwanted | If the \`--due\` value is not a valid calendar date in YYYY-MM-DD format, then the CLI shall print an error and exit with code 1 without saving. | C5 |
| AC-3 | Event-driven | When the user runs \`todo list --overdue\`, the CLI shall print only todos that are not done and whose due date is before today's local date. | C2 |
| AC-4 | Ubiquitous | The CLI shall print a todo's due date after its title in \`todo list\` output when the todo has one. | C2 |
| AC-5 | Ubiquitous | The store shall keep todos without a due date valid and listable. | C3 |

## 12. Non-functional requirements
| ID | Requirement | Measure |
|---|---|---|
| NFR-1 | The feature shall add no runtime dependencies. | \`package.json\` has no \`dependencies\` |

## 15. Open questions
none
EOF
fi
git init -q && git add -A && git -c user.email=eval@example.com -c user.name=eval commit -qm "fixture: todo-cli"
