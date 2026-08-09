// Template stub: WebSearchTool
// Provides web search for the shikigami agent via the Search port.
// Real implementation deferred to Epic 4 (chat + reasoning).

import type { Search } from '../ports/search';

export class WebSearchTool {
  private search: Search;

  constructor(search: Search) {
    this.search = search;
  }

  async searchWeb(_q: string): Promise<unknown[]> {
    throw new Error('Not implemented');
  }
}