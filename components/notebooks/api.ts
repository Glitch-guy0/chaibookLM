import type { CitationSnapshot } from '@backend/shared-kernel/types';

export interface NotebookRecord {
  id: string;
  title: string;
  sourceCount: number;
  createdAt: string;
  expiresAt: string;
}

export interface NotebookListResponse {
  notebooks: NotebookRecord[];
  expiredRemoved: number;
}

export interface NotebookSingleResponse {
  notebook: NotebookRecord;
}

export interface ApiErrorPayload {
  error: { message: string; code: string };
  count?: number;
  cap?: number;
}

/**
 * Thin typed client for the notebooks API. These functions are meant to be used
 * as query/mutation functions inside TanStack Query hooks — client components
 * never call fetch directly in render or effect bodies.
 */
async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    const payload = (data ?? {}) as ApiErrorPayload;
    const err = new Error(payload?.error?.message ?? res.statusText) as Error & {
      status: number;
      code?: string;
      data: ApiErrorPayload;
    };
    err.status = res.status;
    err.code = payload?.error?.code;
    err.data = payload;
    throw err;
  }
  return data as T;
}

export function fetchNotebooks(): Promise<NotebookListResponse> {
  return request<NotebookListResponse>('/api/notebooks');
}

export function createNotebook(title: string): Promise<NotebookSingleResponse> {
  return request<NotebookSingleResponse>('/api/notebooks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
}

export function fetchNotebook(id: string): Promise<NotebookSingleResponse> {
  return request<NotebookSingleResponse>(`/api/notebooks/${encodeURIComponent(id)}`);
}

export function renameNotebook(
  id: string,
  title: string,
): Promise<NotebookSingleResponse> {
  return request<NotebookSingleResponse>(
    `/api/notebooks/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    },
  );
}

export function deleteNotebook(id: string): Promise<{ deleted: boolean }> {
  return request<{ deleted: boolean }>(
    `/api/notebooks/${encodeURIComponent(id)}`,
    { method: 'DELETE' },
  );
}

export function deleteNotebooksBulk(ids: string[]): Promise<{ deleted: number }> {
  return request<{ deleted: number }>('/api/notebooks/bulk', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  });
}

/**
 * Number of whole days until a notebook expires. Positive values only; expired
 * notebooks are pruned on dashboard load, so callers never see <= 0 here.
 */
export function daysUntilExpiry(expiresAt: string, now = Date.now()): number {
  const diff = new Date(expiresAt).getTime() - now;
  return diff > 0 ? Math.ceil(diff / 86_400_000) : 0;
}

// ── Sources ──────────────────────────────────────────────────────────────

export type SourceType = 'text' | 'web';
export type SourceStatus = 'queued' | 'processing' | 'ready' | 'failed';

export interface SourceRecord {
  id: string;
  notebookId: string;
  userId: string;
  type: SourceType;
  title: string;
  status: SourceStatus;
  size: number;
  failReason: string | null;
  createdAt: string;
}

export interface SourceListResponse {
  sources: SourceRecord[];
}

export interface SourceSingleResponse {
  source: SourceRecord;
}

export function fetchSources(notebookId: string): Promise<SourceListResponse> {
  return request<SourceListResponse>(
    `/api/notebooks/${encodeURIComponent(notebookId)}/sources`,
  );
}

export function createTextSource(
  notebookId: string,
  input: { title?: string; content: string },
): Promise<SourceSingleResponse> {
  return request<SourceSingleResponse>(
    `/api/notebooks/${encodeURIComponent(notebookId)}/sources`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'text', ...input }),
    },
  );
}

export function createWebSource(
  notebookId: string,
  input: { title?: string; url: string },
): Promise<SourceSingleResponse> {
  return request<SourceSingleResponse>(
    `/api/notebooks/${encodeURIComponent(notebookId)}/sources`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'web', ...input }),
    },
  );
}

export function deleteSource(id: string): Promise<{ deleted: boolean }> {
  return request<{ deleted: boolean }>(
    `/api/sources/${encodeURIComponent(id)}`,
    { method: 'DELETE' },
  );
}

export function deleteSourcesBulk(ids: string[]): Promise<{ deleted: number }> {
  return request<{ deleted: number }>('/api/sources/bulk', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  });
}

export type SourceContent =
  | { type: 'text'; text: string }
  | { type: 'web'; url: string; snapshotHtml: string | null };

export function fetchSourceContent(sourceId: string): Promise<SourceContent> {
  return request<{ content: SourceContent }>(
    `/api/sources/${encodeURIComponent(sourceId)}/content`,
  ).then((res) => res.content);
}

export function clearFailedSources(
  notebookId: string,
): Promise<{ deleted: number }> {
  return request<{ deleted: number }>('/api/sources/clear-failed', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notebookId }),
  });
}

// ── Chat ─────────────────────────────────────────────────────────────────

/**
 * Fixed printable-ASCII marker matching the server route's CHAT_ERROR_SENTINEL.
 * Kept as a plain string literal, never a raw control byte.
 */
const CHAT_ERROR_SENTINEL = 'CHAT_ERROR:';

/**
 * Fixed printable-ASCII marker matching the server route's
 * CHAT_CITATIONS_SENTINEL. Sent (with a JSON-encoded CitationSnapshot[]
 * payload, possibly empty) only on a successful, non-refusal completion --
 * refusal and error paths never send it.
 */
const CHAT_CITATIONS_SENTINEL = 'CHAT_CITATIONS:';

export type { CitationSnapshot };

export interface StreamChatResult {
  fullText: string;
  failed: boolean;
  errorMessage?: string;
  /** The persisted (or reused, on retry) user chat_messages row id, read off
   * the `X-Chat-User-Message-Id` response header -- callers thread this back
   * in as `retryOfMessageId` if this turn later needs to be retried. */
  userMessageId?: string;
  /** Parsed from the CHAT_CITATIONS: trailer, present only on a successful,
   * non-refusal completion (may be an empty array when the answer cited
   * nothing). Absent on refusal/error/failed turns. */
  citations?: CitationSnapshot[];
}

/**
 * Streams a chat answer for `notebookId`, invoking `onToken` with each
 * decoded text chunk as it arrives. Buffers the tail of each decoded chunk
 * across `reader.read()` calls (fold-in fix) so a sentinel split across two
 * reads is still detected -- only ever emits the sentinel-prefixed suffix
 * once accumulated text unambiguously starts with it. Passing
 * `retryOfMessageId` (the `userMessageId` from a previously-failed turn's
 * result) resends against the already-persisted user message instead of
 * inserting a duplicate.
 */
export async function streamChatMessage(
  notebookId: string,
  message: string,
  onToken: (token: string) => void,
  signal?: AbortSignal,
  retryOfMessageId?: string,
): Promise<StreamChatResult> {
  let res: Response;
  try {
    res = await fetch(`/api/notebooks/${encodeURIComponent(notebookId)}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, retryOfMessageId }),
      signal,
    });
  } catch (err) {
    // Fold-in fix: a network drop or an aborted fetch must resolve to a
    // failed-turn result like every other failure path here, never surface
    // as an unhandled promise rejection.
    const errMessage = err instanceof Error ? err.message : 'Network request failed';
    return { fullText: '', failed: true, errorMessage: errMessage };
  }

  if (!res.ok || !res.body) {
    let errMessage = res.statusText;
    try {
      const data = (await res.json()) as ApiErrorPayload;
      errMessage = data?.error?.message ?? errMessage;
    } catch {
      // ignore -- no JSON body
    }
    return { fullText: '', failed: true, errorMessage: errMessage };
  }

  const userMessageId = res.headers.get('X-Chat-User-Message-Id') ?? undefined;
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = '';
  // Tail buffer: text not yet confirmed clear of a sentinel split across
  // reads. Held back from onToken until we know it isn't (the start of) the
  // sentinel.
  let pending = '';
  let failed = false;
  let errorMessage: string | undefined;
  let citations: CitationSnapshot[] | undefined;

  const maxSentinelTail = Math.max(
    CHAT_ERROR_SENTINEL.length,
    CHAT_CITATIONS_SENTINEL.length,
  );

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      pending += decoder.decode(value, { stream: true });

      const errIdx = pending.indexOf(CHAT_ERROR_SENTINEL);
      const citIdx = pending.indexOf(CHAT_CITATIONS_SENTINEL);

      if (errIdx !== -1) {
        const before = pending.slice(0, errIdx);
        if (before) {
          full += before;
          onToken(before);
        }
        failed = true;
        errorMessage = pending.slice(errIdx + CHAT_ERROR_SENTINEL.length);
        // The outcome is now known and the server closes the stream right
        // after the sentinel -- stop scanning/emitting so the same
        // pre-sentinel text is never re-processed on a subsequent chunk.
        break;
      }

      if (citIdx !== -1) {
        const before = pending.slice(0, citIdx);
        if (before) {
          full += before;
          onToken(before);
        }
        const payload = pending.slice(citIdx + CHAT_CITATIONS_SENTINEL.length);
        try {
          citations = JSON.parse(payload) as CitationSnapshot[];
        } catch {
          citations = [];
        }
        // Same reasoning as the error sentinel: the server closes the stream
        // right after this trailer, so stop scanning to avoid re-emitting
        // the pre-sentinel text on a later read.
        break;
      }

      // Hold back a tail long enough to contain a partial sentinel match.
      const safeLength = Math.max(0, pending.length - maxSentinelTail);
      const safe = pending.slice(0, safeLength);
      pending = pending.slice(safeLength);
      if (safe) {
        full += safe;
        onToken(safe);
      }
    }
  } catch (err) {
    const errMessage = err instanceof Error ? err.message : 'Stream read failed';
    return { fullText: full, failed: true, errorMessage: errMessage, userMessageId };
  }

  if (!failed && citations === undefined && pending) {
    full += pending;
    onToken(pending);
  }

  return { fullText: full, failed, errorMessage, userMessageId, citations };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}
