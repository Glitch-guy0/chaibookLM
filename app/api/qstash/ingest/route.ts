import { NextRequest, NextResponse } from 'next/server';
import { getBackend } from '../../lib/backend';
import { handleIngestionFailure } from '../../../../backend/src/contexts/ingestion/failure-handler';

/**
 * POST /api/qstash/ingest
 * Webhook callback invoked by Upstash QStash to execute source ingestion.
 *
 * Verifies the `upstash-signature` header against QSTASH_CURRENT_SIGNING_KEY /
 * QSTASH_NEXT_SIGNING_KEY before executing the ingestion pipeline via SourceIndexer.
 */
export async function POST(request: NextRequest) {
  const signature = request.headers.get('upstash-signature');
  if (!signature) {
    return NextResponse.json(
      { error: { message: 'Missing Upstash signature', code: 'UNAUTHORIZED' } },
      { status: 401 },
    );
  }

  // Read raw body as string for cryptographic HMAC verification
  const rawBody = await request.text();

  const backend = await getBackend();
  const queue = backend.queue;

  const isValid = await queue.verifyWebhookSignature({
    signature,
    body: rawBody,
    url: request.url,
  });

  if (!isValid) {
    return NextResponse.json(
      { error: { message: 'Invalid Upstash signature', code: 'UNAUTHORIZED' } },
      { status: 401 },
    );
  }

  let payload: { sourceId?: unknown };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { error: { message: 'Invalid JSON payload', code: 'INVALID_BODY' } },
      { status: 400 },
    );
  }

  const sourceId = typeof payload?.sourceId === 'string' ? payload.sourceId.trim() : '';
  if (!sourceId) {
    return NextResponse.json(
      { error: { message: 'sourceId is required', code: 'INVALID_BODY' } },
      { status: 400 },
    );
  }

  try {
    await backend.indexer.index(sourceId);
    return NextResponse.json({ ok: true, sourceId }, { status: 200 });
  } catch (err: any) {
    // Record failure in Neon repository and purge temporary storage
    await handleIngestionFailure(
      sourceId,
      err?.message || 'QStash ingestion execution failed',
      {
        repo: backend.repo,
        storage: (backend.sources as any).storage,
      },
    ).catch(() => {});

    return NextResponse.json(
      {
        error: {
          message: err?.message || 'Ingestion failed',
          code: 'INGESTION_FAILED',
        },
      },
      { status: 500 },
    );
  }
}
