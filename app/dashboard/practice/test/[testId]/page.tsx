"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { Card } from "@/src/ui/card";
import { Button } from "@/src/ui/button";
import { Loading } from "@/src/ui/loading";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/ui/dialog";
import {
  practiceService,
  StartTestResponse,
  Question,
} from "@/src/services/practice.service";
import { ApiClientError } from "@/src/lib/api-client";
import { TestTimer } from "@/src/components/practice/TestTimer";
import { QuestionDisplay } from "@/src/components/practice/QuestionDisplay";
import { QuestionNavigator } from "@/src/components/practice/QuestionNavigator";
import {
  Calculator,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Flag,
  Highlighter,
  Grid3X3,
  Eye,
  EyeOff,
  Type,
  X,
  StickyNote,
  Edit,
  MoreVertical,
} from "lucide-react";
import { useCurrentUser } from "@/src/hooks/use-auth";
import { debounce } from "@/src/utils/request-queue";

const QUESTIONS_PER_MODULE = { ENGLISH: 27, MATH: 22 } as const;

/** Strict Mode / double mount da loadTestState ikki marta chaqilmasin – so‘nggi natija cache (qisqa vaqt) */
let loadStateCache: { attemptId: string; state: StartTestResponse; ts: number } | null = null;
const LOAD_STATE_CACHE_MS = 2500;

export default function TestTakingPage() {
  const router = useRouter();
  const params = useParams();
  // NOTE: Route segment is [testId], but here it actually represents attemptId
  const attemptId = params.testId as string;
  const { data: currentUser } = useCurrentUser();

  const [testState, setTestState] = useState<StartTestResponse | null>(null);
  // Local cache for all questions in current module
  const [questionsCache, setQuestionsCache] = useState<Map<number, Question>>(
    new Map()
  );
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(
    new Set()
  );
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(
    new Set()
  );
  const [currentAnswer, setCurrentAnswer] = useState<{
    choiceId?: string;
    textAnswer?: string;
  }>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [totalQuestions, setTotalQuestions] = useState<number | null>(null);
  // Pending answers to submit in background
  const [pendingAnswers, setPendingAnswers] = useState<
    Map<number, { questionId: string; choiceId?: string; textAnswer?: string }>
  >(new Map());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFullscreenWarning, setShowFullscreenWarning] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showNavigator, setShowNavigator] = useState(false);
  const [isMarkupEnabled, setIsMarkupEnabled] = useState(false);
  const [isTimerHidden, setIsTimerHidden] = useState(false);
  const [remainingTimeSeconds, setRemainingTimeSeconds] = useState<
    number | null
  >(null);
  const [isEliminationMode, setIsEliminationMode] = useState(false);
  const [eliminatedChoices, setEliminatedChoices] = useState<Set<string>>(
    new Set()
  );
  const [questionNotes, setQuestionNotes] = useState<Map<number, string>>(
    new Map()
  );
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [newNoteText, setNewNoteText] = useState("");

  // localStorage key for notes
  const getNotesStorageKey = useCallback(
    () => `test_notes_${attemptId}`,
    [attemptId]
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
    [getNotesStorageKey]
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
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const wasFullscreenRef = useRef(false);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const loadAnswersTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastAnswersLoadRef = useRef<number>(0);
  const ANSWERS_CACHE_DURATION = 15000; // 15 sec – kam so‘rov uchun
  const preloadTimeoutRef = useRef<number | null>(null);
  const preloadInFlightRef = useRef<boolean>(false);
  /** Goto so‘rovlari ketma-ket – 429 kamayadi */
  const gotoMutexRef = useRef<Promise<unknown>>(Promise.resolve());
  /** loadTestState dublikat chaqirilmasin (Strict Mode / remount) */
  const loadTestStateInFlightRef = useRef(false);
  /** Next/Prev/Jump davomida ikkinchi so‘rov ketmasin – 1 so‘rov, keyin 2 kelmasin */
  const navigationInFlightRef = useRef(false);

  // Resizable 2-column layout state
  const [splitPosition, setSplitPosition] = useState(50); // percentage for left pane
  const layoutContainerRef = useRef<HTMLDivElement | null>(null);
  const isDraggingDividerRef = useRef(false);

  // localStorage key for answers
  const getStorageKey = useCallback(
    () => `test_answers_${attemptId}`,
    [attemptId]
  );

  // sessionStorage: savollarni backenddan olgach saqlash (tez o‘tish uchun)
  const getQuestionsStorageKey = useCallback(
    () => `test_questions_${attemptId}`,
    [attemptId]
  );

  const saveQuestionToLocal = useCallback(
    (index: number, question: Question) => {
      setQuestionsCache((prev) => {
        const next = new Map(prev);
        next.set(index, question);
        return next;
      });
      if (typeof window === "undefined") return;
      try {
        const key = getQuestionsStorageKey();
        const raw = sessionStorage.getItem(key);
        const data: Record<string, Question> = raw ? JSON.parse(raw) : {};
        data[String(index)] = question;
        sessionStorage.setItem(key, JSON.stringify(data));
      } catch (e) {
        console.warn("saveQuestionToLocal:", e);
      }
    },
    [getQuestionsStorageKey]
  );

  const getQuestionFromLocal = useCallback(
    (index: number): Question | null => {
      const fromCache = questionsCache.get(index);
      if (fromCache) return fromCache;
      if (typeof window === "undefined") return null;
      try {
        const raw = sessionStorage.getItem(getQuestionsStorageKey());
        if (!raw) return null;
        const data: Record<string, Question> = JSON.parse(raw);
        const q = data[String(index)];
        if (q) {
          setQuestionsCache((prev) => {
            const next = new Map(prev);
            next.set(index, q);
            return next;
          });
          return q;
        }
      } catch (e) {
        console.warn("getQuestionFromLocal:", e);
      }
      return null;
    },
    [getQuestionsStorageKey, questionsCache]
  );

  // localStorage key for highlights
  const getHighlightsStorageKey = useCallback(
    () => `test_highlights_${attemptId}`,
    [attemptId]
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
      // Clamp between 20% and 80%
      next = Math.max(20, Math.min(80, next));
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

  const handleDividerMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      isDraggingDividerRef.current = true;
      document.body.style.cursor = "col-resize";
    },
    []
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
      }>
    ) => {
      if (typeof window === "undefined") return;
      try {
        const key = getHighlightsStorageKey();
        const stored = localStorage.getItem(key);
        const allHighlights = stored ? JSON.parse(stored) : {};
        allHighlights[questionId] = highlights;
        localStorage.setItem(key, JSON.stringify(allHighlights));
      } catch (err) {
        console.error("Failed to save highlights to localStorage:", err);
      }
    },
    [getHighlightsStorageKey]
  );

  // Submit all highlights to backend (batch)
  const submitAllHighlights = useCallback(async () => {
    const allHighlights = getAllHighlightsFromStorage();

    if (allHighlights.size === 0) {
      console.log("[Test Page] No highlights to submit");
      return;
    }

    console.log(
      `[Test Page] Submitting ${allHighlights.size} question highlights to server...`
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
              highlights
            );
          } catch (err) {
            console.error(
              `Failed to submit highlights for question ${questionId}:`,
              err
            );
          }
        })()
      );
    }

    await Promise.all(submitPromises);
    console.log("[Test Page] All highlights submitted successfully");
  }, [attemptId, getAllHighlightsFromStorage]);

  // Load answers from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined" && attemptId) {
      try {
        const stored = localStorage.getItem(getStorageKey());
        if (stored) {
          const answers = JSON.parse(stored);
          // Restore answered questions set
          const answeredSet = new Set<number>();
          Object.keys(answers).forEach((key) => {
            if (answers[key]) {
              answeredSet.add(parseInt(key));
            }
          });
          setAnsweredQuestions(answeredSet);
        }
      } catch (err) {
        console.error("Failed to load answers from localStorage:", err);
      }
    }
  }, [attemptId, getStorageKey]);

  // Save answer to localStorage
  const saveAnswerToStorage = useCallback(
    (
      questionIndex: number,
      answer: {
        questionId: string;
        choiceId?: string;
        textAnswer?: string;
        markedForReview?: boolean;
        eliminatedChoices?: string[];
      }
    ) => {
      if (typeof window === "undefined") return;

      try {
        const key = getStorageKey();
        const stored = localStorage.getItem(key);
        const answers = stored ? JSON.parse(stored) : {};
        answers[questionIndex] = answer;
        localStorage.setItem(key, JSON.stringify(answers));
      } catch (err) {
        console.error("Failed to save answer to localStorage:", err);
      }
    },
    [getStorageKey]
  );

  // Get all answers from localStorage
  const getAllAnswersFromStorage = useCallback((): Map<
    number,
    {
      questionId: string;
      choiceId?: string;
      textAnswer?: string;
      markedForReview?: boolean;
      eliminatedChoices?: string[];
    }
  > => {
    if (typeof window === "undefined") return new Map();

    try {
      const stored = localStorage.getItem(getStorageKey());
      if (!stored) return new Map();

      const answers = JSON.parse(stored);
      const map = new Map<
        number,
        {
          questionId: string;
          choiceId?: string;
          textAnswer?: string;
          markedForReview?: boolean;
          eliminatedChoices?: string[];
        }
      >();
      Object.keys(answers).forEach((key) => {
        map.set(parseInt(key), answers[key]);
      });
      return map;
    } catch (err) {
      console.error("Failed to get answers from localStorage:", err);
      return new Map();
    }
  }, [getStorageKey]);

  // Restore saved answer for a question index when navigating (back/next/jump)
  const applySavedAnswerForIndex = useCallback(
    (index: number) => {
      const savedAnswer = getAllAnswersFromStorage().get(index);
      if (savedAnswer) {
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
        setCurrentAnswer({});
        setEliminatedChoices(new Set());
      }
    },
    [getAllAnswersFromStorage]
  );

  // Persist current question answer to localStorage whenever user changes selection/text/flag/eliminations
  // So all questions' answers are saved; user can go to any question and see/edit their answer before finishing
  const isFlaggedCurrent = testState?.question
    ? flaggedQuestions.has(testState.currentQuestionIndex)
    : false;
  useEffect(() => {
    if (!testState?.question) return;
    const idx = testState.currentQuestionIndex;
    const questionId = testState.question.id;
    const answerData = {
      questionId,
      choiceId: currentAnswer.choiceId,
      textAnswer: currentAnswer.textAnswer,
      markedForReview: isFlaggedCurrent,
      eliminatedChoices: Array.from(eliminatedChoices),
    };
    saveAnswerToStorage(idx, answerData);
    setPendingAnswers((prev) => {
      const next = new Map(prev);
      next.set(idx, answerData);
      return next;
    });
    if (
      currentAnswer.choiceId != null ||
      (currentAnswer.textAnswer != null &&
        currentAnswer.textAnswer.trim() !== "")
    ) {
      setAnsweredQuestions((prev) => {
        const next = new Set(prev);
        next.add(idx);
        return next;
      });
    }
  }, [
    testState?.currentQuestionIndex,
    testState?.question,
    currentAnswer.choiceId,
    currentAnswer.textAnswer,
    isFlaggedCurrent,
    eliminatedChoices,
    saveAnswerToStorage,
  ]);

  // Clear localStorage on unmount (only if test is completed)
  useEffect(() => {
    return () => {
      if (loadAnswersTimeoutRef.current) {
        clearTimeout(loadAnswersTimeoutRef.current);
      }
      if (preloadTimeoutRef.current !== null) {
        window.clearTimeout(preloadTimeoutRef.current);
      }
    };
  }, []);

  // Agar module-review sahifasidan ma'lum bir savolga qaytish kerak bo'lsa – faqat index hozirgi savoldan farq qilsa goto
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
    // Allaqachon shu savolda bo‘lsak – qayta goto so‘rov yubormaymiz (dublikat 1/0 so‘rovlari kamayadi)
    if (index === testState.currentQuestionIndex) return;
    handleJumpToQuestion(index).catch((err) =>
      console.error("[Test Page] Failed to jump from module review:", err)
    );
  }, [attemptId, handleJumpToQuestion, testState]);

  useEffect(() => {
    loadTestState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId]);

  const handleCancelTest = useCallback(async () => {
    try {
      await practiceService.abandonAttempt(attemptId);
    } catch (err) {
      // Attempt already completed/abandoned – redirect without error
      if (
        err instanceof ApiClientError &&
        err.status === 400 &&
        /not in progress/i.test(err.message ?? "")
      ) {
        router.push("/dashboard/practice");
        return;
      }
      console.error("Failed to abandon attempt:", err);
    }
    router.push("/dashboard/practice");
  }, [attemptId, router]);

  const startCountdown = useCallback(() => {
    // Clear existing countdown
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // If still not in fullscreen, cancel test
          if (!document.fullscreenElement) {
            handleCancelTest();
            return 0;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    countdownIntervalRef.current = interval;
  }, [handleCancelTest]);

  // Check fullscreen on mount
  useEffect(() => {
    if (typeof document !== "undefined") {
      const isFs = !!document.fullscreenElement;
      setIsFullscreen(isFs);
      wasFullscreenRef.current = isFs;

      // If not in fullscreen, show warning modal with countdown
      if (!isFs) {
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

  // Handle continue without fullscreen (smaller text mode)
  const handleContinueWithoutFullscreen = useCallback(() => {
    setShowFullscreenWarning(false);
    setCountdown(10);
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    // Test continues but user is warned they're not in fullscreen
    // UI will be smaller but functional
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
        // Fullscreen exited - show warning and start countdown
        if (wasFullscreenRef.current) {
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

  /** Goto so‘rovini ketma-ketlashtirish – 429 kamayadi */
  const runGoto = useCallback(
    (index: number): Promise<StartTestResponse> => {
      const prev = gotoMutexRef.current;
      const p = prev
        .then(() => practiceService.jumpToQuestion(attemptId, index))
        .catch((err) => {
          throw err;
        });
      gotoMutexRef.current = p;
      return p as Promise<StartTestResponse>;
    },
    [attemptId]
  );

  // Keyingi savolni faqat cache'ga yuklash – runGoto(currentIndex) chaqirmaymiz, chunki u state'ni ustiga yozadi va 429 oshadi
  const preloadNextQuestions = useCallback(
    (currentIndex: number, totalQuestions: number) => {
      const nextIndex = currentIndex + 1;
      if (nextIndex >= totalQuestions) return;
      if (getQuestionFromLocal(nextIndex)) return;
      if (preloadInFlightRef.current) return;
      if (preloadTimeoutRef.current !== null) {
        window.clearTimeout(preloadTimeoutRef.current);
      }
      preloadTimeoutRef.current = window.setTimeout(() => {
        preloadTimeoutRef.current = null;
        if (preloadInFlightRef.current) return;
        if (getQuestionFromLocal(nextIndex)) return;
        preloadInFlightRef.current = true;
        runGoto(nextIndex)
          .then((nextState) => {
            if (nextState?.question && nextState.currentQuestionIndex === nextIndex)
              saveQuestionToLocal(nextIndex, nextState.question);
          })
          .catch(() => {})
          .finally(() => {
            preloadInFlightRef.current = false;
          });
      }, 3500);
    },
    [getQuestionFromLocal, saveQuestionToLocal, runGoto]
  );

  async function loadTestState() {
    if (loadTestStateInFlightRef.current) return;
    // Strict Mode / double mount: yaqinda cache bo‘lsa so‘rov yubormaymiz – dublikat current kamayadi
    if (
      loadStateCache?.attemptId === attemptId &&
      Date.now() - loadStateCache.ts < LOAD_STATE_CACHE_MS
    ) {
      const state = loadStateCache.state;
      setTestState(state);
      setEliminatedChoices(new Set());
      if (state.question) saveQuestionToLocal(state.currentQuestionIndex, state.question);
      const savedAnswer = getAllAnswersFromStorage().get(state.currentQuestionIndex);
      if (savedAnswer) {
        setCurrentAnswer({ choiceId: savedAnswer.choiceId, textAnswer: savedAnswer.textAnswer });
        if (savedAnswer.eliminatedChoices?.length)
          setEliminatedChoices(new Set(savedAnswer.eliminatedChoices));
      } else setCurrentAnswer({});
      if (state?.currentModule?.totalQuestions) {
        const sectionType = state.currentSection?.type ?? "ENGLISH";
        const cap = QUESTIONS_PER_MODULE[sectionType] ?? 27;
        setTotalQuestions(Math.min(state.currentModule.totalQuestions, cap));
      }
      setAnsweredQuestions(new Set(getAllAnswersFromStorage().keys()));
      setLoading(false);
      return;
    }
    loadTestStateInFlightRef.current = true;
    try {
      setLoading(true);
      setError(""); // Clear previous errors
      const state = await practiceService.getCurrentQuestion(attemptId);

      // Validate state structure
      if (!state) {
        setError("Invalid test state received from server");
        return;
      }

      // Check if test requires break or is completed
      if ((state as any).requiresBreak) {
        router.push(`/dashboard/practice/test/${attemptId}/break`);
        return;
      }

      if ((state as any).requiresFinish) {
        router.push(`/dashboard/practice/test/${attemptId}/finish`);
        return;
      }

      if (!state.question) {
        console.error("[Test Page] No question in state:", state);
        setError(
          "No current question available. The test may have been completed or abandoned."
        );
        return;
      }

      setTestState(state);
      loadStateCache = { attemptId, state, ts: Date.now() };
      setEliminatedChoices(new Set()); // Clear eliminations when loading new question
      saveQuestionToLocal(state.currentQuestionIndex, state.question);

      // Load saved answer for current question from localStorage
      const savedAnswer = getAllAnswersFromStorage().get(
        state.currentQuestionIndex
      );
      if (savedAnswer) {
        setCurrentAnswer({
          choiceId: savedAnswer.choiceId,
          textAnswer: savedAnswer.textAnswer,
        });
        // Restore eliminated choices if any
        if (
          savedAnswer.eliminatedChoices &&
          savedAnswer.eliminatedChoices.length > 0
        ) {
          setEliminatedChoices(new Set(savedAnswer.eliminatedChoices));
        }
        // Restore flagged status if any
        if (savedAnswer.markedForReview) {
          setFlaggedQuestions((prev) => {
            const next = new Set(prev);
            next.add(state.currentQuestionIndex);
            return next;
          });
        }
      } else {
        setCurrentAnswer({});
      }

      // Set totalQuestions from current module, capped to SAT standard (27/22) so navigation and goto stay correct
      if (state?.currentModule?.totalQuestions) {
        const sectionType = state.currentSection?.type ?? "ENGLISH";
        const cap = QUESTIONS_PER_MODULE[sectionType] ?? 27;
        const total = Math.min(state.currentModule.totalQuestions, cap);
        setTotalQuestions(total);

        preloadNextQuestions(state.currentQuestionIndex, total);
      } else {
        console.warn(
          "[Test Page] No totalQuestions in currentModule:",
          state.currentModule
        );
      }

      // Initialize timer if module duration is available
      if (state?.currentModule?.duration && remainingTimeSeconds === null) {
        const durationSeconds = state.currentModule.duration * 60; // Convert minutes to seconds
        setRemainingTimeSeconds(durationSeconds);
      }

      // Answered questions: localStorage dan (API so‘rovsiz – kam so‘rov)
      const stored = getAllAnswersFromStorage();
      setAnsweredQuestions(new Set(stored.keys()));
    } catch (err) {
      console.error("[Test Page] Failed to load test state:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load test";
      setError(errorMessage);

      // If it's a 404 or 401, provide more specific error
      if (err instanceof Error && err.message.includes("404")) {
        setError(
          "Test attempt not found. It may have been deleted or expired."
        );
      } else if (err instanceof Error && err.message.includes("401")) {
        setError("Unauthorized. Please log in again.");
      } else if (err instanceof Error && /429|Too Many Requests/i.test(err.message)) {
        setError("Server busy (Too Many Requests). Click Retry below or wait a moment and refresh.");
      }
    } finally {
      setLoading(false);
      loadTestStateInFlightRef.current = false;
    }
  }

  async function loadAnsweredQuestions(
    currentState?: StartTestResponse,
    force = false
  ) {
    // Throttle: don't load if called within cache duration
    const now = Date.now();
    if (!force && now - lastAnswersLoadRef.current < ANSWERS_CACHE_DURATION) {
      console.log(
        "[Test Page] Skipping loadAnsweredQuestions - too soon after last load"
      );
      return;
    }

    try {
      lastAnswersLoadRef.current = now;
      const answers = await practiceService.getAnsweredQuestions(attemptId);
      const state = currentState || testState;

      if (!answers || !Array.isArray(answers.answers)) {
        setAnsweredQuestions(new Set());
        const raw =
          state?.currentModule?.totalQuestions ??
          testState?.currentModule?.totalQuestions ??
          answers?.totalQuestions ??
          0;
        const sectionType = state?.currentSection?.type ?? testState?.currentSection?.type ?? "ENGLISH";
        const cap = QUESTIONS_PER_MODULE[sectionType] ?? 27;
        setTotalQuestions(Math.min(raw, cap));
        return;
      }

      const answeredSet = new Set(
        answers.answers.filter((a) => a.answered).map((a) => a.questionIndex)
      );
      setAnsweredQuestions(answeredSet);

      const raw =
        state?.currentModule?.totalQuestions ??
        testState?.currentModule?.totalQuestions ??
        answers?.totalQuestions ??
        0;
      const sectionType = state?.currentSection?.type ?? testState?.currentSection?.type ?? "ENGLISH";
      const cap = QUESTIONS_PER_MODULE[sectionType] ?? 27;
      setTotalQuestions(Math.min(raw, cap));
    } catch (err) {
      console.error("Failed to load answered questions:", err);
      const state = currentState || testState;
      if (state?.currentModule?.totalQuestions) {
        const sectionType = state.currentSection?.type ?? "ENGLISH";
        const cap = QUESTIONS_PER_MODULE[sectionType] ?? 27;
        setTotalQuestions(Math.min(state.currentModule.totalQuestions, cap));
      }
    }
  }

  // Debounced version for frequent calls
  function debouncedLoadAnsweredQuestions(currentState?: StartTestResponse) {
    // Clear existing timeout
    if (loadAnswersTimeoutRef.current) {
      clearTimeout(loadAnswersTimeoutRef.current);
    }

    // Set new timeout
    loadAnswersTimeoutRef.current = setTimeout(() => {
      loadAnsweredQuestions(currentState, false).catch(console.error);
    }, 500); // Wait 500ms after last call
  }

  // Save answer to localStorage only (no server request during test)
  const handleAnswer = useCallback(() => {
    if (!testState?.question) return;

    const currentIndex = testState.currentQuestionIndex;
    const questionId = testState.question.id;

    const answerData = {
      questionId,
      choiceId: currentAnswer.choiceId,
      textAnswer: currentAnswer.textAnswer,
      markedForReview: flaggedQuestions.has(currentIndex),
      eliminatedChoices: Array.from(eliminatedChoices),
    };

    // Save to localStorage immediately
    saveAnswerToStorage(currentIndex, answerData);

    // Store in pending answers map (for submission at end)
    setPendingAnswers((prev) => {
      const next = new Map(prev);
      next.set(currentIndex, answerData);
      return next;
    });

    // Optimistically update answered questions
    setAnsweredQuestions((prev) => {
      const next = new Set(prev);
      next.add(currentIndex);
      return next;
    });

    // Do not clear currentAnswer – selection stays visible; when navigating we load from storage
    // NO SERVER REQUEST - answers will be submitted when test finishes
  }, [
    testState,
    currentAnswer,
    saveAnswerToStorage,
    flaggedQuestions,
    eliminatedChoices,
  ]);

  // Navigate to module review page (no server calls, only local state)
  const handleGoToModuleReview = useCallback(() => {
    if (!testState?.currentModule || totalQuestions === null) return;
    // Make sure current answer is persisted to localStorage
    handleAnswer();
    const sectionNum = testState.currentSection.orderIndex + 1;
    const moduleNum = testState.currentModule.moduleNumber;
    const type = testState.currentSection.type;
    const total = totalQuestions;
    router.push(
      `/dashboard/practice/test/${attemptId}/module-review?section=${sectionNum}&module=${moduleNum}&type=${type}&total=${total}`
    );
  }, [attemptId, handleAnswer, router, testState, totalQuestions]);

  async function handleNext() {
    if (!testState?.question) return;
    if (navigationInFlightRef.current) return;

    const currentIndex = testState.currentQuestionIndex;
    const nextIndex = currentIndex + 1;
    const cap = totalQuestions ?? QUESTIONS_PER_MODULE[testState.currentSection?.type ?? "ENGLISH"] ?? 27;
    if (nextIndex >= cap) {
      handleGoToModuleReview();
      return;
    }

    try {
      navigationInFlightRef.current = true;
      setSubmitting(true);

      handleAnswer();
      setIsMarkupEnabled(false);

      // Har doim API'dan yangi savolni olish – faqat javob so'ralgan indexga mos bo'lsa state yangilaymiz
      const nextState = await runGoto(nextIndex);
      if (nextState.currentQuestionIndex !== nextIndex) return;
      setTestState(nextState);
      if (nextState.question)
        saveQuestionToLocal(nextIndex, nextState.question);
      applySavedAnswerForIndex(nextIndex);
      if (totalQuestions) preloadNextQuestions(nextIndex, totalQuestions);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to go to next question"
      );
    } finally {
      setSubmitting(false);
      navigationInFlightRef.current = false;
    }
  }

  async function handlePrevious() {
    if (!testState?.question) return;
    if (navigationInFlightRef.current) return;

    try {
      navigationInFlightRef.current = true;
      setSubmitting(true);

      // Save current answer (no server request)
      handleAnswer();

      // Clear markup when moving to previous question
      setIsMarkupEnabled(false);

      const currentIndex = testState.currentQuestionIndex;
      const prevIndex = currentIndex - 1;

      // Har doim API'dan yangi savolni olish – faqat javob so'ralgan indexga mos bo'lsa state yangilaymiz
      const prevState = await runGoto(prevIndex);
      if (prevState.currentQuestionIndex !== prevIndex) return;
      setTestState(prevState);
      if (prevState.question)
        saveQuestionToLocal(prevIndex, prevState.question);
      applySavedAnswerForIndex(prevIndex);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to go to previous question"
      );
    } finally {
      setSubmitting(false);
      navigationInFlightRef.current = false;
    }
  }

  async function handleJumpToQuestion(index: number) {
    if (!testState?.question) return;
    if (navigationInFlightRef.current) return;

    const cap = totalQuestions ?? QUESTIONS_PER_MODULE[testState.currentSection?.type ?? "ENGLISH"] ?? 27;
    if (index < 0 || index >= cap) return;

    try {
      navigationInFlightRef.current = true;
      setSubmitting(true);

      handleAnswer();
      setIsMarkupEnabled(false);

      // Har doim API'dan yangi savolni olish – faqat so'ralgan index bo'lsa state yangilaymiz (eski javob ustiga yozilmasin)
      const state = await runGoto(index);
      if (state.currentQuestionIndex !== index) {
        setError("Savol indexi mos kelmadi. Qayta urinib ko'ring.");
        return;
      }
      setTestState(state);
      if (state.question) saveQuestionToLocal(index, state.question);
      applySavedAnswerForIndex(index);
      if (totalQuestions) preloadNextQuestions(index, totalQuestions);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to go to selected question"
      );
    } finally {
      setSubmitting(false);
      navigationInFlightRef.current = false;
    }
  }

  async function handleToggleFlag() {
    if (!testState?.question) return;

    try {
      setFlaggedQuestions((prev) => {
        const next = new Set(prev);
        const idx = testState.currentQuestionIndex;
        if (next.has(idx)) {
          next.delete(idx);
        } else {
          next.add(idx);
        }
        return next;
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to toggle flag status"
      );
    }
  }

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

  // Submit all pending answers from localStorage to server (PRODUCTION-READY: Batch submission)
  const submitAllPendingAnswers = useCallback(async () => {
    const allAnswers = getAllAnswersFromStorage();

    if (allAnswers.size === 0) {
      console.log("[Test Page] No answers to submit");
      return;
    }

    console.log(
      `[Test Page] Submitting ${allAnswers.size} answers to server (batch mode)...`
    );

    // Convert Map to Array to avoid iterator issues
    const answersArray = Array.from(allAnswers.entries());

    // Filter out invalid answers before submission
    const validAnswers = answersArray
      .map(([questionIndex, answer]) => {
        // Get question from cache to check type
        const question = questionsCache.get(questionIndex);

        if (!question) {
          // If question not in cache, include it (will be validated on server)
          return { questionIndex, answer };
        }

        // Validate: MULTIPLE_CHOICE requires choiceId
        if (question.questionType === "MULTIPLE_CHOICE" && !answer.choiceId) {
          console.warn(
            `[Test Page] Skipping question ${questionIndex}: MULTIPLE_CHOICE requires choiceId`
          );
          return null;
        }

        // Validate: STUDENT_PRODUCED requires textAnswer
        if (
          question.questionType === "STUDENT_PRODUCED" &&
          !answer.textAnswer
        ) {
          console.warn(
            `[Test Page] Skipping question ${questionIndex}: STUDENT_PRODUCED requires textAnswer`
          );
          return null;
        }

        return { questionIndex, answer };
      })
      .filter(
        (item): item is { questionIndex: number; answer: any } => item !== null
      );

    if (validAnswers.length === 0) {
      console.log("[Test Page] No valid answers to submit");
      return;
    }

    // PRODUCTION-READY: Use batch submission instead of individual requests
    try {
      const batchAnswers = validAnswers.map(({ answer }) => ({
        questionId: answer.questionId,
        choiceId: answer.choiceId,
        textAnswer: answer.textAnswer,
        markedForReview: answer.markedForReview,
        eliminatedChoices: answer.eliminatedChoices,
      }));

      // Submit in batches of 10 to avoid overwhelming server
      const BATCH_SIZE = 10;
      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < batchAnswers.length; i += BATCH_SIZE) {
        const batch = batchAnswers.slice(i, i + BATCH_SIZE);

        try {
          const result = await practiceService.submitAnswersBatch(
            attemptId,
            batch
          );
          successCount += result.processed;
          failCount += result.failed;

          // Small delay between batches to avoid rate limiting
          if (i + BATCH_SIZE < batchAnswers.length) {
            await new Promise((resolve) => setTimeout(resolve, 300));
          }
        } catch (err) {
          console.error(
            `[Test Page] Batch submission failed for batch ${
              i / BATCH_SIZE + 1
            }:`,
            err
          );
          failCount += batch.length;
        }
      }

      console.log(
        `[Test Page] Batch submission complete: ${successCount} succeeded, ${failCount} failed`
      );
    } catch (err) {
      console.error("[Test Page] Batch submission error:", err);
      // Fallback: individual submission (should rarely happen)
      console.warn("[Test Page] Falling back to individual submission...");

      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < validAnswers.length; i++) {
        const { questionIndex, answer } = validAnswers[i];

        try {
          await practiceService.submitAnswer(
            attemptId,
            answer.questionId,
            answer.choiceId,
            answer.textAnswer,
            answer.markedForReview,
            answer.eliminatedChoices
          );
          successCount++;

          // Delay between requests
          if (i < validAnswers.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 200));
          }
        } catch (err) {
          console.error(
            `Failed to submit answer for question ${questionIndex}:`,
            err
          );
          failCount++;
        }
      }

      console.log(
        `[Test Page] Fallback submission complete: ${successCount} succeeded, ${failCount} failed`
      );
    }
  }, [attemptId, getAllAnswersFromStorage, questionsCache]);

  function handleAnswerChange(answer: {
    choiceId?: string;
    textAnswer?: string;
  }) {
    setCurrentAnswer(answer);
  }

  function getProgress() {
    const total =
      totalQuestions ?? testState?.currentModule?.totalQuestions ?? 0;
    if (!total) return 0;
    return Math.round((answeredQuestions.size / total) * 100);
  }

  const handleTimeUp = useCallback(async () => {
    if (testState) {
      // Call handleFinishSection directly
      try {
        setSubmitting(true);
        // Save current answer before finishing
        handleAnswer();

        // Submit all pending answers and highlights
        await Promise.all([submitAllPendingAnswers(), submitAllHighlights()]);

        // Submit test – but backend may already have finalized attempt
        try {
          await practiceService.submitTest(attemptId);
        } catch (err) {
          if (
            err instanceof ApiClientError &&
            err.status === 400 &&
            /not in progress/i.test(err.message)
          ) {
            // Attempt already completed or not active – treat as graceful finish
            console.warn(
              "[Test Page] Attempt already not in progress, skipping submitTest"
            );
          } else {
            console.error("Failed to submit test on time up:", err);
            setError("Failed to finish section. Please try again.");
            return;
          }
        }

        router.push(`/dashboard/practice/test/${attemptId}/finish`);
      } catch (err) {
        console.error("Failed to finish section:", err);
        setError("Failed to finish section. Please try again.");
      } finally {
        setSubmitting(false);
      }
    }
  }, [
    testState,
    attemptId,
    router,
    submitAllPendingAnswers,
    submitAllHighlights,
    handleAnswer,
  ]);

  // Handle save and exit
  const handleSaveAndExit = useCallback(async () => {
    try {
      // Submit all pending answers and highlights before exiting
      await Promise.all([submitAllPendingAnswers(), submitAllHighlights()]);

      // Navigate to practice page
      router.push("/dashboard/practice");
    } catch (err) {
      console.error("Failed to save and exit:", err);
      // Still navigate even if save fails
      router.push("/dashboard/practice");
    }
  }, [router, submitAllPendingAnswers, submitAllHighlights]);

  // Timer countdown effect
  useEffect(() => {
    if (remainingTimeSeconds === null || remainingTimeSeconds <= 0) {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      if (remainingTimeSeconds === 0) {
        handleTimeUp();
      }
      return;
    }

    timerIntervalRef.current = setInterval(() => {
      setRemainingTimeSeconds((prev) => {
        if (prev === null || prev <= 1) {
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [remainingTimeSeconds, handleTimeUp]);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  if (!testState || !testState.question) {
    return (
      <div className="flex min-h-screen bg-gray-50 items-center justify-center">
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
  const sectionType = testState.currentSection?.type ?? "ENGLISH";
  const cap = QUESTIONS_PER_MODULE[sectionType] ?? 27;
  const rawTotal = totalQuestions ?? testState.currentModule?.totalQuestions ?? 0;
  const totalQs = Math.min(rawTotal, cap);

  const isLastQuestion =
    testState.currentQuestionIndex === Math.max(0, totalQs - 1);
  const isFlagged = flaggedQuestions.has(testState.currentQuestionIndex);

  // Format timer display (MM:SS)
  const formatTimer = (seconds: number | null) => {
    if (seconds === null) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex min-h-screen w-full bg-gray-50 px-[20px]">
      {/* Desmos Calculator Panel (Math only, non-blocking, draggable) */}
      {showCalculator && testState.currentSection.type === "MATH" && (
        <div className="pointer-events-none fixed inset-0 z-40">
          <div
            className="pointer-events-auto absolute bottom-20 right-4 bg-white rounded-xl shadow-2xl w-[480px] h-[420px] flex flex-col overflow-hidden border border-gray-200 cursor-move"
            // Simple draggable behavior
            onMouseDown={(e) => {
              const target = e.currentTarget as HTMLDivElement;
              const startX = e.clientX - target.offsetLeft;
              const startY = e.clientY - target.offsetTop;

              const handleMove = (moveEvent: MouseEvent) => {
                target.style.left = `${Math.max(
                  0,
                  moveEvent.clientX - startX
                )}px`;
                target.style.top = `${Math.max(
                  0,
                  moveEvent.clientY - startY
                )}px`;
                target.style.bottom = "auto";
                target.style.right = "auto";
              };

              const handleUp = () => {
                window.removeEventListener("mousemove", handleMove);
                window.removeEventListener("mouseup", handleUp);
              };

              window.addEventListener("mousemove", handleMove);
              window.addEventListener("mouseup", handleUp);
            }}
          >
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-200 bg-gray-50 cursor-default">
              <h2 className="text-xs font-semibold text-gray-800">
                Desmos Calculator
              </h2>
              <button
                type="button"
                onClick={() => setShowCalculator(false)}
                className="text-[10px] text-gray-500 hover:text-gray-800"
              >
                Close
              </button>
            </div>
            <div className="flex-1 bg-black/5">
              <iframe
                src="https://www.desmos.com/calculator"
                title="Desmos Calculator"
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      )}
      {/* Fullscreen Exit Warning Modal */}
      {showFullscreenWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 text-center space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-orange-500 text-white flex items-center justify-center text-3xl font-bold animate-pulse">
              {countdown > 0 ? countdown : "⚠"}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Fullscreen Exited
              </h2>
              <p className="text-sm text-gray-600 mb-2">
                You have exited fullscreen mode. Please choose how to continue:
              </p>
              {countdown > 0 && (
                <p className="text-lg font-semibold text-orange-600 mb-2">
                  {countdown} seconds remaining
                </p>
              )}
              {countdown === 0 && (
                <p className="text-sm font-semibold text-red-600 mb-2">
                  Test will be cancelled. Redirecting...
                </p>
              )}
            </div>
            <div className="space-y-3">
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleEnterFullscreen}
                disabled={countdown === 0}
                size="lg"
              >
                Continue in Fullscreen
              </Button>
              <Button
                className="w-full bg-gray-600 hover:bg-gray-700 text-white"
                onClick={handleContinueWithoutFullscreen}
                disabled={countdown === 0}
                size="lg"
                variant="outline"
              >
                Continue with Smaller Text (Not Fullscreen)
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 transition-all duration-300 relative">
        {/* Watermark with glass blur effect */}
        <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center overflow-hidden">
          <div className="relative w-full h-full">
            {/* Glass blur background */}
            <div className="absolute inset-0 backdrop-blur-xl bg-gradient-to-br from-white/20 via-white/10 to-transparent"></div>
            {/* Watermark text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-7xl md:text-9xl lg:text-[12rem] font-extrabold text-gray-300/20 select-none transform -rotate-12 tracking-wider">
                SATZIYO
              </div>
            </div>
          </div>
        </div>

        <main className="flex-1 relative z-10 flex flex-col h-screen min-h-0">
          <div
            className="h-full flex flex-col font-noto-serif transition-all duration-300"
            style={{ fontSize: "15px", lineHeight: "24px" }}
          >
            {/* Header – qotib turadi */}
            <div
              className="flex-shrink-0 bg-white text-gray-800 p-2 flex justify-between items-center border-b border-gray-300 relative"
              style={{
                borderBottom: "2px dashed",
                borderImage:
                  "repeating-linear-gradient(to right, rgb(167, 56, 87) 0%, rgb(167, 56, 87) 3.5%, transparent 3.5%, transparent 4%, rgb(249, 223, 205) 4%, rgb(249, 223, 205) 7.5%, transparent 7.5%, transparent 8%, rgb(28, 17, 103) 8%, rgb(28, 17, 103) 11.5%, transparent 11.5%, transparent 12%, rgb(94, 147, 101) 12%, rgb(94, 147, 101) 15.5%, transparent 15.5%, transparent 16%) 1 / 1 / 0 stretch",
              }}
            >
              <div className="pl-4">
                <p className="font-semibold text-lg">
                  Section {testState.currentSection.orderIndex + 1}, Module{" "}
                  {testState.currentModule.moduleNumber}:{" "}
                  {testState.currentSection.type === "ENGLISH"
                    ? "Reading and Writing"
                    : "Math"}
                </p>
                <button className="text-sm text-blue-600 hover:underline">
                  Directions
                </button>
              </div>

              {/* Timer - Centered */}
              {!isTimerHidden ? (
                <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-2">
                  <div className="text-xl font-bold text-black">
                    {formatTimer(remainingTimeSeconds)}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        remainingTimeSeconds !== null &&
                        remainingTimeSeconds <= 300
                      ) {
                        return;
                      }
                      setIsTimerHidden(true);
                    }}
                    disabled={
                      remainingTimeSeconds !== null &&
                      remainingTimeSeconds <= 300
                    }
                    className="flex items-center justify-center text-xs text-gray-600 hover:text-blue-600 focus:outline-none rounded-md p-1 transition-colors duration-200"
                    aria-label="Hide timer"
                    title="Hide timer"
                  >
                    <EyeOff className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsTimerHidden(false)}
                    className="flex items-center justify-center text-xs text-gray-600 hover:text-blue-600 focus:outline-none rounded-md p-1 transition-colors duration-200"
                    aria-label="Show timer"
                    title="Show timer"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Right side buttons - one row */}
              <div className="flex items-center gap-2 flex-nowrap pr-4 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowNotesModal(true)}
                  className="flex items-center gap-1.5 p-2 rounded-lg transition-colors duration-200 bg-gray-100 text-gray-600 hover:bg-gray-200 text-xs whitespace-nowrap"
                  title="Open Notes"
                >
                  <StickyNote className="w-5 h-5 shrink-0" />
                  <span className="hidden sm:inline">Notes</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsMarkupEnabled((prev) => !prev)}
                  className={`flex items-center gap-1.5 p-2 rounded-lg transition-colors duration-200 text-xs whitespace-nowrap ${
                    isMarkupEnabled
                      ? "text-blue-600 bg-gray-100"
                      : "text-gray-700 hover:text-blue-600 hover:bg-gray-100 bg-gray-100 hover:bg-gray-200"
                  }`}
                  aria-label="Highlights and Notes"
                >
                  <Edit className="w-5 h-5 shrink-0" />
                  <span className="hidden sm:inline">Highlights</span>
                </button>
                {testState.currentSection.type === "MATH" && (
                  <button
                    type="button"
                    onClick={() => setShowCalculator((prev) => !prev)}
                    className={`flex items-center gap-1.5 p-2 rounded-lg transition-colors duration-200 text-xs whitespace-nowrap ${
                      showCalculator
                        ? "text-blue-600 bg-gray-100"
                        : "text-gray-700 hover:text-blue-600 hover:bg-gray-100 bg-gray-100 hover:bg-gray-200"
                    }`}
                    aria-label="Calculator"
                    title="Calculator"
                  >
                    <Calculator className="w-5 h-5 shrink-0" />
                    <span className="hidden sm:inline">Calculator</span>
                  </button>
                )}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowMoreMenu((prev) => !prev)}
                    className="flex items-center gap-1.5 p-2 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-gray-100 text-xs whitespace-nowrap bg-gray-100"
                    aria-label="More options"
                  >
                    <MoreVertical className="w-5 h-5 shrink-0" />
                    <span className="hidden sm:inline">More</span>
                  </button>
                  {showMoreMenu && (
                    <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[150px]">
                      <button
                        type="button"
                        onClick={() => {
                          setShowMoreMenu(false);
                          handleSaveAndExit();
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                      >
                        Save and Exit
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Markaz – chap: image+passage; o‘ng: savol+choices; ustunlar orasida gap, matn dividerga yopishmasin */}
            <div className="flex-1 min-h-0 flex flex-col">
              <div className="relative flex flex-1 min-h-0 overflow-hidden gap-0" ref={layoutContainerRef}>
                {/* Left Column: image + passage – scroll faqat shu ustunda, o‘ngda padding */}
                <div
                  className="content-pane flex flex-col min-h-0 flex-shrink-0 pr-2"
                  style={{
                    width: `calc(${splitPosition}% - 6px)`,
                    minWidth: 120,
                  }}
                >
                  <div
                    className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-hide"
                    style={{ WebkitOverflowScrolling: "touch" }}
                  >
                    {(question.sharedPassage?.content || question.passage) || question.imageUrl ? (
                      <div className="prose max-w-none pr-4 pb-4">
                        {question.imageUrl && (
                          <div className="mb-4">
                            <Image
                              src={question.imageUrl}
                              alt="Savol rasmi"
                              width={400}
                              height={300}
                              className="w-full h-auto rounded-lg object-contain max-h-[320px]"
                            />
                          </div>
                        )}
                        {(question.sharedPassage?.content || question.passage) && (
                          <div className="p-4 bg-gray-50/80 rounded-lg">
                            <p className="text-base leading-relaxed whitespace-pre-wrap">
                              {question.sharedPassage?.content || question.passage}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 text-gray-500 text-sm">Passage yoki rasm yo&apos;q.</div>
                    )}
                  </div>
                </div>

                {/* Resizable Divider – markazdagi ustun, 2 tarafiga bo‘shliq */}
                <div
                  className="divider flex-shrink-0"
                  style={{ left: `calc(${splitPosition}% - 4px)` }}
                  onMouseDown={handleDividerMouseDown}
                />

                {/* Right Column: savol raqami, savol matni, choices – chapda padding, dividerga yopishmasin */}
                <div
                  className="content-pane flex flex-col min-h-0 flex-1 min-w-0 pl-2"
                  style={{ width: `calc(${100 - splitPosition}% - 6px)` }}
                >
                  <div
                    className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-hide pl-3"
                    style={{ WebkitOverflowScrolling: "touch" }}
                  >
                    {/* Question Index + Flag – savol matni dividerga yopishmasin */}
                    <div className="mb-4 pr-2">
                      <div className="question-index-container flex items-center justify-between bg-gray-200 rounded mb-2">
                        <div className="flex items-center h-full">
                          <p className="question-index font-semibold bg-black text-white text-sm h-full px-3 py-2 rounded-l">
                            {testState.currentQuestionIndex + 1}
                          </p>
                          <button
                            type="button"
                            onClick={handleToggleFlag}
                            className="flex items-center text-sm text-gray-600 hover:text-black mr-2 h-full px-2"
                          >
                            <Flag
                              className={`w-5 h-5 text-gray-500 ${isFlagged ? "fill-orange-500 text-orange-500" : ""}`}
                            />
                            <span className="ml-1">Mark for Review</span>
                          </button>
                        </div>
                        {question.questionType === "MULTIPLE_CHOICE" && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsEliminationMode((prev) => !prev);
                              if (isEliminationMode) setEliminatedChoices(new Set());
                            }}
                            className={`flex items-center text-sm text-gray-600 hover:text-black mr-2 h-full relative border border-gray-300 rounded-sm w-8 h-8 justify-center bg-transparent ${isEliminationMode ? "bg-blue-100" : ""}`}
                          >
                            <span className="text-[12px] font-medium text-gray-600">ABC</span>
                            {isEliminationMode && (
                              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="absolute w-8 h-8 text-gray-500">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M18 6L6 18" />
                              </svg>
                            )}
                          </button>
                        )}
                      </div>

                      {/* Question Text */}
                      <div className="prose max-w-none mt-2">
                        <QuestionDisplay
                          question={question}
                          selectedChoiceId={undefined}
                          textAnswer={undefined}
                          onSelectChoice={() => {}}
                          onTextAnswerChange={() => {}}
                          isFlagged={isFlagged}
                          hidePassage
                          isMarkupEnabled={isMarkupEnabled}
                          showOnlyQuestionText
                          attemptId={attemptId}
                          onHighlightsChange={(highlights) => {
                            if (highlights.length > 0) {
                              saveHighlightsToStorage(question.id, highlights);
                            } else {
                              const allHighlights = getAllHighlightsFromStorage();
                              allHighlights.delete(question.id);
                              if (typeof window !== "undefined") {
                                try {
                                  const highlightsObj: Record<string, any> = {};
                                  allHighlights.forEach((value, key) => {
                                    highlightsObj[key] = value;
                                  });
                                  localStorage.setItem(getHighlightsStorageKey(), JSON.stringify(highlightsObj));
                                } catch (err) {
                                  console.error("Failed to save highlights to localStorage:", err);
                                }
                              }
                            }
                          }}
                        />
                      </div>
                    </div>

                    {/* Choices */}
                  {question.questionType === "MULTIPLE_CHOICE" &&
                    question.choices &&
                    question.choices.length > 0 && (
                      <div className="space-y-2">
                        {question.choices.map((choice, index) => {
                          const isSelected =
                            currentAnswer.choiceId === choice.id;
                          const letter = String.fromCharCode(65 + index);
                          const isEliminated = eliminatedChoices.has(choice.id);
                          const choiceImageUrl = choice.imageUrl?.trim();

                          return (
                            <div
                              key={choice.id || index}
                              className="relative w-full mb-2"
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  if (isEliminationMode) {
                                    setEliminatedChoices((prev) => {
                                      const next = new Set(prev);
                                      if (next.has(choice.id)) {
                                        next.delete(choice.id);
                                      } else {
                                        next.add(choice.id);
                                      }
                                      return next;
                                    });
                                  } else {
                                    handleAnswerChange({
                                      choiceId: choice.id,
                                      textAnswer: currentAnswer.textAnswer,
                                    });
                                  }
                                }}
                                className={`w-full p-3 text-left border-2 rounded-lg text-base flex items-start gap-3 ${
                                  isSelected
                                    ? "border-black"
                                    : isEliminated
                                    ? "border-gray-300 bg-gray-100 opacity-60"
                                    : "border-gray-200 hover:bg-gray-200 cursor-pointer"
                                }`}
                              >
                                <div
                                  className={`flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full font-bold border border-black ${
                                    isSelected
                                      ? "bg-black text-white"
                                      : "text-black"
                                  }`}
                                >
                                  <span className="text-xs">{letter}</span>
                                </div>
                                <div
                                  className={`flex-1 min-w-0 ${
                                    isEliminated
                                      ? "line-through text-gray-500"
                                      : ""
                                  }`}
                                >
                                  {(choice.choiceText || `Choice ${letter}`) && (
                                    <span className="block">
                                      {choice.choiceText || `Choice ${letter}`}
                                    </span>
                                  )}
                                  {choiceImageUrl && (
                                    <span className="block mt-2">
                                      <Image
                                        src={choiceImageUrl}
                                        alt={`Variant ${letter}`}
                                        width={280}
                                        height={160}
                                        className="rounded border border-gray-200 object-contain max-h-40 w-full"
                                        unoptimized={choiceImageUrl.startsWith("data:")}
                                      />
                                    </span>
                                  )}
                                </div>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                  {question.questionType === "STUDENT_PRODUCED" && (
                    <div className="space-y-4">
                      <input
                        type="text"
                        value={currentAnswer.textAnswer || ""}
                        onChange={(e) =>
                          handleAnswerChange({
                            textAnswer: e.target.value,
                            choiceId: currentAnswer.choiceId,
                          })
                        }
                        placeholder="Type your answer"
                        pattern="[0-9.\\-/]+"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                      />
                    </div>
                  )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer – qotib turadi (Question navigator / Back–Next) */}
            <div
              className="flex-shrink-0 bg-blue-100 p-2 flex justify-between items-center"
              style={{
                borderTop: "2px dashed",
                backgroundColor: "rgb(229, 235, 245)",
                borderImage:
                  "repeating-linear-gradient(to right, rgb(167, 56, 87) 0%, rgb(167, 56, 87) 3.5%, transparent 3.5%, transparent 4%, rgb(249, 223, 205) 4%, rgb(249, 223, 205) 7.5%, transparent 7.5%, transparent 8%, rgb(28, 17, 103) 8%, rgb(28, 17, 103) 11.5%, transparent 11.5%, transparent 12%, rgb(94, 147, 101) 12%, rgb(94, 147, 101) 15.5%, transparent 15.5%, transparent 16%) 1 / 1 / 0 stretch",
              }}
            >
              <p>
                {currentUser?.name ||
                  currentUser?.email?.split("@")[0] ||
                  "User"}
              </p>
              <div
                className="bg-black text-white p-2 flex items-center gap-2 rounded-xl cursor-pointer"
                style={{
                  position: "absolute",
                  left: "50%",
                  transform: "translateX(-50%)",
                }}
                onClick={() => setShowNavigator((prev) => !prev)}
              >
                <p className="text-white">
                  Question {testState.currentQuestionIndex + 1} of {totalQs}
                </p>
                <button
                  className="p-1 rounded"
                  style={{ pointerEvents: "none" }}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={testState.currentQuestionIndex === 0 || submitting}
                  className="px-4 py-2 text-white transition-opacity duration-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: "rgb(51, 76, 199)",
                    borderRadius: "30px",
                    opacity: testState.currentQuestionIndex === 0 ? 0.5 : 1,
                  }}
                >
                  Back
                </Button>
                {!isLastQuestion ? (
                  <Button
                    onClick={handleNext}
                    disabled={submitting}
                    className="px-4 py-2 text-white transition-opacity duration-200 rounded-md cursor-pointer"
                    style={{
                      backgroundColor: "rgb(51, 76, 199)",
                      borderRadius: "30px",
                    }}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    onClick={handleFinishSection}
                    disabled={submitting}
                    className="px-4 py-2 text-white transition-opacity duration-200 rounded-md cursor-pointer"
                    style={{
                      backgroundColor: "rgb(51, 76, 199)",
                      borderRadius: "30px",
                    }}
                  >
                    Finish Section
                  </Button>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Question Navigator Modal */}
      {showNavigator && (
        <QuestionNavigator
          totalQuestions={totalQs}
          currentIndex={testState.currentQuestionIndex}
          answeredSet={answeredQuestions}
          flaggedSet={flaggedQuestions}
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

      {/* Notes Panel - Right Side */}
      {showNotesModal && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setShowNotesModal(false)}
          />
          {/* Panel */}
          <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Notes for Question {testState.currentQuestionIndex + 1}
              </h2>
              <button
                type="button"
                onClick={() => setShowNotesModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close notes"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Existing Notes Display */}
            <div className="flex-1 overflow-y-auto p-4">
              {questionNotes.has(testState.currentQuestionIndex) ? (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Your Notes:
                  </h3>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-700 whitespace-pre-wrap">
                    {questionNotes.get(testState.currentQuestionIndex)}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      const newNotes = new Map(questionNotes);
                      newNotes.delete(testState.currentQuestionIndex);
                      setQuestionNotes(newNotes);
                      saveNotesToStorage(newNotes);
                    }}
                  >
                    Clear All Notes
                  </Button>
                </div>
              ) : (
                <div className="text-center text-gray-500 text-sm py-8">
                  No notes yet. Add your first note below.
                </div>
              )}
            </div>

            {/* Add Note Section */}
            <div className="border-t border-gray-200 p-4 bg-gray-50">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Add Note:
              </h3>
              <textarea
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="Type your note here..."
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    handleAddNote();
                  }
                }}
              />
              <Button
                onClick={handleAddNote}
                disabled={!newNoteText.trim()}
                className="w-full mt-2 bg-gray-900 hover:bg-gray-800"
              >
                Add Note
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
