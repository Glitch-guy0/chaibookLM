import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { errorResponse } from '../../helpers';
import { getBackend } from '../../lib/backend';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * DELETE /api/sources/[id]
 * Delete a source owned by the authenticated user, cascading Qdrant → Filebase
 * → Neon. Returns 404 when the source is missing or not owned.
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  const { userId } = getAuth(request);
  if (!userId) {
    return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);
  }

  const { id } = await context.params;
  const { sources } = await getBackend();
  const deleted = await sources.remove([id], userId);

  if (deleted === 0) {
    return errorResponse('Source not found', 'NOT_FOUND', 404);
  }

  return NextResponse.json({ deleted: true });
}
