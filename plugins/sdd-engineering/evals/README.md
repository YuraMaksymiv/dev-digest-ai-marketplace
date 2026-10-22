# sdd-engineering evals

Behavior evals for one fixed scenario: **a user asks for a spec and a plan
for a small feature** (due dates for a tiny todo CLI). Negative cases check
that the workflow stays quiet when it isn't needed.

| Case | Checks | Kind |
|---|---|---|
| `spec-discovery-asks-questions` | vague request → `spec-creator` pass 1 asks blocking questions, writes nothing | positive |
| `spec-authoring-ears-no-impl` | answers supplied → `spec-creator` is still dispatched (single pass), writes `specs/due-dates.md` with an EARS unwanted-behaviour row, draft/clarified status, no source code, all six facts covered | positive |
| `spec-every-requirement-has-ac` | (1.1.0) every mandatory requirement is in §3a and maps to a testable AC/NFR; vague ones ("fast", "user-friendly") get a blocking marker and the spec stays `draft` | positive |
| `planner-uses-approved-spec` | planner plans only against the spec's AC-IDs, uses the documented `npm test`, asks multi/single | positive |
| `planner-refuses-draft-spec` | `draft` spec → blocked, no plan | guardrail |
| `planner-missing-test-command` | no documented test command → asks the user, invents nothing | guardrail |
| `negative-unrelated-question` | a JS question → no SDD agent or skill | negative |
| `negative-trivial-fix` | typo fix → edited directly, no spec/plan agents | negative |
| `negative-retro-not-automatic` | `workflow-retro` never starts on its own | negative |

## Run

From the marketplace root:

```
claude plugin eval ./plugins --eval-dir sdd-engineering/evals --scaffold --trust-plugin \
  --allow-tools Write Edit --runs 3 --no-publish \
  --json plugins/sdd-engineering/evals/results/latest.json
```

- `--scaffold` is required. Cases build their fixture repository with
  `fixture.sh`. These scripts are ours, only create files and a git repo,
  and never touch the network.
- `--allow-tools Write Edit` lets `spec-creator` write the spec and lets the
  typo case edit `README.md`. No Bash is granted.
- The target is `./plugins` with `--eval-dir sdd-engineering/evals`, not
  `./plugins/sdd-engineering`. The runner only loads `plugins:` entries
  inside the target directory, and every case loads the three dependency
  plugins through `plugins:`, so namespaced references resolve exactly as
  they do after installation.
- An installed copy can be evaluated directly (dependencies come from the
  install): `claude plugin eval sdd-engineering@dev-digest-ai-marketplace …`.
- A smoke subset runs with `--tag smoke`.
- Results go to `plugins/sdd-engineering/evals/results/` (gitignored). Record headline numbers in
  `docs/COST-BASELINE.md`, not in git-tracked result files.

## Fixture

`_fixtures/todo-cli.sh` is the single source. A scaffold script has to live
inside its case directory, so `_fixtures/sync.sh` regenerates every case's
`fixture.sh` from it plus the case's `fixture.env`. After you edit the
fixture, run:

```
bash plugins/sdd-engineering/evals/_fixtures/sync.sh
```
