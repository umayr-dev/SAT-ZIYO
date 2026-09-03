/**
 * Next.js Middleware
 * Server-side JWT token validation for route protection
 * Uses HttpOnly cookies with JWT Bearer token authentication
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const JWT_COOKIE_NAME = "token";

// Routes that require authentication
const protectedRoutes = [
  "/dashboard",
  "/admin",
  "/settings",
  "/profile",
  "/support",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip API routes (they handle their own auth)
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Get JWT token from cookie
  const token = request.cookies.get(JWT_COOKIE_NAME)?.value;

  // Presence only. Validating the JWT here would mean a backend round trip on
  // every navigation; the server layouts do the real check via getServerUser().
  const isAuthenticated = Boolean(token);

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Protect dashboard routes
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // NOTE: we deliberately do NOT bounce "authenticated" users off /auth/login.
  //
  // `isAuthenticated` here means "a token cookie exists", not "the token is
  // valid" — middleware cannot call the backend on every navigation. The server
  // layouts (dashboard/settings/support/admin) DO validate, via getServerUser().
  // When a cookie is present but the token is expired/revoked the two disagree,
  // and bouncing here closed the circle:
  //
  //   /dashboard -> layout: getServerUser() null -> /auth/login?redirect=/dashboard
  //             -> middleware: cookie present    -> /dashboard -> ...forever
  //
  // The browser spun on that pair until the tab was killed, and every lap fired
  // another /auth/me at the backend. The login page already does the *validated*
  // version of this check on mount (getCurrentUser(), including the admin-role
  // branch) and redirects itself, so nothing is lost by letting it render.

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
