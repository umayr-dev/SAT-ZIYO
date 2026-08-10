"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import {
  SidebarProvider,
  useSidebar,
} from "@/src/components/dashboard/SidebarContext";
import { DashboardSidebar } from "@/src/components/dashboard/DashboardSidebar";
import { cn } from "@/lib/utils";

type DashboardShellProps = {
  children: ReactNode;
};

/**
 * Dashboard chrome (sidebar + content well).
 *
 * PERF: this deliberately has NO `isClient` gate. The previous version held an
 * `isClient` state set in a useEffect and returned `null` until it flipped —
 * and useEffect never runs on the server, so every /dashboard/** route,
 * including the entire test-taking flow, shipped SSR HTML with no content at
 * all. Nothing could paint until the JS bundle downloaded, parsed and
 * hydrated. `usePathname()` is stable across server and client in the App
 * Router, so the hydration mismatch the gate guarded against does not exist.
 */
function DashboardShellContent({ children }: DashboardShellProps) {
  const { isCollapsed } = useSidebar();
  const pathname = usePathname();

  // On practice test flow we want a distraction-free layout (no sidebar/header)
  const isPracticeTestRoute =
    typeof pathname === "string" &&
    pathname.startsWith("/dashboard/practice/test");

  return (
    <div className="min-h-screen bg-white">
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
              : "px-3 pt-3 pb-4 sm:px-4 sm:pt-4 sm:pb-6 md:px-6 md:pt-6 md:pb-8 lg:px-8",
          )}
        >
          <div className={cn("max-w-[1440px] mx-auto w-full")}>{children}</div>
        </div>
      </div>
    </div>
  );
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <SidebarProvider>
      <DashboardShellContent>{children}</DashboardShellContent>
    </SidebarProvider>
  );
}
