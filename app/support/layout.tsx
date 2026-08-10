import { redirect } from "next/navigation";
import { getServerUser } from "@/src/lib/server/otp-auth";
import { SidebarProvider } from "@/src/components/dashboard/SidebarContext";

/**
 * PERF: server component — see app/settings/layout.tsx for the rationale.
 */
export default async function SupportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getServerUser();
  if (!user) {
    redirect("/auth/login?redirect=/support");
  }

  return <SidebarProvider>{children}</SidebarProvider>;
}
