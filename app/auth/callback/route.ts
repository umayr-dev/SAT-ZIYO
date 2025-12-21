import { createClient } from "@/src/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const errorParam = requestUrl.searchParams.get("error");
  const origin = requestUrl.origin;

  // If there's an error from OAuth provider
  if (errorParam) {
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent(errorParam)}`
    );
  }

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Error exchanging code for session:", error);
      return NextResponse.redirect(
        `${origin}/auth/login?error=${encodeURIComponent(error.message)}`
      );
    }

    // Successfully authenticated - redirect to dashboard
    if (data?.user) {
      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  // Fallback redirect to login if no code
  return NextResponse.redirect(`${origin}/auth/login`);
}
