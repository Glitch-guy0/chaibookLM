import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { errorResponse } from '../../helpers';
import { getBackend } from '../../lib/backend';

/**
 * DELETE /api/notebooks/bulk
 * Delete multiple notebooks owned by the authenticated user in one request.
 * Per-id ownership is honored; the notebook counter reconciles to the actual
 * count. Returns the number of notebooks actually deleted.
 */
export async function DELETE(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);
  }

  let ids: string[] = [];
  try {
    const body = (await request.json()) as { ids?: unknown };
    const raw = body?.ids;
    if (Array.isArray(raw)) {
      ids = raw.filter((id): id is string => typeof id === 'string');
    }
  } catch {
    return errorResponse('Invalid request body', 'INVALID_BODY', 400);
  }

  const uniqueIds = [...new Set(ids)];
  if (uniqueIds.length === 0) {
    return errorResponse('No notebooks selected', 'INVALID_BODY', 400);
  }
  if (uniqueIds.length > 100) {
    return errorResponse('Too many notebooks in one request', 'TOO_MANY_IDS', 400);
  }

  const { notebooks } = await getBackend();
  const deleted = await notebooks.deleteMany(uniqueIds, userId);

  return NextResponse.json({ deleted });
}
