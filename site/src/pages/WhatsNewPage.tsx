import { t } from '../i18n';
import { pluginHref, useCatalog } from '../lib/data';
import { ReleaseItems } from './PluginPage';

export function WhatsNewPage() {
  const { releases } = useCatalog();
  return (
    <main className="container feed">
      <a className="back-link" href="#/">
        {t('whatsNew.back')}
      </a>
      <div className="feed-title-row">
        <h1>{t('whatsNew.title')}</h1>
      </div>
      <p className="muted">{t('whatsNew.subtitle')}</p>
      {releases.length === 0 ? (
        <div className="state-box" style={{ marginTop: 22 }}>
          <p>{t('whatsNew.empty')}</p>
        </div>
      ) : (
        <div className="feed-list">
          {releases.map((r) => (
            <a key={`${r.plugin}@${r.version}`} className="feed-item" href={pluginHref(r.plugin)}>
              <div className="feed-when">
                <div className="v">v{r.version}</div>
                <div className="d">{r.date ?? t('whatsNew.undated')}</div>
              </div>
              <div className="feed-body">
                <div className="release-title">{r.displayName}</div>
                <ReleaseItems items={r.items} />
              </div>
            </a>
          ))}
        </div>
      )}
    </main>
  );
}
