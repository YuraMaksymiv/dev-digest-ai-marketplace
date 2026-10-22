#!/usr/bin/env node
// Summarises a `claude plugin eval --json <file> --keep-temp` run for docs/COST-BASELINE.md.
// Usage: node scripts/eval-metrics.mjs <eval.json> [--markdown]
// Token and tool counts come from each run's trace.jsonl (kept only with --keep-temp).
import { existsSync, readFileSync } from 'node:fs';

const [file, flag] = process.argv.slice(2);
if (!file) {
  console.error('usage: node scripts/eval-metrics.mjs <eval.json> [--markdown]');
  process.exit(2);
}
const result = JSON.parse(readFileSync(file, 'utf8'));

const median = (xs) => {
  const s = xs.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  if (!s.length) return NaN;
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const range = (xs) => {
  const s = xs.filter((x) => Number.isFinite(x));
  return s.length ? [Math.min(...s), Math.max(...s)] : [NaN, NaN];
};

function traceMetrics(path) {
  if (!path || !existsSync(path)) return null;
  const m = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, mainApiCalls: 0, mainToolCalls: 0, subagentToolCalls: 0, subagents: 0, durationMs: NaN, models: {} };
  const messageIds = new Set();
  const lastSubagentUsage = new Map();
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    let o;
    try { o = JSON.parse(line); } catch { continue; }
    if (o.type === 'assistant' && !o.parent_tool_use_id) {
      const msg = o.message ?? {};
      if (msg.id) messageIds.add(msg.id);
      for (const b of msg.content ?? []) if (b.type === 'tool_use') m.mainToolCalls++;
    }
    if (o.type === 'system' && (o.subtype === 'task_progress' || o.subtype === 'task_notification') && o.usage) {
      lastSubagentUsage.set(o.task_id, o.usage);
    }
    if (o.type === 'result') {
      m.durationMs = o.duration_ms;
      for (const [model, u] of Object.entries(o.modelUsage ?? {})) {
        m.input += u.inputTokens ?? 0;
        m.output += u.outputTokens ?? 0;
        m.cacheRead += u.cacheReadInputTokens ?? 0;
        m.cacheWrite += u.cacheCreationInputTokens ?? 0;
        m.models[model] = (m.models[model] ?? 0) + (u.costUSD ?? 0);
      }
      m.subagents = o.subagent_stats?.spawned ?? 0;
      m.subagentTypes = Object.keys(o.subagent_stats?.by_type ?? {});
    }
  }
  m.mainApiCalls = messageIds.size;
  for (const u of lastSubagentUsage.values()) m.subagentToolCalls += u.tool_uses ?? 0;
  return m;
}

const rows = [];
const perCase = [];
for (const c of result.cases) {
  const runs = c.arms?.with ?? [];
  for (const r of runs) rows.push({ case: c.name, ...r, t: traceMetrics(r.tracePath) });
  perCase.push({ name: c.name, score: c.aggregates?.score, passRate: c.aggregates?.passRate, cost: median(runs.map((r) => r.costUsd)), sec: median(runs.map((r) => r.durationSeconds)) });
}

const withTrace = rows.filter((r) => r.t);
const col = (f) => withTrace.map(f);
const critical = rows.filter((r) => {
  const negative = r.case.startsWith('negative-');
  const routingMiss = !negative && r.t && !r.t.subagentTypes?.some((t) => t.startsWith('sdd-engineering:'));
  return r.error || r.score === 0 || (negative && !r.passed) || routingMiss;
});

const summary = {
  plugins: result.suite.plugins.map((p) => `${p.name}@${p.version}`),
  claudeVersion: result.claudeVersion,
  startedAt: result.startedAt,
  runs: rows.length,
  tracesFound: withTrace.length,
  totalCostUsd: result.costUsd,
  median: {
    inputTokens: median(col((r) => r.t.input)),
    outputTokens: median(col((r) => r.t.output)),
    cacheReadTokens: median(col((r) => r.t.cacheRead)),
    cacheWriteTokens: median(col((r) => r.t.cacheWrite)),
    mainApiCalls: median(col((r) => r.t.mainApiCalls)),
    toolCalls: median(col((r) => r.t.mainToolCalls + r.t.subagentToolCalls)),
    costUsd: median(rows.map((r) => r.costUsd)),
    latencySec: median(rows.map((r) => r.durationSeconds)),
  },
  range: {
    costUsd: range(rows.map((r) => r.costUsd)),
    latencySec: range(rows.map((r) => r.durationSeconds)),
  },
  passRate: rows.filter((r) => r.passed).length / (rows.length || 1),
  meanScore: rows.reduce((a, r) => a + (r.score ?? 0), 0) / (rows.length || 1),
  criticalFailures: critical.map((r) => {
    const why = r.error ? `error: ${r.error}` : r.t && !r.case.startsWith('negative-') && !r.t.subagentTypes?.some((t) => t.startsWith('sdd-engineering:')) ? 'no SDD agent dispatched' : `score=${r.score}`;
    return `${r.case} (${why})`;
  }),
  perCase,
};

if (flag === '--markdown') {
  const f = (x, d = 0) => (Number.isFinite(x) ? x.toFixed(d) : '—');
  const s = summary;
  console.log(`| Metric (median per run) | Value |\n|---|---|`);
  console.log(`| Input tokens (uncached) | ${f(s.median.inputTokens)} |`);
  console.log(`| Output tokens | ${f(s.median.outputTokens)} |`);
  console.log(`| Cache read / write tokens | ${f(s.median.cacheReadTokens)} / ${f(s.median.cacheWriteTokens)} |`);
  console.log(`| API calls (main session) | ${f(s.median.mainApiCalls)} |`);
  console.log(`| Tool calls (main + subagents) | ${f(s.median.toolCalls)} |`);
  console.log(`| Cost (USD) | ${f(s.median.costUsd, 3)} (range ${f(s.range.costUsd[0], 3)}–${f(s.range.costUsd[1], 3)}) |`);
  console.log(`| Latency (s) | ${f(s.median.latencySec)} (range ${f(s.range.latencySec[0])}–${f(s.range.latencySec[1])}) |`);
  console.log(`| Pass rate (runs passing all graders) | ${(s.passRate * 100).toFixed(1)}% (mean score ${s.meanScore.toFixed(3)}) |`);
  console.log(`| Critical failures | ${s.criticalFailures.length ? s.criticalFailures.join('; ') : 'none'} |`);
  console.log(`\nTotal suite cost: $${f(s.totalCostUsd, 2)} · ${s.runs} runs · traces read: ${s.tracesFound}\n`);
  console.log(`| Case | Score | Pass rate | Median cost | Median s |\n|---|---|---|---|---|`);
  for (const c of s.perCase) console.log(`| ${c.name} | ${f(c.score, 2)} | ${f(c.passRate * 100)}% | ${f(c.cost, 3)} | ${f(c.sec)} |`);
} else {
  console.log(JSON.stringify(summary, null, 2));
}
