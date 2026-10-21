import { useMemo } from 'react';
import { CopyCommand } from '../components/CopyCommand';
import { KindDot } from '../components/KindBadge';
import { InlineMarkdown } from '../components/InlineMarkdown';
import { Markdown } from '../components/Markdown';
import { NotFoundPage } from './NotFoundPage';
import { t } from '../i18n';
import { artifactHref, KINDS, pluginHref, useCatalog, type Artifact, type ArtifactKind } from '../lib/data';
import { githubBases } from '../lib/markdown';
import { searchHref } from '../lib/router';

export function PluginPage({ name }: { name: string }) {
  const catalog = useCatalog();
  const plugin = catalog.pluginsByName.get(name);
  const { marketplace } = catalog.index;

  const groups = useMemo(() => {
    if (!plugin) return [];
    const own = plugin.artifactIds.map((id) => catalog.artifactsById.get(id)).filter((a): a is Artifact => !!a);
    return KINDS.filter((k): k is ArtifactKind => k !== 'plugin')
      .map((kind) => ({ kind, items: own.filter((a) => a.kind === kind) }))
      .filter((g) => g.items.length > 0);
  }, [plugin, catalog]);

  if (!plugin) return <NotFoundPage message={t('plugin.notFound', { name })} />;

  const readmeCtx = githubBases(marketplace.repoUrl, `${plugin.sourcePath}/README.md`);
  const compatCtx = githubBases(marketplace.repoUrl, `${plugin.sourcePath}/COMPATIBILITY.md`);

  return (
    <main className="container narrow">
      <a className="back-link" href={searchHref({})}>
        {t('plugin.back')}
      </a>
      <div className="detail-head">
        <div className="detail-icon kind-plugin" aria-hidden="true">
          ◆
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="detail-title-row">
            <h1>{plugin.displayName}</h1>
            {plugin.version && <span className="badge badge-lg kind-plugin">v{plugin.version}</span>}
            {plugin.compatibility && (
              <span className="badge badge-lg compat-badge" title={t('plugin.compatibility')}>
                ✓ {plugin.compatibility}
              </span>
            )}
          </div>
          <p className="detail-desc">
        <InlineMarkdown text={plugin.description} />
      </p>
          <div className="detail-meta">
            <span>{plugin.name}</span>
            {plugin.author && (
              <span>
                {t('plugin.author')}:{' '}
                {plugin.authorUrl ? (
                  <a href={plugin.authorUrl} target="_blank" rel="noopener noreferrer">
                    {plugin.author}
                  </a>
                ) : (
                  plugin.author
                )}
              </span>
            )}
            {marketplace.owner && marketplace.owner !== plugin.author && (
              <span>
                {t('plugin.owner')}: {marketplace.owner}
              </span>
            )}
            {plugin.license && (
              <span>
                {t('plugin.license')}: {plugin.license}
              </span>
            )}
            {plugin.updated && <span>{t('plugin.updated', { date: plugin.updated })}</span>}
          </div>
          {plugin.keywords.length > 0 && (
            <div className="chip-row" style={{ marginTop: 12 }} aria-label={t('plugin.keywords')}>
              {plugin.keywords.map((k) => (
                <a key={k} className="hero-chip" href={searchHref({ keywords: [k] })}>
                  #{k}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="install-block">
        <span className="install-label">{t('plugin.installSlash')}</span>
        <div className="install-row">
          <CopyCommand command={plugin.install.slash} />
          <a className="btn" style={{ height: 44 }} href={plugin.repoUrl} target="_blank" rel="noopener noreferrer">
            {t('plugin.viewOnGitHub')}
          </a>
        </div>
        <span className="install-label">{t('plugin.installCli')}</span>
        <CopyCommand command={plugin.install.cli} />
      </div>

      <section className="section">
        <h2 className="section-title">{t('plugin.composition')}</h2>
        {groups.length === 0 ? (
          <p className="muted">{t('plugin.compositionEmpty')}</p>
        ) : (
          <div className="comp-groups">
            {groups.map((g) => (
              <div key={g.kind}>
                <div className="comp-group-head">
                  <KindDot kind={g.kind} />
                  <span className="label">{t(`kindPlural.${g.kind}`)}</span>
                  <span className="count">{g.items.length}</span>
                </div>
                <div className="comp-grid">
                  {g.items.map((a) => (
                    <a key={a.id} className="comp-item" href={artifactHref(a.id)}>
                      <div className="comp-item-top">
                        <span className="comp-item-name">{a.name}</span>
                        {a.invocation && <span className="comp-item-inv">{a.invocation}</span>}
                      </div>
                      <div className="comp-item-desc">{a.description}</div>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="section">
        <h2 className="section-title">{t('plugin.dependencies')}</h2>
        {plugin.dependencies.length === 0 ? (
          <p className="muted">{t('plugin.dependenciesNone')}</p>
        ) : (
          <div className="dep-list">
            {plugin.dependencies.map((d) =>
              d.internal ? (
                <a key={d.name} className="pill" href={pluginHref(d.name)}>
                  {d.name}
                  <span className="dep-version">{d.version ?? t('plugin.anyVersion')}</span>
                </a>
              ) : (
                <span key={`${d.name}@${d.marketplace}`} className="pill">
                  {d.marketplace ? `${d.name}@${d.marketplace}` : d.name}
                  <span className="dep-version">{d.version ?? t('plugin.anyVersion')}</span>
                  <span className="dep-version">{t('plugin.external')}</span>
                </span>
              ),
            )}
          </div>
        )}
        <div className="dep-sub">{t('plugin.usedBy')}</div>
        {plugin.usedBy.length === 0 ? (
          <p className="muted">{t('plugin.usedByNone')}</p>
        ) : (
          <div className="dep-list">
            {plugin.usedBy.map((u) => (
              <a key={u.name} className="pill" href={pluginHref(u.name)}>
                {u.name}
                <span className="dep-version">{u.version ?? t('plugin.anyVersion')}</span>
              </a>
            ))}
          </div>
        )}
      </section>

      <section className="section">
        <h2 className="section-title">{t('plugin.readme')}</h2>
        {plugin.readmeFile ? (
          <div className="panel">
            <Markdown file={plugin.readmeFile} context={readmeCtx} />
          </div>
        ) : (
          <p className="muted">{t('plugin.readmeNone')}</p>
        )}
      </section>

      {plugin.compatibilityFile && (
        <section className="section">
          <h2 className="section-title">{t('plugin.compatibilityDoc')}</h2>
          <div className="panel">
            <Markdown file={plugin.compatibilityFile} context={compatCtx} />
          </div>
        </section>
      )}

      <section className="section">
        <h2 className="section-title">{t('plugin.changelog')}</h2>
        {plugin.releases.length === 0 ? (
          <p className="muted">{t('plugin.changelogNone')}</p>
        ) : (
          <div className="changelog">
            {plugin.releases.map((r) => (
              <div key={r.version} className="changelog-entry">
                <div className="changelog-entry-head">
                  <span className="changelog-version">v{r.version}</span>
                  {r.date && <span className="faint">{r.date}</span>}
                </div>
                <ReleaseItems items={r.items} />
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export function ReleaseItems({ items }: { items: { section: string | null; text: string }[] }) {
  const sections: { section: string | null; texts: string[] }[] = [];
  for (const it of items) {
    const last = sections[sections.length - 1];
    if (last && last.section === it.section) last.texts.push(it.text);
    else sections.push({ section: it.section, texts: [it.text] });
  }
  return (
    <>
      {sections.map((s, i) => (
        <div key={i}>
          {s.section && <div className="changelog-section">{s.section}</div>}
          <ul>
            {s.texts.map((text, j) => (
              <li key={j}>
                <InlineMarkdown text={text} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}
