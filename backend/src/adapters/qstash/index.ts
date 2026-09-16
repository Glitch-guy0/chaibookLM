import { Client, Receiver } from '@upstash/qstash';
import type {
  QueueService,
  IngestionJobPayload,
  EnqueueResult,
  VerifyWebhookParams,
} from '../../ports/QueueService';

export interface QStashConfig {
  url?: string;
  token?: string;
  currentSigningKey?: string;
  nextSigningKey?: string;
  destinationUrl?: string;
}

/**
 * Upstash QStash adapter implementing QueueService.
 *
 * Supports regional/custom QSTASH_URL (e.g. https://qstash-eu-central-1.upstash.io),
 * asynchronous job publishing to /api/qstash/ingest, and cryptographic webhook
 * verification using current and next signing keys.
 */
export class QStashAdapter implements QueueService {
  private client: Client | null = null;
  private receiver: Receiver | null = null;
  private readonly url: string;
  private readonly token?: string;
  private readonly destinationUrl: string;

  constructor(config?: QStashConfig) {
    const rawUrl = config?.url ?? process.env.QSTASH_URL;
    // Normalize URL: remove trailing slashes and fall back to global QStash URL if unset
    this.url = rawUrl?.trim()
      ? rawUrl.trim().replace(/\/+$/, '')
      : 'https://qstash.upstash.io';

    this.token = (config?.token ?? process.env.QSTASH_TOKEN)?.trim();

    const currentSigningKey = (
      config?.currentSigningKey ?? process.env.QSTASH_CURRENT_SIGNING_KEY
    )?.trim();
    const nextSigningKey = (
      config?.nextSigningKey ?? process.env.QSTASH_NEXT_SIGNING_KEY
    )?.trim();

    const rawDestination =
      config?.destinationUrl ??
      process.env.QSTASH_DESTINATION_URL ??
      process.env.NEXT_PUBLIC_APP_URL ??
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000');

    this.destinationUrl = rawDestination.trim().replace(/\/+$/, '');

    if (this.token) {
      this.client = new Client({
        token: this.token,
        baseUrl: this.url,
      });
    }

    if (currentSigningKey && nextSigningKey) {
      this.receiver = new Receiver({
        currentSigningKey,
        nextSigningKey,
      });
    }
  }

  /**
   * Returns the resolved QStash base URL.
   */
  getUrl(): string {
    return this.url;
  }

  /**
   * Returns the resolved destination base URL used for callback webhooks.
   */
  getDestinationUrl(): string {
    return this.destinationUrl;
  }

  /**
   * True if QStash token is configured and the client is ready to publish jobs.
   */
  isConfigured(): boolean {
    return Boolean(this.client && this.token);
  }

  /**
   * True if signing keys are present for verifying incoming webhooks.
   */
  hasReceiverConfigured(): boolean {
    return Boolean(this.receiver);
  }

  /**
   * Publish an ingestion job to QStash targeting the callback endpoint.
   */
  async enqueueIngestion(payload: IngestionJobPayload): Promise<EnqueueResult> {
    if (!this.client) {
      throw new Error(
        'QStash is not configured. Missing QSTASH_TOKEN environment variable.',
      );
    }

    const callbackUrl = `${this.destinationUrl}/api/qstash/ingest`;

    const res = await this.client.publishJSON({
      url: callbackUrl,
      body: payload,
      retries: 3,
    });

    return { messageId: res.messageId };
  }

  /**
   * Verify the authenticity of an incoming webhook from QStash.
   */
  async verifyWebhookSignature({
    signature,
    body,
    url,
  }: VerifyWebhookParams): Promise<boolean> {
    if (!this.receiver) {
      return false;
    }

    try {
      const isValid = await this.receiver.verify({
        signature,
        body,
        url,
        clockTolerance: 30,
      });
      return isValid;
    } catch {
      return false;
    }
  }
}
