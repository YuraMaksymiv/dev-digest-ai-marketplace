# Cost baseline — SDD scenario

Measured 2026-10-21. Numbers come from real runs only. Where a difference is
within noise, this document says so.

## Scenario and method

- **Scenario**: the `sdd-engineering` eval suite. A user asks for a spec and
  a plan for a small feature (due dates for a todo CLI), plus guardrail and
  negative cases: 8 cases, see `plugins/sdd-engineering/evals/README.md`.
- **Command** (identical for baseline and experiment; only the plugin files
  changed):

  ```bash
  claude plugin eval ./plugins --eval-dir sdd-engineering/evals --runs 5 \
    --model sonnet --judge-model haiku --ablation none \
    --scaffold --trust-plugin --allow-tools Write Edit --keep-temp \
    --no-publish --threshold 0 -j 4 --json evals-<label>.json
  node scripts/eval-metrics.mjs evals-<label>.json --markdown
  ```

- 5 runs per case, medians reported. `--ablation none` measures cost with
  the plugin only. The main session is fixed to `sonnet`; agent models come
  from frontmatter (`sonnet`, `haiku` for `plan-verifier`/`test-runner`).
- Tokens, tool calls and subagent types are read from each run's
  `trace.jsonl` (`--keep-temp`). "API calls" counts main-session model
  calls only, since subagent calls are not itemised in the trace.
- **Critical failure** = an error, a score of 0, a negative case that
  activated SDD, or a positive case where no `sdd-engineering` agent was
  dispatched.

## Baseline

| Field | Value |
|---|---|
| Plugins @ commit | `sdd-engineering@1.0.0`, `engineering-paved-path@1.0.0`, `research-tools@1.0.0`, `architecture-review@1.0.0` @ `fea6c7e` |
| Claude Code | 2.1.306 |
| Model (session / judge) | `sonnet` / `haiku` |
| Runs | 8 cases × 5 = 40 |
| Suite cost | $3.54 |

| Metric (median per run) | Value |
|---|---|
| Input tokens (uncached) | 8 |
| Output tokens | 2,087 |
| Cache read / write tokens | 52,017 / 15,561 |
| API calls (main session) | 2 |
| Tool calls (main + subagents) | 5 |
| Cost (USD) | 0.080 (range 0.035–0.196) |
| Latency (s) | 36 (range 3–74) |
| Pass rate (runs passing all graders) | 85.0% (mean score 0.950) |
| Critical failures | 3 — `spec-authoring-ears-no-impl`: the main session wrote the spec itself without dispatching `spec-creator` |

| Case | Score | Pass rate | Median cost | Median s |
|---|---|---|---|---|
| negative-retro-not-automatic | 1.00 | 100% | 0.039 | 6 |
| negative-trivial-fix | 1.00 | 100% | 0.042 | 5 |
| negative-unrelated-question | 1.00 | 100% | 0.035 | 3 |
| planner-missing-test-command | 1.00 | 100% | 0.131 | 46 |
| planner-refuses-draft-spec | 1.00 | 100% | 0.069 | 21 |
| planner-uses-approved-spec | 0.87 | 60% | 0.129 | 47 |
| spec-authoring-ears-no-impl | 0.73 | 20% | 0.100 | 42 |
| spec-discovery-asks-questions | 1.00 | 100% | 0.128 | 49 |

### Findings from the baseline

1. **Routing gap (critical).** When the prompt already contains every answer
   ("don't ask, write the spec"), a `sonnet` main session bypassed
   `spec-creator` in 3 of 5 runs and wrote a non-template spec itself. The
   eval caught it. This is a routing problem, not a prompt-size problem, so it
   was kept out of the cost experiment (one change at a time) and is tracked
   as a separate fix with its own eval (a `tool_used Agent
   sdd-engineering:spec-creator` grader on the authoring case).
2. **Judge noise.** `planner-uses-approved-spec` failed 2 of 5 runs on the LLM
   rubric only. The deterministic graders (planner dispatched, no invented
   AC-IDs) passed every run.

## Experiment — one change only

**Change**: remove the pass-2-only and duplicated spec rules from the agent
prompts. The EARS rules, spec template, self-check and Spec Report moved
from `spec-creator.md` into an on-demand skill `sdd-engineering:spec-format`,
which the agent loads only in pass 2. `implementation-planner` referenced
it instead of restating the ID rules. `spec-creator.md`: 19.5 KB → 13.5 KB.
Model and routing unchanged.

**Pass criteria**: quality gate green, no new critical false negatives, and
cost or latency lower by more than the noise band.

Whole-suite medians aren't comparable here. The baseline's cheapest
`spec-authoring` runs were exactly the ones that skipped `spec-creator`, so
the comparison only counts runs where the agent actually ran:

| Like-for-like (spec-creator dispatched) | Baseline | Experiment | Δ | Within noise? |
|---|---|---|---|---|
| spec-discovery (pass 1), n=5/5 — median cost | $0.128 (0.121–0.142) | $0.131 (0.126–0.148) | +2% | yes |
| spec-discovery — median latency | 49 s | 47 s | −4% | yes |
| spec-discovery — median cache-write tokens | 20,036 | 21,486 | +7% | yes |
| spec-authoring (pass 2), n=2/3 — median cost | $0.179 | $0.173 | −3% | yes |
| spec-authoring — median latency | 72 s | 69 s | −4% | yes |

| Whole suite | Baseline | Experiment |
|---|---|---|
| Suite cost | $3.54 | $3.80 |
| Median cost per run | $0.080 | $0.114 (case mix, see above) |
| Pass rate / mean score | 85.0% / 0.950 | 92.5% / 0.958 |
| Critical failures | 3 (routing) | 2 routing + 1 judge false-fail on `planner-refuses-draft-spec` (the planner correctly refused the draft spec) |

**Verdict: rejected — no measurable saving.** Quality held, but cost and
latency moved within the noise band. Expected size of the effect: ~6 KB of
prompt is ~1.5k tokens of cache write per `spec-creator` call (≈ $0.006),
which is small against a ~$0.13 run, and pass 2 loads the moved text back.
The change was reverted, so `1.0.0` ships the baseline prompts.

**Where the cost actually is** (from the traces): output tokens and the
subagent's own file reads/writes dominate, not the system prompt. Better
candidates for a next experiment: a cheaper model for pass 1 discovery, or
passing the main session's already-read context to the agent as a path +
abstract instead of re-reading the repository.
