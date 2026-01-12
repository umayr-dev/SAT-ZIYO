"use client";

import { useEffect, useState } from "react";
import { DashboardSidebar } from "@/src/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/src/components/dashboard/DashboardHeader";
import { DailyPracticeCard } from "@/src/components/dashboard/DailyPracticeCard";
import { ProgressOverview } from "@/src/components/dashboard/ProgressOverview";
import {
  SidebarProvider,
  useSidebar,
} from "@/src/components/dashboard/SidebarContext";
import { authService } from "@/src/services/auth.service";
import type { UserProfile } from "@/src/types";
import { cn } from "@/lib/utils";

function DashboardContent() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isCollapsed } = useSidebar();

  useEffect(() => {
    async function fetchUser() {
      try {
        const userProfile = await authService.getCurrentUser();
        setUser({
          id: userProfile.id,
          email: userProfile.email,
          role: userProfile.role,
          name: userProfile.name,
        });
      } catch (error) {
        console.error("Failed to fetch user:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUser();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // AuthGuard will handle redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 ">
      {/* Sidebar */}
      <DashboardSidebar />

      {/* Main Content */}
      <div
        className={cn(
          "flex-1 transition-all duration-300",
          isCollapsed ? "ml-20" : "ml-64"
        )}
      >
        <div className="w-full pl-2 pr-6 pt-0 pb-6">
          {/* Header */}
          <DashboardHeader user={user} />

          {/* Daily Practice Card */}
          <DailyPracticeCard />

          {/* Progress Overview */}
          <ProgressOverview />
        </div>
      </div>
    </div>
  );
}

export function DashboardPageClient() {
  return <DashboardContent />;
}
