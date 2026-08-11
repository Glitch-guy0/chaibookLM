// WebSearchTool
// Provides web search for the fetch-on-refusal flow via the Search port.
// Only ever invoked from the server-side POST /api/notebooks/[id]/search-fetch
// route (triggered by an explicit user click) -- the model never calls this.

import type { Search, SearchResult } from '../ports/search';

export class WebSearchTool {
  private search: Search;

  constructor(search: Search) {
    this.search = search;
  }

  async searchWeb(q: string): Promise<SearchResult[]> {
    return this.search.query(q);
  }
}
