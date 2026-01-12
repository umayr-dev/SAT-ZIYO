/**
 * Server-side OTP Authentication Utilities
 * Used in Server Components, Server Actions, and Middleware
 * Uses secure cookie-based authentication
 */

import { cookies } from "next/headers";
import type { UserProfile, User } from "@/src/types";
import { API_CONFIG } from "@/src/config/api";

/**
 * Get the current authenticated user on the server
 * Returns null if not authenticated
 * Uses HttpOnly session cookie
 */
export async function getServerUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");

    if (!sessionCookie?.value) {
      return null;
    }

    // Fetch user profile from API using the session cookie
    const response = await fetch(`${API_CONFIG.baseURL}/auth/me`, {
      method: "GET",
      headers: {
        Cookie: `session=${sessionCookie.value}`,
      },
      credentials: "include",
      cache: "no-store", // Always fetch fresh data
    });

    if (!response.ok) {
      if (response.status === 401) {
        return null;
      }
      throw new Error(`Failed to fetch user: ${response.statusText}`);
    }

    const userProfile: UserProfile = await response.json();

    return {
      id: userProfile.id,
      email: userProfile.email,
      role: userProfile.role,
    };
  } catch (error) {
    console.error("Error fetching server user:", error);
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
    const { redirect } = await import("next/navigation");
    redirect("/auth/login");
    // This line is unreachable but needed for TypeScript
    throw new Error("Unauthorized");
  }

  return user;
}

/**
 * Check if user has specific role
 */
export async function requireRole(role: string): Promise<User> {
  const user = await requireAuth();

  if (user.role !== role) {
    const { redirect } = await import("next/navigation");
    redirect("/dashboard");
  }

  return user;
}
