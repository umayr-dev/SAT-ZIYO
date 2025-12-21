"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/src/hooks/use-auth";
import { useAuthStore } from "@/src/stores/auth.store";
import { Loading } from "@/src/ui/loading";
import { DashboardSidebar } from "@/src/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/src/components/dashboard/DashboardHeader";
import { DailyPracticeSection } from "@/src/components/dashboard/DailyPracticeSection";
import { ExamCountdownCard } from "@/src/components/dashboard/ExamCountdownCard";
import { TargetScoreCard } from "@/src/components/dashboard/TargetScoreCard";
import { FloatingActionButton } from "@/src/components/dashboard/FloatingActionButton";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { data: currentUser, isLoading, error } = useCurrentUser();

  // Use currentUser from query if available, otherwise use store user
  const userToDisplay = currentUser || user;

  useEffect(() => {
    // Only redirect if we're sure user is not authenticated
    // Wait for query to finish loading before redirecting
    if (!isLoading && !isAuthenticated && !userToDisplay && error) {
      router.push("/auth/login");
    }
  }, [isLoading, isAuthenticated, userToDisplay, error, router]);

  // Show loading while checking authentication
  if (isLoading && !userToDisplay) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  // Show error only if we're sure user is not authenticated
  if (!isLoading && error && !userToDisplay) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Authentication Error
          </h1>
          <p className="text-gray-600 mb-4">
            {error instanceof Error
              ? error.message
              : "Please sign in to continue"}
          </p>
          <button
            onClick={() => router.push("/auth/login")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // If no user after loading, redirect
  if (!isLoading && !userToDisplay) {
    router.push("/auth/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <DashboardSidebar />

      {/* Main Content */}
      <div className="flex-1 ml-64">
        <div className="p-8">
          <DashboardHeader />
          <DailyPracticeSection />

          {/* Bottom Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ExamCountdownCard />
            <TargetScoreCard />
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <FloatingActionButton />
    </div>
  );
}
