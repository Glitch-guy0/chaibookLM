import { inngest } from '../client';
import { getBackend } from '../../lib/backend';
import { handleIngestionFailure } from '../../../../backend/src/contexts/ingestion/failure-handler';

export const SOURCE_INGEST_FUNCTION_CONFIG = {
  id: 'source-ingest',
  concurrency: {
    key: 'event.data.userId',
    limit: 2,
  },
  retries: 3 as const,
};

/**
 * fnSourceIngest (AC-2.2.1 - AC-2.2.4)
 * Durable background ingestion orchestration with:
 * - Per-user concurrency limit: 2 pipelines max
 * - 3 retries with exponential backoff for transient errors
 * - Failure isolation via onFailure hook updating Neon status to 'failed' and purging temp files
 */
export const fnSourceIngest = inngest.createFunction(
  {
    id: SOURCE_INGEST_FUNCTION_CONFIG.id,
    triggers: [{ event: 'source.ingest' }],
    concurrency: SOURCE_INGEST_FUNCTION_CONFIG.concurrency,
    retries: SOURCE_INGEST_FUNCTION_CONFIG.retries,
    onFailure: async ({ event, error }: { event: any; error: Error }) => {
      const sourceId = event?.data?.event?.data?.sourceId || event?.data?.sourceId;
      if (!sourceId) return;

      const { sources } = await getBackend();
      await handleIngestionFailure(
        sourceId,
        error?.message || 'Ingestion failed during background orchestration',
        {
          repo: (sources as any).repo,
          storage: (sources as any).storage,
        },
      );
    },
  },
  async ({ event, step }: { event: any; step: any }) => {
    const { sourceId } = event.data;

    return await step.run('execute-source-ingestion', async () => {
      const { sources } = await getBackend();
      // Invoke indexer/ingestion for this source
      if ((sources as any).indexer?.index) {
        await (sources as any).indexer.index(sourceId);
      }
      return { success: true, sourceId };
    });
  },
);
