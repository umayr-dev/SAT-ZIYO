/**
 * OAuth Callback Route
 * Handles OAuth callbacks from Google and other providers
 * Cookie-based authentication
 *
 * API server redirects here after successful OAuth authentication
 * with session cookie already set
 */

import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const errorParam = requestUrl.searchParams.get("error");
  const redirectParam = requestUrl.searchParams.get("redirect"); // Redirect URL from API
  const origin = requestUrl.origin;

  // If there's an error from OAuth provider
  if (errorParam) {
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent(errorParam)}`
    );
  }

  // If we have a code, the API server should have set the session cookie
  // The API server redirects here after successful OAuth
  if (code) {
    // API server should have already processed the OAuth code
    // and set the session cookie. We just redirect to dashboard
    // or the redirect URL from API parameter
    const redirectUrl = redirectParam
      ? decodeURIComponent(redirectParam)
      : "/dashboard";
    return NextResponse.redirect(`${origin}${redirectUrl}`);
  }

  // Fallback redirect to login if no code
  return NextResponse.redirect(`${origin}/auth/login`);
}
