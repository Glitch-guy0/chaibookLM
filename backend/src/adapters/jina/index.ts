import type { Search, SearchResult } from '../../ports/search';

const READER_URL = 'https://r.jina.ai';
const SEARCH_URL = 'https://s.jina.ai';
const SEARCH_TOP_N = 5;

/**
 * Parses s.jina.ai's markdown-formatted search results (requested via
 * `X-Return-Format: markdown`) into `SearchResult[]`. The endpoint's
 * documented shape is a numbered list of blocks, each roughly:
 *
 *   [1] Title: <title>
 *   [1] URL Source: <url>
 *   [1] Description: <snippet>
 *
 * separated by blank lines. This parser groups lines by their leading
 * `[n]` index rather than assuming exact field order/casing, so minor
 * formatting drift in jina's output degrades gracefully (a block missing a
 * title/url is simply skipped) instead of throwing.
 */
export function parseSearchMarkdown(markdown: string): SearchResult[] {
  const byIndex = new Map<string, { title?: string; url?: string; content?: string }>();
  const lineRe = /^\[(\d+)\]\s*([A-Za-z ]+):\s*(.*)$/;
  for (const rawLine of markdown.split('\n')) {
    const line = rawLine.trim();
    const match = lineRe.exec(line);
    if (!match) continue;
    const [, index, field, value] = match;
    const entry = byIndex.get(index) ?? {};
    const normalizedField = field.trim().toLowerCase();
    if (normalizedField === 'title') {
      entry.title = value.trim();
    } else if (normalizedField === 'url source') {
      entry.url = value.trim();
    } else if (normalizedField === 'description') {
      entry.content = value.trim();
    }
    byIndex.set(index, entry);
  }

  const results: SearchResult[] = [];
  for (const [, entry] of Array.from(byIndex.entries()).sort(
    (a, b) => Number(a[0]) - Number(b[0]),
  )) {
    if (!entry.title || !entry.url) continue;
    results.push({ title: entry.title, url: entry.url, content: entry.content ?? '' });
  }
  return results;
}

/** Remove markdown image syntax (and image-only lines) at index time only. */
export function stripImages(markdown: string): string {
  return markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .split('\n')
    .filter((line) => !/^\s*(https?:\/\/\S+\.(png|jpe?g|gif|webp|svg|avif)(\?.*)?)\s*$/i.test(line))
    .join('\n');
}

/**
 * Jina adapter. `query` (web search) is deferred to Epic 4; `fetchReader`
 * implements the r.jina.ai reader (URL → markdown) for web-source ingestion.
 * Configured via JINA_API_KEY (optional) and JINA_READER_URL (optional). Throws
 * a clear error on fetch failure; ingestion converts that into a `failed` status.
 */
export class JinaAdapter implements Search {
  private apiKey: string;
  private readerUrl: string;

  constructor() {
    this.apiKey = process.env.JINA_API_KEY ?? '';
    this.readerUrl = (process.env.JINA_READER_URL ?? READER_URL).replace(/\/+$/, '');
  }

  /**
   * Web search via s.jina.ai, mirroring fetchReader's auth/error
   * conventions. Requests markdown so the response is a numbered list of
   * `[n] Title/URL Source/Description` blocks (jina's search reader does not
   * document a stable structured-JSON shape for this endpoint), parsed by
   * `parseSearchMarkdown`. Returns at most the top 5 results.
   */
  async query(q: string): Promise<SearchResult[]> {
    const target = `${SEARCH_URL}/${encodeURIComponent(q)}`;
    const res = await fetch(target, {
      headers: {
        'X-Return-Format': 'markdown',
        ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
      },
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(
        `Web search failed (${res.status})${detail ? `: ${detail}` : ''}`,
      );
    }
    const markdown = await res.text();
    if (!markdown || markdown.trim().length === 0) {
      throw new Error('Web search returned no content.');
    }
    return parseSearchMarkdown(markdown).slice(0, SEARCH_TOP_N);
  }

  async fetchReader(url: string): Promise<string> {
    const target = `${this.readerUrl}/${url}`;
    const res = await fetch(target, {
      headers: {
        'X-Return-Format': 'markdown',
        'X-With-Generated-Alt': 'true',
        ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
      },
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(
        `Could not fetch the page (${res.status})${detail ? `: ${detail}` : ''}`,
      );
    }
    const markdown = await res.text();
    if (!markdown || markdown.trim().length === 0) {
      throw new Error('The page returned no readable content.');
    }
    return markdown;
  }
}
