import { DashboardPageClient } from "@/src/components/dashboard/DashboardPageClient";

/**
 * Dashboard Page
 * Uses client-side authentication (JWT token in localStorage)
 * Server-side can't access localStorage, so we use client-side components
 */
export default function DashboardPage() {
  return <DashboardPageClient />;
}
