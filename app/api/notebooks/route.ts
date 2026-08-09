import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { errorResponse, serializeNotebook } from '../helpers';
import { getBackend } from '../lib/backend';

/**
 * GET /api/notebooks
 * List all notebooks for the authenticated user, lazily pruning any that have
 * expired (TTL). Returns the surviving notebooks plus the number removed so the
 * client can announce the cleanup.
 */
export async function GET(_request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);
  }

  const { notebooks } = await getBackend();
  const expiredRemoved = await notebooks.removeExpiredForUser(userId);
  const list = await notebooks.findByUserId(userId);

  return NextResponse.json({
    notebooks: list.map(serializeNotebook),
    expiredRemoved,
  });
}

/**
 * POST /api/notebooks
 * Create a new notebook for the authenticated user. Rejects empty/whitespace
 * titles with 400 and blocks users at their notebook cap with 409.
 */
export async function POST(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid request body', 'INVALID_BODY', 400);
  }

  const title =
    typeof (body as { title?: unknown })?.title === 'string'
      ? (body as { title: string }).title.trim()
      : '';
  if (!title) {
    return errorResponse('Title is required', 'INVALID_NAME', 400);
  }

  const { notebooks, limits } = await getBackend();
  const created = await notebooks.create(userId, title);

  if (!created) {
    const counter = await limits.getNotebookCounter(userId);
    return NextResponse.json(
      {
        error: {
          message: `You have reached the limit of ${counter.cap} notebooks`,
          code: 'NOTEBOOK_CAP_EXCEEDED',
        },
        count: counter.count,
        cap: counter.cap,
      },
      { status: 409 },
    );
  }

  return NextResponse.json({ notebook: serializeNotebook(created) }, { status: 201 });
}
