"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AuthGuard } from "@/src/components/auth/auth-guard";
import {
  SidebarProvider,
  useSidebar,
} from "@/src/components/dashboard/SidebarContext";
import { DashboardSidebar } from "@/src/components/dashboard/DashboardSidebar";
import { cn } from "@/lib/utils";

type DashboardLayoutProps = {
  children: ReactNode;
};

/**
 * Dashboard Layout Content Wrapper
 * Renders sidebar and main content area; hides sidebar on focused routes.
 */
function DashboardLayoutContent({ children }: DashboardLayoutProps) {
  const { isCollapsed } = useSidebar();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // On practice test flow we want a distraction-free layout (no sidebar/header)
  const isPracticeTestRoute =
    typeof pathname === "string" &&
    pathname.startsWith("/dashboard/practice/test");

  if (!isClient) {
    // Avoid mismatch between server/client for usePathname
    return null;
  }

  return (
    <div className="min-h-screen bg-brand-orange-50">
      {/* Sidebar only for non-test routes */}
      {!isPracticeTestRoute && <DashboardSidebar />}

      {/* Main Content - adjusts based on sidebar state */}
      <div
        className={cn(
          "transition-all duration-300 min-h-screen",
          isPracticeTestRoute ? "ml-0" : isCollapsed ? "ml-20" : "ml-72",
        )}
      >
        <div
          className={cn(
            "w-full",
            isPracticeTestRoute
              ? "px-0 pt-0 pb-0"
              : "pl-4 pr-8 pt-6 pb-8 lg:pl-6 lg:pr-10",
          )}
        >
          <div className={cn("max-w-[1440px] mx-auto w-full")}>{children}</div>
        </div>
      </div>
    </div>
  );
}

/**
 * Dashboard Layout
 * Wraps dashboard pages with auth + sidebar provider.
 */
export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <AuthGuard>
      <SidebarProvider>
        <DashboardLayoutContent>{children}</DashboardLayoutContent>
      </SidebarProvider>
    </AuthGuard>
  );
}
