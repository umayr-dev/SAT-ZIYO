"use client";

import { useQuery } from "@tanstack/react-query";

export interface HourDistribution {
  hour: number;
  count: number;
}

export interface DayDistribution {
  date: string;
  count: number;
}

export interface AdminStats {
  usersCount: number;
  testsCount: number;
  hourDistribution: HourDistribution[];
  dayDistribution?: DayDistribution[];
  totalAttempts?: number;
}

async function fetchAdminStats(): Promise<AdminStats> {
  const response = await fetch("/api/admin/stats", {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Failed to load admin stats (${response.status})`);
  }

  return response.json();
}

/**
 * Shared hook for admin dashboard statistics.
 *
 * Uses React Query to:
 * - Cache data between components and navigations
 * - Avoid duplicate parallel requests to /api/admin/stats
 * - Reduce server load when multiple admin widgets are mounted
 */
export function useAdminStats() {
  return useQuery<AdminStats>({
    queryKey: ["admin-stats"],
    queryFn: fetchAdminStats,
    staleTime: 60_000, // 1 minute: reuse data without refetching
    refetchOnWindowFocus: false,
  });
}
