// FetchOnRefusalService
//
// Server-side handler for the "Find related web pages" approval action on a
// refusal turn (Story 4.4). Only ever invoked from
// POST /api/notebooks/[id]/search-fetch, itself only ever triggered by the
// user clicking the button -- the model never calls WebSearchTool directly.
//
// Each search result re-enters the notebook through the exact same
// SourceService.create call used by the interactive add-a-source flow, so it
// is subject to the same per-notebook/per-user caps. Unlike that flow's
// fire-and-forget ingestion, this deliberately awaits SourceIndexer.index for
// each created source so the reported count reflects settled creation, not
// just an enqueued response (Design Notes).

import type { SourceService } from '../sources/index';
import type { SourceIndexer } from '../../templates/SourceIndexer';
import type { WebSearchTool } from '../../templates/WebSearchTool';

export type FetchOnRefusalResult =
  | { ok: true; added: number }
  | { ok: false; reason: 'search_failed' | 'no_results' | 'capped' };

export class FetchOnRefusalService {
  constructor(
    private readonly webSearchTool: WebSearchTool,
    private readonly sourceService: SourceService,
    private readonly indexer: SourceIndexer,
  ) {}

  async approve(
    notebookId: string,
    userId: string,
    query: string,
  ): Promise<FetchOnRefusalResult> {
    let results;
    try {
      results = await this.webSearchTool.searchWeb(query);
    } catch {
      return { ok: false, reason: 'search_failed' };
    }

    if (!results || results.length === 0) {
      return { ok: false, reason: 'no_results' };
    }

    const seenUrls = new Set<string>();
    let added = 0;
    let sawUnexpectedFailure = false;
    for (const result of results) {
      if (seenUrls.has(result.url)) continue;
      seenUrls.add(result.url);

      let created;
      try {
        created = await this.sourceService.create({
          notebookId,
          userId,
          type: 'web',
          title: result.title || result.url,
          content: result.url,
        });
      } catch {
        // Unexpected create-path failure (not a cap/size rejection) -- track
        // separately so it isn't misreported as "capped" below.
        sawUnexpectedFailure = true;
        continue;
      }

      if (!created.ok) {
        // Cap/size rejections for individual candidates are skipped
        // silently, not surfaced as separate errors.
        continue;
      }

      await this.indexer.index(created.source.id).catch(() => {});
      added += 1;
    }

    if (added === 0) {
      // If every candidate was rejected purely by cap/size checks, the
      // cap-specific message (no retry) is correct. If any candidate failed
      // unexpectedly instead, this is a transient failure, not a permanent
      // cap -- report it as retryable.
      return { ok: false, reason: sawUnexpectedFailure ? 'search_failed' : 'capped' };
    }

    return { ok: true, added };
  }
}
