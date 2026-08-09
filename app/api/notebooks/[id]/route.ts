import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { errorResponse, serializeNotebook } from '../../helpers';
import { getBackend } from '../../lib/backend';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/notebooks/[id]
 * Fetch a single notebook owned by the authenticated user.
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  const { userId } = await auth();

  if (!userId) {
    return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);
  }

  const { id } = await context.params;
  const { notebooks } = await getBackend();
  const notebook = await notebooks.findById(id);

  if (!notebook || notebook.userId !== userId) {
    return errorResponse('Notebook not found', 'NOT_FOUND', 404);
  }

  return NextResponse.json({ notebook: serializeNotebook(notebook) });
}

/**
 * PATCH /api/notebooks/[id]
 * Rename a notebook owned by the authenticated user. Rejects empty/whitespace
 * titles with 400 and returns 404 when the notebook is missing or not owned.
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const { userId } = await auth();

  if (!userId) {
    return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);
  }

  const { id } = await context.params;

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

  const { notebooks } = await getBackend();
  const existing = await notebooks.findById(id);

  if (!existing || existing.userId !== userId) {
    return errorResponse('Notebook not found', 'NOT_FOUND', 404);
  }

  const updated = await notebooks.rename(id, title);
  if (!updated) {
    return errorResponse('Notebook not found', 'NOT_FOUND', 404);
  }
  return NextResponse.json({ notebook: serializeNotebook(updated) });
}

/**
 * DELETE /api/notebooks/[id]
 * Delete a single notebook owned by the authenticated user, cascading its
 * sources and chat in Neon. Returns 404 when missing or not owned.
 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { userId } = await auth();

  if (!userId) {
    return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);
  }

  const { id } = await context.params;
  const { notebooks } = await getBackend();
  const existing = await notebooks.findById(id);

  if (!existing || existing.userId !== userId) {
    return errorResponse('Notebook not found', 'NOT_FOUND', 404);
  }

  await notebooks.delete(id, userId);
  return NextResponse.json({ deleted: true });
}
