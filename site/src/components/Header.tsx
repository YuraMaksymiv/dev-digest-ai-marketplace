import { useEffect, useState } from 'react';
import { t } from '../i18n';
import { navigate, readSearchState, searchHref, type Route } from '../lib/router';
import type { Theme } from '../lib/theme';

interface Props {
  route: Route;
  repoUrl: string;
  theme: Theme;
  onToggleTheme: () => void;
  onOpenPalette: () => void;
}

export function Header({ route, repoUrl, theme, onToggleTheme, onOpenPalette }: Props) {
  const routeQuery = route.name === 'search' ? route.params.get('q') ?? '' : '';
  const [query, setQuery] = useState(routeQuery);

  useEffect(() => {
    setQuery(routeQuery);
  }, [routeQuery]);

  const onChange = (value: string) => {
    setQuery(value);
    const base = route.name === 'search' ? readSearchState(route.params) : {};
    navigate(searchHref({ ...base, q: value }), { replace: route.name === 'search' });
  };

  return (
    <header className="header">
      <a className="brand" href="#/" aria-label={t('app.title')}>
        <span className="brand-mark" aria-hidden="true">
          ◆
        </span>
        <span className="brand-name">{t('app.brand')}</span>
        <span className="brand-tag">{t('app.brandTag')}</span>
      </a>
      <div className="header-search" role="search">
        <span className="search-icon" aria-hidden="true">
          ⌕
        </span>
        <input
          type="search"
          value={query}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t('header.searchPlaceholder')}
          aria-label={t('header.searchLabel')}
        />
      </div>
      <nav className="header-nav" aria-label={t('header.nav')}>
        <a className="nav-text" href="#/whats-new" aria-current={route.name === 'whats-new' ? 'page' : undefined}>
          {t('header.navWhatsNew')}
        </a>
        <a className="nav-text" href="#/getting-started" aria-current={route.name === 'getting-started' ? 'page' : undefined}>
          {t('header.navGettingStarted')}
        </a>
        <button type="button" className="icon-btn palette-btn" onClick={onOpenPalette} aria-label={t('header.palette')}>
          ⌘K
        </button>
        <button
          type="button"
          className="icon-btn"
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? t('header.themeToLight') : t('header.themeToDark')}
          title={theme === 'dark' ? t('header.themeToLight') : t('header.themeToDark')}
        >
          <span aria-hidden="true">{theme === 'dark' ? '☀' : '☾'}</span>
        </button>
        <a className="nav-text" href={repoUrl} target="_blank" rel="noopener noreferrer">
          {t('header.github')}
        </a>
      </nav>
    </header>
  );
}
