import { redirect } from "next/navigation";
import { getServerUser } from "@/src/lib/server/otp-auth";
import { SidebarProvider } from "@/src/components/dashboard/SidebarContext";

/**
 * PERF: server component. <AuthGuard> rendered a spinner and then made a
 * client-side /api/auth/me round trip through Vercel(Stockholm) to the VPS
 * before showing anything. The server already holds the HttpOnly cookie and
 * can decide before streaming.
 */
export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getServerUser();
  if (!user) {
    redirect("/auth/login?redirect=/settings");
  }

  return <SidebarProvider>{children}</SidebarProvider>;
}
