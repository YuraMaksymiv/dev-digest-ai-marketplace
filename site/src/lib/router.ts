import { useSyncExternalStore } from 'react';

export type Route =
  | { name: 'home' }
  | { name: 'search'; params: URLSearchParams }
  | { name: 'plugin'; plugin: string }
  | { name: 'artifact'; id: string }
  | { name: 'whats-new' }
  | { name: 'getting-started' }
  | { name: 'not-found'; path: string };

const ROUTE_EVENT = 'catalog:route';

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

export function parseHash(hash: string): Route {
  const raw = hash.replace(/^#/, '') || '/';
  const qIndex = raw.indexOf('?');
  const path = qIndex >= 0 ? raw.slice(0, qIndex) : raw;
  const query = qIndex >= 0 ? raw.slice(qIndex + 1) : '';
  const parts = path.split('/').filter(Boolean);

  if (parts.length === 0) return { name: 'home' };
  if (parts[0] === 'search' && parts.length === 1) return { name: 'search', params: new URLSearchParams(query) };
  if (parts[0] === 'plugin' && parts.length === 2) return { name: 'plugin', plugin: safeDecode(parts[1]) };
  if (parts[0] === 'artifact' && parts.length >= 2) {
    return { name: 'artifact', id: parts.slice(1).join('/').split(':').map(safeDecode).join(':') };
  }
  if (parts[0] === 'whats-new' && parts.length === 1) return { name: 'whats-new' };
  if (parts[0] === 'getting-started' && parts.length === 1) return { name: 'getting-started' };
  return { name: 'not-found', path };
}

function subscribe(cb: () => void): () => void {
  window.addEventListener('hashchange', cb);
  window.addEventListener(ROUTE_EVENT, cb);
  return () => {
    window.removeEventListener('hashchange', cb);
    window.removeEventListener(ROUTE_EVENT, cb);
  };
}

const getHash = () => window.location.hash;

export function useHash(): string {
  return useSyncExternalStore(subscribe, getHash, getHash);
}

export function navigate(href: string, { replace = false }: { replace?: boolean } = {}): void {
  const target = href.startsWith('#') ? href : `#${href}`;
  if (target === window.location.hash) return;
  if (replace) {
    window.history.replaceState(window.history.state, '', target);
    window.dispatchEvent(new Event(ROUTE_EVENT));
  } else {
    window.location.hash = target;
  }
}

export interface SearchState {
  q: string;
  kinds: string[];
  keywords: string[];
  authors: string[];
  sort: 'relevance' | 'name' | 'updated';
}

const splitList = (v: string | null) => (v ? v.split(',').map((s) => s.trim()).filter(Boolean) : []);

export function readSearchState(params: URLSearchParams): SearchState {
  const sort = params.get('sort');
  return {
    q: params.get('q') ?? '',
    kinds: splitList(params.get('kind')),
    keywords: splitList(params.get('kw')),
    authors: splitList(params.get('author')),
    sort: sort === 'name' || sort === 'updated' ? sort : 'relevance',
  };
}

export function searchHref(s: Partial<SearchState>): string {
  const p = new URLSearchParams();
  if (s.q) p.set('q', s.q);
  if (s.kinds?.length) p.set('kind', s.kinds.join(','));
  if (s.keywords?.length) p.set('kw', s.keywords.join(','));
  if (s.authors?.length) p.set('author', s.authors.join(','));
  if (s.sort && s.sort !== 'relevance') p.set('sort', s.sort);
  const qs = p.toString();
  return `#/search${qs ? `?${qs}` : ''}`;
}
