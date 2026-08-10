import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { errorResponse } from '../../../helpers';
import { getBackend } from '../../../lib/backend';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/sources/[id]/content
 * Full raw content for the Showcase panel: a Text Source's stored text, or a
 * Web Source's URL + optional captured HTML snapshot. Mirrors the auth/
 * ownership/404 style of `DELETE /api/sources/[id]`. `content_unavailable`
 * (a missing/corrupted storage blob, as opposed to a missing/not-owned
 * `Source` row) is mapped to a distinct 404-family response rather than
 * silently succeeding with empty content.
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) {
    return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);
  }

  const { id } = await context.params;
  const { sources } = await getBackend();

  try {
    const result = await sources.getContent(id, userId);

    if (!result.ok) {
      if (result.reason === 'not_found') {
        return errorResponse('Source not found', 'NOT_FOUND', 404);
      }
      return errorResponse(
        'Source content is unavailable',
        'CONTENT_UNAVAILABLE',
        404,
      );
    }

    return NextResponse.json({ content: result.content });
  } catch {
    return errorResponse('Could not load source content', 'INTERNAL_ERROR', 500);
  }
}
