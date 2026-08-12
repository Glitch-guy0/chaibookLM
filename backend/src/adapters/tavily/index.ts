import type { Search, SearchResult } from '../../ports/search';

const TAVILY_API_URL = 'https://api.tavily.com/search';
const TAVILY_SEARCH_TOP_N = 5;

/**
 * Tavily adapter for web search. Configured via TAVILY_API_KEY.
 * Throws a clear error on fetch failure; ingestion converts that into a `failed` status.
 */
export class TavilyAdapter implements Search {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.TAVILY_API_KEY ?? '';
  }

  private assertConfigured(): void {
    if (!this.apiKey) {
      throw new Error('Tavily not configured: set TAVILY_API_KEY');
    }
  }

  /**
   * Web search via Tavily API. Returns at most the top 5 results.
   * Tavily returns structured JSON with result objects containing title, url, and content.
   */
  async query(q: string): Promise<SearchResult[]> {
    this.assertConfigured();

    const payload = {
      api_key: this.apiKey,
      query: q,
      max_results: TAVILY_SEARCH_TOP_N,
      include_answer: false,
    };

    const res = await fetch(TAVILY_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(
        `Web search failed (${res.status})${detail ? `: ${detail}` : ''}`,
      );
    }

    const data = (await res.json()) as {
      results?: Array<{ title: string; url: string; content: string }>;
    };

    if (!data.results || data.results.length === 0) {
      throw new Error('Web search returned no results.');
    }

    return data.results.map((r) => ({
      title: r.title || '',
      url: r.url || '',
      content: r.content || '',
    }));
  }
}
