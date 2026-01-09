import { createClient } from "@/src/lib/supabase/server";
import { redirect } from "next/navigation";
import type { User } from "@/src/types";

/**
 * Server-side authentication utilities
 * Used in Server Components and Server Actions
 */

/**
 * Get the current authenticated user on the server
 * Returns null if not authenticated
 */
export async function getServerUser(): Promise<User | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email!,
      name: user.user_metadata?.name || user.email?.split("@")[0],
      createdAt: user.created_at,
    };
  } catch {
    return null;
  }
}

/**
 * Require authentication - redirects to login if not authenticated
 * Use in Server Components that require auth
 */
export async function requireAuth(): Promise<User> {
  const user = await getServerUser();

  if (!user) {
    redirect("/auth/login");
  }

  return user;
}

/**
 * Check if user is authenticated (non-blocking)
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getServerUser();
  return user !== null;
}
