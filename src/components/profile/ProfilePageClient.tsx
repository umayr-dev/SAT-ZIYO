"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardSidebar } from "@/src/components/dashboard/DashboardSidebar";
import { useSidebar } from "@/src/components/dashboard/SidebarContext";
import { ProfileForm } from "@/src/components/profile/ProfileForm";
import { authService } from "@/src/services/auth.service";
import type { UserProfile } from "@/src/types";
import { cn } from "@/lib/utils";

export function ProfilePageClient() {
  const router = useRouter();
  const { isCollapsed } = useSidebar();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const userProfile = await authService.getCurrentUser();
        setUser(userProfile);
      } catch (error) {
        console.error("Failed to fetch user:", error);
        // If error, redirect to login
        router.push("/auth/login");
      } finally {
        setIsLoading(false);
      }
    }

    fetchUser();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50 ">
      {/* Sidebar - Client Component for navigation */}
      <DashboardSidebar />

      {/* Main Content */}
      <div
        className={cn(
          "flex-1 transition-all duration-300",
          isCollapsed ? "ml-20" : "ml-64"
        )}
      >
        <div className="pl-2 pr-6 py-6 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
            <p className="text-gray-600 mt-1">
              Manage your account information and preferences
            </p>
          </div>

          {/* Profile Form */}
          <ProfileForm user={user} onUserUpdate={setUser} />
        </div>
      </div>
    </div>
  );
}
