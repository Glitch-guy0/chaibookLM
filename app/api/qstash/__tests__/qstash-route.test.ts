import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../ingest/route';

// Mock dependencies
const mockVerifyWebhookSignature = vi.fn();
const mockIndex = vi.fn();
const mockSetSourceStatus = vi.fn();
const mockStorageDelete = vi.fn();

vi.mock('../../lib/backend', () => ({
  getBackend: vi.fn().mockImplementation(async () => ({
    queue: {
      verifyWebhookSignature: mockVerifyWebhookSignature,
    },
    indexer: {
      index: mockIndex,
    },
    repo: {
      setSourceStatus: mockSetSourceStatus,
    },
    sources: {
      storage: {
        delete: mockStorageDelete,
      },
    },
  })),
}));

describe('POST /api/qstash/ingest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects requests with missing upstash-signature header (401)', async () => {
    const req = new NextRequest('http://localhost:3000/api/qstash/ingest', {
      method: 'POST',
      body: JSON.stringify({ sourceId: 'src_123' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error.message).toContain('Missing Upstash signature');
  });

  it('rejects requests with invalid signature (401)', async () => {
    mockVerifyWebhookSignature.mockResolvedValueOnce(false);

    const req = new NextRequest('http://localhost:3000/api/qstash/ingest', {
      method: 'POST',
      headers: {
        'upstash-signature': 'invalid_sig',
      },
      body: JSON.stringify({ sourceId: 'src_123' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error.message).toContain('Invalid Upstash signature');
  });

  it('rejects malformed JSON body (400)', async () => {
    mockVerifyWebhookSignature.mockResolvedValueOnce(true);

    const req = new NextRequest('http://localhost:3000/api/qstash/ingest', {
      method: 'POST',
      headers: {
        'upstash-signature': 'valid_sig',
      },
      body: 'this is not valid json',
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error.code).toBe('INVALID_BODY');
  });

  it('rejects requests missing sourceId (400)', async () => {
    mockVerifyWebhookSignature.mockResolvedValueOnce(true);

    const req = new NextRequest('http://localhost:3000/api/qstash/ingest', {
      method: 'POST',
      headers: {
        'upstash-signature': 'valid_sig',
      },
      body: JSON.stringify({ other: 'value' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error.message).toContain('sourceId is required');
  });

  it('successfully indexes source on valid signature and returns 200', async () => {
    mockVerifyWebhookSignature.mockResolvedValueOnce(true);
    mockIndex.mockResolvedValueOnce(undefined);

    const req = new NextRequest('http://localhost:3000/api/qstash/ingest', {
      method: 'POST',
      headers: {
        'upstash-signature': 'valid_sig',
      },
      body: JSON.stringify({ sourceId: 'src_test_valid' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({ ok: true, sourceId: 'src_test_valid' });
    expect(mockIndex).toHaveBeenCalledWith('src_test_valid');
  });

  it('handles ingestion errors, isolates failure, and returns 500 for QStash retry', async () => {
    mockVerifyWebhookSignature.mockResolvedValueOnce(true);
    mockIndex.mockRejectedValueOnce(new Error('Downstream indexing error'));
    mockSetSourceStatus.mockResolvedValueOnce(undefined);

    const req = new NextRequest('http://localhost:3000/api/qstash/ingest', {
      method: 'POST',
      headers: {
        'upstash-signature': 'valid_sig',
      },
      body: JSON.stringify({ sourceId: 'src_test_error' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error.message).toContain('Downstream indexing error');
    expect(mockSetSourceStatus).toHaveBeenCalledWith(
      'src_test_error',
      'failed',
      'Downstream indexing error',
    );
  });
});
