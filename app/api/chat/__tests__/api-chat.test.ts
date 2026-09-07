import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('../../../helpers', () => ({
  errorResponse: vi.fn((message, code, status) =>
    Response.json({ error: { message, code } }, { status }),
  ),
}));

vi.mock('../../../lib/rate-limit', () => ({
  checkRateLimit: vi.fn(() => ({ allowed: true })),
  rateLimitResponse: vi.fn(),
}));

describe('Real-Time SSE Token Streaming & Chat Endpoint (Story 3.3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects unauthenticated requests with 401', async () => {
    const { auth } = await import('@clerk/nextjs/server');
    (auth as any).mockResolvedValue({ userId: null });

    const { POST } = await import('../route');
    const req = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({ notebookId: 'nb_1', message: 'Hello' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('validates required fields message and notebookId', async () => {
    const { auth } = await import('@clerk/nextjs/server');
    (auth as any).mockResolvedValue({ userId: 'user_123' });

    const { POST } = await import('../route');
    const req = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({ notebookId: 'nb_1' }), // missing message
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
