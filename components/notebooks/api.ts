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
