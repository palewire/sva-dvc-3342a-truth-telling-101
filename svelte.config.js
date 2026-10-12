import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex, escapeSvelte } from 'mdsvex';
import rehypeSlug from 'rehype-slug';
import { createHighlighter } from 'shiki';

const base = process.env.BASE_PATH ?? '';

if (base && (!base.startsWith('/') || base.endsWith('/'))) {
  throw new Error('BASE_PATH must start with / and must not end with /');
}

/**
 * Parse a code fence meta string to extract line numbers to highlight.
 * Supports {1,3,5-7} or {emphasize-lines="1,3,5-7"}.
 * @param {string} meta
 * @returns {Set<number>}
 */
function parseHighlightLines(meta) {
  if (!meta) return new Set();

  const emphasizeMatch = meta.match(/\{emphasize-lines=["']([^"']+)["']\}/);
  const simpleMatch = meta.match(/\{([^}]+)\}/);

  const lineSpec = emphasizeMatch?.[1] || simpleMatch?.[1];
  if (!lineSpec) return new Set();
  if (!/^[\d,\s-]+$/.test(lineSpec.trim())) return new Set();

  const lines = new Set();
  for (const part of lineSpec.split(',')) {
    const trimmed = part.trim();
    if (trimmed.includes('-')) {
      const [start, end] = trimmed.split('-').map((n) => parseInt(n.trim(), 10));
      for (let i = start; i <= end; i++) lines.add(i);
    } else {
      const num = parseInt(trimmed, 10);
      if (!isNaN(num)) lines.add(num);
    }
  }
  return lines;
}

const theme = 'catppuccin-macchiato';
const highlighter = await createHighlighter({
  themes: [theme],
  langs: [
    'javascript',
    'typescript',
    'html',
    'css',
    'scss',
    'svelte',
    'json',
    'bash',
    'shell',
    'markdown',
    'yaml',
    'python'
  ]
});

/**
 * Custom mdsvex highlighter using Shiki, following
 * https://mdsvex.pngwn.io/docs#with-shiki
 * @param {string} code
 * @param {string} [lang]
 * @param {string} [meta]
 * @returns {string}
 */
function shikiHighlighter(code, lang = 'text', meta = '') {
  const validLang = highlighter.getLoadedLanguages().includes(lang) ? lang : 'text';
  const highlightLines = parseHighlightLines(meta);

  const html = highlighter.codeToHtml(code, {
    lang: validLang,
    theme,
    transformers: [
      {
        line(node, line) {
          if (highlightLines.has(line)) {
            this.addClassToHast(node, 'highlighted');
          }
        }
      }
    ]
  });

  const copyIcon = `<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;
  const wrapped = `<div class="code-block"><button class="copy-btn" type="button" aria-label="Copy code">${copyIcon}Copy</button>${html}</div>`;
  return `{@html \`${escapeSvelte(wrapped)}\`}`;
}

/** @type {import('@sveltejs/kit').Config} */
const config = {
  extensions: ['.svelte', '.svx'],
  preprocess: [
    mdsvex({
      extensions: ['.svx'],
      rehypePlugins: [rehypeSlug],
      highlight: {
        highlighter: shikiHighlighter
      }
    }),
    vitePreprocess()
  ],
  kit: {
    paths: { base },
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      precompress: true,
      strict: true
    }),
    prerender: {
      // Allow drafts to reference screenshots that haven't been captured yet.
      handleHttpError: 'warn',
      handleUnseenRoutes({ routes, message }) {
        // The week route intentionally has no entries until a real lesson is added.
        if (routes.length === 1 && routes[0] === '/weeks/[slug]') return;
        throw new Error(message);
      }
    }
  }
};

export default config;
