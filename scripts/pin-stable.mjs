#!/usr/bin/env node
// Pins one plugin in the stable channel to a released tag and its commit SHA.
// Usage: node scripts/pin-stable.mjs <plugin> <version>
// The tag <plugin>--v<version> must already exist on origin (created by `claude plugin tag --push`).
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const [plugin, version] = process.argv.slice(2);
if (!plugin || !/^\d+\.\d+\.\d+$/.test(version ?? '')) {
  console.error('usage: node scripts/pin-stable.mjs <plugin> <x.y.z>');
  process.exit(2);
}
const tag = `${plugin}--v${version}`;
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();

const remote = git('ls-remote', '--tags', 'origin', `refs/tags/${tag}^{}`, `refs/tags/${tag}`);
const lines = remote.split('\n').filter(Boolean);
if (!lines.length) {
  console.error(`tag ${tag} not found on origin — release it first (scripts/release.sh ${plugin})`);
  process.exit(1);
}
// An annotated tag lists the peeled commit as "<sha>\trefs/tags/<tag>^{}"; prefer it.
const sha = (lines.find((l) => l.endsWith('^{}')) ?? lines[0]).split('\t')[0];

const file = 'channels/stable/marketplace.json';
const market = JSON.parse(readFileSync(file, 'utf8'));
const entry = market.plugins.find((p) => p.name === plugin);
if (!entry) {
  console.error(`${plugin} is not listed in ${file}`);
  process.exit(1);
}
const before = `${entry.source.ref ?? '-'} @ ${entry.source.sha ?? '-'}`;
entry.source.ref = tag;
entry.source.sha = sha;
writeFileSync(file, JSON.stringify(market, null, 2) + '\n');
console.log(`${plugin}: ${before}  →  ${tag} @ ${sha}`);
console.log('Next: claude plugin validate channels/stable/marketplace.json, then open a PR.');
