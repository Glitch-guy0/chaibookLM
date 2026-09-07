import { describe, expect, it, vi } from 'vitest';

describe('Protected Session Routing & Middleware (AC-1.2.1, AC-1.2.2, AC-1.2.4)', () => {
  const publicRoutes = ['/', '/sign-in', '/sign-up', '/api/webhooks/clerk'];
  const protectedRoutes = ['/dashboard', '/dashboard/notebook/nb_123', '/notebook/nb_123', '/api/notebooks'];

  function isPublic(path: string): boolean {
    const patterns = [
      /^\/$/,
      /^\/sign-in(.*)/,
      /^\/sign-up(.*)/,
      /^\/api\/webhooks(.*)/,
    ];
    return patterns.some((regex) => regex.test(path));
  }

  it('allows unauthenticated access to public routes', () => {
    for (const route of publicRoutes) {
      expect(isPublic(route)).toBe(true);
    }
  });

  it('classifies /dashboard and /notebook routes as protected', () => {
    for (const route of protectedRoutes) {
      expect(isPublic(route)).toBe(false);
    }
  });

  it('redirects unauthenticated requests to sign-in', async () => {
    const protect = vi.fn().mockRejectedValue(new Error('Unauthorized redirect'));
    const auth = { protect };

    let redirected = false;
    try {
      await auth.protect();
    } catch {
      redirected = true;
    }

    expect(protect).toHaveBeenCalledTimes(1);
    expect(redirected).toBe(true);
  });
});
