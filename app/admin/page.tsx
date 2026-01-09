"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useAdminStore } from "@/src/stores/admin.store";
import { AdminLayout } from "@/src/components/admin/AdminLayout";
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

/**
 * Admin Dashboard Page - Client Component with Dynamic Imports
 *
 * Performance Benefits:
 * - Heavy components dynamically imported (reduces initial bundle)
 * - Admin panel doesn't block landing page load
 * - Client-side auth check (admin uses localStorage)
 * - Fast initial render
 * - Code splitting for admin features
 */
export default function AdminDashboardPage() {
  const router = useRouter();
  const { isAdminAuthenticated } = useAdminStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAdminAuthenticated) {
      router.push("/admin/login");
    }
  }, [mounted, isAdminAuthenticated, router]);

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h2>
          <p className="text-gray-600">Welcome to the admin panel</p>
        </div>

        {/* Stats Cards - Dynamically imported */}
        <AdminStatsCards />

        {/* Quick Actions - Dynamically imported */}
        <AdminQuickActions />
      </div>
    </AdminLayout>
  );
}
