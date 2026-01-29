"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { adminTestService } from "@/src/services/admin-test.service";

export const adminTestsKeys = {
  all: ["admin", "tests"] as const,
  list: () => [...adminTestsKeys.all, "list"] as const,
  detail: (testId: string) =>
    [...adminTestsKeys.all, "detail", testId] as const,
};

const STALE_TIME_MS = 3 * 60 * 1000; // 3 min — smooth page-to-page, less server load

export function useAdminTests() {
  return useQuery({
    queryKey: adminTestsKeys.list(),
    queryFn: () => adminTestService.getAllTests(),
    staleTime: STALE_TIME_MS,
    gcTime: 5 * 60 * 1000,
  });
}

export function useAdminTestById(testId: string | null) {
  return useQuery({
    queryKey: adminTestsKeys.detail(testId ?? ""),
    queryFn: () => adminTestService.getTestById(testId!),
    enabled: !!testId,
    staleTime: STALE_TIME_MS,
    gcTime: 5 * 60 * 1000,
  });
}

export function useAdminTestInvalidate() {
  const queryClient = useQueryClient();
  return {
    invalidateList: () =>
      queryClient.invalidateQueries({ queryKey: adminTestsKeys.all }),
    invalidateTest: (testId: string) =>
      queryClient.invalidateQueries({
        queryKey: adminTestsKeys.detail(testId),
      }),
  };
}
