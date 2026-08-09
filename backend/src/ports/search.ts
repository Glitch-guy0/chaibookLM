export interface Search {
  query(q: string): Promise<SearchResult[]>;
}

export interface SearchResult {
  title: string;
  url: string;
  content: string;
}