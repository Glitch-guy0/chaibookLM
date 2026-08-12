/**
 * Firecrawl adapter for URL → clean markdown scraping.
 * Configured via FIRECRAWL_API_KEY. Throws a clear error when unconfigured.
 */
export class FirecrawlAdapter {
  private apiKey: string;
  private apiUrl: string;

  constructor() {
    this.apiKey = process.env.FIRECRAWL_API_KEY ?? '';
    this.apiUrl = (process.env.FIRECRAWL_API_URL ?? 'https://api.firecrawl.dev').replace(
      /\/+$/,
      '',
    );
  }

  private assertConfigured(): void {
    if (!this.apiKey) {
      throw new Error('Firecrawl not configured: set FIRECRAWL_API_KEY');
    }
  }

  /**
   * Scrapes a URL and returns clean markdown.
   * Uses Firecrawl's API to extract content from a webpage.
   */
  async scrape(url: string): Promise<string> {
    this.assertConfigured();

    const res = await fetch(`${this.apiUrl}/v1/scrape`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown'],
        timeout: 30000,
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(
        `Could not fetch the page (${res.status})${detail ? `: ${detail}` : ''}`,
      );
    }

    const data = (await res.json()) as {
      success?: boolean;
      data?: { markdown?: string };
    };

    if (!data.success || !data.data?.markdown) {
      throw new Error('The page returned no readable content.');
    }

    return data.data.markdown;
  }
}
