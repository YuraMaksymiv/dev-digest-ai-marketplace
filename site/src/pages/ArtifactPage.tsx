import { CopyCommand } from '../components/CopyCommand';
import { InlineMarkdown } from '../components/InlineMarkdown';
import { KindBadge } from '../components/KindBadge';
import { Markdown } from '../components/Markdown';
import { NotFoundPage } from './NotFoundPage';
import { t } from '../i18n';
import { pluginHref, useCatalog } from '../lib/data';
import { githubBases } from '../lib/markdown';
import { searchHref } from '../lib/router';

export function ArtifactPage({ id }: { id: string }) {
  const catalog = useCatalog();
  const artifact = catalog.artifactsById.get(id);
  if (!artifact) return <NotFoundPage message={t('artifact.notFound', { id })} />;

  const { repoUrl } = catalog.index.marketplace;
  const ctx = githubBases(repoUrl, artifact.path);
  const note = artifact.disableModelInvocation
    ? t('artifact.manualOnly')
    : !artifact.userInvocable && (artifact.kind === 'skill' || artifact.kind === 'command')
      ? t('artifact.modelOnly')
      : null;

  return (
    <main className="container article">
      <nav className="breadcrumb" aria-label={t('artifact.breadcrumb')}>
        <a href={searchHref({})}>{t('artifact.catalog')}</a>
        <span className="sep"> / </span>
        <a href={pluginHref(artifact.plugin)}>{artifact.pluginDisplayName}</a>
        <span className="sep"> / </span>
        <span>{artifact.name}</span>
      </nav>

      <div className="detail-title-row">
        <KindBadge kind={artifact.kind} large />
        <h1>{artifact.name}</h1>
        {artifact.invocation && <span className="invocation">{artifact.invocation}</span>}
      </div>
      <p className="detail-desc">
        <InlineMarkdown text={artifact.description} />
      </p>

      <div className="facts">
        <div>
          <div className="fact-label">{t('artifact.parent')}</div>
          <div className="fact-value">
            <a href={pluginHref(artifact.plugin)}>{artifact.pluginDisplayName}</a>
            {artifact.version && <span className="faint mono"> v{artifact.version}</span>}
          </div>
        </div>
        {artifact.model && (
          <div>
            <div className="fact-label">{t('artifact.model')}</div>
            <div className="fact-value mono">{artifact.model}</div>
          </div>
        )}
        {artifact.argumentHint && (
          <div>
            <div className="fact-label">{t('artifact.argumentHint')}</div>
            <div className="fact-value mono">{artifact.argumentHint}</div>
          </div>
        )}
        {note && (
          <div>
            <div className="fact-label">{t('artifact.invocation')}</div>
            <div className="fact-value">{note}</div>
          </div>
        )}
      </div>

      {artifact.tools.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <div className="fact-label">{artifact.kind === 'hook' ? t('artifact.matchers') : t('artifact.tools')}</div>
          <div className="chip-row">
            {artifact.tools.map((tool) => (
              <span key={tool} className="pill">
                {tool}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="install-block">
        <span className="install-label">{t('artifact.installVia', { plugin: artifact.plugin })}</span>
        <CopyCommand command={artifact.install.slash} />
      </div>

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">{t('artifact.documentation')}</h2>
          <a className="faint" href={`${repoUrl}/blob/main/${artifact.path}`} target="_blank" rel="noopener noreferrer">
            {t('artifact.source')}
          </a>
        </div>
        {artifact.bodyFile ? (
          <div className="panel">
            <Markdown file={artifact.bodyFile} context={ctx} />
          </div>
        ) : (
          <p className="muted">{t('artifact.noBody')}</p>
        )}
      </section>
    </main>
  );
}
