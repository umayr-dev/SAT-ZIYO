import { getServerUser } from "@/src/lib/server/auth";
import { redirect } from "next/navigation";
import { DashboardSidebar } from "@/src/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/src/components/dashboard/DashboardHeader";
import { DailyPracticeSection } from "@/src/components/dashboard/DailyPracticeSection";
import { ExamCountdownCard } from "@/src/components/dashboard/ExamCountdownCard";
import { TargetScoreCard } from "@/src/components/dashboard/TargetScoreCard";
import { FloatingActionButton } from "@/src/components/dashboard/FloatingActionButton";

/**
 * Dashboard Page - Server Component
 *
 * Performance Benefits:
 * - Server-side authentication (no client-side auth check)
 * - No hydration cost for auth state
 * - User data fetched on server
 * - SEO-friendly (server-rendered)
 */
export default async function DashboardPage() {
  // Server-side auth check
  const user = await getServerUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - Client Component for navigation */}
      <DashboardSidebar />

      {/* Main Content */}
      <div className="flex-1 ml-64">
        <div className="p-8">
          {/* Header - Receives user from server */}
          <DashboardHeader user={user} />

          {/* Daily Practice - Client Component for interactions */}
          <DailyPracticeSection />

          {/* Bottom Cards - Client Components for interactions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ExamCountdownCard />
            <TargetScoreCard />
          </div>
        </div>
      </div>

      {/* Floating Action Button - Client Component */}
      <FloatingActionButton />
    </div>
  );
}
