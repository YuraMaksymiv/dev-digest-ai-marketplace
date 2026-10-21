import { useMemo } from 'react';
import { renderInline } from '../lib/markdown';

export function InlineMarkdown({ text, className = '' }: { text: string; className?: string }) {
  const html = useMemo(() => renderInline(text), [text]);
  // Safe: renderInline sanitizes with DOMPurify and an inline-only allowlist.
  return <span className={`inline-md ${className}`.trim()} dangerouslySetInnerHTML={{ __html: html }} />;
}
