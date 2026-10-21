import { useMemo, useState } from 'react';
import { EntryCard } from '../components/EntryCard';
import { KindDot } from '../components/KindBadge';
import { t } from '../i18n';
import { presentKinds, useCatalog, type Entry, type Kind } from '../lib/data';
import { navigate, readSearchState, searchHref, type SearchState } from '../lib/router';
import { searchEntries, type Hit, type SearchIndex } from '../lib/search';

const MAX_KEYWORD_FACETS = 24;

type Facet = 'kinds' | 'keywords' | 'authors';

function matches(entry: Entry, s: SearchState, skip?: Facet): boolean {
  if (skip !== 'kinds' && s.kinds.length && !s.kinds.includes(entry.kind)) return false;
  if (skip !== 'keywords' && s.keywords.length && !s.keywords.every((k) => entry.keywords.includes(k))) return false;
  if (skip !== 'authors' && s.authors.length && !(entry.author && s.authors.includes(entry.author))) return false;
  return true;
}

function countBy(hits: Hit[], key: (e: Entry) => string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const h of hits) for (const k of key(h.entry)) m.set(k, (m.get(k) ?? 0) + 1);
  return m;
}

const toggle = (list: string[], value: string) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

export function SearchPage({ params, index }: { params: URLSearchParams; index: SearchIndex }) {
  const catalog = useCatalog();
  const state = readSearchState(params);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const hits = useMemo(() => searchEntries(index, catalog, state.q), [index, catalog, state.q]);

  const results = hits.filter((h) => matches(h.entry, state));
  if (state.sort === 'name') results.sort((a, b) => a.entry.name.localeCompare(b.entry.name));
  if (state.sort === 'updated') {
    results.sort((a, b) => (b.entry.updated ?? '').localeCompare(a.entry.updated ?? '') || a.entry.name.localeCompare(b.entry.name));
  }

  const kindCounts = countBy(hits.filter((h) => matches(h.entry, state, 'kinds')), (e) => [e.kind]);
  const keywordCounts = countBy(hits.filter((h) => matches(h.entry, state, 'keywords')), (e) => e.keywords);
  const authorCounts = countBy(hits.filter((h) => matches(h.entry, state, 'authors')), (e) => (e.author ? [e.author] : []));

  const kinds = presentKinds(catalog.stats).filter((k) => (kindCounts.get(k) ?? 0) > 0 || state.kinds.includes(k));
  const keywords = [...keywordCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, MAX_KEYWORD_FACETS)
    .map(([k]) => k);
  for (const k of state.keywords) if (!keywords.includes(k)) keywords.push(k);
  const authors = [...new Set([...authorCounts.keys(), ...state.authors])].sort();

  const update = (patch: Partial<SearchState>) => navigate(searchHref({ ...state, ...patch }), { replace: true });
  const reset = () => update({ kinds: [], keywords: [], authors: [] });
  const hasFacets = state.kinds.length + state.keywords.length + state.authors.length > 0;

  return (
    <main className="search-layout">
      <aside className="facets" data-open={filtersOpen} aria-label={t('search.filters')}>
        <div className="facets-head">
          <span className="facets-label">{t('search.filters')}</span>
          {hasFacets && (
            <button type="button" className="link-btn" onClick={reset}>
              {t('search.reset')}
            </button>
          )}
        </div>
        {kinds.length > 0 && (
          <>
            <div className="facet-title">{t('search.facetKind')}</div>
            <div className="facet-list">
              {kinds.map((k: Kind) => (
                <button
                  key={k}
                  type="button"
                  className="facet-item"
                  aria-pressed={state.kinds.includes(k)}
                  onClick={() => update({ kinds: toggle(state.kinds, k) })}
                >
                  <KindDot kind={k} />
                  <span className="label">{t(`kindPlural.${k}`)}</span>
                  <span className="count">{kindCounts.get(k) ?? 0}</span>
                </button>
              ))}
            </div>
          </>
        )}
        {keywords.length > 0 && (
          <>
            <div className="facet-title">{t('search.facetKeywords')}</div>
            <div className="kw-facets">
              {keywords.map((k) => (
                <button
                  key={k}
                  type="button"
                  className="kw-chip"
                  aria-pressed={state.keywords.includes(k)}
                  onClick={() => update({ keywords: toggle(state.keywords, k) })}
                >
                  {k}
                </button>
              ))}
            </div>
          </>
        )}
        {authors.length > 0 && (
          <>
            <div className="facet-title">{t('search.facetAuthor')}</div>
            <div className="facet-list">
              {authors.map((a) => (
                <button
                  key={a}
                  type="button"
                  className="facet-item"
                  aria-pressed={state.authors.includes(a)}
                  onClick={() => update({ authors: toggle(state.authors, a) })}
                >
                  <span className="label">{a}</span>
                  <span className="count">{authorCounts.get(a) ?? 0}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </aside>

      <section>
        <div className="results-head">
          <div>
            <h1>{state.q ? t('search.heading', { q: state.q }) : t('search.headingAll')}</h1>
            <div className="muted" aria-live="polite">
              {results.length === 1 ? t('search.countOne') : t('search.count', { n: results.length })}
            </div>
          </div>
          <div className="row-actions">
            <button type="button" className="btn btn-sm filters-toggle" aria-expanded={filtersOpen} onClick={() => setFiltersOpen((v) => !v)}>
              {filtersOpen ? t('search.hideFilters') : t('search.showFilters')}
            </button>
            <label className="sort-label">
              {t('search.sort')}
              <select value={state.sort} onChange={(e) => update({ sort: e.target.value as SearchState['sort'] })}>
                <option value="relevance">{t('search.sortRelevance')}</option>
                <option value="name">{t('search.sortName')}</option>
                <option value="updated">{t('search.sortUpdated')}</option>
              </select>
            </label>
          </div>
        </div>

        {results.length > 0 ? (
          <div className="results-grid">
            {results.map((h) => (
              <EntryCard key={h.entry.id} entry={h.entry} />
            ))}
          </div>
        ) : (
          <div className="state-box">
            <div className="state-icon" aria-hidden="true">
              ⌕
            </div>
            <h3>{t('search.emptyTitle')}</h3>
            <p>{t('search.emptyText')}</p>
            <button type="button" className="btn" onClick={() => navigate(searchHref({}), { replace: true })}>
              {t('search.emptyReset')}
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
