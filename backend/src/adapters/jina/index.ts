import type { Search, SearchResult } from '../../ports/search';

const READER_URL = 'https://r.jina.ai';

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

  async query(_q: string): Promise<SearchResult[]> {
    throw new Error('Not implemented');
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
