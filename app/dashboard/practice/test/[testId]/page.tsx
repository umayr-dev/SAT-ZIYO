"use client";

import { useEffect, useRef, useState, useCallback, useMemo, useDeferredValue } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/src/ui/button";
import { Loading } from "@/src/ui/loading";
import { Card } from "@/src/ui/card";
import {
  practiceService,
  StartTestResponse,
  Question,
  hasChoiceOptions,
} from "@/src/services/practice.service";
import { TestHeader } from "@/src/components/practice/TestHeader";
import { TestFooter } from "@/src/components/practice/TestFooter";
import { DesktopTestContent } from "@/src/components/practice/DesktopTestContent";
import { MobileTestContent } from "@/src/components/practice/MobileTestContent";
import { FullscreenWarningModal } from "@/src/components/practice/FullscreenWarningModal";
import { RefreshConfirmDialog } from "@/src/components/practice/RefreshConfirmDialog";
import { NotesPanel } from "@/src/components/practice/NotesPanel";
import { DESMOS_DEFAULT_H, DESMOS_DEFAULT_W } from "@/src/config/desmos";
import { QuestionNavigator } from "@/src/components/practice/QuestionNavigator";
import {
  ChevronLeft,
  Grid3X3,
  Type,
  Highlighter,
} from "lucide-react";
import { useAnswerPersistence } from "@/src/hooks/use-answer-persistence";
import { useTestNavigation } from "@/src/hooks/use-test-navigation";
import { useTestSession } from "@/src/hooks/use-test-session";
import { useCurrentUser } from "@/src/hooks/use-auth";
import { debounce } from "@/src/utils/request-queue";
import {
  buildModulePrefix,
} from "@/src/utils/practice-answers-storage";
import {
  getAttemptMeta,
  registerPausedTest,
  saveAttemptMeta,
} from "@/src/utils/practice-paused-sessions";

import { MathToolsColumn } from "@/src/components/practice/MathToolsColumn";

export default function TestTakingPage() {
  const router = useRouter();
  const params = useParams();
  // NOTE: Route segment is [testId], but here it actually represents attemptId
  const attemptId = params.testId as string;
  const { data: currentUser } = useCurrentUser();

  const [testState, setTestState] = useState<StartTestResponse | null>(null);
  const testStateRef = useRef<StartTestResponse | null>(null);
  // Local cache for all questions in current module
  const [questionsCache, setQuestionsCache] = useState<Map<number, Question>>(
    new Map(),
  );
  const questionsCacheRef = useRef<Map<number, Question>>(new Map());
  questionsCacheRef.current = questionsCache;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [totalQuestions, setTotalQuestions] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFullscreenWarning, setShowFullscreenWarning] = useState(false);
  const [fullscreenModalReason, setFullscreenModalReason] = useState<
    "initial" | "exited"
  >("initial");
  const [countdown, setCountdown] = useState(10);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showReferenceSheet, setShowReferenceSheet] = useState(false);
  const [referenceSheetSize, setReferenceSheetSize] = useState({
    width: 420,
    height: 520,
  });
  const [showNavigator, setShowNavigator] = useState(false);
  const [isMarkupEnabled, setIsMarkupEnabled] = useState(false);
  const [isTimerHidden, setIsTimerHidden] = useState(false);
  // Absolute wall-clock deadline (ms epoch) for the current module. The timer
  // is derived from this so it cannot drift in background tabs and restores
  // correctly on refresh.
  const [moduleDeadline, setModuleDeadline] = useState<number | null>(null);
  const [isEliminationMode, setIsEliminationMode] = useState(false);
  const [questionNotes, setQuestionNotes] = useState<Map<number, string>>(
    new Map(),
  );
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [newNoteText, setNewNoteText] = useState("");
  const [isQuestionLoading, setIsQuestionLoading] = useState(false);
  const [showRefreshModal, setShowRefreshModal] = useState(false);

  // localStorage key for notes
  const getNotesStorageKey = useCallback(
    () => `test_notes_${attemptId}`,
    [attemptId],
  );

  // Save notes to localStorage
  const saveNotesToStorage = useCallback(
    (notes: Map<number, string>) => {
      if (typeof window === "undefined") return;
      try {
        const notesObj: Record<string, string> = {};
        notes.forEach((value, key) => {
          notesObj[key.toString()] = value;
        });
        localStorage.setItem(getNotesStorageKey(), JSON.stringify(notesObj));
      } catch (err) {
        console.error("Failed to save notes to localStorage:", err);
      }
    },
    [getNotesStorageKey],
  );

  // Add new note
  const handleAddNote = useCallback(() => {
    if (!newNoteText.trim() || !testState) return;

    const currentIndex = testState.currentQuestionIndex;
    const newNotes = new Map(questionNotes);
    const existingNote = newNotes.get(currentIndex) || "";
    const updatedNote = existingNote
      ? `${existingNote}\n\n${newNoteText.trim()}`
      : newNoteText.trim();

    newNotes.set(currentIndex, updatedNote);
    setQuestionNotes(newNotes);
    saveNotesToStorage(newNotes);
    setNewNoteText("");
  }, [newNoteText, questionNotes, testState, saveNotesToStorage]);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  /** Timer 0 ga yetganda handleTimeUp faqat bir marta chaqirilsin */
  const timeUpHandledRef = useRef(false);
  const wasFullscreenRef = useRef(false);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  /** Fullscreen countdown 0 → save session (avoid abandon + double save). */
  const saveSessionAndExitRef = useRef<() => Promise<void>>(() =>
    Promise.resolve(),
  );
  const sessionSaveInFlightRef = useRef(false);
  const remainingTimeSecondsRef = useRef<number | null>(null);

  // 920px gacha desktop 2-ustun; 920px dan pastda mobil (1-ustun, passage+image tepada)
  const [isDesktopLayout, setIsDesktopLayout] = useState(false);
  useEffect(() => {
    const mq =
      typeof window !== "undefined"
        ? window.matchMedia("(min-width: 920px)")
        : null;
    if (!mq) return;
    setIsDesktopLayout(mq.matches);
    const handler = () => setIsDesktopLayout(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Resizable 2-column layout state
  const [splitPosition, setSplitPosition] = useState(50); // percentage for left pane
  const layoutContainerRef = useRef<HTMLDivElement | null>(null);
  const isDraggingDividerRef = useRef(false);
  const [desmosSize, setDesmosSize] = useState({
    width: DESMOS_DEFAULT_W,
    height: DESMOS_DEFAULT_H,
  });
  const [desmosPosition, setDesmosPosition] = useState({ x: 0, y: 0 });
  const [referenceSheetPosition, setReferenceSheetPosition] = useState({
    x: 0,
    y: 0,
  });

  // Timer is no longer persisted per-tick: on every load the server's
  // authoritative remainingSeconds re-anchors the deadline, so a refresh
  // restores the correct time without a client-side cached value to go stale.

  // localStorage key for answers (one key per attempt; inside we use s{section}_m{module}_{index})
  // getStorageKey — useAnswerPersistence hook ichida

  // Current module prefix — always from testStateRef so saves match the active question during navigation.
  const getCurrentModulePrefix = useCallback(() => {
    const ts = testStateRef.current;
    const s = ts?.currentSection?.orderIndex ?? 0;
    const m = ts?.currentModule?.moduleNumber ?? 1;
    return buildModulePrefix(s, m);
  }, []);

  const getModulePrefixForState = useCallback(
    (sectionOrderIndex: number, moduleNumber: number) =>
      buildModulePrefix(sectionOrderIndex, moduleNumber),
    [],
  );

  testStateRef.current = testState;

  const {
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
    getStorageKey,
    applySavedAnswerForIndex,
    handleAnswer,
    syncCurrentAnswerToServer,
    syncCurrentModuleAnswers,
    submitAllPendingAnswers,
    handleAnswerRef,
    handleAnswerChangeRef,
    handleSelectChoice,
    handleTextAnswerChange,
    handleToggleFlag,
  } = useAnswerPersistence({
    attemptId,
    testStateRef,
    getCurrentModulePrefix,
    getModulePrefixForState,
    showNavigator,
    currentQuestionIndex: testState?.currentQuestionIndex ?? 0,
    hasActiveQuestion: !!testState?.question,
  });

  // sessionStorage: savollarni backenddan olgach saqlash (tez o‘tish uchun). Section+module bo‘yicha ajratamiz – Module 2 da Module 1 savollari chiqmasin.
  const getQuestionsStorageKey = useCallback(
    () =>
      `test_questions_${attemptId}_s${testState?.currentSection?.orderIndex ?? 0}_m${testState?.currentModule?.moduleNumber ?? 1}`,
    [
      attemptId,
      testState?.currentSection?.orderIndex,
      testState?.currentModule?.moduleNumber,
    ],
  );

  const saveQuestionToLocal = useCallback(
    (index: number, question: Question, storageKeyOverride?: string) => {
      questionsCacheRef.current.set(index, question);
      setQuestionsCache((prev) => {
        const next = new Map(prev);
        next.set(index, question);
        return next;
      });
      if (typeof window === "undefined") return;
      try {
        const key = storageKeyOverride ?? getQuestionsStorageKey();
        const raw = sessionStorage.getItem(key);
        const data: Record<string, Question> = raw ? JSON.parse(raw) : {};
        data[String(index)] = question;
        sessionStorage.setItem(key, JSON.stringify(data));
      } catch (e) {
        console.warn("saveQuestionToLocal:", e);
      }
    },
    [getQuestionsStorageKey],
  );

  const {
    handleNext,
    handlePrevious,
    handleJumpToQuestion,
    handleGoToModuleReview,
  } = useTestNavigation({
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
  });

  const startModuleTimer = useCallback((seconds: number | null | undefined) => {
    const secs = Math.max(0, Math.floor(Number(seconds) || 0));
    timeUpHandledRef.current = false;
    remainingTimeSecondsRef.current = secs;
    setModuleDeadline(Date.now() + secs * 1000);
  }, []);

  // Modul o‘zgarganda (Module 1 → Module 2) in-memory cache’ni tozalash – eski modul savollari ko‘rinmasin
  const moduleKeyRef = useRef<string>("");
  useEffect(() => {
    const key = `${testState?.currentSection?.orderIndex ?? ""}_${testState?.currentModule?.moduleNumber ?? ""}`;
    if (moduleKeyRef.current !== "" && moduleKeyRef.current !== key) {
      setQuestionsCache(new Map());
    }
    moduleKeyRef.current = key;
  }, [
    testState?.currentSection?.orderIndex,
    testState?.currentModule?.moduleNumber,
  ]);

  // localStorage key for highlights
  const getHighlightsStorageKey = useCallback(
    () => `test_highlights_${attemptId}`,
    [attemptId],
  );

  // Get all highlights from localStorage (grouped by questionId)
  const getAllHighlightsFromStorage = useCallback((): Map<
    string,
    Array<{
      startOffset: number;
      endOffset: number;
      color: "YELLOW" | "GREEN" | "BLUE" | "PINK" | "ORANGE";
      note?: string | null;
    }>
  > => {
    if (typeof window === "undefined") return new Map();
    try {
      const stored = localStorage.getItem(getHighlightsStorageKey());
      if (!stored) return new Map();
      const highlights = JSON.parse(stored);
      const map = new Map<
        string,
        Array<{
          startOffset: number;
          endOffset: number;
          color: "YELLOW" | "GREEN" | "BLUE" | "PINK" | "ORANGE";
          note?: string | null;
        }>
      >();
      Object.keys(highlights).forEach((questionId) => {
        map.set(questionId, highlights[questionId]);
      });
      return map;
    } catch (err) {
      console.error("Failed to get highlights from localStorage:", err);
      return new Map();
    }
  }, [getHighlightsStorageKey]);

  // Handle dragging of the vertical divider between question and choices
  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      if (!isDraggingDividerRef.current || !layoutContainerRef.current) return;
      const rect = layoutContainerRef.current.getBoundingClientRect();
      if (rect.width <= 0) return;
      const relativeX = e.clientX - rect.left;
      let next = (relativeX / rect.width) * 100;
      // Clamp between 30% and 70% so question and buttons stay visible (min 280px each)
      next = Math.max(30, Math.min(70, next));
      setSplitPosition(next);
    }

    function handleMouseUp() {
      if (!isDraggingDividerRef.current) return;
      isDraggingDividerRef.current = false;
      document.body.style.cursor = "";
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  // Refresh / leave confirmation: show modal on F5 or Ctrl+R (custom dialog only, no browser default alert)
  useEffect(() => {
    if (!testState) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F5" || (e.ctrlKey && e.key.toLowerCase() === "r")) {
        e.preventDefault();
        setShowRefreshModal(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [testState]);

  const handleDividerMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      isDraggingDividerRef.current = true;
      document.body.style.cursor = "col-resize";
    },
    [],
  );

  // Save highlights to localStorage (grouped by questionId)
  const saveHighlightsToStorage = useCallback(
    (
      questionId: string,
      highlights: Array<{
        startOffset: number;
        endOffset: number;
        color: "YELLOW" | "GREEN" | "BLUE" | "PINK" | "ORANGE";
        note?: string | null;
      }>,
    ) => {
      if (typeof window === "undefined") return;
      try {
        const id = String(questionId);
        const key = getHighlightsStorageKey();
        const stored = localStorage.getItem(key);
        const allHighlights = stored ? JSON.parse(stored) : {};
        allHighlights[id] = highlights;
        localStorage.setItem(key, JSON.stringify(allHighlights));
      } catch (err) {
        console.error("Failed to save highlights to localStorage:", err);
      }
    },
    [getHighlightsStorageKey],
  );

  /** Bo'sh [] faqat avval bu kalit uchun saqlangan highlight bo'lsa o'chiriladi — savol almashganda "hayoliy" [] boshqa savol yozuvlarini buzmasin */
  const persistQuestionTextHighlights = useCallback(
    (
      questionId: string,
      highlights: Array<{
        startOffset: number;
        endOffset: number;
        color: "YELLOW" | "GREEN" | "BLUE" | "PINK" | "ORANGE";
        note?: string | null;
      }>,
    ) => {
      if (highlights.length > 0) {
        saveHighlightsToStorage(questionId, highlights);
        return;
      }
      if (typeof window === "undefined") return;
      try {
        const id = String(questionId);
        const all = getAllHighlightsFromStorage();
        if (!all.has(id)) return;
        all.delete(id);
        const highlightsObj: Record<string, unknown> = {};
        all.forEach((value, key) => {
          highlightsObj[key] = value;
        });
        localStorage.setItem(
          getHighlightsStorageKey(),
          JSON.stringify(highlightsObj),
        );
      } catch (err) {
        console.error("Failed to clear question highlights in localStorage:", err);
      }
    },
    [
      saveHighlightsToStorage,
      getAllHighlightsFromStorage,
      getHighlightsStorageKey,
    ],
  );

  // Submit all highlights to backend (batch)
  const submitAllHighlights = useCallback(async () => {
    const allHighlights = getAllHighlightsFromStorage();

    if (allHighlights.size === 0) {
      console.log("[Test Page] No highlights to submit");
      return;
    }

    console.log(
      `[Test Page] Submitting ${allHighlights.size} question highlights to server...`,
    );

    const submitPromises: Promise<void>[] = [];
    let delay = 0;

    const highlightsArray = Array.from(allHighlights.entries());

    for (const [questionId, highlights] of highlightsArray) {
      if (highlights.length === 0) continue; // Skip empty highlights

      submitPromises.push(
        (async () => {
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay += 50; // 50ms delay between requests

          try {
            await practiceService.saveHighlights(
              attemptId,
              questionId,
              highlights,
            );
          } catch (err) {
            console.error(
              `Failed to submit highlights for question ${questionId}:`,
              err,
            );
          }
        })(),
      );
    }

    await Promise.all(submitPromises);
    console.log("[Test Page] All highlights submitted successfully");
  }, [attemptId, getAllHighlightsFromStorage]);

  const { loadTestState, handleTimeUp } = useTestSession({
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
  });

  const handleRemainingSecondsChange = useCallback((remaining: number) => {
    remainingTimeSecondsRef.current = remaining;
  }, []);

  const startCountdown = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          countdownIntervalRef.current = null;
          // Do NOT auto-exit the test. Incidental fullscreen loss (Esc, OS
          // notification, alt-tab, mobile) must never terminate the session.
          // The prompt stays visible so the user can re-enter fullscreen or
          // continue; their progress and timer are untouched.
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    countdownIntervalRef.current = interval;
  }, []);

  // Check fullscreen on mount
  useEffect(() => {
    if (typeof document !== "undefined") {
      const isFs = !!document.fullscreenElement;
      setIsFullscreen(isFs);
      wasFullscreenRef.current = isFs;

      // If not in fullscreen, show choice modal (no cancel)
      if (!isFs) {
        setFullscreenModalReason("initial");
        setShowFullscreenWarning(true);
        setCountdown(10);
        startCountdown();
      }
    }
  }, [startCountdown]);

  async function handleEnterFullscreen() {
    try {
      if (document.fullscreenElement == null) {
        await document.documentElement.requestFullscreen();
      }

      // Wait a bit for fullscreen to activate
      await new Promise((resolve) => setTimeout(resolve, 100));

      if (document.fullscreenElement) {
        // Clear countdown and hide warning
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
        setShowFullscreenWarning(false);
        setCountdown(10);
      }
    } catch (err) {
      console.error("Failed to enter fullscreen:", err);
    }
  }

  // Handle continue without fullscreen (small screen mode)
  const handleContinueWithoutFullscreen = useCallback(() => {
    setShowFullscreenWarning(false);
    setFullscreenModalReason("initial");
    setCountdown(10);
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    const handler = () => {
      const now = !!document.fullscreenElement;
      setIsFullscreen(now);

      if (now) {
        // Fullscreen enabled - clear warning
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
        setShowFullscreenWarning(false);
        setCountdown(10);
      } else {
        // Fullscreen exited - show choice modal again
        if (wasFullscreenRef.current) {
          setFullscreenModalReason("exited");
          setShowFullscreenWarning(true);
          setCountdown(10);
          startCountdown();
        }
      }

      wasFullscreenRef.current = now;
    };
    if (typeof document !== "undefined") {
      document.addEventListener("fullscreenchange", handler);
    }
    return () => {
      if (typeof document !== "undefined") {
        document.removeEventListener("fullscreenchange", handler);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [startCountdown]);

  async function handleFinishSection() {
    if (!testState?.question) return;

    try {
      // Endi modulni darhol tugatmaymiz – review sahifasiga olib boramiz
      handleGoToModuleReview();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to finish section");
    } finally {
      setSubmitting(false);
    }
  }

  function getProgress() {
    const total =
      totalQuestions ?? testState?.currentModule?.totalQuestions ?? 0;
    if (!total) return 0;
    return Math.round((answeredQuestions.size / total) * 100);
  }

  // Save session and leave (fullscreen timeout, Save & Exit menu) — attempt stays IN_PROGRESS
  const saveTestSessionAndExit = useCallback(async () => {
    if (sessionSaveInFlightRef.current) return;
    sessionSaveInFlightRef.current = true;

    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    try {
      handleAnswerRef.current();

      try {
        await syncCurrentAnswerToServer();
        await syncCurrentModuleAnswers();
        await submitAllPendingAnswers({ clearStorage: false });
        await submitAllHighlights();
      } catch (syncErr) {
        console.warn("[Test Page] Session save sync (partial):", syncErr);
      }

      const ts = testStateRef.current;
      const timeLeft = remainingTimeSecondsRef.current;
      const testTitle =
        ts?.testTitle ?? getAttemptMeta(attemptId)?.testTitle ?? "Practice Test";

      let testId = getAttemptMeta(attemptId)?.testId;
      if (!testId) {
        try {
          const attempts = await practiceService.getMyAttempts();
          const att = attempts.find((a) => a.id === attemptId);
          if (att?.testId) {
            testId = att.testId;
            saveAttemptMeta(attemptId, {
              testId: att.testId,
              testTitle: att.testTitle || testTitle,
            });
          }
        } catch {
          // continue with local-only registry below if possible
        }
      }

      if (typeof window !== "undefined" && ts?.currentSection && ts?.currentModule) {
        if (timeLeft != null) {
          const timerKey = `test_timer_${attemptId}_s${ts.currentSection.orderIndex}_m${ts.currentModule.moduleNumber}`;
          sessionStorage.setItem(timerKey, String(timeLeft));
        }
        sessionStorage.setItem(
          `test_session_${attemptId}`,
          JSON.stringify({
            sectionOrderIndex: ts.currentSection.orderIndex,
            moduleNumber: ts.currentModule.moduleNumber,
            questionIndex: ts.currentQuestionIndex,
            remainingTimeSeconds: timeLeft,
            savedAt: Date.now(),
          }),
        );
      }

      if (testId) {
        registerPausedTest({
          attemptId,
          testId,
          testTitle,
          savedAt: Date.now(),
        });
      }

      router.push("/dashboard/practice");
    } catch (err) {
      console.error("Failed to save test session:", err);
      router.push("/dashboard/practice");
    }
  }, [
    attemptId,
    router,
    submitAllHighlights,
    submitAllPendingAnswers,
    syncCurrentAnswerToServer,
    syncCurrentModuleAnswers,
  ]);

  useEffect(() => {
    saveSessionAndExitRef.current = saveTestSessionAndExit;
  }, [saveTestSessionAndExit]);

  // Handle save and exit (menu)
  const handleSaveAndExit = useCallback(async () => {
    await saveTestSessionAndExit();
  }, [saveTestSessionAndExit]);

  const persistQuestionTextHighlightsRef = useRef(persistQuestionTextHighlights);
  persistQuestionTextHighlightsRef.current = persistQuestionTextHighlights;

  const activeQuestionIdRef = useRef("");
  activeQuestionIdRef.current = testState?.question?.id ?? "";

  const handleHighlightsChange = useCallback(
    (
      highlights: Parameters<typeof persistQuestionTextHighlights>[1],
    ) => {
      const qid = activeQuestionIdRef.current;
      if (qid) persistQuestionTextHighlightsRef.current(qid, highlights);
    },
    [],
  );

  const handleHideTimer = useCallback(() => setIsTimerHidden(true), []);
  const handleShowTimer = useCallback(() => setIsTimerHidden(false), []);
  const handleToggleMarkup = useCallback(
    () => setIsMarkupEnabled((prev) => !prev),
    [],
  );
  const handleOpenNotes = useCallback(() => setShowNotesModal(true), []);
  const handleToggleReferenceSheet = useCallback(
    () => setShowReferenceSheet((prev) => !prev),
    [],
  );
  const handleToggleCalculator = useCallback(
    () => setShowCalculator((prev) => !prev),
    [],
  );
  const handleToggleMoreMenu = useCallback(
    () => setShowMoreMenu((prev) => !prev),
    [],
  );
  const handleSaveAndExitFromMenu = useCallback(() => {
    setShowMoreMenu(false);
    void handleSaveAndExit();
  }, [handleSaveAndExit]);
  const handleToggleNavigator = useCallback(
    () => setShowNavigator((prev) => !prev),
    [],
  );

  const handleToggleEliminationMode = useCallback(() => {
    setIsEliminationMode((prev) => {
      if (prev) setEliminatedChoices(new Set());
      return !prev;
    });
  }, []);

  const handleChoicePanelClick = useCallback(
    (choiceId: string) => {
      if (isEliminationMode) {
        setEliminatedChoices((prev) => {
          const next = new Set(prev);
          if (next.has(choiceId)) next.delete(choiceId);
          else next.add(choiceId);
          return next;
        });
      } else {
        handleAnswerChangeRef.current({
          choiceId,
          textAnswer: currentAnswerRef.current.textAnswer,
        });
      }
    },
    [isEliminationMode],
  );

  const handleEliminationToggle = useCallback((choiceId: string) => {
    setEliminatedChoices((prev) => {
      const next = new Set(prev);
      if (next.has(choiceId)) next.delete(choiceId);
      else next.add(choiceId);
      return next;
    });
  }, []);

  const handleEliminationUndo = useCallback((choiceId: string) => {
    setEliminatedChoices((prev) => {
      const next = new Set(prev);
      next.delete(choiceId);
      return next;
    });
  }, []);

  const handleGridInChange = useCallback((value: string) => {
    handleAnswerChangeRef.current({
      textAnswer: value,
      choiceId: currentAnswerRef.current.choiceId,
    });
  }, []);

  const handleClearNotes = useCallback(() => {
    if (!testState) return;
    const newNotes = new Map(questionNotes);
    newNotes.delete(testState.currentQuestionIndex);
    setQuestionNotes(newNotes);
    saveNotesToStorage(newNotes);
  }, [questionNotes, testState, saveNotesToStorage]);

  const handleRefreshContinue = useCallback(() => {
    setShowRefreshModal(false);
  }, []);

  const handleRefreshSaveAndExit = useCallback(() => {
    setShowRefreshModal(false);
    void handleSaveAndExit();
  }, [handleSaveAndExit]);

  const handlePassageHighlightsChange = useCallback(
    (
      questionId: string,
      highlights: Array<{
        startOffset: number;
        endOffset: number;
        color: "YELLOW" | "GREEN" | "BLUE" | "PINK" | "ORANGE";
        note?: string | null;
      }>,
    ) => {
      if (highlights.length > 0) {
        const key = getHighlightsStorageKey();
        try {
          const raw =
            typeof window !== "undefined" ? localStorage.getItem(key) : null;
          const all = raw
            ? (JSON.parse(raw) as Record<string, unknown>)
            : {};
          all[`${questionId}_passage`] = highlights;
          if (typeof window !== "undefined")
            localStorage.setItem(key, JSON.stringify(all));
        } catch (e) {
          console.error(e);
        }
      }
    },
    [getHighlightsStorageKey],
  );

  // Close more menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMoreMenu && !(event.target as Element).closest(".relative")) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMoreMenu]);

  const deferredTextAnswer = useDeferredValue(currentAnswer.textAnswer);

  const navigatorAnsweredSet = useMemo(() => {
    const idx = testState?.currentQuestionIndex ?? 0;
    const next = new Set<number>(answeredQuestions);
    const refLive = currentAnswerRef.current;
    const live =
      refLive.choiceId !== undefined || refLive.textAnswer !== undefined
        ? refLive
        : currentAnswer;
    const hasChoice = live.choiceId !== undefined && live.choiceId !== null;
    const hasText =
      live.textAnswer != null && String(live.textAnswer).trim() !== "";
    const hasMeta =
      flaggedQuestionsRef.current.has(idx) || eliminatedChoices.size > 0;
    if (hasChoice || hasText || hasMeta) next.add(idx);
    else next.delete(idx);
    return next;
  }, [
    answeredQuestions,
    currentAnswer,
    eliminatedChoices.size,
    testState?.currentQuestionIndex,
  ]);

  const navigatorFlaggedSet = useMemo(
    () => new Set(flaggedQuestions),
    [flaggedQuestions],
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  if (!testState || !testState.question) {
    return (
      <div className="flex min-h-screen bg-white items-center justify-center">
        <Card className="p-8 max-w-md w-full">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4 text-red-600">Error</h2>
            <p className="text-gray-700 mb-6">
              {error || "Failed to load test"}
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard/practice")}
              >
                Back to Tests
              </Button>
              <Button
                variant="default"
                onClick={() => {
                  setError("");
                  loadTestState();
                }}
              >
                Retry
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const question: Question = testState.question;
  const totalQs =
    totalQuestions ?? testState.currentModule?.totalQuestions ?? 0;

  const isLastQuestion =
    testState.currentQuestionIndex === Math.max(0, totalQs - 1);
  const isFlagged = flaggedQuestions.has(testState.currentQuestionIndex);
  const displayTextAnswer = deferredTextAnswer;

  return (
    <div className="fixed inset-0 flex bg-white overflow-hidden">
      {/* Fullscreen choice modal – minimal, two options only */}
      {showFullscreenWarning && (
        <FullscreenWarningModal
          reason={fullscreenModalReason}
          countdown={countdown}
          onEnterFullscreen={handleEnterFullscreen}
          onContinueWithoutFullscreen={handleContinueWithoutFullscreen}
        />
      )}

      <div className="flex-1 min-h-0 flex flex-col transition-all duration-300 relative overflow-hidden">
        <main className="flex-1 min-h-0 relative z-10 flex flex-col">
          <div
            className="flex-1 min-h-0 flex flex-col font-noto-serif transition-all duration-300 text-xs sm:text-sm md:text-base"
            style={{ lineHeight: "1.5" }}
          >
            <TestHeader
              sectionOrderIndex={testState.currentSection.orderIndex}
              moduleNumber={testState.currentModule.moduleNumber}
              sectionType={testState.currentSection.type}
              moduleDeadline={moduleDeadline}
              onTimeUp={handleTimeUp}
              onRemainingSecondsChange={handleRemainingSecondsChange}
              isTimerHidden={isTimerHidden}
              onHideTimer={handleHideTimer}
              onShowTimer={handleShowTimer}
              isMarkupEnabled={isMarkupEnabled}
              onToggleMarkup={handleToggleMarkup}
              onOpenNotes={handleOpenNotes}
              showReferenceSheet={showReferenceSheet}
              onToggleReferenceSheet={handleToggleReferenceSheet}
              showCalculator={showCalculator}
              onToggleCalculator={handleToggleCalculator}
              showMoreMenu={showMoreMenu}
              onToggleMoreMenu={handleToggleMoreMenu}
              onSaveAndExitFromMenu={handleSaveAndExitFromMenu}
            />

            {/* Content row: MATH 1-ustun = markaz (60%), MATH 2-ustun = full width */}
            <div
              className={`flex-1 min-h-[50vh] min-[920px]:min-h-0 flex min-w-0 overflow-hidden transition-[justify-content] duration-300 ease-out ${testState.currentSection.type === "MATH" && !(showCalculator || showReferenceSheet) && hasChoiceOptions(question) ? "lg:justify-center" : ""}`}
            >
              {testState.currentSection.type === "MATH" && (
                <MathToolsColumn
                  isDesktopLayout={isDesktopLayout}
                  showCalculator={showCalculator}
                  showReferenceSheet={showReferenceSheet}
                  attemptId={attemptId}
                  desmosSize={desmosSize}
                  desmosPosition={desmosPosition}
                  referenceSheetSize={referenceSheetSize}
                  referenceSheetPosition={referenceSheetPosition}
                  onDesmosSizeChange={setDesmosSize}
                  onDesmosPositionChange={setDesmosPosition}
                  onReferenceSheetSizeChange={setReferenceSheetSize}
                  onReferenceSheetPositionChange={setReferenceSheetPosition}
                  onCloseCalculator={() => setShowCalculator(false)}
                  onCloseReferenceSheet={() => setShowReferenceSheet(false)}
                />
              )}
              {/* Right column: MATH 1-ustun = 60%, MATH 2-ustun = 100%, ENGLISH = 100% */}
              <div
                className={`min-h-[45vh] min-[920px]:min-h-0 flex flex-col relative overflow-hidden px-3 sm:px-4 lg:px-5 z-0 min-w-0 w-full flex-1 transition-[flex,max-width,width] duration-300 ease-out ${
                  testState.currentSection.type === "MATH" &&
                  (showCalculator || showReferenceSheet)
                    ? "lg:flex-[0_0_50%] lg:w-auto"
                    : testState.currentSection.type === "MATH" &&
                        hasChoiceOptions(question)
                      ? "lg:w-[60%] lg:max-w-full lg:flex-none"
                      : ""
                }`}
              >
                {/* Desktop (≥920px): 2-ustun; JS orqali faqat katta ekranda */}
                {isDesktopLayout && (
                  <DesktopTestContent
                    layoutContainerRef={layoutContainerRef}
                    sectionType={testState.currentSection.type}
                    question={question}
                    questionIndex={testState.currentQuestionIndex + 1}
                    isFlagged={isFlagged}
                    isEliminationMode={isEliminationMode}
                    eliminatedChoiceIds={eliminatedChoices}
                    selectedChoiceId={currentAnswer.choiceId}
                    displayTextAnswer={displayTextAnswer}
                    gridInValue={currentAnswer.textAnswer || ""}
                    isMarkupEnabled={isMarkupEnabled}
                    attemptId={attemptId}
                    splitPosition={splitPosition}
                    onDividerMouseDown={handleDividerMouseDown}
                    onToggleFlag={handleToggleFlag}
                    onToggleEliminationMode={handleToggleEliminationMode}
                    onSelectChoice={handleSelectChoice}
                    onTextAnswerChange={handleTextAnswerChange}
                    onQuestionHighlightsChange={handleHighlightsChange}
                    onQuestionTextHighlightsChange={persistQuestionTextHighlights}
                    onPassageHighlightsChange={handlePassageHighlightsChange}
                    onChoiceClick={handleChoicePanelClick}
                    onEliminationToggle={handleEliminationToggle}
                    onEliminationUndo={handleEliminationUndo}
                    onGridInChange={handleGridInChange}
                  />
                )}

                {!isDesktopLayout && (
                  <MobileTestContent
                    sectionType={testState.currentSection.type}
                    question={question}
                    questionIndex={testState.currentQuestionIndex + 1}
                    isFlagged={isFlagged}
                    isEliminationMode={isEliminationMode}
                    eliminatedChoiceIds={eliminatedChoices}
                    selectedChoiceId={currentAnswer.choiceId}
                    displayTextAnswer={displayTextAnswer}
                    isMarkupEnabled={isMarkupEnabled}
                    attemptId={attemptId}
                    onToggleFlag={handleToggleFlag}
                    onToggleEliminationMode={handleToggleEliminationMode}
                    onSelectChoice={handleSelectChoice}
                    onTextAnswerChange={handleTextAnswerChange}
                    onQuestionHighlightsChange={handleHighlightsChange}
                    onPassageHighlightsChange={handlePassageHighlightsChange}
                    onChoiceClick={handleChoicePanelClick}
                    onEliminationToggle={handleEliminationToggle}
                    onEliminationUndo={handleEliminationUndo}
                  />
                )}
              </div>
            </div>

            <TestFooter
              userLabel={
                currentUser?.name ||
                currentUser?.email?.split("@")[0] ||
                "User"
              }
              currentQuestionIndex={testState.currentQuestionIndex}
              totalQuestions={totalQs}
              isLastQuestion={isLastQuestion}
              submitting={submitting}
              isQuestionLoading={isQuestionLoading}
              onToggleNavigator={handleToggleNavigator}
              onPrevious={handlePrevious}
              onNext={handleNext}
              onFinishSection={handleFinishSection}
            />
          </div>
        </main>
      </div>

      {/* Question Navigator Modal */}
      {showNavigator && (
        <QuestionNavigator
          totalQuestions={totalQs}
          currentIndex={testState.currentQuestionIndex}
          answeredSet={navigatorAnsweredSet}
          flaggedSet={navigatorFlaggedSet}
          onJump={handleJumpToQuestion}
          onClose={() => setShowNavigator(false)}
          sectionTitle={`Section ${
            testState.currentSection.orderIndex + 1
          }, Module ${testState.currentModule.moduleNumber}: ${
            testState.currentSection.type === "ENGLISH"
              ? "Reading and Writing"
              : "Math"
          } Questions`}
          onGoToReview={handleGoToModuleReview}
        />
      )}

      <RefreshConfirmDialog
        open={showRefreshModal}
        onOpenChange={setShowRefreshModal}
        onContinue={handleRefreshContinue}
        onSaveAndExit={handleRefreshSaveAndExit}
      />

      {showNotesModal && (
        <NotesPanel
          questionIndex={testState.currentQuestionIndex + 1}
          noteText={questionNotes.get(testState.currentQuestionIndex)}
          newNoteText={newNoteText}
          onNewNoteTextChange={setNewNoteText}
          onClose={() => setShowNotesModal(false)}
          onAddNote={handleAddNote}
          onClearNotes={handleClearNotes}
        />
      )}
    </div>
  );
}
