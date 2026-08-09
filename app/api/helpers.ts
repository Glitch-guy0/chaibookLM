import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

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