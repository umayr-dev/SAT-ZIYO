import { ReactNode } from "react";
import { notFound, redirect } from "next/navigation";
import { getServerUser } from "@/src/lib/server/otp-auth";
import { AdminLayout } from "@/src/components/admin/AdminLayout";

interface AdminRootLayoutProps {
  children: ReactNode;
}

/**
 * Admin root layout
 * - Uses global auth (email/password + Google + OTP)
 * - Allows access ONLY for users with role === "ADMIN"
 * - If not authenticated -> redirect to /auth/login?redirect=/admin
 * - If authenticated but not ADMIN -> 404 page
 */
export default async function AdminRootLayout({
  children,
}: AdminRootLayoutProps) {
  const user = await getServerUser();

  // Not logged in -> go to normal login page, but redirect back to /admin after auth
  if (!user) {
    redirect("/auth/login?redirect=/admin");
  }

  // Logged in but not ADMIN or OWNER -> 404
  // OWNER has higher privileges than ADMIN, so both can access admin panel
  if (user.role !== "ADMIN" && user.role !== "OWNER") {
    notFound();
  }

  // Logged in and ADMIN -> render admin shell + content
  return <AdminLayout>{children}</AdminLayout>;
}


