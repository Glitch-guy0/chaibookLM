export interface IngestionJobPayload {
  sourceId: string;
  notebookId?: string;
  userId?: string;
  type?: string;
}

export interface EnqueueResult {
  messageId?: string;
}

export interface VerifyWebhookParams {
  signature: string;
  body: string;
  url?: string;
}

/**
 * Port representing an asynchronous queue service (e.g. Upstash QStash).
 */
export interface QueueService {
  /**
   * Enqueue a source ingestion task to be processed asynchronously.
   */
  enqueueIngestion(payload: IngestionJobPayload): Promise<EnqueueResult>;

  /**
   * Cryptographically verify an incoming webhook request from the queue service.
   */
  verifyWebhookSignature(params: VerifyWebhookParams): Promise<boolean>;

  /**
   * Whether the queue service has the required credentials and configuration.
   */
  isConfigured(): boolean;
}
