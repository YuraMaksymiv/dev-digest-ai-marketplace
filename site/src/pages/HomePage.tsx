import { useMemo, useState, type FormEvent } from 'react';
import { InlineMarkdown } from '../components/InlineMarkdown';
import { KindDot } from '../components/KindBadge';
import { t } from '../i18n';
import { pluginHref, presentKinds, useCatalog } from '../lib/data';
import { navigate, searchHref } from '../lib/router';

const HERO_CHIPS = 6;
const HOME_RELEASES = 4;

export function HomePage() {
  const catalog = useCatalog();
  const { index, stats, releases } = catalog;
  const [query, setQuery] = useState('');
  const kinds = presentKinds(stats);
  const isEmpty = index.plugins.length === 0;

  const topKeywords = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of index.plugins) for (const k of p.keywords) counts.set(k, (counts.get(k) ?? 0) + 1);
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, HERO_CHIPS)
      .map(([k]) => k);
  }, [index.plugins]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    navigate(searchHref({ q: query.trim() }));
  };

  return (
    <main className="container">
      <section className="hero">
        <div className="eyebrow">{t('home.eyebrow')}</div>
        <h1>{t('home.title')}</h1>
        <p>{t('home.subtitle')}</p>
        <form className="hero-search" role="search" onSubmit={submit}>
          <span className="search-icon" aria-hidden="true">
            ⌕
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('home.searchPlaceholder')}
            aria-label={t('header.searchLabel')}
          />
        </form>
        {topKeywords.length > 0 && (
          <div className="hero-chips">
            {topKeywords.map((k) => (
              <a key={k} className="hero-chip" href={searchHref({ keywords: [k] })}>
                #{k}
              </a>
            ))}
          </div>
        )}
      </section>

      {isEmpty ? (
        <section className="state-box">
          <div className="state-icon" aria-hidden="true">
            ◇
          </div>
          <h2>{t('home.emptyTitle')}</h2>
          <p>{t('home.emptyText')}</p>
          <div className="row-actions">
            <a className="btn btn-primary" href="#/getting-started">
              {t('home.emptyStart')}
            </a>
            <a className="btn" href={`${index.marketplace.repoUrl}/blob/main/CONTRIBUTING.md`} target="_blank" rel="noopener noreferrer">
              {t('home.emptyContributing')}
            </a>
          </div>
        </section>
      ) : (
        <>
          <section className="stats-grid" aria-label={t('home.browse')}>
            {kinds.map((k) => (
              <a key={k} className={`stat-card kind-${k}`} href={searchHref({ kinds: [k] })}>
                <div className="stat-count">{stats.byKind[k]}</div>
                <div className="stat-label">{t(`kindPlural.${k}`)}</div>
              </a>
            ))}
          </section>

          <section className="section">
            <div className="section-head">
              <h2>{t('home.whatsNew')}</h2>
              <a className="faint" href="#/whats-new">
                {t('home.whatsNewAll')}
              </a>
            </div>
            {releases.length === 0 ? (
              <p className="muted">{t('home.noReleases')}</p>
            ) : (
              <div className="release-list">
                {releases.slice(0, HOME_RELEASES).map((r) => (
                  <a key={`${r.plugin}@${r.version}`} className="release-row" href={pluginHref(r.plugin)}>
                    <span className="badge kind-plugin">v{r.version}</span>
                    <div className="release-main">
                      <div className="release-title">{r.displayName}</div>
                      <div className="release-summary">
                        <InlineMarkdown text={r.summary} />
                      </div>
                    </div>
                    {r.date && <span className="release-date">{r.date}</span>}
                  </a>
                ))}
              </div>
            )}
          </section>

          <section className="section">
            <div className="section-head">
              <h2>{t('home.browse')}</h2>
            </div>
            <div className="browse-row">
              {kinds.map((k) => (
                <a key={k} className="browse-btn" href={searchHref({ kinds: [k] })}>
                  <KindDot kind={k} />
                  <span>{t(`kindPlural.${k}`)}</span>
                  <span className="count">{stats.byKind[k]}</span>
                </a>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
