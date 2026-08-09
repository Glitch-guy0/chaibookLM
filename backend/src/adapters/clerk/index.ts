import { verifyToken, createClerkClient } from '@clerk/nextjs/server';

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY ?? '',
});

/**
 * Validate a Clerk session JWT and return the userId.
 * Returns null for invalid or expired tokens.
 */
export async function validateSession(
  sessionToken: string,
): Promise<{ userId: string } | null> {
  try {
    const payload = await verifyToken(sessionToken, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });
    if (!payload?.sub) return null;
    return { userId: payload.sub };
  } catch {
    return null;
  }
}

/**
 * Extract userId from a session token carried in the Authorization header.
 * Expects `Authorization: Bearer <session_jwt>`.
 */
export async function extractUserIdFromRequest(
  request: Request,
): Promise<string | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) return null;
  const result = await validateSession(token);
  return result?.userId ?? null;
}

export { clerkClient };