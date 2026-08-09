import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { errorResponse } from '../helpers';

/**
 * GET /api/notebooks
 * List all notebooks for the authenticated user.
 */
export async function GET(_request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);
  }

  // Placeholder — will query the database in Epic 2
  return NextResponse.json({ notebooks: [] });
}

/**
 * POST /api/notebooks
 * Create a new notebook for the authenticated user.
 */
export async function POST(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);
  }

  try {
    const body = await request.json();

    // Placeholder — will persist to the database in Epic 2
    const notebook = {
      id: 'placeholder-id',
      title: body.title ?? 'Untitled Notebook',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ notebook }, { status: 201 });
  } catch {
    return errorResponse('Invalid request body', 'INVALID_BODY', 400);
  }
}