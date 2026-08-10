import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { errorResponse } from '../../helpers';
import { getBackend } from '../../lib/backend';

/**
 * DELETE /api/sources/bulk
 * Delete multiple sources owned by the authenticated user in one request.
 * Per-id ownership is honored; the source counter reconciles to the actual
 * count. Returns the number of sources actually deleted.
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
      ids = raw.filter(
        (id): id is string => typeof id === 'string' && id.length > 0,
      );
    }
  } catch {
    return errorResponse('Invalid request body', 'INVALID_BODY', 400);
  }

  const uniqueIds = [...new Set(ids)];
  if (uniqueIds.length === 0) {
    return errorResponse('No sources selected', 'INVALID_BODY', 400);
  }
  if (uniqueIds.length > 100) {
    return errorResponse('Too many sources in one request', 'TOO_MANY_IDS', 400);
  }

  const { sources } = await getBackend();
  const deleted = await sources.remove(uniqueIds, userId);

  return NextResponse.json({ deleted });
}
