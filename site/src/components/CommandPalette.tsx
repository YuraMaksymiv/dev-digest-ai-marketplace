import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { t, type MessageKey } from '../i18n';
import { entryHref, entryTitle, type Catalog, type Kind } from '../lib/data';
import { navigate } from '../lib/router';
import { searchEntries, type SearchIndex } from '../lib/search';
import { KindDot } from './KindBadge';

interface Item {
  key: string;
  href: string;
  title: string;
  meta: string;
  kind: Kind | null;
  group: 'pages' | 'entries';
}

const PAGES: { key: MessageKey; href: string }[] = [
  { key: 'palette.pageHome', href: '#/' },
  { key: 'palette.pageSearch', href: '#/search' },
  { key: 'palette.pageWhatsNew', href: '#/whats-new' },
  { key: 'palette.pageGettingStarted', href: '#/getting-started' },
];
const MAX_RESULTS = 12;

interface Props {
  catalog: Catalog;
  index: SearchIndex;
  onClose: () => void;
}

export function CommandPalette({ catalog, index, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    inputRef.current?.focus();
    return () => previous?.focus?.();
  }, []);

  const items = useMemo<Item[]>(() => {
    const q = query.trim();
    const pages: Item[] = PAGES.filter((p) => !q || t(p.key).toLowerCase().includes(q.toLowerCase())).map((p) => ({
      key: p.href,
      href: p.href,
      title: t(p.key),
      meta: '',
      kind: null,
      group: 'pages',
    }));
    const hits = q ? searchEntries(index, catalog, q).slice(0, MAX_RESULTS).map((h) => h.entry) : catalog.index.plugins;
    const entries: Item[] = hits.map((e) => ({
      key: e.id,
      href: entryHref(e),
      title: entryTitle(e),
      meta: e.kind === 'plugin' ? e.name : e.pluginDisplayName,
      kind: e.kind,
      group: 'entries',
    }));
    return q ? [...entries, ...pages] : [...pages, ...entries];
  }, [query, catalog, index]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  useEffect(() => {
    document.getElementById(`palette-opt-${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const open = (item: Item | undefined) => {
    if (!item) return;
    onClose();
    navigate(item.href);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (items.length ? (i + 1) % items.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (items.length ? (i - 1 + items.length) % items.length : 0));
    } else if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') {
      e.preventDefault();
      open(items[active]);
    } else if (e.key === 'Tab') {
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>('input, button');
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  let lastGroup: Item['group'] | null = null;

  return (
    <div className="palette-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className="palette"
        role="dialog"
        aria-modal="true"
        aria-label={t('palette.label')}
        ref={dialogRef}
        onKeyDown={onKeyDown}
      >
        <div className="palette-input-row">
          <span className="faint" aria-hidden="true">
            ⌕
          </span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('palette.placeholder')}
            aria-label={t('palette.placeholder')}
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
            aria-activedescendant={items.length ? `palette-opt-${active}` : undefined}
            autoComplete="off"
            spellCheck={false}
          />
          <button type="button" className="kbd" onClick={onClose} aria-label={t('palette.esc')}>
            {t('palette.esc')}
          </button>
        </div>
        {items.length === 0 ? (
          <div className="palette-empty">{t('palette.empty')}</div>
        ) : (
          <ul className="palette-list" id="palette-list" role="listbox" aria-label={t('palette.label')}>
            {items.map((item, i) => {
              const header = item.group !== lastGroup && item.group === 'pages' ? t('palette.pages') : null;
              lastGroup = item.group;
              return (
                <li key={item.key} role="presentation">
                  {header && (
                    <div className="palette-group" aria-hidden="true">
                      {header}
                    </div>
                  )}
                  <div
                    id={`palette-opt-${i}`}
                    role="option"
                    aria-selected={i === active}
                    className="palette-item"
                    onMouseMove={() => setActive(i)}
                    onClick={() => open(item)}
                  >
                    {item.kind ? <KindDot kind={item.kind} /> : <span className="dot" aria-hidden="true" />}
                    <span className="main">
                      <span className="name">{item.title}</span>
                      {item.meta && <span className="meta"> · {item.meta}</span>}
                    </span>
                    {item.kind && <span className="kind">{t(`kind.${item.kind}`)}</span>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <div className="palette-foot">{t('palette.hint')}</div>
      </div>
    </div>
  );
}
