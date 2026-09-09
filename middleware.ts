import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/notebook(.*)',
]);

const isAuthPage = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
]);

export default clerkMiddleware(async (auth, request) => {
  // Redirect already-authenticated users away from sign-in/sign-up pages.
  if (isAuthPage(request)) {
    try {
      const session = await auth();
      if (session?.userId) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } catch {
      // Auth unavailable at build time or missing env — let the page render
    }
  }

  if (isProtectedRoute(request)) {
    try {
      await auth().protect();
    } catch (err) {
      if (err instanceof Error && err.message.includes('clerk:')) {
        throw err;
      }
      console.error('[middleware] clerk auth protect failed:', err);
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, but always run for API routes
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
