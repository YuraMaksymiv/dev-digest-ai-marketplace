import { createContext, useContext } from 'react';

export const KINDS = ['plugin', 'skill', 'agent', 'command', 'hook', 'mcp'] as const;
export type Kind = (typeof KINDS)[number];
export type ArtifactKind = Exclude<Kind, 'plugin'>;

export interface InstallCommands {
  slash: string;
  cli: string;
  update: string;
}

export interface Dependency {
  name: string;
  marketplace: string | null;
  version: string | null;
  internal: boolean;
}

export interface ReleaseItem {
  section: string | null;
  text: string;
}

export interface PluginRelease {
  version: string;
  date: string | null;
  items: ReleaseItem[];
}

export interface Plugin {
  id: string;
  kind: 'plugin';
  name: string;
  displayName: string;
  version: string | null;
  description: string;
  author: string | null;
  authorUrl: string | null;
  homepage: string | null;
  license: string | null;
  category: string | null;
  keywords: string[];
  dependencies: Dependency[];
  usedBy: { name: string; version: string | null }[];
  updated: string | null;
  sourcePath: string;
  repoUrl: string;
  install: InstallCommands;
  compatibility: string | null;
  compatibilityFile: string | null;
  readmeFile: string | null;
  releases: PluginRelease[];
  counts: Record<ArtifactKind, number>;
  artifactIds: string[];
  searchText: string;
}

export interface Artifact {
  id: string;
  kind: ArtifactKind;
  name: string;
  description: string;
  invocation: string | null;
  tools: string[];
  model: string | null;
  argumentHint: string | null;
  disableModelInvocation: boolean;
  userInvocable: boolean;
  transport?: string;
  path: string;
  bodyFile: string | null;
  searchText: string;
  plugin: string;
  pluginDisplayName: string;
  keywords: string[];
  author: string | null;
  updated: string | null;
  version: string | null;
  install: InstallCommands;
}

export type Entry = Plugin | Artifact;

export interface MarketplaceMeta {
  name: string;
  displayName: string;
  description: string | null;
  owner: string | null;
  repo: string;
  repoUrl: string;
  commands: {
    addMarketplace: string;
    addMarketplaceCli: string;
    updateMarketplace: string;
    reload: string;
    installPlugin: string;
    installPluginCli: string;
    updatePlugin: string;
    rollback: string[] | null;
  };
  stableChannel: string | null;
}

export interface CatalogIndex {
  schemaVersion: number;
  generatedAt: string;
  marketplace: MarketplaceMeta;
  plugins: Plugin[];
  artifacts: Artifact[];
}

export interface Release {
  plugin: string;
  displayName: string;
  version: string;
  date: string | null;
  summary: string;
  items: ReleaseItem[];
}

export interface Stats {
  schemaVersion: number;
  generatedAt: string;
  gitSha: string | null;
  pluginCount: number;
  artifactCount: number;
  byKind: Record<Kind, number>;
  warnings: string[];
}

export interface Catalog {
  index: CatalogIndex;
  releases: Release[];
  stats: Stats;
  pluginsByName: Map<string, Plugin>;
  artifactsById: Map<string, Artifact>;
  entries: Entry[];
}

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(path, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return (await res.json()) as T;
}

export async function loadCatalog(): Promise<Catalog> {
  const [index, releasesFile, stats] = await Promise.all([
    fetchJson<CatalogIndex>('./index.json'),
    fetchJson<{ releases: Release[] }>('./releases.json'),
    fetchJson<Stats>('./stats.json'),
  ]);
  return {
    index,
    releases: releasesFile.releases,
    stats,
    pluginsByName: new Map(index.plugins.map((p) => [p.name, p])),
    artifactsById: new Map(index.artifacts.map((a) => [a.id, a])),
    entries: [...index.plugins, ...index.artifacts],
  };
}

const bodyCache = new Map<string, Promise<string>>();

export function loadBody(file: string): Promise<string> {
  let p = bodyCache.get(file);
  if (!p) {
    p = fetch(`./bodies/${encodeURIComponent(file)}`).then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.text();
    });
    p.catch(() => bodyCache.delete(file));
    bodyCache.set(file, p);
  }
  return p;
}

export const CatalogContext = createContext<Catalog | null>(null);

export function useCatalog(): Catalog {
  const c = useContext(CatalogContext);
  if (!c) throw new Error('useCatalog must be used inside CatalogContext');
  return c;
}

export function entryHref(e: Entry): string {
  return e.kind === 'plugin' ? `#/plugin/${encodeURIComponent(e.name)}` : artifactHref(e.id);
}

export function artifactHref(id: string): string {
  return `#/artifact/${id.split(':').map(encodeURIComponent).join(':')}`;
}

export function pluginHref(name: string): string {
  return `#/plugin/${encodeURIComponent(name)}`;
}

export function entryTitle(e: Entry): string {
  return e.kind === 'plugin' ? e.displayName : e.name;
}

export function presentKinds(stats: Stats): Kind[] {
  return KINDS.filter((k) => (stats.byKind[k] ?? 0) > 0);
}
