import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { Notebook, Source } from '@backend/shared-kernel/types';

/**
 * Extracts the authenticated user's ID from the request using Clerk auth().
 * Returns `null` if the user is not authenticated.
 */
export async function getUserIdFromRequest(): Promise<string | null> {
  const { userId } = await auth();
  return userId;
}

/**
 * Creates a standardized error response.
 *
 * @param message - Human-readable error description.
 * @param code - Machine-readable error code (e.g. "UNAUTHORIZED", "NOT_FOUND").
 * @param status - HTTP status code.
 */
export function errorResponse(
  message: string,
  code: string,
  status: number,
): NextResponse {
  return NextResponse.json({ error: { message, code } }, { status });
}

/**
 * Serialize a Notebook for the JSON wire format, converting Date fields to
 * ISO strings. Also guards against values that already arrived as strings.
 */
export function serializeNotebook(notebook: Notebook) {
  return {
    id: notebook.id,
    title: notebook.title,
    sourceCount: notebook.sourceCount,
    createdAt:
      notebook.createdAt instanceof Date
        ? notebook.createdAt.toISOString()
        : String(notebook.createdAt),
    expiresAt:
      notebook.expiresAt instanceof Date
        ? notebook.expiresAt.toISOString()
        : String(notebook.expiresAt),
  };
}

/**
 * Serialize a Source for the JSON wire format, converting Date fields to ISO
 * strings and always including failReason (null when absent).
 */
export function serializeSource(source: Source) {
  return {
    id: source.id,
    notebookId: source.notebookId,
    userId: source.userId,
    type: source.type,
    title: source.title,
    status: source.status,
    size: source.size,
    failReason: source.failReason ?? null,
    createdAt:
      source.createdAt instanceof Date
        ? source.createdAt.toISOString()
        : String(source.createdAt),
  };
}