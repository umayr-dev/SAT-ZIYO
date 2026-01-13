/**
 * OAuth Callback Route
 * Handles OAuth callbacks from Google and other providers
 * Cookie-based authentication with JWT token
 *
 * API server redirects here after successful OAuth authentication
 * with token in query parameter
 */

import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/src/config/api";

const JWT_COOKIE_NAME = "token";
const JWT_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const token = requestUrl.searchParams.get("token");
  const errorParam = requestUrl.searchParams.get("error");
  const redirectParam = requestUrl.searchParams.get("redirect");
  const origin = requestUrl.origin;

  // If there's an error from OAuth provider
  if (errorParam) {
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent(errorParam)}`
    );
  }

  // If we have a token, store it in cookie and redirect
  if (token) {
    // Verify token by calling /auth/me
    try {
      const verifyResponse = await fetch(`${API_CONFIG.baseURL}/auth/me`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!verifyResponse.ok) {
        // Invalid token, redirect to login with error
        return NextResponse.redirect(
          `${origin}/auth/login?error=${encodeURIComponent("Invalid authentication token")}`
        );
      }

      // Token is valid, store in cookie
      const redirectUrl = redirectParam
        ? decodeURIComponent(redirectParam)
        : "/dashboard";

      const response = NextResponse.redirect(`${origin}${redirectUrl}`);

      // Store JWT token in HttpOnly, Secure, SameSite=Lax cookie
      response.cookies.set(JWT_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: JWT_MAX_AGE,
        path: "/",
      });

      return response;
    } catch (error) {
      console.error("OAuth callback error:", error);
      return NextResponse.redirect(
        `${origin}/auth/login?error=${encodeURIComponent("Authentication failed")}`
      );
    }
  }

  // Fallback redirect to login if no token
  return NextResponse.redirect(`${origin}/auth/login`);
}
