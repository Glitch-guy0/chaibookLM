import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { errorResponse } from '../../helpers';
import { getBackend } from '../../lib/backend';

/**
 * DELETE /api/sources/clear-failed
 * Delete all failed sources in a notebook owned by the authenticated user.
 * Returns the number of failed sources actually deleted.
 */
export async function DELETE(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);
  }

  let notebookId: string;
  try {
    const body = (await request.json()) as { notebookId?: unknown };
    if (typeof body?.notebookId !== 'string' || !body.notebookId) {
      return errorResponse('A notebook id is required', 'INVALID_BODY', 400);
    }
    notebookId = body.notebookId;
  } catch {
    return errorResponse('Invalid request body', 'INVALID_BODY', 400);
  }

  const { notebooks, sources } = await getBackend();
  const notebook = await notebooks.findById(notebookId);
  if (!notebook || notebook.userId !== userId) {
    return errorResponse('Notebook not found', 'NOT_FOUND', 404);
  }

  const deleted = await sources.clearFailed(notebookId, userId);
  return NextResponse.json({ deleted });
}
