import { requireAuth } from "@/src/lib/server/auth";
import { redirect } from "next/navigation";

/**
 * Dashboard Layout - Server Component
 * Handles authentication on the server before rendering
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    // Server-side auth check - redirects if not authenticated
    const user = await requireAuth();

    return <>{children}</>;
  } catch (error) {
    // If auth fails, redirect to login
    redirect("/auth/login");
  }
}
