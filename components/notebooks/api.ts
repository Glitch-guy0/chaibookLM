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

export function clearFailedSources(
  notebookId: string,
): Promise<{ deleted: number }> {
  return request<{ deleted: number }>('/api/sources/clear-failed', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notebookId }),
  });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}
