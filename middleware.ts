/**
 * Next.js Middleware
 * Basic route protection - detailed auth checks happen in Server Components
 * JWT tokens are stored in localStorage (client-side only)
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require authentication (protected at Server Component level)
const protectedRoutes = ["/dashboard", "/admin"];

// Routes that should redirect to dashboard if already authenticated
const authRoutes = ["/auth/login", "/auth/register"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check if route is auth route
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // For protected routes, allow request to proceed
  // Server Components (dashboard/layout.tsx) will handle auth checks
  // JWT token is in localStorage (client-side), so middleware can't check it
  if (isProtectedRoute) {
    return NextResponse.next();
  }

  // For auth routes, allow request to proceed
  // Client-side will handle redirects based on token presence
  if (isAuthRoute) {
    return NextResponse.next();
  }

  // Allow request to proceed
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
