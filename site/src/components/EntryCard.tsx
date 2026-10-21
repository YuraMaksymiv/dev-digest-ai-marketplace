import { t } from '../i18n';
import { entryHref, entryTitle, type Entry } from '../lib/data';
import { InlineMarkdown } from './InlineMarkdown';
import { KindBadge } from './KindBadge';
import { useCopy } from './Toast';

const MAX_TAGS = 4;

export function EntryCard({ entry }: { entry: Entry }) {
  const [copy, copied] = useCopy();
  const href = entryHref(entry);
  const meta =
    entry.kind === 'plugin'
      ? entry.author
        ? t('search.byAuthor', { author: entry.author })
        : ''
      : t('search.inPlugin', { plugin: entry.pluginDisplayName });
  const title = entryTitle(entry);
  return (
    <article className="card">
      <div className="card-body">
        <div className="card-top">
          <KindBadge kind={entry.kind} />
          {entry.version && <span className="card-version">v{entry.version}</span>}
        </div>
        <a className="card-title" href={href}>
          {title}
        </a>
        <p className="card-desc">
          <InlineMarkdown text={entry.description} />
        </p>
        {entry.keywords.length > 0 && (
          <div className="card-tags">
            {entry.keywords.slice(0, MAX_TAGS).map((kw) => (
              <span key={kw} className="tag">
                #{kw}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="card-foot">
        <span className="card-meta">{entry.kind === 'plugin' ? meta : entry.invocation ?? meta}</span>
        <div className="card-actions">
          <button type="button" className="btn btn-sm" onClick={() => copy(entry.install.slash)}>
            {copied ? t('copy.copied') : t('copy.copyInstall')}
          </button>
          <a className="btn btn-sm btn-primary" href={href} aria-label={`${t('search.open')} ${title}`}>
            {t('search.open')}
          </a>
        </div>
      </div>
    </article>
  );
}
