import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables. Please check your .env.local file."
    );
  }

  if (supabaseUrl.includes("<your_") || supabaseAnonKey.includes("<your_")) {
    throw new Error(
      "Supabase credentials are not configured. Please update your .env.local file with your actual Supabase URL and anon key."
    );
  }

  // Check if service role key is being used (should not be used in browser)
  if (
    supabaseAnonKey.startsWith("sb_secret_") ||
    supabaseAnonKey.includes("service_role")
  ) {
    throw new Error(
      "❌ ERROR: You are using a SERVICE ROLE KEY in the browser!\n\n" +
        "The key you're using starts with 'sb_secret_' which is a service role key.\n" +
        "Service role keys should NEVER be used in the browser.\n\n" +
        "✅ SOLUTION:\n" +
        "1. Go to Supabase Dashboard > Project Settings > API\n" +
        "2. Find the 'anon public' key (it starts with 'eyJ...')\n" +
        "3. Replace NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local with the anon/public key\n" +
        "4. Restart your development server\n\n" +
        "The anon key is safe to use in the browser, while service_role key is only for server-side operations."
    );
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
