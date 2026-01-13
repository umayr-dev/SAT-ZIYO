/**
 * Next.js Middleware
 * Server-side JWT token validation for route protection
 * Uses HttpOnly cookies with JWT Bearer token authentication
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { API_CONFIG } from "@/src/config/api";

const JWT_COOKIE_NAME = "token";

// Routes that require authentication
const protectedRoutes = ["/dashboard", "/admin", "/settings", "/profile"];

// Routes that should redirect to dashboard if already authenticated
const authRoutes = ["/auth/login", "/auth/register"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip API routes (they handle their own auth)
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Get JWT token from cookie
  const token = request.cookies.get(JWT_COOKIE_NAME)?.value;
  let isAuthenticated = false;

  if (token) {
    try {
      // Verify token with external API
      const response = await fetch(`${API_CONFIG.baseURL}/auth/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        // Don't follow redirects
        redirect: "manual",
      });

      if (response.ok || response.status === 200) {
        isAuthenticated = true;
      }
    } catch (error) {
      // Network error or invalid token - treat as not authenticated
      console.error("Middleware auth check error:", error);
    }
  }

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check if route is auth route
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Protect dashboard routes
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth pages
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

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
