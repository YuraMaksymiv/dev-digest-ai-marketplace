import { useEffect, useMemo, useState, type MouseEvent } from 'react';
import { t } from '../i18n';
import { loadBody } from '../lib/data';
import { renderMarkdown, type MarkdownContext } from '../lib/markdown';

type State = { status: 'loading' } | { status: 'error' } | { status: 'ready'; md: string };

export function Markdown({ file, context }: { file: string; context: MarkdownContext }) {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    let alive = true;
    setState({ status: 'loading' });
    loadBody(file).then(
      (md) => alive && setState({ status: 'ready', md }),
      () => alive && setState({ status: 'error' }),
    );
    return () => {
      alive = false;
    };
  }, [file]);

  const html = useMemo(
    () => (state.status === 'ready' ? renderMarkdown(state.md, context) : ''),
    [state, context.blobBase, context.rawBase],
  );

  const onClick = (e: MouseEvent<HTMLDivElement>) => {
    const a = (e.target as HTMLElement).closest('a[data-anchor]');
    if (!a) return;
    e.preventDefault();
    const id = a.getAttribute('href')?.slice(1);
    if (id) document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (state.status === 'loading') return <div className="markdown faint">{t('markdown.loading')}</div>;
  if (state.status === 'error') return <div className="markdown faint">{t('markdown.error')}</div>;
  // Safe: renderMarkdown always passes marked output through DOMPurify.
  return <div className="markdown" onClick={onClick} dangerouslySetInnerHTML={{ __html: html }} />;
}
