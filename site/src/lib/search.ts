import MiniSearch from 'minisearch';
import type { Catalog, Entry } from './data';

interface Doc {
  id: string;
  name: string;
  displayName: string;
  description: string;
  keywords: string;
  body: string;
}

export const SEARCH_BOOST = { name: 4, displayName: 3, description: 2, keywords: 1.5, body: 1 } as const;

export type SearchIndex = MiniSearch<Doc>;

export function createSearchIndex(catalog: Catalog): MiniSearch<Doc> {
  const ms = new MiniSearch<Doc>({
    idField: 'id',
    fields: ['name', 'displayName', 'description', 'keywords', 'body'],
    searchOptions: {
      boost: { ...SEARCH_BOOST },
      prefix: true,
      fuzzy: 0.2,
      combineWith: 'AND',
    },
  });
  ms.addAll(
    catalog.entries.map((e) => ({
      id: e.id,
      name: e.name,
      displayName: e.kind === 'plugin' ? e.displayName : e.pluginDisplayName,
      description: e.description,
      keywords: e.keywords.join(' '),
      body: e.searchText,
    })),
  );
  return ms;
}

export interface Hit {
  entry: Entry;
  score: number;
}

const KIND_RANK: Record<string, number> = { plugin: 0, skill: 1, agent: 2, command: 3, hook: 4, mcp: 5 };

export function searchEntries(ms: SearchIndex, catalog: Catalog, query: string): Hit[] {
  const q = query.trim();
  const lookup = (id: string): Entry | undefined => catalog.pluginsByName.get(id) ?? catalog.artifactsById.get(id);
  if (!q) {
    return [...catalog.entries]
      .sort((a, b) => KIND_RANK[a.kind] - KIND_RANK[b.kind] || a.name.localeCompare(b.name))
      .map((entry) => ({ entry, score: 0 }));
  }
  let results = ms.search(q);
  if (results.length === 0) results = ms.search(q, { combineWith: 'OR' });
  return results.flatMap((r) => {
    const entry = lookup(String(r.id));
    return entry ? [{ entry, score: r.score }] : [];
  });
}
