"use client";

import dynamic from "next/dynamic";
import { Loading } from "@/src/ui/loading";

// Dynamic imports for heavy admin components
// These are loaded only when needed, reducing initial bundle size
const AdminStatsCards = dynamic(
  () => import("@/src/components/admin/AdminStatsCards"),
  {
    loading: () => (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-lg" />
        ))}
      </div>
    ),
    ssr: false, // Admin panel doesn't need SSR
  }
);

const AdminQuickActions = dynamic(
  () => import("@/src/components/admin/AdminQuickActions"),
  {
    loading: () => (
      <div className="h-48 bg-gray-100 animate-pulse rounded-lg" />
    ),
    ssr: false,
  }
);

const TestAttemptHoursChart = dynamic(
  () => import("@/src/components/admin/TestAttemptHoursChart"),
  {
    loading: () => (
      <div className="h-80 bg-gray-100 animate-pulse rounded-lg" />
    ),
    ssr: false,
  }
);

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h2>
        <p className="text-gray-600">Welcome to the admin panel</p>
      </div>

      {/* Stats Cards - Dynamically imported */}
      <AdminStatsCards />

      {/* Test Attempt Hours Chart - Dynamically imported */}
      <TestAttemptHoursChart />

      {/* Quick Actions - Dynamically imported */}
      <AdminQuickActions />
    </div>
  );
}


