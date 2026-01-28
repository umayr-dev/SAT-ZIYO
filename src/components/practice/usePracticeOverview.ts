"use client";

import { useQuery } from "@tanstack/react-query";
import {
  practiceService,
  type Test,
  type Attempt,
} from "@/src/services/practice.service";

interface PracticeOverview {
  tests: Test[];
  attempts: Attempt[];
}

async function fetchPracticeOverview(): Promise<PracticeOverview> {
  // Fetch tests and attempts together so we only hit the server once
  const [testsData, attemptsData] = await Promise.all([
    practiceService.getAvailableTests(),
    practiceService.getMyAttempts(),
  ]);

  // Filter only active tests (backend should already filter, but double-check)
  const activeTests = (testsData || []).filter(
    (test) => test.isActive !== false,
  );

  return {
    tests: activeTests,
    attempts: attemptsData || [],
  };
}

/**
 * Shared hook for the practice dashboard.
 *
 * Uses React Query so that:
 * - /api/practice/tests and /api/practice/my-attempts are fetched together
 * - Result is cached across navigations and components
 * - Duplicate requests are automatically deduplicated
 */
export function usePracticeOverview() {
  return useQuery<PracticeOverview>({
    queryKey: ["practice-overview"],
    queryFn: fetchPracticeOverview,
    staleTime: 60_000, // 1 minute cache
    refetchOnWindowFocus: false,
  });
}
