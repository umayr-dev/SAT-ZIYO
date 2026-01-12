"use client";

import { AuthGuard } from "@/src/components/auth/auth-guard";
import { SidebarProvider } from "@/src/components/dashboard/SidebarContext";

export default function SupportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <SidebarProvider>{children}</SidebarProvider>
    </AuthGuard>
  );
}
