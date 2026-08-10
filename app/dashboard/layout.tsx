import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerUser } from "@/src/lib/server/otp-auth";
import { DashboardShell } from "@/src/components/dashboard/DashboardShell";

type DashboardLayoutProps = {
  children: ReactNode;
};

/**
 * Dashboard Layout — SERVER component.
 *
 * PERF: auth is resolved on the server before a byte is streamed, using the
 * same getServerUser() pattern app/admin/layout.tsx already uses. Previously
 * this was a client component wrapped in <AuthGuard>, which meant every
 * dashboard load paid an extra browser -> Vercel(Stockholm) -> VPS round trip
 * to /api/auth/me *after* hydration, while showing a spinner — on top of the
 * layout rendering null until hydration. Both are gone: the shell and the page
 * content now arrive in the SSR HTML.
 */
export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const user = await getServerUser();

  if (!user) {
    redirect("/auth/login?redirect=/dashboard");
  }

  return <DashboardShell>{children}</DashboardShell>;
}
