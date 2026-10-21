import { useCallback, useEffect, useMemo, useState } from 'react';
import { CommandPalette } from './components/CommandPalette';
import { Header } from './components/Header';
import { ToastProvider } from './components/Toast';
import { t } from './i18n';
import { CatalogContext, loadCatalog, type Catalog } from './lib/data';
import { parseHash, useHash, type Route } from './lib/router';
import { createSearchIndex, type SearchIndex } from './lib/search';
import { applyTheme, readStoredTheme, type Theme } from './lib/theme';
import { ArtifactPage } from './pages/ArtifactPage';
import { GettingStartedPage } from './pages/GettingStartedPage';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PluginPage } from './pages/PluginPage';
import { SearchPage } from './pages/SearchPage';
import { WhatsNewPage } from './pages/WhatsNewPage';

type LoadState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; catalog: Catalog; index: SearchIndex };

function routeTitle(route: Route, catalog: Catalog): string | null {
  switch (route.name) {
    case 'plugin':
      return catalog.pluginsByName.get(route.plugin)?.displayName ?? null;
    case 'artifact':
      return catalog.artifactsById.get(route.id)?.name ?? null;
    case 'whats-new':
      return t('whatsNew.title');
    case 'getting-started':
      return t('gs.title');
    case 'search':
      return route.params.get('q') || t('search.headingAll');
    default:
      return null;
  }
}

function Page({ route, index }: { route: Route; index: SearchIndex }) {
  switch (route.name) {
    case 'home':
      return <HomePage />;
    case 'search':
      return <SearchPage params={route.params} index={index} />;
    case 'plugin':
      return <PluginPage name={route.plugin} />;
    case 'artifact':
      return <ArtifactPage id={route.id} />;
    case 'whats-new':
      return <WhatsNewPage />;
    case 'getting-started':
      return <GettingStartedPage />;
    default:
      return <NotFoundPage message={t('notFound.text', { path: route.path })} />;
  }
}

export function App() {
  const hash = useHash();
  const route = useMemo(() => parseHash(hash), [hash]);
  const [load, setLoad] = useState<LoadState>({ status: 'loading' });
  const [theme, setTheme] = useState<Theme>(readStoredTheme);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    loadCatalog().then(
      (catalog) => setLoad({ status: 'ready', catalog, index: createSearchIndex(catalog) }),
      (err: unknown) => {
        console.error(err);
        setLoad({ status: 'error' });
      },
    );
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const pathKey = hash.split('?')[0];
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathKey]);

  useEffect(() => {
    if (load.status !== 'ready') return;
    const title = routeTitle(route, load.catalog);
    document.title = title ? `${title} · ${t('app.title')}` : t('app.title');
  }, [route, load]);

  const closePalette = useCallback(() => setPaletteOpen(false), []);
  const toggleTheme = useCallback(() => setTheme((th) => (th === 'dark' ? 'light' : 'dark')), []);

  if (load.status !== 'ready') {
    return (
      <div className="app">
        <div className="center-state" role={load.status === 'error' ? 'alert' : 'status'}>
          {load.status === 'loading' ? (
            t('app.loading')
          ) : (
            <>
              <p>{t('app.loadError')}</p>
              <p className="faint mono">{t('app.loadErrorHint')}</p>
            </>
          )}
        </div>
      </div>
    );
  }

  const { catalog, index } = load;
  const { stats, index: data } = catalog;
  const footerVars = { repo: data.marketplace.repo, sha: stats.gitSha ?? '', date: stats.generatedAt.slice(0, 10) };

  return (
    <CatalogContext.Provider value={catalog}>
      <ToastProvider>
        <div className="app">
          <Header
            route={route}
            repoUrl={data.marketplace.repoUrl}
            theme={theme}
            onToggleTheme={toggleTheme}
            onOpenPalette={() => setPaletteOpen(true)}
          />
          <Page route={route} index={index} />
          <footer className="footer">
            <nav className="footer-nav" aria-label={t('header.nav')}>
              <a href="#/whats-new">{t('header.navWhatsNew')}</a>
              <a href="#/getting-started">{t('header.navGettingStarted')}</a>
            </nav>
            <a href={data.marketplace.repoUrl} target="_blank" rel="noopener noreferrer">
              {stats.gitSha ? t('app.footer', footerVars) : t('app.footerNoSha', footerVars)}
            </a>
          </footer>
          {paletteOpen && <CommandPalette catalog={catalog} index={index} onClose={closePalette} />}
        </div>
      </ToastProvider>
    </CatalogContext.Provider>
  );
}
