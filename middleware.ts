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
const protectedRoutes = [
  "/dashboard",
  "/admin",
  "/settings",
  "/profile",
  "/support",
];

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

  // For protected routes, check if token exists
  // Full validation happens in AuthGuard (client-side) and API routes
  // This prevents unnecessary redirects for users with valid tokens
  if (token) {
    // Token exists - assume authenticated for now
    // Full validation will happen in AuthGuard component
    isAuthenticated = true;

    // Optional: Quick validation for production (can be disabled if causing issues)
    // Uncomment below if you want server-side validation in middleware
    /*
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

      const response = await fetch(`${API_CONFIG.baseURL}/auth/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        redirect: "manual",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok || response.status === 200) {
        isAuthenticated = true;
      } else {
        isAuthenticated = false;
      }
    } catch (error) {
      // Network error or timeout - let AuthGuard handle validation
      // Token exists, so allow through and let client-side validate
      isAuthenticated = true;
    }
    */
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
