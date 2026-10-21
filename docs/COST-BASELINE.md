# Cost baseline — SDD scenario

Status: **template, not measured yet.** Fill it in from real runs only. If a
difference is within noise, say so. Never write down a saving that wasn't
measured.

## Scenario and method

- **Scenario**: the `sdd-engineering` eval suite. The user asks for a spec and
  a plan for a small feature (due dates for a todo CLI), plus guardrail and
  negative cases. 8 cases, see `plugins/sdd-engineering/evals/README.md`.
- **Command** (same for baseline and experiment; only the plugin commit changes):

  ```bash
  claude plugin eval ./plugins --eval-dir sdd-engineering/evals --scaffold --trust-plugin \
    --allow-tools Write Edit --runs 5 --model sonnet --judge-model haiku \
    --ablation none --no-publish --json evals-<label>.json
  ```

- `--runs 5` per case. Report medians. `--ablation none`, because cost is
  measured with the plugin only.
- Model for the main session is fixed (`--model sonnet`). Agent models come
  from their frontmatter and are not changed during the experiment.
- Projected static cost per plugin: `claude plugin details <plugin>`.

## Baseline

| Field | Value |
|---|---|
| Plugin @ commit | `sdd-engineering@1.0.0` @ `<sha>` |
| Dependencies | engineering-paved-path `<v>`, research-tools `<v>`, architecture-review `<v>` |
| Claude Code | `<version>` |
| Model (session / judge) | `<model>` / `<model>` |
| Date | `<YYYY-MM-DD>` |
| Runs | `<cases × runs>` |

| Metric (median per run) | Value |
|---|---|
| Input tokens | |
| Output tokens | |
| Cache read / write tokens | |
| API calls | |
| Tool calls (incl. Agent dispatches) | |
| Cost (USD) | |
| Latency (s) | |
| Pass rate (all graders) | |
| Critical failures (positive case scored 0, or a negative case activated SDD) | |

`claude plugin details sdd-engineering` projected tokens: `<n>`

## Experiment — one change only

**Change**: remove instructions duplicated between agent prompts and skills.
Keep the detail in skill references that load on demand (e.g. the spec
template and EARS table move from `spec-creator.md` into a reference file it
reads when writing). Model and routing stay the same.

**Pass criteria**: quality gate green (pass rate ≥ baseline − noise), no new
critical false negatives, **and** cost or latency actually lower than the
noise band (report the IQR or min–max of the baseline runs).

| Metric (median) | Baseline | Experiment | Δ | Within noise? |
|---|---|---|---|---|
| Cost (USD) | | | | |
| Latency (s) | | | | |
| Input tokens | | | | |
| Pass rate | | | | |
| Critical failures | | | | |

**Verdict**: `<accepted / rejected / inconclusive — within noise>`
