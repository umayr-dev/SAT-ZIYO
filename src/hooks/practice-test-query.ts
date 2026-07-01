import {
  type QueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import {
  practiceService,
  type StartTestResponse,
} from "@/src/services/practice.service";

/** Strict Mode / double mount: shu vaqt ichida React Query cache dan o‘qish */
export const PRACTICE_TEST_CURRENT_CACHE_MS = 2500;

const PRACTICE_TEST_GC_TIME_MS = 5 * 60 * 1000;

export const practiceTestKeys = {
  all: ["practice-test"] as const,
  attempt: (attemptId: string) =>
    [...practiceTestKeys.all, attemptId] as const,
  current: (attemptId: string): QueryKey =>
    [...practiceTestKeys.attempt(attemptId), "current"] as const,
};

export function getRecentPracticeTestCurrentQuestion(
  queryClient: QueryClient,
  attemptId: string,
  maxAgeMs = PRACTICE_TEST_CURRENT_CACHE_MS,
): StartTestResponse | null {
  const queryKey = practiceTestKeys.current(attemptId);
  const queryState = queryClient.getQueryState<StartTestResponse>(queryKey);
  if (!queryState?.data || !queryState.dataUpdatedAt) return null;
  if (Date.now() - queryState.dataUpdatedAt >= maxAgeMs) return null;
  return queryState.data;
}

export function setPracticeTestCurrentQuestion(
  queryClient: QueryClient,
  attemptId: string,
  state: StartTestResponse,
): void {
  queryClient.setQueryData(practiceTestKeys.current(attemptId), state);
}

export async function invalidatePracticeTestCurrentQuestion(
  queryClient: QueryClient,
  attemptId: string,
): Promise<void> {
  await queryClient.invalidateQueries({
    queryKey: practiceTestKeys.current(attemptId),
  });
}

/** Server authoritative current attempt state — deduped via React Query. */
export async function fetchPracticeTestCurrentQuestion(
  queryClient: QueryClient,
  attemptId: string,
  options?: { force?: boolean },
): Promise<StartTestResponse> {
  const queryKey = practiceTestKeys.current(attemptId);

  if (options?.force) {
    await invalidatePracticeTestCurrentQuestion(queryClient, attemptId);
  }

  return queryClient.fetchQuery({
    queryKey,
    queryFn: () => practiceService.getCurrentQuestion(attemptId),
    staleTime: 0,
    gcTime: PRACTICE_TEST_GC_TIME_MS,
    retry: 2,
  });
}

export type PracticeTestNavigateAction =
  | { type: "next" }
  | { type: "previous" }
  | { type: "goto"; index: number };

/** Next / previous / goto — server javobini React Query cache ga yozadi (Phase 4B). */
export async function executePracticeTestNavigation(
  queryClient: QueryClient,
  attemptId: string,
  action: PracticeTestNavigateAction,
): Promise<StartTestResponse> {
  let state: StartTestResponse;
  switch (action.type) {
    case "next":
      state = await practiceService.nextQuestion(attemptId);
      break;
    case "previous":
      state = await practiceService.previousQuestion(attemptId);
      break;
    case "goto":
      state = await practiceService.jumpToQuestion(attemptId, action.index);
      break;
  }
  setPracticeTestCurrentQuestion(queryClient, attemptId, state);
  return state;
}
