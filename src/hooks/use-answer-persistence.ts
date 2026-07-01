"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  startTransition,
  type RefObject,
} from "react";
import { StartTestResponse } from "@/src/services/practice.service";
import { submitAnswersInBatches } from "@/src/utils/submit-answers-batch";
import {
  clearPracticeAnswersStorage,
  getModuleAnswersForSubmit,
  readPracticeAnswerAtIndex,
  removePracticeAnswer,
  savePracticeAnswer,
} from "@/src/utils/practice-answers-storage";
import { syncAnswerToServerIfChanged } from "@/src/utils/practice-answer-sync";

export type CurrentAnswer = {
  choiceId?: string;
  textAnswer?: string;
};

export type StoredAnswerEntry = {
  questionId: string;
  choiceId?: string;
  textAnswer?: string;
  markedForReview?: boolean;
  eliminatedChoices?: string[];
};

export interface UseAnswerPersistenceOptions {
  attemptId: string;
  testStateRef: RefObject<StartTestResponse | null>;
  getCurrentModulePrefix: () => string;
  getModulePrefixForState: (
    sectionOrderIndex: number,
    moduleNumber: number,
  ) => string;
  showNavigator: boolean;
  currentQuestionIndex: number;
  hasActiveQuestion: boolean;
}

export function useAnswerPersistence({
  attemptId,
  testStateRef,
  getCurrentModulePrefix,
  getModulePrefixForState,
  showNavigator,
  currentQuestionIndex,
  hasActiveQuestion,
}: UseAnswerPersistenceOptions) {
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(
    new Set(),
  );
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(
    new Set(),
  );
  const [currentAnswer, setCurrentAnswer] = useState<CurrentAnswer>({});
  const [eliminatedChoices, setEliminatedChoices] = useState<Set<string>>(
    new Set(),
  );

  const currentAnswerRef = useRef<CurrentAnswer>({});
  const flaggedQuestionsRef = useRef<Set<number>>(new Set());
  const eliminatedChoicesRef = useRef<Set<string>>(new Set());
  const serverSyncedAnswersRef = useRef<Map<string, string>>(new Map());
  const handleAnswerRef = useRef<() => void>(() => {});

  flaggedQuestionsRef.current = flaggedQuestions;
  eliminatedChoicesRef.current = eliminatedChoices;

  const getStorageKey = useCallback(
    () => `test_answers_${attemptId}`,
    [attemptId],
  );

  const hasActualAnswer = useCallback(
    (answer: { choiceId?: string; textAnswer?: string }) =>
      !!(
        answer.choiceId ||
        (answer.textAnswer != null && String(answer.textAnswer).trim() !== "")
      ),
    [],
  );

  const saveAnswerToStorage = useCallback(
    (questionIndex: number, answer: StoredAnswerEntry) => {
      savePracticeAnswer(
        attemptId,
        getCurrentModulePrefix(),
        questionIndex,
        answer,
      );
    },
    [attemptId, getCurrentModulePrefix],
  );

  const removeAnswerFromStorage = useCallback(
    (questionIndex: number) => {
      removePracticeAnswer(
        attemptId,
        getCurrentModulePrefix(),
        questionIndex,
      );
    },
    [attemptId, getCurrentModulePrefix],
  );

  const syncAnsweredFromStorage = useCallback(() => {
    if (typeof window === "undefined" || !attemptId) return;
    const prefix = getCurrentModulePrefix();
    try {
      const stored = localStorage.getItem(getStorageKey());
      if (!stored) {
        setAnsweredQuestions(new Set());
        return;
      }
      const answers = JSON.parse(stored) as Record<
        string,
        Record<string, unknown>
      >;
      const answeredSet = new Set<number>();
      Object.keys(answers).forEach((k) => {
        if (!k.startsWith(prefix)) return;
        const entry = answers[k] as { choiceId?: string; textAnswer?: string };
        if (entry && hasActualAnswer(entry)) {
          const idx = parseInt(k.slice(prefix.length), 10);
          if (!Number.isNaN(idx)) answeredSet.add(idx);
        }
      });
      setAnsweredQuestions(answeredSet);
    } catch (err) {
      console.error("Failed to load answers from localStorage:", err);
    }
  }, [attemptId, getStorageKey, getCurrentModulePrefix, hasActualAnswer]);

  useEffect(() => {
    syncAnsweredFromStorage();
  }, [syncAnsweredFromStorage]);

  useEffect(() => {
    if (showNavigator) syncAnsweredFromStorage();
  }, [showNavigator, syncAnsweredFromStorage]);

  const getAllAnswersFromStorage = useCallback((): Map<
    number,
    StoredAnswerEntry
  > => {
    if (typeof window === "undefined") return new Map();

    try {
      const key = getStorageKey();
      const prefix = getCurrentModulePrefix();
      const stored = localStorage.getItem(key);
      if (!stored) return new Map();

      const answers = JSON.parse(stored) as Record<
        string,
        Record<string, unknown>
      >;
      const map = new Map<number, StoredAnswerEntry>();
      Object.keys(answers).forEach((k) => {
        if (!k.startsWith(prefix)) return;
        const questionIndex = parseInt(k.slice(prefix.length), 10);
        if (Number.isNaN(questionIndex)) return;
        map.set(questionIndex, answers[k] as StoredAnswerEntry);
      });
      return map;
    } catch (err) {
      console.error("Failed to get answers from localStorage:", err);
      return new Map();
    }
  }, [getStorageKey, getCurrentModulePrefix]);

  const getAllAnswersForSubmit = useCallback((): StoredAnswerEntry[] => {
    if (typeof window === "undefined") return [];

    try {
      const key = getStorageKey();
      const stored = localStorage.getItem(key);
      if (!stored) return [];

      const answers = JSON.parse(stored) as Record<
        string,
        Record<string, unknown>
      >;
      return Object.keys(answers)
        .filter((k) => /^s\d+_m\d+_\d+$/.test(k))
        .filter((k) => {
          const entry = answers[k] as {
            choiceId?: string;
            textAnswer?: string;
          };
          return !!(
            entry?.choiceId ||
            (entry?.textAnswer != null &&
              String(entry.textAnswer).trim() !== "")
          );
        })
        .map((k) => answers[k] as StoredAnswerEntry)
        .filter((a) => !!a.questionId);
    } catch (err) {
      console.error("Failed to get answers for submit:", err);
      return [];
    }
  }, [getStorageKey]);

  const applySavedAnswerForIndex = useCallback(
    (index: number) => {
      const savedAnswer = getAllAnswersFromStorage().get(index);
      if (savedAnswer) {
        currentAnswerRef.current = {
          choiceId: savedAnswer.choiceId,
          textAnswer: savedAnswer.textAnswer,
        };
        setCurrentAnswer({
          choiceId: savedAnswer.choiceId,
          textAnswer: savedAnswer.textAnswer,
        });
        if (
          savedAnswer.eliminatedChoices &&
          savedAnswer.eliminatedChoices.length > 0
        ) {
          setEliminatedChoices(new Set(savedAnswer.eliminatedChoices));
        } else {
          setEliminatedChoices(new Set());
        }
        if (savedAnswer.markedForReview) {
          setFlaggedQuestions((prev) => {
            const next = new Set(prev);
            next.add(index);
            return next;
          });
        } else {
          setFlaggedQuestions((prev) => {
            const next = new Set(prev);
            next.delete(index);
            return next;
          });
        }
      } else {
        currentAnswerRef.current = {};
        setCurrentAnswer({});
        setEliminatedChoices(new Set());
      }
    },
    [getAllAnswersFromStorage],
  );

  const persistCurrentQuestionAnswer = useCallback(() => {
    const ts = testStateRef.current;
    if (!ts?.question || !ts.currentSection || !ts.currentModule) return;
    const idx = ts.currentQuestionIndex;
    const questionId = ts.question.id;
    const live = currentAnswerRef.current;
    const modulePrefix = getModulePrefixForState(
      ts.currentSection.orderIndex,
      ts.currentModule.moduleNumber,
    );
    const stored = readPracticeAnswerAtIndex(attemptId, modulePrefix, idx);

    const choiceIdNorm =
      live.choiceId != null && String(live.choiceId).trim() !== ""
        ? String(live.choiceId)
        : stored?.choiceId != null && String(stored.choiceId).trim() !== ""
          ? String(stored.choiceId)
          : undefined;
    const textAnswer =
      live.textAnswer !== undefined && live.textAnswer !== null
        ? live.textAnswer
        : stored?.textAnswer;
    const hasAnswer = hasActualAnswer({
      choiceId: choiceIdNorm,
      textAnswer,
    });
    const elim = eliminatedChoicesRef.current;
    const flagged = flaggedQuestionsRef.current.has(idx);
    const hasMeta = flagged || elim.size > 0;
    const answerData = {
      questionId,
      choiceId: choiceIdNorm,
      textAnswer,
      markedForReview: flagged,
      eliminatedChoices: Array.from(elim),
    };
    if (hasAnswer || hasMeta) {
      savePracticeAnswer(attemptId, modulePrefix, idx, answerData);
      if (hasAnswer) {
        startTransition(() => {
          setAnsweredQuestions((prev) => {
            const next = new Set(prev);
            next.add(idx);
            return next;
          });
        });
      }
    } else if (!stored || !hasActualAnswer(stored)) {
      removePracticeAnswer(attemptId, modulePrefix, idx);
      startTransition(() => {
        setAnsweredQuestions((prev) => {
          const next = new Set(prev);
          next.delete(idx);
          return next;
        });
      });
    }
  }, [attemptId, getModulePrefixForState, hasActualAnswer, testStateRef]);

  const isFlaggedCurrent = hasActiveQuestion
    ? flaggedQuestions.has(currentQuestionIndex)
    : false;

  useEffect(() => {
    persistCurrentQuestionAnswer();
  }, [isFlaggedCurrent, eliminatedChoices, persistCurrentQuestionAnswer]);

  const handleAnswer = useCallback(() => {
    const ts = testStateRef.current;
    if (!ts?.question) return;

    const currentIndex = ts.currentQuestionIndex;
    const questionId = ts.question.id;
    const live = currentAnswerRef.current;
    const choiceIdNorm =
      live.choiceId != null && live.choiceId !== ""
        ? String(live.choiceId)
        : undefined;
    const hasAnswer = hasActualAnswer({
      choiceId: choiceIdNorm,
      textAnswer: live.textAnswer,
    });

    const answerData = {
      questionId,
      choiceId: choiceIdNorm,
      textAnswer: live.textAnswer,
      markedForReview: flaggedQuestionsRef.current.has(currentIndex),
      eliminatedChoices: Array.from(eliminatedChoicesRef.current),
    };

    const hasMeta =
      flaggedQuestionsRef.current.has(currentIndex) ||
      eliminatedChoicesRef.current.size > 0;

    if (hasAnswer || hasMeta) {
      saveAnswerToStorage(currentIndex, answerData);
      setAnsweredQuestions((prev) => {
        const next = new Set(prev);
        next.add(currentIndex);
        return next;
      });
    } else {
      removeAnswerFromStorage(currentIndex);
      setAnsweredQuestions((prev) => {
        const next = new Set(prev);
        next.delete(currentIndex);
        return next;
      });
    }
  }, [hasActualAnswer, saveAnswerToStorage, removeAnswerFromStorage, testStateRef]);

  useEffect(() => {
    handleAnswerRef.current = handleAnswer;
  }, [handleAnswer]);

  const syncCurrentAnswerToServer = useCallback(async () => {
    const ts = testStateRef.current;
    if (!ts?.question) return;

    const live = currentAnswerRef.current;
    const choiceIdNorm =
      live.choiceId != null && String(live.choiceId).trim() !== ""
        ? String(live.choiceId)
        : undefined;

    if (
      !hasActualAnswer({
        choiceId: choiceIdNorm,
        textAnswer: live.textAnswer,
      })
    ) {
      return;
    }

    const currentIndex = ts.currentQuestionIndex;
    await syncAnswerToServerIfChanged(
      attemptId,
      {
        questionId: ts.question.id,
        choiceId: choiceIdNorm,
        textAnswer: live.textAnswer,
        markedForReview: flaggedQuestionsRef.current.has(currentIndex),
        eliminatedChoices: Array.from(eliminatedChoicesRef.current),
      },
      serverSyncedAnswersRef.current,
    );
  }, [attemptId, hasActualAnswer, testStateRef]);

  const syncCurrentModuleAnswers = useCallback(async () => {
    const ts = testStateRef.current;
    if (!ts?.currentSection || !ts?.currentModule) return null;

    const prefix = getModulePrefixForState(
      ts.currentSection.orderIndex,
      ts.currentModule.moduleNumber,
    );
    const answers = getModuleAnswersForSubmit(attemptId, prefix);
    if (answers.length === 0) return null;

    return submitAnswersInBatches(attemptId, answers, {
      throwIfAllFailed: false,
      toleratePersistedErrors: true,
    });
  }, [attemptId, getModulePrefixForState, testStateRef]);

  useEffect(() => {
    const flush = () => {
      if (document.visibilityState === "hidden") {
        handleAnswerRef.current();
        void syncCurrentAnswerToServer();
      }
    };
    const onPageHide = () => handleAnswerRef.current();
    document.addEventListener("visibilitychange", flush);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("visibilitychange", flush);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [syncCurrentAnswerToServer]);

  const submitAllPendingAnswers = useCallback(
    async (options?: { clearStorage?: boolean }) => {
      const allAnswers = getAllAnswersForSubmit();

      if (allAnswers.length === 0) {
        return;
      }

      const result = await submitAnswersInBatches(attemptId, allAnswers, {
        throwIfAllFailed: options?.clearStorage === true,
        toleratePersistedErrors: true,
      });

      if (
        options?.clearStorage === true &&
        (result.processed > 0 || result.skipped > 0)
      ) {
        clearPracticeAnswersStorage(attemptId);
      } else if (result.failed > 0) {
        console.warn(
          `[Test Page] ${result.failed}/${result.total} answer(s) failed to save`,
        );
      }

      return result;
    },
    [attemptId, getAllAnswersForSubmit],
  );

  const handleAnswerChange = useCallback(
    (answer: CurrentAnswer) => {
      currentAnswerRef.current = answer;

      try {
        persistCurrentQuestionAnswer();
      } catch (e) {
        console.error("[Test Page] persist answer failed:", e);
      }

      setCurrentAnswer(answer);
    },
    [persistCurrentQuestionAnswer],
  );

  const handleAnswerChangeRef = useRef(handleAnswerChange);
  handleAnswerChangeRef.current = handleAnswerChange;

  const handleSelectChoice = useCallback((choiceId: string) => {
    handleAnswerChangeRef.current({
      choiceId,
      textAnswer: currentAnswerRef.current.textAnswer,
    });
  }, []);

  const handleTextAnswerChange = useCallback((text: string) => {
    handleAnswerChangeRef.current({
      textAnswer: text,
      choiceId: currentAnswerRef.current.choiceId,
    });
  }, []);

  const handleToggleFlag = useCallback(() => {
    const ts = testStateRef.current;
    if (!ts?.question) return;

    setFlaggedQuestions((prev) => {
      const next = new Set(prev);
      const idx = ts.currentQuestionIndex;
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      flaggedQuestionsRef.current = next;
      return next;
    });
    persistCurrentQuestionAnswer();
  }, [persistCurrentQuestionAnswer, testStateRef]);

  return {
    answeredQuestions,
    setAnsweredQuestions,
    flaggedQuestions,
    setFlaggedQuestions,
    flaggedQuestionsRef,
    currentAnswer,
    setCurrentAnswer,
    currentAnswerRef,
    eliminatedChoices,
    setEliminatedChoices,
    eliminatedChoicesRef,
    serverSyncedAnswersRef,
    handleAnswerRef,
    getStorageKey,
    hasActualAnswer,
    applySavedAnswerForIndex,
    persistCurrentQuestionAnswer,
    handleAnswer,
    syncCurrentAnswerToServer,
    syncCurrentModuleAnswers,
    submitAllPendingAnswers,
    handleAnswerChange,
    handleAnswerChangeRef,
    handleSelectChoice,
    handleTextAnswerChange,
    handleToggleFlag,
  };
}
