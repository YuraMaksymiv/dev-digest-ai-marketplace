import DOMPurify from 'dompurify';
import { Marked } from 'marked';

export interface MarkdownContext {
  /** GitHub URL of the directory the markdown file lives in, e.g. https://github.com/o/r/blob/main/plugins/x/ */
  blobBase?: string;
  /** Raw URL of the same directory, used for images. */
  rawBase?: string;
}

const HEADING_PREFIX = 'md-';

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-');
}

const marked = new Marked({ gfm: true, breaks: false, async: false });
marked.use({
  renderer: {
    heading({ tokens, depth }) {
      const inner = this.parser.parseInline(tokens);
      return `<h${depth} id="${HEADING_PREFIX}${slugify(inner)}">${inner}</h${depth}>\n`;
    },
  },
});

function isAbsolute(url: string): boolean {
  return /^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith('//');
}

function resolveAgainst(url: string, base: string | undefined): string | null {
  if (!base) return null;
  try {
    return new URL(url, base).toString();
  } catch {
    return null;
  }
}

let hooksInstalled = false;
let currentContext: MarkdownContext = {};

function installHooks(): void {
  if (hooksInstalled) return;
  hooksInstalled = true;
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A') {
      const href = node.getAttribute('href');
      if (!href) return;
      if (href.startsWith('#')) {
        node.setAttribute('href', `#${HEADING_PREFIX}${href.slice(1)}`);
        node.setAttribute('data-anchor', 'true');
        return;
      }
      let target = href;
      if (!isAbsolute(href)) {
        const resolved = resolveAgainst(href, currentContext.blobBase);
        if (!resolved) {
          node.removeAttribute('href');
          return;
        }
        target = resolved;
        node.setAttribute('href', target);
      }
      if (/^https?:/i.test(target)) {
        node.setAttribute('target', '_blank');
        node.setAttribute('rel', 'noopener noreferrer');
      }
    } else if (node.tagName === 'IMG') {
      const src = node.getAttribute('src');
      if (src && !isAbsolute(src)) {
        const resolved = resolveAgainst(src, currentContext.rawBase);
        if (resolved) node.setAttribute('src', resolved);
        else node.removeAttribute('src');
      }
      node.setAttribute('loading', 'lazy');
    }
  });
}

export function stripFrontmatter(md: string): string {
  return md.replace(/^---\n[\s\S]*?\n---[ \t]*(?:\n|$)/, '');
}

/** Renders untrusted markdown to sanitized HTML. Never inject the output of marked without this. */
export function renderMarkdown(md: string, ctx: MarkdownContext = {}): string {
  installHooks();
  const html = marked.parse(stripFrontmatter(md)) as string;
  currentContext = ctx;
  try {
    return DOMPurify.sanitize(html, {
      USE_PROFILES: { html: true },
      FORBID_TAGS: ['style', 'form', 'input', 'button', 'textarea', 'select'],
      FORBID_ATTR: ['style'],
      ADD_ATTR: ['target'],
    });
  } finally {
    currentContext = {};
  }
}

export function githubBases(repoUrl: string, filePath: string, branch = 'main'): MarkdownContext {
  const dir = filePath.includes('/') ? filePath.slice(0, filePath.lastIndexOf('/') + 1) : '';
  const m = /^https:\/\/github\.com\/([^/]+\/[^/]+)/.exec(repoUrl);
  return {
    blobBase: `${repoUrl}/blob/${branch}/${dir}`,
    rawBase: m ? `https://raw.githubusercontent.com/${m[1]}/${branch}/${dir}` : undefined,
  };
}

/** Renders a single untrusted markdown line (changelog bullets) to sanitized inline HTML. */
export function renderInline(md: string): string {
  installHooks();
  const html = marked.parseInline(md) as string;
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: ['code', 'strong', 'em', 'del'], ALLOWED_ATTR: [] });
}
