import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QStashAdapter } from '../index';

// Mock @upstash/qstash
const mockPublishJSON = vi.fn();
const mockVerify = vi.fn();

vi.mock('@upstash/qstash', () => {
  return {
    Client: vi.fn().mockImplementation(function (options) {
      return {
        options,
        publishJSON: mockPublishJSON,
      };
    }),
    Receiver: vi.fn().mockImplementation(function (options) {
      return {
        options,
        verify: mockVerify,
      };
    }),
  };
});

describe('QStashAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.QSTASH_URL;
    delete process.env.QSTASH_TOKEN;
    delete process.env.QSTASH_CURRENT_SIGNING_KEY;
    delete process.env.QSTASH_NEXT_SIGNING_KEY;
    delete process.env.QSTASH_DESTINATION_URL;
  });

  it('respects custom regional QSTASH_URL (baseUrl) and trims trailing slashes', () => {
    const adapter = new QStashAdapter({
      url: 'https://qstash-eu-central-1.upstash.io/',
      token: 'test-token',
    });

    expect(adapter.getUrl()).toBe('https://qstash-eu-central-1.upstash.io');
    expect(adapter.isConfigured()).toBe(true);
  });

  it('falls back to default global endpoint when QSTASH_URL is omitted', () => {
    const adapter = new QStashAdapter({
      token: 'test-token',
    });

    expect(adapter.getUrl()).toBe('https://qstash.upstash.io');
  });

  it('reports isConfigured false when token is absent', () => {
    const adapter = new QStashAdapter({});
    expect(adapter.isConfigured()).toBe(false);
  });

  it('enqueues ingestion job with 3 retries targeting /api/qstash/ingest', async () => {
    mockPublishJSON.mockResolvedValueOnce({ messageId: 'msg_12345' });

    const adapter = new QStashAdapter({
      url: 'https://qstash-eu-central-1.upstash.io',
      token: 'test-token',
      destinationUrl: 'https://my-app.vercel.app/',
    });

    const result = await adapter.enqueueIngestion({
      sourceId: 'src_abc',
      notebookId: 'nb_123',
      userId: 'user_456',
      type: 'text',
    });

    expect(result).toEqual({ messageId: 'msg_12345' });
    expect(mockPublishJSON).toHaveBeenCalledTimes(1);
    expect(mockPublishJSON).toHaveBeenCalledWith({
      url: 'https://my-app.vercel.app/api/qstash/ingest',
      body: {
        sourceId: 'src_abc',
        notebookId: 'nb_123',
        userId: 'user_456',
        type: 'text',
      },
      retries: 3,
    });
  });

  it('throws descriptive error on enqueueIngestion when unconfigured', async () => {
    const adapter = new QStashAdapter({});

    await expect(
      adapter.enqueueIngestion({ sourceId: 'src_abc' }),
    ).rejects.toThrow('QStash is not configured');
  });

  it('verifies signature using Receiver when signing keys are provided', async () => {
    mockVerify.mockResolvedValueOnce(true);

    const adapter = new QStashAdapter({
      token: 'test-token',
      currentSigningKey: 'sig_current',
      nextSigningKey: 'sig_next',
    });

    expect(adapter.hasReceiverConfigured()).toBe(true);

    const isValid = await adapter.verifyWebhookSignature({
      signature: 'valid_sig',
      body: '{"sourceId":"src_123"}',
      url: 'https://my-app.vercel.app/api/qstash/ingest',
    });

    expect(isValid).toBe(true);
    expect(mockVerify).toHaveBeenCalledWith({
      signature: 'valid_sig',
      body: '{"sourceId":"src_123"}',
      url: 'https://my-app.vercel.app/api/qstash/ingest',
      clockTolerance: 30,
    });
  });

  it('returns false when signature verification fails or throws', async () => {
    mockVerify.mockRejectedValueOnce(new Error('Signature verification failed'));

    const adapter = new QStashAdapter({
      token: 'test-token',
      currentSigningKey: 'sig_current',
      nextSigningKey: 'sig_next',
    });

    const isValid = await adapter.verifyWebhookSignature({
      signature: 'bad_sig',
      body: '{}',
    });

    expect(isValid).toBe(false);
  });

  it('returns false when receiver keys are missing', async () => {
    const adapter = new QStashAdapter({
      token: 'test-token',
    });

    expect(adapter.hasReceiverConfigured()).toBe(false);

    const isValid = await adapter.verifyWebhookSignature({
      signature: 'sig',
      body: '{}',
    });

    expect(isValid).toBe(false);
  });
});
