#!/usr/bin/env node
// Builds the static catalog index consumed by site/ from real repository content.
// Zero dependencies: Node >= 22 builtins only.
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = resolve(process.env.CATALOG_ROOT || resolve(dirname(fileURLToPath(import.meta.url)), '..'));
const OUT_DIR = resolve(process.env.CATALOG_OUT || join(ROOT, 'site', 'public'));
const BODIES_DIR = join(OUT_DIR, 'bodies');
const MARKETPLACE_FILE = join(ROOT, '.claude-plugin', 'marketplace.json');
const DEFAULT_REPO = 'YuraMaksymiv/dev-digest-ai-marketplace';
const DEFAULT_MARKETPLACE_NAME = 'dev-digest-ai-marketplace';
const DEFAULT_BRANCH = 'main';
const STABLE_CHANNEL_FILE = 'channels/stable/marketplace.json';
const SEARCH_EXCERPT_CHARS = 1500;
const KIND_ORDER = ['plugin', 'skill', 'agent', 'command', 'hook', 'mcp'];

class IndexError extends Error {}

const warnings = [];
const warn = (msg) => {
  warnings.push(msg);
  console.warn(`warning: ${msg}`);
};

function readText(file) {
  return existsSync(file) ? readFileSync(file, 'utf8').replace(/\r\n?/g, '\n') : null;
}

function readJson(file, { required = false } = {}) {
  const text = readText(file);
  if (text === null) {
    if (required) throw new IndexError(`missing file: ${rel(file)}`);
    return null;
  }
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new IndexError(`invalid JSON in ${rel(file)}: ${err.message}`);
  }
}

const rel = (p) => relative(ROOT, p).split(sep).join('/');
const isDir = (p) => existsSync(p) && statSync(p).isDirectory();
const isFile = (p) => existsSync(p) && statSync(p).isFile();

function git(args) {
  try {
    return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}

// ---------- frontmatter (a small YAML subset: scalars, quoted strings, inline/block lists, block scalars) ----------

function parseScalar(raw) {
  const v = raw.trim();
  if (v === '') return '';
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    const inner = v.slice(1, -1);
    if (v.startsWith("'")) return inner.replace(/''/g, "'");
    try {
      return JSON.parse(v);
    } catch {
      return inner;
    }
  }
  if (v.startsWith('[') && v.endsWith(']')) {
    return splitInlineList(v.slice(1, -1)).map((s) => parseScalar(s));
  }
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (v === 'null' || v === '~') return null;
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  return v.replace(/\s+#.*$/, '');
}

function splitInlineList(s) {
  const out = [];
  let cur = '';
  let quote = null;
  for (const ch of s) {
    if (quote) {
      if (ch === quote) quote = null;
      cur += ch;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
      cur += ch;
    } else if (ch === ',') {
      out.push(cur);
      cur = '';
    } else cur += ch;
  }
  if (cur.trim()) out.push(cur);
  return out.map((x) => x.trim()).filter(Boolean);
}

export function parseFrontmatter(text) {
  const m = /^---\n([\s\S]*?)\n---[ \t]*(?:\n|$)/.exec(text);
  if (!m) return { data: {}, body: text };
  const data = {};
  const lines = m[1].split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const kv = /^([A-Za-z0-9_-]+):(.*)$/.exec(line);
    if (!kv) continue;
    const key = kv[1];
    const rest = kv[2].trim();
    if (rest === '|' || rest === '>' || /^[|>][+-]?$/.test(rest)) {
      const block = [];
      while (i + 1 < lines.length && (/^\s+/.test(lines[i + 1]) || lines[i + 1] === '')) block.push(lines[++i]);
      const indent = Math.min(...block.filter((l) => l.trim()).map((l) => l.match(/^\s*/)[0].length), Infinity);
      const stripped = block.map((l) => l.slice(Number.isFinite(indent) ? indent : 0));
      data[key] = (rest.startsWith('|') ? stripped.join('\n') : stripped.join(' ').replace(/\s+/g, ' ')).trim();
    } else if (rest === '') {
      const items = [];
      while (i + 1 < lines.length && /^\s*-\s+/.test(lines[i + 1])) items.push(parseScalar(lines[++i].replace(/^\s*-\s+/, '')));
      if (items.length) data[key] = items;
      else {
        const block = [];
        while (i + 1 < lines.length && /^\s+\S/.test(lines[i + 1])) block.push(lines[++i].trim());
        data[key] = block.length ? block.join(' ') : '';
      }
    } else {
      data[key] = parseScalar(rest);
    }
  }
  return { data, body: text.slice(m[0].length) };
}

// ---------- helpers ----------

function toList(v) {
  if (v === undefined || v === null || v === '') return [];
  if (Array.isArray(v)) return v.map(String).map((s) => s.trim()).filter(Boolean);
  return String(v).split(',').map((s) => s.trim()).filter(Boolean);
}

function toBool(v) {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') return v.trim().toLowerCase() === 'true';
  return undefined;
}

function markdownToText(md) {
  return md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`|~-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const excerpt = (md, n = SEARCH_EXCERPT_CHARS) => markdownToText(md || '').slice(0, n);

function firstParagraph(md) {
  if (!md) return '';
  for (const block of md.split(/\n\s*\n/)) {
    const t = block.trim();
    if (!t || t.startsWith('#') || t.startsWith('```') || t.startsWith('<!--')) continue;
    return markdownToText(t).slice(0, 280);
  }
  return '';
}

function compatibilitySummary(md) {
  if (!md) return null;
  const cc = /Claude Code[^\n`]*`([^`]+)`/.exec(md);
  if (cc) return `Claude Code ${cc[1].trim()}`;
  const para = md.split(/\n\s*\n/).map((b) => b.trim()).find((b) => b && !b.startsWith('#') && !b.startsWith('|') && !b.startsWith('```'));
  return para ? markdownToText(para).slice(0, 120) : null;
}

function personName(p) {
  if (!p) return null;
  if (typeof p === 'string') return p.replace(/\s*<[^>]*>\s*/, '').trim() || null;
  if (typeof p === 'object' && p.name) return String(p.name);
  return null;
}

function personUrl(p) {
  return p && typeof p === 'object' && typeof p.url === 'string' && /^https?:\/\//.test(p.url) ? p.url : null;
}

function bodyFileFor(id) {
  return `${id.replace(/[^A-Za-z0-9._-]+/g, '__')}.md`;
}

const bodies = new Map();
function storeBody(id, markdown) {
  if (!markdown || !markdown.trim()) return null;
  const file = bodyFileFor(id);
  bodies.set(file, markdown);
  return file;
}

function walkMarkdown(dir, prefix = []) {
  const out = [];
  if (!isDir(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['evals', 'scripts', 'references', 'temp', 'node_modules'].includes(entry.name) || entry.name.startsWith('.')) continue;
      out.push(...walkMarkdown(p, [...prefix, entry.name]));
    } else if (entry.isFile() && entry.name.endsWith('.md') && !/^(README|CHANGELOG)\.md$/i.test(entry.name)) {
      out.push({ file: p, segments: [...prefix, entry.name.replace(/\.md$/, '')] });
    }
  }
  return out;
}

function componentDirs(pluginDir, manifestValue, defaultDir) {
  const dirs = [join(pluginDir, defaultDir)];
  for (const p of toList(manifestValue)) {
    const abs = resolve(pluginDir, p);
    if (abs.startsWith(pluginDir) && !dirs.includes(abs)) dirs.push(abs);
  }
  return dirs.filter(isDir);
}

// ---------- changelog ----------

export function parseChangelog(md) {
  if (!md) return [];
  const releases = [];
  let cur = null;
  let section = null;
  for (const line of md.split('\n')) {
    const h = /^##\s+\[?v?(\d+\.\d+\.\d+[^\]\s]*)\]?(?:\([^)]*\))?\s*(?:[-–—]\s*(\d{4}-\d{2}-\d{2}))?/.exec(line);
    if (h) {
      cur = { version: h[1], date: h[2] || null, items: [] };
      section = null;
      releases.push(cur);
      continue;
    }
    if (/^##\s/.test(line)) {
      cur = null;
      continue;
    }
    if (!cur) continue;
    const s = /^###\s+(.+?)\s*$/.exec(line);
    if (s) {
      section = s[1];
      continue;
    }
    const b = /^\s{0,3}[-*]\s+(.*)$/.exec(line);
    if (b) cur.items.push({ section, text: b[1].trim() });
    else if (/^\s{2,}\S/.test(line) && cur.items.length) cur.items[cur.items.length - 1].text += ` ${line.trim()}`;
  }
  return releases;
}

// ---------- main ----------

function resolveRepo() {
  if (process.env.CATALOG_REPO) return process.env.CATALOG_REPO;
  if (process.env.GITHUB_REPOSITORY) return process.env.GITHUB_REPOSITORY;
  const remote = git(['remote', 'get-url', 'origin']);
  const m = /github\.com[:/]([^/]+\/[^/.]+?)(?:\.git)?$/.exec(remote);
  return m ? m[1] : DEFAULT_REPO;
}

function resolveSourceDir(entry, pluginRoot) {
  const src = entry.source;
  if (typeof src === 'string') {
    if (src.startsWith('./') || src.startsWith('../') || src === '.') return resolve(ROOT, src);
    return resolve(ROOT, pluginRoot || '.', src);
  }
  return null;
}

function parseDependency(dep) {
  if (typeof dep === 'string') {
    const at = dep.lastIndexOf('@');
    if (at > 0) return { name: dep.slice(0, at), marketplace: dep.slice(at + 1), version: null };
    return { name: dep, marketplace: null, version: null };
  }
  if (dep && typeof dep === 'object' && dep.name) {
    return { name: String(dep.name), marketplace: dep.marketplace ? String(dep.marketplace) : null, version: dep.version ? String(dep.version) : null };
  }
  return null;
}

function buildArtifacts(plugin, pluginDir, manifest) {
  const artifacts = [];
  const add = (a) => {
    a.id = `${plugin.name}:${a.kind}:${a.name}`;
    a.plugin = plugin.name;
    a.pluginDisplayName = plugin.displayName;
    a.keywords = plugin.keywords;
    a.author = plugin.author;
    a.updated = plugin.updated;
    a.version = plugin.version;
    a.install = plugin.install;
    artifacts.push(a);
  };

  for (const dir of componentDirs(pluginDir, manifest.skills, 'skills')) {
    for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const file = join(dir, entry.name, 'SKILL.md');
      if (!entry.isDirectory() || !isFile(file)) continue;
      const { data, body } = parseFrontmatter(readText(file));
      const name = String(data.name || entry.name);
      const userInvocable = toBool(data['user-invocable']);
      const id = `${plugin.name}:skill:${name}`;
      add({
        kind: 'skill',
        name,
        description: String(data.description || firstParagraph(body)),
        invocation: userInvocable === false ? null : `/${plugin.name}:${name}`,
        tools: toList(data['allowed-tools'] ?? data.tools),
        model: data.model ? String(data.model) : null,
        argumentHint: data['argument-hint'] ? String(data['argument-hint']) : null,
        disableModelInvocation: toBool(data['disable-model-invocation']) ?? false,
        userInvocable: userInvocable ?? true,
        path: rel(file),
        bodyFile: storeBody(id, body),
        searchText: excerpt(body),
      });
    }
  }

  for (const dir of componentDirs(pluginDir, manifest.agents, 'agents')) {
    for (const { file, segments } of walkMarkdown(dir)) {
      const { data, body } = parseFrontmatter(readText(file));
      const name = [...segments.slice(0, -1), String(data.name || segments.at(-1))].join(':');
      const id = `${plugin.name}:agent:${name}`;
      add({
        kind: 'agent',
        name,
        description: String(data.description || firstParagraph(body)),
        invocation: `${plugin.name}:${name}`,
        tools: toList(data.tools),
        model: data.model ? String(data.model) : null,
        argumentHint: null,
        disableModelInvocation: false,
        userInvocable: true,
        path: rel(file),
        bodyFile: storeBody(id, body),
        searchText: excerpt(body),
      });
    }
  }

  for (const dir of componentDirs(pluginDir, manifest.commands, 'commands')) {
    for (const { file, segments } of walkMarkdown(dir)) {
      const { data, body } = parseFrontmatter(readText(file));
      const name = segments.join(':');
      const id = `${plugin.name}:command:${name}`;
      add({
        kind: 'command',
        name,
        description: String(data.description || firstParagraph(body)),
        invocation: `/${plugin.name}:${name}`,
        tools: toList(data['allowed-tools'] ?? data.tools),
        model: data.model ? String(data.model) : null,
        argumentHint: data['argument-hint'] ? String(data['argument-hint']) : null,
        disableModelInvocation: toBool(data['disable-model-invocation']) ?? false,
        userInvocable: true,
        path: rel(file),
        bodyFile: storeBody(id, body),
        searchText: excerpt(body),
      });
    }
  }

  const hooksFile = join(pluginDir, 'hooks', 'hooks.json');
  const hooksJson = readJson(hooksFile);
  if (hooksJson) {
    const events = hooksJson.hooks && typeof hooksJson.hooks === 'object' ? hooksJson.hooks : {};
    for (const [event, config] of Object.entries(events)) {
      const groups = Array.isArray(config) ? config : [];
      const matchers = groups.map((g) => g && g.matcher).filter(Boolean);
      const commands = groups.flatMap((g) => (Array.isArray(g?.hooks) ? g.hooks : [])).map((h) => h?.command || h?.type).filter(Boolean);
      const md = [`Event: \`${event}\``, '', matchers.length ? `Matchers: ${matchers.map((m) => `\`${m}\``).join(', ')}` : '', '', '```json', JSON.stringify(config, null, 2), '```', ''].join('\n');
      const id = `${plugin.name}:hook:${event}`;
      add({
        kind: 'hook',
        name: event,
        description: hooksJson.description ? String(hooksJson.description) : `${event}${matchers.length ? ` (${matchers.join(', ')})` : ''}`,
        invocation: null,
        tools: matchers,
        model: null,
        argumentHint: null,
        disableModelInvocation: false,
        userInvocable: false,
        path: rel(hooksFile),
        bodyFile: storeBody(id, md),
        searchText: `${event} ${matchers.join(' ')} ${commands.join(' ')}`.slice(0, SEARCH_EXCERPT_CHARS),
      });
    }
  }

  const mcpFile = join(pluginDir, '.mcp.json');
  const mcpJson = readJson(mcpFile);
  if (mcpJson) {
    const servers = mcpJson.mcpServers && typeof mcpJson.mcpServers === 'object' ? mcpJson.mcpServers : mcpJson;
    for (const [server, config] of Object.entries(servers)) {
      if (!config || typeof config !== 'object') continue;
      const safe = { ...config };
      if (safe.env && typeof safe.env === 'object') safe.env = Object.fromEntries(Object.keys(safe.env).map((k) => [k, '…']));
      if (safe.headers && typeof safe.headers === 'object') safe.headers = Object.fromEntries(Object.keys(safe.headers).map((k) => [k, '…']));
      const transport = config.type || (config.url ? 'http' : 'stdio');
      const md = ['```json', JSON.stringify({ [server]: safe }, null, 2), '```', ''].join('\n');
      const id = `${plugin.name}:mcp:${server}`;
      add({
        kind: 'mcp',
        name: server,
        description: config.description ? String(config.description) : `${transport} MCP server`,
        invocation: null,
        tools: [],
        model: null,
        argumentHint: null,
        disableModelInvocation: false,
        userInvocable: false,
        transport,
        path: rel(mcpFile),
        bodyFile: storeBody(id, md),
        searchText: `${server} ${transport} ${config.command || config.url || ''}`,
      });
    }
  }

  return artifacts;
}

function main() {
  const repo = resolveRepo();
  const repoUrl = `https://github.com/${repo}`;
  const marketplace = readJson(MARKETPLACE_FILE);
  if (!marketplace) warn(`${rel(MARKETPLACE_FILE)} not found — building an empty catalog`);
  const mktName = (marketplace && marketplace.name) || DEFAULT_MARKETPLACE_NAME;
  const pluginRoot = marketplace?.metadata?.pluginRoot || null;
  const entries = Array.isArray(marketplace?.plugins) ? marketplace.plugins : [];
  if (marketplace && !Array.isArray(marketplace.plugins)) warn('marketplace.json has no "plugins" array');

  const plugins = [];
  let artifacts = [];
  const releases = [];
  const seen = new Set();

  for (const entry of entries) {
    if (!entry || !entry.name) throw new IndexError('marketplace.json contains a plugin entry without "name"');
    if (seen.has(entry.name)) throw new IndexError(`duplicate plugin name in marketplace.json: ${entry.name}`);
    seen.add(entry.name);
    const dir = resolveSourceDir(entry, pluginRoot);
    if (!dir) {
      warn(`plugin "${entry.name}" uses a non-local source — skipped`);
      continue;
    }
    if (!dir.startsWith(ROOT)) throw new IndexError(`plugin "${entry.name}" source escapes the repository: ${entry.source}`);
    if (!isDir(dir)) throw new IndexError(`plugin "${entry.name}" references missing directory: ${rel(dir) || entry.source}`);

    const manifestFile = join(dir, '.claude-plugin', 'plugin.json');
    const manifest = readJson(manifestFile) || {};
    if (!isFile(manifestFile)) warn(`plugin "${entry.name}" has no ${rel(manifestFile)} — using marketplace entry only`);
    if (manifest.name && manifest.name !== entry.name) {
      throw new IndexError(`plugin.json name "${manifest.name}" does not match marketplace entry "${entry.name}" (${rel(manifestFile)})`);
    }

    const name = entry.name;
    const readme = readText(join(dir, 'README.md'));
    const changelogMd = readText(join(dir, 'CHANGELOG.md'));
    const compatibility = readText(join(dir, 'COMPATIBILITY.md'));
    const changelog = parseChangelog(changelogMd);
    const sourcePath = rel(dir);
    const updated = changelog.find((r) => r.date)?.date || git(['log', '-1', '--format=%cs', '--', sourcePath]) || null;
    const version = String(manifest.version || entry.version || changelog[0]?.version || '') || null;
    const keywords = [...new Set([...toList(manifest.keywords), ...toList(entry.keywords), ...toList(entry.tags)].map((k) => k.toLowerCase()))];
    const deps = (Array.isArray(manifest.dependencies) ? manifest.dependencies : Array.isArray(entry.dependencies) ? entry.dependencies : [])
      .map(parseDependency)
      .filter(Boolean)
      .map((d) => ({ ...d, internal: !d.marketplace || d.marketplace === mktName }));

    const plugin = {
      id: name,
      kind: 'plugin',
      name,
      displayName: String(manifest.displayName || entry.displayName || name),
      version,
      description: String(manifest.description || entry.description || firstParagraph(readme)),
      author: personName(manifest.author) || personName(entry.author) || personName(marketplace?.owner),
      authorUrl: personUrl(manifest.author) || personUrl(entry.author),
      homepage: manifest.homepage || entry.homepage || null,
      license: manifest.license || entry.license || null,
      category: entry.category || null,
      keywords,
      dependencies: deps,
      usedBy: [],
      updated,
      sourcePath,
      repoUrl: `${repoUrl}/tree/${DEFAULT_BRANCH}/${sourcePath}`,
      install: {
        slash: `/plugin install ${name}@${mktName}`,
        cli: `claude plugin install ${name}@${mktName} --scope project`,
        update: `claude plugin update ${name}@${mktName} --scope project`,
      },
      compatibility: compatibilitySummary(compatibility),
      compatibilityFile: storeBody(`${name}:compatibility`, compatibility),
      readmeFile: storeBody(`${name}:readme`, readme),
      releases: changelog.map((r) => ({ version: r.version, date: r.date, items: r.items })),
      counts: {},
      searchText: excerpt(readme),
    };

    const own = buildArtifacts(plugin, dir, manifest);
    for (const k of KIND_ORDER.slice(1)) plugin.counts[k] = own.filter((a) => a.kind === k).length;
    plugin.artifactIds = own.map((a) => a.id);
    artifacts = artifacts.concat(own);
    plugins.push(plugin);

    for (const r of changelog) {
      releases.push({ plugin: name, displayName: plugin.displayName, version: r.version, date: r.date, summary: r.items[0]?.text || '', items: r.items });
    }
  }

  const byName = new Map(plugins.map((p) => [p.name, p]));
  for (const p of plugins) {
    for (const d of p.dependencies) {
      if (!d.internal) continue;
      const target = byName.get(d.name);
      if (!target) {
        warn(`plugin "${p.name}" depends on "${d.name}", which is not in this marketplace`);
        d.internal = false;
        continue;
      }
      target.usedBy.push({ name: p.name, version: d.version });
    }
  }

  releases.sort((a, b) => (b.date || '').localeCompare(a.date || '') || a.plugin.localeCompare(b.plugin));
  plugins.sort((a, b) => a.name.localeCompare(b.name));

  const byKind = Object.fromEntries(KIND_ORDER.map((k) => [k, k === 'plugin' ? plugins.length : artifacts.filter((a) => a.kind === k).length]));
  const generatedAt = new Date().toISOString();
  const sha = process.env.GITHUB_SHA ? process.env.GITHUB_SHA.slice(0, 7) : git(['rev-parse', '--short', 'HEAD']) || null;

  const stable = readJson(join(ROOT, STABLE_CHANNEL_FILE));
  const stableName = stable && typeof stable.name === 'string' ? stable.name : null;
  const rollback = stableName
    ? [
        `claude plugin marketplace add https://raw.githubusercontent.com/${repo}/${DEFAULT_BRANCH}/${STABLE_CHANNEL_FILE} --scope project`,
        `claude plugin marketplace update ${stableName}`,
        `claude plugin disable <plugin>@${mktName} --scope project`,
        `claude plugin install <plugin>@${stableName} --scope project`,
        '/reload-plugins',
      ]
    : null;

  const meta = {
    name: mktName,
    displayName: marketplace?.metadata?.displayName || marketplace?.displayName || mktName,
    description: marketplace?.metadata?.description || marketplace?.description || null,
    owner: personName(marketplace?.owner),
    repo,
    repoUrl,
    commands: {
      addMarketplace: `/plugin marketplace add ${repo}`,
      addMarketplaceCli: `claude plugin marketplace add ${repo} --scope project`,
      updateMarketplace: `claude plugin marketplace update ${mktName}`,
      reload: '/reload-plugins',
      installPlugin: `/plugin install <plugin>@${mktName}`,
      installPluginCli: `claude plugin install <plugin>@${mktName} --scope project`,
      updatePlugin: `claude plugin update <plugin>@${mktName} --scope project`,
      rollback,
    },
    stableChannel: stableName,
  };

  rmSync(BODIES_DIR, { recursive: true, force: true });
  mkdirSync(BODIES_DIR, { recursive: true });
  for (const [file, md] of bodies) writeFileSync(join(BODIES_DIR, file), md);
  writeFileSync(join(OUT_DIR, 'index.json'), JSON.stringify({ schemaVersion: 1, generatedAt, marketplace: meta, plugins, artifacts }));
  writeFileSync(join(OUT_DIR, 'releases.json'), JSON.stringify({ schemaVersion: 1, generatedAt, releases }));
  writeFileSync(join(OUT_DIR, 'stats.json'), JSON.stringify({ schemaVersion: 1, generatedAt, gitSha: sha, pluginCount: plugins.length, artifactCount: artifacts.length, byKind, warnings }));

  console.log(`catalog index: ${plugins.length} plugin(s), ${artifacts.length} artifact(s), ${releases.length} release(s), ${bodies.size} body file(s) → ${rel(OUT_DIR)}`);
}

try {
  main();
} catch (err) {
  if (err instanceof IndexError) {
    console.error(`build-index: error: ${err.message}`);
    process.exit(1);
  }
  throw err;
}
