"use client";

import {
  useCallback,
  useEffect,
  useRef,
  startTransition,
  type RefObject,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import {
  StartTestResponse,
  Question,
} from "@/src/services/practice.service";
import {
  executePracticeTestNavigation,
  setPracticeTestCurrentQuestion,
} from "@/src/hooks/practice-test-query";

const QUESTIONS_PER_MODULE = { ENGLISH: 27, MATH: 22 } as const;

export interface UseTestNavigationOptions {
  attemptId: string;
  router: Pick<AppRouterInstance, "push">;
  testStateRef: RefObject<StartTestResponse | null>;
  testState: StartTestResponse | null;
  setTestState: Dispatch<SetStateAction<StartTestResponse | null>>;
  totalQuestions: number | null;
  questionsCacheRef: RefObject<Map<number, Question>>;
  remainingTimeSecondsRef: RefObject<number | null>;
  setError: Dispatch<SetStateAction<string>>;
  setIsQuestionLoading: Dispatch<SetStateAction<boolean>>;
  handleAnswer: () => void;
  applySavedAnswerForIndex: (index: number) => void;
  syncCurrentAnswerToServer: () => Promise<void>;
  syncCurrentModuleAnswers: () => Promise<unknown>;
  saveQuestionToLocal: (
    index: number,
    question: Question,
    storageKeyOverride?: string,
  ) => void;
}

export function useTestNavigation({
  attemptId,
  router,
  testStateRef,
  testState,
  setTestState,
  totalQuestions,
  questionsCacheRef,
  remainingTimeSecondsRef,
  setError,
  setIsQuestionLoading,
  handleAnswer,
  applySavedAnswerForIndex,
  syncCurrentAnswerToServer,
  syncCurrentModuleAnswers,
  saveQuestionToLocal,
}: UseTestNavigationOptions) {
  const queryClient = useQueryClient();
  const gotoMutexRef = useRef<Promise<unknown>>(Promise.resolve());
  const navigationInFlightRef = useRef(false);
  const latestRequestedJumpRef = useRef<number | null>(null);
  const preloadTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (preloadTimeoutRef.current !== null) {
        window.clearTimeout(preloadTimeoutRef.current);
      }
    };
  }, []);

  const nextQuestionMutation = useMutation({
    mutationFn: () =>
      executePracticeTestNavigation(queryClient, attemptId, { type: "next" }),
    retry: 1,
  });

  const previousQuestionMutation = useMutation({
    mutationFn: () =>
      executePracticeTestNavigation(queryClient, attemptId, {
        type: "previous",
      }),
    retry: 1,
  });

  const jumpQuestionMutation = useMutation({
    mutationFn: (index: number) => {
      const prev = gotoMutexRef.current;
      const p = prev
        .catch(() => {})
        .then(() =>
          executePracticeTestNavigation(queryClient, attemptId, {
            type: "goto",
            index,
          }),
        );
      gotoMutexRef.current = p.catch(() => {});
      return p as Promise<StartTestResponse>;
    },
    retry: 1,
  });

  const readQuestionFromLocalCache = useCallback(
    (index: number): Question | null => {
      const fromRef = questionsCacheRef.current?.get(index);
      if (fromRef) return fromRef;

      const ts = testStateRef.current;
      if (!ts?.currentSection || !ts?.currentModule) return null;
      if (typeof window === "undefined") return null;

      try {
        const key = `test_questions_${attemptId}_s${ts.currentSection.orderIndex}_m${ts.currentModule.moduleNumber}`;
        const raw = sessionStorage.getItem(key);
        if (!raw) return null;
        const data = JSON.parse(raw) as Record<string, Question>;
        const q = data[String(index)];
        if (q) {
          questionsCacheRef.current?.set(index, q);
          return q;
        }
      } catch (e) {
        console.warn("readQuestionFromLocalCache:", e);
      }
      return null;
    },
    [attemptId, questionsCacheRef, testStateRef],
  );

  const applyOptimisticQuestionView = useCallback(
    (index: number, question: Question) => {
      const ts = testStateRef.current;
      if (!ts?.currentSection || !ts?.currentModule) return;
      startTransition(() => {
        setTestState({
          ...ts,
          currentQuestionIndex: index,
          question,
        });
        applySavedAnswerForIndex(index);
      });
    },
    [applySavedAnswerForIndex, setTestState, testStateRef],
  );

  const runGoto = useCallback(
    (localIndex: number): Promise<StartTestResponse> =>
      jumpQuestionMutation.mutateAsync(localIndex),
    [jumpQuestionMutation],
  );

  const clearPreloadTimeout = useCallback(() => {
    if (preloadTimeoutRef.current !== null) {
      window.clearTimeout(preloadTimeoutRef.current);
      preloadTimeoutRef.current = null;
    }
  }, []);

  const getQuestionCap = useCallback(() => {
    const ts = testStateRef.current;
    return (
      totalQuestions ??
      QUESTIONS_PER_MODULE[ts?.currentSection?.type ?? "ENGLISH"] ??
      27
    );
  }, [totalQuestions, testStateRef]);

  /** Nav kutmasin — javob localStorage da, server sync fonda. */
  const syncAnswerInBackground = useCallback(
    (context: "next" | "previous" | "jump" | "module-review") => {
      void syncCurrentAnswerToServer().catch((err) => {
        console.warn(`[Test Page] Background answer sync on ${context}:`, err);
      });
    },
    [syncCurrentAnswerToServer],
  );

  const commitNavState = useCallback(
    (
      serverState: StartTestResponse,
      targetIndex: number,
      usedOptimisticCache: boolean,
    ) => {
      const prev = testStateRef.current;
      let finalState = serverState;

      if (
        usedOptimisticCache &&
        prev &&
        prev.currentQuestionIndex === targetIndex &&
        serverState.currentQuestionIndex === targetIndex &&
        prev.question?.id === serverState.question?.id
      ) {
        finalState = { ...serverState, question: prev.question };
      }

      if (finalState.question) {
        saveQuestionToLocal(
          finalState.currentQuestionIndex,
          finalState.question,
        );
      }
      applySavedAnswerForIndex(finalState.currentQuestionIndex);
      setTestState(finalState);
      setPracticeTestCurrentQuestion(queryClient, attemptId, finalState);
    },
    [
      applySavedAnswerForIndex,
      attemptId,
      queryClient,
      saveQuestionToLocal,
      setTestState,
      testStateRef,
    ],
  );

  const handleGoToModuleReview = useCallback(() => {
    const ts = testStateRef.current;
    if (!ts?.currentModule || totalQuestions === null) return;
    handleAnswer();
    if (
      typeof window !== "undefined" &&
      remainingTimeSecondsRef.current != null
    ) {
      const key = `test_timer_${attemptId}_s${ts.currentSection.orderIndex}_m${ts.currentModule.moduleNumber}`;
      sessionStorage.setItem(key, String(remainingTimeSecondsRef.current));
    }
    const sectionNum = ts.currentSection.orderIndex + 1;
    const moduleNum = ts.currentModule.moduleNumber;
    const type = ts.currentSection.type;
    router.push(
      `/dashboard/practice/test/${attemptId}/module-review?section=${sectionNum}&module=${moduleNum}&type=${type}&total=${totalQuestions}`,
    );
    void syncCurrentAnswerToServer()
      .catch((err) => {
        console.warn(
          "[Test Page] Background answer sync on module-review:",
          err,
        );
      })
      .finally(() => {
        void syncCurrentModuleAnswers().catch((err) => {
          console.warn(
            "[Test Page] Background module answer sync on module-review:",
            err,
          );
        });
      });
  }, [
    attemptId,
    handleAnswer,
    remainingTimeSecondsRef,
    router,
    syncCurrentAnswerToServer,
    syncCurrentModuleAnswers,
    testStateRef,
    totalQuestions,
  ]);

  const handleNext = useCallback(async () => {
    const ts = testStateRef.current;
    if (!ts?.question) return;
    if (navigationInFlightRef.current) return;

    const currentIndex = ts.currentQuestionIndex;
    const nextIndex = currentIndex + 1;
    const cap = getQuestionCap();
    if (nextIndex >= cap) {
      handleGoToModuleReview();
      return;
    }

    try {
      clearPreloadTimeout();
      navigationInFlightRef.current = true;

      handleAnswer();
      syncAnswerInBackground("next");

      const cachedQuestion = readQuestionFromLocalCache(nextIndex);
      const usedOptimisticCache = !!cachedQuestion;
      if (cachedQuestion) {
        applyOptimisticQuestionView(nextIndex, cachedQuestion);
      } else {
        setIsQuestionLoading(true);
      }

      const nextState = await nextQuestionMutation.mutateAsync();
      commitNavState(nextState, nextIndex, usedOptimisticCache);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to go to next question",
      );
    } finally {
      setIsQuestionLoading(false);
      navigationInFlightRef.current = false;
    }
  }, [
    applyOptimisticQuestionView,
    clearPreloadTimeout,
    commitNavState,
    getQuestionCap,
    handleAnswer,
    handleGoToModuleReview,
    nextQuestionMutation,
    readQuestionFromLocalCache,
    setError,
    setIsQuestionLoading,
    syncAnswerInBackground,
    testStateRef,
  ]);

  const handlePrevious = useCallback(async () => {
    const ts = testStateRef.current;
    if (!ts?.question) return;
    if (navigationInFlightRef.current) return;

    const prevIndex = ts.currentQuestionIndex - 1;
    if (prevIndex < 0) return;

    try {
      clearPreloadTimeout();
      navigationInFlightRef.current = true;

      handleAnswer();
      syncAnswerInBackground("previous");

      const cachedQuestion = readQuestionFromLocalCache(prevIndex);
      const usedOptimisticCache = !!cachedQuestion;
      if (cachedQuestion) {
        applyOptimisticQuestionView(prevIndex, cachedQuestion);
      } else {
        setIsQuestionLoading(true);
      }

      const prevState = await previousQuestionMutation.mutateAsync();
      commitNavState(prevState, prevIndex, usedOptimisticCache);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to go to previous question",
      );
    } finally {
      setIsQuestionLoading(false);
      navigationInFlightRef.current = false;
    }
  }, [
    applyOptimisticQuestionView,
    clearPreloadTimeout,
    commitNavState,
    handleAnswer,
    previousQuestionMutation,
    readQuestionFromLocalCache,
    setError,
    setIsQuestionLoading,
    syncAnswerInBackground,
    testStateRef,
  ]);

  const handleJumpToQuestion = useCallback(
    async (index: number) => {
      const ts = testStateRef.current;
      if (!ts?.question) return;
      if (navigationInFlightRef.current) return;

      const cap = getQuestionCap();
      if (index < 0 || index >= cap) return;

      latestRequestedJumpRef.current = index;
      try {
        clearPreloadTimeout();
        navigationInFlightRef.current = true;

        handleAnswer();
        syncAnswerInBackground("jump");

        const cachedQuestion = readQuestionFromLocalCache(index);
        const usedOptimisticCache = !!cachedQuestion;
        if (cachedQuestion) {
          applyOptimisticQuestionView(index, cachedQuestion);
        } else {
          setIsQuestionLoading(true);
        }

        const state = await jumpQuestionMutation.mutateAsync(index);

        if (state.currentQuestionIndex !== index) {
          setError("Savol indexi mos kelmadi. Qayta urinib ko'ring.");
          return;
        }
        if (latestRequestedJumpRef.current !== index) return;
        commitNavState(state, index, usedOptimisticCache);
      } catch (err) {
        if (latestRequestedJumpRef.current === index) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to go to selected question",
          );
        }
      } finally {
        if (latestRequestedJumpRef.current === index) {
          latestRequestedJumpRef.current = null;
        }
        setIsQuestionLoading(false);
        navigationInFlightRef.current = false;
      }
    },
    [
      applyOptimisticQuestionView,
      clearPreloadTimeout,
      commitNavState,
      getQuestionCap,
      handleAnswer,
      jumpQuestionMutation,
      readQuestionFromLocalCache,
      setError,
      setIsQuestionLoading,
      syncAnswerInBackground,
      testStateRef,
    ],
  );

  useEffect(() => {
    if (!testState?.question) return;
    if (typeof window === "undefined") return;
    const key = `test_jump_${attemptId}`;
    const stored = sessionStorage.getItem(key);
    if (!stored) return;
    const index = parseInt(stored, 10);
    if (!Number.isFinite(index) || index < 0) {
      sessionStorage.removeItem(key);
      return;
    }
    sessionStorage.removeItem(key);
    if (index === testState.currentQuestionIndex) return;
    handleJumpToQuestion(index).catch((err) =>
      console.error("[Test Page] Failed to jump from module review:", err),
    );
  }, [attemptId, handleJumpToQuestion, testState]);

  return {
    handleNext,
    handlePrevious,
    handleJumpToQuestion,
    handleGoToModuleReview,
    readQuestionFromLocalCache,
    applyOptimisticQuestionView,
    runGoto,
  };
}
