import type { Search, SearchResult } from '../../ports/search';

export class JinaAdapter implements Search {
  async query(_q: string): Promise<SearchResult[]> {
    throw new Error('Not implemented');
  }
}