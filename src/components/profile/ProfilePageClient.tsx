"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardSidebar } from "@/src/components/dashboard/DashboardSidebar";
import { useSidebar } from "@/src/components/dashboard/SidebarContext";
import { ProfileForm } from "@/src/components/profile/ProfileForm";
import { authService } from "@/src/services/auth.service";
import { useLogout } from "@/src/hooks/use-auth";
import type { UserProfile } from "@/src/types";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/ui/card";
import { Button } from "@/src/ui/button";
import { LogOut } from "lucide-react";

export function ProfilePageClient() {
  const router = useRouter();
  const { isCollapsed } = useSidebar();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const logoutMutation = useLogout();

  const handleLogout = async () => {
    try {
      logoutMutation.mutateAsync().catch(() => {});
      window.location.href = "/";
    } catch {
      window.location.href = "/";
    }
  };

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

          {/* Sign Out Card */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <LogOut className="h-4 w-4" />
                Sign Out
              </CardTitle>
              <CardDescription>
                Sign out of your account on this device.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <LogOut className="h-4 w-4 mr-2" />
                {logoutMutation.isPending ? "Signing out..." : "Sign Out"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
