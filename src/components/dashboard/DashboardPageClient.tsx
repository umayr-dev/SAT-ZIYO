"use client";

import { useEffect, useState } from "react";
import { DashboardHeader } from "@/src/components/dashboard/DashboardHeader";
import { ProgressOverview } from "@/src/components/dashboard/ProgressOverview";
import { authService } from "@/src/services/auth.service";
import type { UserProfile } from "@/src/types";

function DashboardContent() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // AuthGuard will handle redirect
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <DashboardHeader user={user} />

      <div>
        <ProgressOverview />
      </div>
    </div>
  );
}

export function DashboardPageClient() {
  return <DashboardContent />;
}
