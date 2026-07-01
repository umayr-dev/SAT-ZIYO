"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type RefObject,
  type MutableRefObject,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import {
  practiceService,
  StartTestResponse,
  Question,
} from "@/src/services/practice.service";
import { ApiClientError } from "@/src/lib/api-client";
import { submitAnswersInBatches } from "@/src/utils/submit-answers-batch";
import { getAllPracticeAnswersForSubmit } from "@/src/utils/practice-answers-storage";
import { saveAttemptMeta } from "@/src/utils/practice-paused-sessions";
import {
  isBreakStep,
  isContinueTestStep,
  isFinishTestStep,
  nextStepFromFinishModule,
} from "@/src/utils/practice-module-flow";
import type { CurrentAnswer } from "@/src/hooks/use-answer-persistence";
import {
  fetchPracticeTestCurrentQuestion,
  getRecentPracticeTestCurrentQuestion,
  invalidatePracticeTestCurrentQuestion,
  setPracticeTestCurrentQuestion,
} from "@/src/hooks/practice-test-query";

export const MODULE_TRANSITION_RETRY_KEY = "test_module_transition_retries";

const ANSWERS_CACHE_DURATION = 15000;

export interface UseTestSessionOptions {
  attemptId: string;
  router: Pick<AppRouterInstance, "push">;
  testStateRef: RefObject<StartTestResponse | null>;
  setTestState: Dispatch<SetStateAction<StartTestResponse | null>>;
  setLoading: Dispatch<SetStateAction<boolean>>;
  setIsQuestionLoading: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<string>>;
  setSubmitting: Dispatch<SetStateAction<boolean>>;
  setTotalQuestions: Dispatch<SetStateAction<number | null>>;
  timeUpHandledRef: MutableRefObject<boolean>;
  startModuleTimer: (seconds: number | null | undefined) => void;
  saveQuestionToLocal: (
    index: number,
    question: Question,
    storageKeyOverride?: string,
  ) => void;
  getStorageKey: () => string;
  setEliminatedChoices: Dispatch<SetStateAction<Set<string>>>;
  setCurrentAnswer: Dispatch<SetStateAction<CurrentAnswer>>;
  currentAnswerRef: MutableRefObject<CurrentAnswer>;
  setAnsweredQuestions: Dispatch<SetStateAction<Set<number>>>;
  setFlaggedQuestions: Dispatch<SetStateAction<Set<number>>>;
  flaggedQuestionsRef: MutableRefObject<Set<number>>;
  handleAnswer: () => void;
  syncCurrentAnswerToServer: () => Promise<void>;
  submitAllPendingAnswers: (options?: {
    clearStorage?: boolean;
  }) => Promise<unknown>;
  submitAllHighlights: () => Promise<void>;
}

export function useTestSession({
  attemptId,
  router,
  testStateRef,
  setTestState,
  setLoading,
  setIsQuestionLoading,
  setError,
  setSubmitting,
  setTotalQuestions,
  timeUpHandledRef,
  startModuleTimer,
  saveQuestionToLocal,
  getStorageKey,
  setEliminatedChoices,
  setCurrentAnswer,
  currentAnswerRef,
  setAnsweredQuestions,
  setFlaggedQuestions,
  flaggedQuestionsRef,
  handleAnswer,
  syncCurrentAnswerToServer,
  submitAllPendingAnswers,
  submitAllHighlights,
}: UseTestSessionOptions) {
  const queryClient = useQueryClient();
  const loadTestStateInFlightRef = useRef(false);
  const loadAnswersTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastAnswersLoadRef = useRef<number>(0);
  const loadTestStateRef = useRef<(() => Promise<void>) | null>(null);

  const restoreAnswerSetsFromStorage = useCallback(
    (statePrefix: string) => {
      try {
        const key = getStorageKey();
        const stored = localStorage.getItem(key);
        if (stored) {
          const answers = JSON.parse(stored) as Record<
            string,
            Record<string, unknown>
          >;
          const answeredSet = new Set<number>();
          const flaggedSet = new Set<number>();
          Object.keys(answers).forEach((k) => {
            if (!k.startsWith(statePrefix)) return;
            const entry = answers[k] as {
              choiceId?: string;
              textAnswer?: string;
              markedForReview?: boolean;
            };
            const idx = parseInt(k.slice(statePrefix.length), 10);
            if (Number.isNaN(idx)) return;
            if (
              entry &&
              (!!entry.choiceId ||
                (entry.textAnswer != null &&
                  String(entry.textAnswer).trim() !== ""))
            ) {
              answeredSet.add(idx);
            }
            if (entry?.markedForReview) {
              flaggedSet.add(idx);
            }
          });
          setAnsweredQuestions(answeredSet);
          setFlaggedQuestions(flaggedSet);
          flaggedQuestionsRef.current = flaggedSet;
        } else {
          setAnsweredQuestions(new Set());
          setFlaggedQuestions(new Set());
          flaggedQuestionsRef.current = new Set();
        }
      } catch {
        setAnsweredQuestions(new Set());
        setFlaggedQuestions(new Set());
        flaggedQuestionsRef.current = new Set();
      }
    },
    [
      flaggedQuestionsRef,
      getStorageKey,
      setAnsweredQuestions,
      setFlaggedQuestions,
    ],
  );

  const restoreCurrentAnswerFromStorage = useCallback(
    (
      state: StartTestResponse,
      options?: { includeMarkedForReview?: boolean },
    ) => {
      const statePrefix = `s${state.currentSection.orderIndex}_m${state.currentModule.moduleNumber}_`;
      const key = getStorageKey();
      const raw =
        typeof window !== "undefined" ? localStorage.getItem(key) : null;
      const answersMap = raw
        ? (JSON.parse(raw) as Record<string, Record<string, unknown>>)
        : {};
      const savedEntry = answersMap[statePrefix + state.currentQuestionIndex];
      const savedAnswer = savedEntry as
        | {
            choiceId?: string;
            textAnswer?: string;
            eliminatedChoices?: string[];
            markedForReview?: boolean;
          }
        | undefined;
      const hasActual =
        savedAnswer &&
        (!!savedAnswer.choiceId ||
          (savedAnswer.textAnswer != null &&
            String(savedAnswer.textAnswer).trim() !== ""));
      if (hasActual && savedAnswer) {
        const restored = {
          choiceId: savedAnswer.choiceId,
          textAnswer: savedAnswer.textAnswer,
        };
        currentAnswerRef.current = restored;
        setCurrentAnswer(restored);
        if (savedAnswer.eliminatedChoices?.length) {
          setEliminatedChoices(new Set(savedAnswer.eliminatedChoices));
        }
        if (options?.includeMarkedForReview && savedAnswer.markedForReview) {
          setFlaggedQuestions((prev) => {
            const next = new Set(prev);
            next.add(state.currentQuestionIndex);
            flaggedQuestionsRef.current = next;
            return next;
          });
        }
      } else {
        currentAnswerRef.current = {};
        setCurrentAnswer({});
      }
    },
    [
      currentAnswerRef,
      flaggedQuestionsRef,
      getStorageKey,
      setCurrentAnswer,
      setEliminatedChoices,
      setFlaggedQuestions,
    ],
  );

  const applyCachedLoadState = useCallback(
    (state: StartTestResponse) => {
      setTestState(state);
      setEliminatedChoices(new Set());
      if (state.question) {
        const qKey = `test_questions_${attemptId}_s${state.currentSection.orderIndex}_m${state.currentModule.moduleNumber}`;
        saveQuestionToLocal(state.currentQuestionIndex, state.question, qKey);
      }
      restoreCurrentAnswerFromStorage(state);
      if (state?.currentModule?.totalQuestions) {
        setTotalQuestions(state.currentModule.totalQuestions);
      }
      const statePrefix = `s${state.currentSection.orderIndex}_m${state.currentModule.moduleNumber}_`;
      restoreAnswerSetsFromStorage(statePrefix);
      startModuleTimer(
        state.currentModule.remainingSeconds ??
          state.currentModule.duration * 60,
      );
      setLoading(false);
    },
    [
      attemptId,
      restoreAnswerSetsFromStorage,
      restoreCurrentAnswerFromStorage,
      saveQuestionToLocal,
      setEliminatedChoices,
      setLoading,
      setTestState,
      setTotalQuestions,
      startModuleTimer,
    ],
  );

  const loadTestState = useCallback(async () => {
    if (loadTestStateInFlightRef.current) return;

    const forceRefresh =
      typeof window !== "undefined" &&
      sessionStorage.getItem(`test_force_refresh_state_${attemptId}`) === "1";

    if (forceRefresh) {
      sessionStorage.removeItem(`test_force_refresh_state_${attemptId}`);
      setLoading(true);
      setTestState(null);
    }

    if (!forceRefresh) {
      const recent = getRecentPracticeTestCurrentQuestion(
        queryClient,
        attemptId,
      );
      if (recent) {
        applyCachedLoadState(recent);
        return;
      }
    }

    loadTestStateInFlightRef.current = true;
    const isFirstLoad = !testStateRef.current?.question;
    try {
      if (isFirstLoad || forceRefresh) {
        setLoading(true);
      } else {
        setIsQuestionLoading(true);
      }
      setError("");
      const state = await fetchPracticeTestCurrentQuestion(
        queryClient,
        attemptId,
        { force: forceRefresh },
      );

      if (!state) {
        setError("Invalid test state received from server");
        return;
      }

      if ((state as { requiresBreak?: boolean }).requiresBreak) {
        if (typeof window !== "undefined") {
          sessionStorage.removeItem(
            `${MODULE_TRANSITION_RETRY_KEY}_${attemptId}`,
          );
        }
        router.push(`/dashboard/practice/test/${attemptId}/break`);
        return;
      }

      if ((state as { requiresFinish?: boolean }).requiresFinish) {
        const retryKey = `${MODULE_TRANSITION_RETRY_KEY}_${attemptId}`;
        const retries =
          typeof window !== "undefined"
            ? Number(sessionStorage.getItem(retryKey) || "0")
            : 0;
        if (typeof window !== "undefined" && retries < 5) {
          sessionStorage.setItem(retryKey, String(retries + 1));
          loadTestStateInFlightRef.current = false;
          await new Promise((r) => setTimeout(r, 450));
          await loadTestStateRef.current?.();
          return;
        }
        if (typeof window !== "undefined") {
          sessionStorage.removeItem(retryKey);
        }
        try {
          const pending = getAllPracticeAnswersForSubmit(attemptId);
          if (pending.length > 0) {
            await submitAnswersInBatches(attemptId, pending, {
              throwIfAllFailed: false,
              toleratePersistedErrors: true,
            });
          }
        } catch (syncErr) {
          console.warn("[Test Page] requiresFinish answer sync:", syncErr);
        }
        router.push(`/dashboard/practice/test/${attemptId}/finish`);
        return;
      }

      if (typeof window !== "undefined") {
        sessionStorage.removeItem(`${MODULE_TRANSITION_RETRY_KEY}_${attemptId}`);
      }

      if (!state.question) {
        console.error("[Test Page] No question in state:", state);
        setError(
          "No current question available. The test may have been completed or abandoned.",
        );
        return;
      }

      let activeState = state;

      if (typeof window !== "undefined") {
        const sessionRaw = sessionStorage.getItem(`test_session_${attemptId}`);
        if (sessionRaw) {
          sessionStorage.removeItem(`test_session_${attemptId}`);
          try {
            const session = JSON.parse(sessionRaw) as {
              sectionOrderIndex?: number;
              moduleNumber?: number;
              questionIndex?: number;
            };
            const sameModule =
              session.sectionOrderIndex === state.currentSection.orderIndex &&
              session.moduleNumber === state.currentModule.moduleNumber;
            const targetIndex = session.questionIndex;
            if (
              sameModule &&
              typeof targetIndex === "number" &&
              targetIndex >= 0 &&
              targetIndex !== state.currentQuestionIndex
            ) {
              activeState = await practiceService.jumpToQuestion(
                attemptId,
                targetIndex,
              );
              setPracticeTestCurrentQuestion(
                queryClient,
                attemptId,
                activeState,
              );
            }
          } catch (e) {
            console.warn("[Test Page] Session restore jump failed:", e);
          }
        }
      }

      setTestState(activeState);
      setPracticeTestCurrentQuestion(queryClient, attemptId, activeState);

      void (async () => {
        try {
          const attempts = await practiceService.getMyAttempts();
          const att = attempts.find((a) => a.id === attemptId);
          if (att?.testId) {
            saveAttemptMeta(attemptId, {
              testId: att.testId,
              testTitle:
                att.testTitle || activeState.testTitle || "Practice Test",
            });
          }
        } catch {
          // meta is optional
        }
      })();

      setEliminatedChoices(new Set());
      const qKey = `test_questions_${attemptId}_s${activeState.currentSection.orderIndex}_m${activeState.currentModule.moduleNumber}`;
      if (activeState.question) {
        saveQuestionToLocal(
          activeState.currentQuestionIndex,
          activeState.question,
          qKey,
        );
      }

      restoreCurrentAnswerFromStorage(activeState, {
        includeMarkedForReview: true,
      });

      if (activeState?.currentModule?.totalQuestions) {
        setTotalQuestions(activeState.currentModule.totalQuestions);
      } else {
        console.warn(
          "[Test Page] No totalQuestions in currentModule:",
          activeState.currentModule,
        );
      }

      startModuleTimer(
        activeState.currentModule.remainingSeconds ??
          activeState.currentModule.duration * 60,
      );

      const statePrefixApi = `s${activeState.currentSection.orderIndex}_m${activeState.currentModule.moduleNumber}_`;
      restoreAnswerSetsFromStorage(statePrefixApi);
    } catch (err) {
      console.error("[Test Page] Failed to load test state:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load test";
      setError(errorMessage);

      if (err instanceof Error && err.message.includes("404")) {
        setError(
          "Test attempt not found. It may have been deleted or expired.",
        );
      } else if (err instanceof Error && err.message.includes("401")) {
        setError("Unauthorized. Please log in again.");
      } else if (
        err instanceof Error &&
        /429|Too Many Requests/i.test(err.message)
      ) {
        setError(
          "Server busy (Too Many Requests). Click Retry below or wait a moment and refresh.",
        );
      }
    } finally {
      setLoading(false);
      setIsQuestionLoading(false);
      loadTestStateInFlightRef.current = false;
    }
  }, [
    attemptId,
    applyCachedLoadState,
    queryClient,
    restoreAnswerSetsFromStorage,
    restoreCurrentAnswerFromStorage,
    router,
    saveQuestionToLocal,
    setEliminatedChoices,
    setError,
    setIsQuestionLoading,
    setLoading,
    setTestState,
    setTotalQuestions,
    startModuleTimer,
    testStateRef,
  ]);

  useEffect(() => {
    loadTestStateRef.current = loadTestState;
  }, [loadTestState]);

  useEffect(() => {
    void loadTestState();
  }, [attemptId, loadTestState]);

  useEffect(() => {
    return () => {
      if (loadAnswersTimeoutRef.current) {
        clearTimeout(loadAnswersTimeoutRef.current);
      }
    };
  }, []);

  const loadAnsweredQuestions = useCallback(
    async (currentState?: StartTestResponse, force = false) => {
      const now = Date.now();
      if (!force && now - lastAnswersLoadRef.current < ANSWERS_CACHE_DURATION) {
        console.log(
          "[Test Page] Skipping loadAnsweredQuestions - too soon after last load",
        );
        return;
      }

      try {
        lastAnswersLoadRef.current = now;
        const answers = await practiceService.getAnsweredQuestions(attemptId);
        const state = currentState ?? testStateRef.current;

        if (!answers || !Array.isArray(answers.answers)) {
          setAnsweredQuestions(new Set());
          const raw =
            state?.currentModule?.totalQuestions ??
            answers?.totalQuestions ??
            0;
          setTotalQuestions(raw);
          return;
        }

        const raw =
          state?.currentModule?.totalQuestions ??
          answers?.totalQuestions ??
          0;
        setTotalQuestions(raw);
      } catch (err) {
        console.error("Failed to load answered questions:", err);
        const state = currentState ?? testStateRef.current;
        if (state?.currentModule?.totalQuestions) {
          setTotalQuestions(state.currentModule.totalQuestions);
        }
      }
    },
    [attemptId, setAnsweredQuestions, setTotalQuestions, testStateRef],
  );

  const debouncedLoadAnsweredQuestions = useCallback(
    (currentState?: StartTestResponse) => {
      if (loadAnswersTimeoutRef.current) {
        clearTimeout(loadAnswersTimeoutRef.current);
      }
      loadAnswersTimeoutRef.current = setTimeout(() => {
        loadAnsweredQuestions(currentState, false).catch(console.error);
      }, 500);
    },
    [loadAnsweredQuestions],
  );

  const waitForLoadTestStateIdle = useCallback(async (maxMs = 10000) => {
    const start = Date.now();
    while (loadTestStateInFlightRef.current && Date.now() - start < maxMs) {
      await new Promise((r) => setTimeout(r, 80));
    }
  }, []);

  const continueToNextModuleAfterFinish = useCallback(async () => {
    await invalidatePracticeTestCurrentQuestion(queryClient, attemptId);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(`test_force_refresh_state_${attemptId}`, "1");
      sessionStorage.setItem(`${MODULE_TRANSITION_RETRY_KEY}_${attemptId}`, "0");
    }
    timeUpHandledRef.current = false;
    await waitForLoadTestStateIdle();
    loadTestStateInFlightRef.current = false;
    await loadTestState();
  }, [
    attemptId,
    loadTestState,
    queryClient,
    timeUpHandledRef,
    waitForLoadTestStateIdle,
  ]);

  const handleTimeUp = useCallback(async () => {
    if (!testStateRef.current || timeUpHandledRef.current) return;
    timeUpHandledRef.current = true;
    try {
      setSubmitting(true);
      handleAnswer();
      await syncCurrentAnswerToServer();
      await Promise.all([submitAllPendingAnswers(), submitAllHighlights()]);

      const result = await practiceService.finishModule(attemptId);
      await invalidatePracticeTestCurrentQuestion(queryClient, attemptId);
      const step = nextStepFromFinishModule(result);

      if (isBreakStep(step)) {
        if (typeof window !== "undefined") {
          sessionStorage.removeItem(
            `${MODULE_TRANSITION_RETRY_KEY}_${attemptId}`,
          );
        }
        router.push(`/dashboard/practice/test/${attemptId}/break`);
        return;
      }

      if (isContinueTestStep(step)) {
        await continueToNextModuleAfterFinish();
        return;
      }

      if (isFinishTestStep(step)) {
        router.push(`/dashboard/practice/test/${attemptId}/finish`);
        return;
      }

      console.warn("[Test Page] Unknown finishModule nextStep:", result.nextStep);
      await continueToNextModuleAfterFinish();
    } catch (err) {
      timeUpHandledRef.current = false;
      if (
        err instanceof ApiClientError &&
        err.status === 400 &&
        /not in progress/i.test(err.message)
      ) {
        await invalidatePracticeTestCurrentQuestion(queryClient, attemptId);
        try {
          await submitAllPendingAnswers();
        } catch {
          // answers may already be on server
        }
        router.push(`/dashboard/practice/test/${attemptId}/finish`);
        return;
      }
      console.error("Failed on time up:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Vaqt tugadi. Keyingi bo‘limga o‘tishda xatolik. Qaytadan urinib ko‘ring.",
      );
    } finally {
      setSubmitting(false);
    }
  }, [
    attemptId,
    continueToNextModuleAfterFinish,
    handleAnswer,
    queryClient,
    router,
    setError,
    setSubmitting,
    submitAllHighlights,
    submitAllPendingAnswers,
    syncCurrentAnswerToServer,
    testStateRef,
    timeUpHandledRef,
  ]);

  return {
    loadTestState,
    loadAnsweredQuestions,
    debouncedLoadAnsweredQuestions,
    handleTimeUp,
    continueToNextModuleAfterFinish,
  };
}

/** Modul o‘tishda React Query cache ni tozalash (tashqi sahifalar uchun). */
export async function invalidatePracticeTestSessionCache(
  queryClient: QueryClient,
  attemptId: string,
): Promise<void> {
  await invalidatePracticeTestCurrentQuestion(queryClient, attemptId);
}
