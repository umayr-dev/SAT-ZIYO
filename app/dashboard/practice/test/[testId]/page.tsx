"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
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
  isOpenAnswerQuestion,
  hasChoiceOptions,
  getQuestionImageUrl,
  getChoiceText,
  getChoiceImageUrl,
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
  BookOpen,
} from "lucide-react";
import { useCurrentUser } from "@/src/hooks/use-auth";
import { debounce } from "@/src/utils/request-queue";

const QUESTIONS_PER_MODULE = { ENGLISH: 27, MATH: 22 } as const;

/** Strict Mode / double mount da loadTestState ikki marta chaqilmasin – so‘nggi natija cache (qisqa vaqt) */
let loadStateCache: {
  attemptId: string;
  state: StartTestResponse;
  ts: number;
} | null = null;
const LOAD_STATE_CACHE_MS = 2500;

const DESMOS_MIN_W = 320;
const DESMOS_MIN_H = 280;
const DESMOS_MAX_W = 900;
const DESMOS_MAX_H = 700;

function DesmosCalculatorPanel({
  width,
  height,
  onSizeChange,
  onClose,
}: {
  width: number;
  height: number;
  onSizeChange: (size: { width: number; height: number }) => void;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const startRef = useRef({ x: 0, y: 0, w: 0, h: 0 });

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      startRef.current = { x: e.clientX, y: e.clientY, w: width, h: height };
      const handleMove = (moveEvent: MouseEvent) => {
        const dx = moveEvent.clientX - startRef.current.x;
        const dy = moveEvent.clientY - startRef.current.y;
        const newW = Math.max(
          DESMOS_MIN_W,
          Math.min(DESMOS_MAX_W, startRef.current.w + dx),
        );
        const newH = Math.max(
          DESMOS_MIN_H,
          Math.min(DESMOS_MAX_H, startRef.current.h + dy),
        );
        onSizeChange({ width: newW, height: newH });
      };
      const handleUp = () => {
        window.removeEventListener("mousemove", handleMove);
        window.removeEventListener("mouseup", handleUp);
      };
      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleUp);
    },
    [width, height, onSizeChange],
  );

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("[data-desmos-resize]")) return;
    const target = panelRef.current;
    if (!target) return;
    const startX = e.clientX - target.offsetLeft;
    const startY = e.clientY - target.offsetTop;
    const handleMove = (moveEvent: MouseEvent) => {
      target.style.left = `${Math.max(0, moveEvent.clientX - startX)}px`;
      target.style.top = `${Math.max(0, moveEvent.clientY - startY)}px`;
      target.style.bottom = "auto";
      target.style.right = "auto";
    };
    const handleUp = () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-40">
      <div
        ref={panelRef}
        className="pointer-events-auto absolute bottom-20 right-4 bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden border border-gray-200"
        style={{ width: `${width}px`, height: `${height}px` }}
        onMouseDown={handleDragStart}
      >
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-200 bg-gray-50 cursor-move select-none">
          <h2 className="text-xs font-semibold text-gray-800">
            Desmos Calculator
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[10px] text-gray-500 hover:text-gray-800"
          >
            Close
          </button>
        </div>
        <div className="flex-1 bg-black/5 min-h-0 relative">
          <iframe
            src="https://www.desmos.com/calculator"
            title="Desmos Calculator"
            className="w-full h-full border-0 absolute inset-0"
          />
          <div
            data-desmos-resize
            onMouseDown={handleResizeStart}
            className="absolute bottom-0 right-0 w-5 h-5 cursor-se-resize bg-gray-300 hover:bg-gray-400 rounded-tl border-t border-l border-gray-400"
            aria-label="Resize"
          />
        </div>
      </div>
    </div>
  );
}

const REF_MIN_W = 320;
const REF_MIN_H = 400;
const REF_MAX_W = 700;
const REF_MAX_H = 900;

function ReferenceSheetPanel({
  width,
  height,
  onSizeChange,
  onClose,
}: {
  width: number;
  height: number;
  onSizeChange: (size: { width: number; height: number }) => void;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const startRef = useRef({ x: 0, y: 0, w: 0, h: 0 });

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      startRef.current = { x: e.clientX, y: e.clientY, w: width, h: height };
      const handleMove = (moveEvent: MouseEvent) => {
        const dx = moveEvent.clientX - startRef.current.x;
        const dy = moveEvent.clientY - startRef.current.y;
        const newW = Math.max(
          REF_MIN_W,
          Math.min(REF_MAX_W, startRef.current.w + dx),
        );
        const newH = Math.max(
          REF_MIN_H,
          Math.min(REF_MAX_H, startRef.current.h + dy),
        );
        onSizeChange({ width: newW, height: newH });
      };
      const handleUp = () => {
        window.removeEventListener("mousemove", handleMove);
        window.removeEventListener("mouseup", handleUp);
      };
      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleUp);
    },
    [width, height, onSizeChange],
  );

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("[data-ref-resize]")) return;
    const target = panelRef.current;
    if (!target) return;
    const startX = e.clientX - target.offsetLeft;
    const startY = e.clientY - target.offsetTop;
    const handleMove = (moveEvent: MouseEvent) => {
      target.style.left = `${Math.max(0, moveEvent.clientX - startX)}px`;
      target.style.top = `${Math.max(0, moveEvent.clientY - startY)}px`;
      target.style.bottom = "auto";
      target.style.right = "auto";
    };
    const handleUp = () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-40">
      <div
        ref={panelRef}
        className="pointer-events-auto absolute bottom-20 right-4 bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden border border-gray-200"
        style={{ width: `${width}px`, height: `${height}px` }}
        onMouseDown={handleDragStart}
      >
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-200 bg-gray-50 cursor-move select-none">
          <h2 className="text-xs font-semibold text-gray-800">
            Reference Sheet
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[10px] text-gray-500 hover:text-gray-800"
          >
            Close
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-auto relative bg-gray-100">
          <img
            src="/reference-sheet.png"
            alt="Math Reference Sheet - formulas and facts"
            className="w-full h-auto object-contain block"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
              const fallback = (e.target as HTMLImageElement)
                .nextElementSibling;
              if (fallback instanceof HTMLElement) fallback.hidden = false;
            }}
          />
          <div
            hidden
            className="p-4 text-sm text-gray-600 text-center"
            aria-hidden="true"
          >
            Add <code className="bg-gray-200 px-1">reference-sheet.png</code> to
            the <code className="bg-gray-200 px-1">public</code> folder for the
            formula reference image.
          </div>
          <div
            data-ref-resize
            onMouseDown={handleResizeStart}
            className="absolute bottom-0 right-0 w-5 h-5 cursor-se-resize bg-gray-300 hover:bg-gray-400 rounded-tl border-t border-l border-gray-400"
            aria-label="Resize"
          />
        </div>
      </div>
    </div>
  );
}

export default function TestTakingPage() {
  const router = useRouter();
  const params = useParams();
  // NOTE: Route segment is [testId], but here it actually represents attemptId
  const attemptId = params.testId as string;
  const { data: currentUser } = useCurrentUser();

  const [testState, setTestState] = useState<StartTestResponse | null>(null);
  // Local cache for all questions in current module
  const [questionsCache, setQuestionsCache] = useState<Map<number, Question>>(
    new Map(),
  );
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(
    new Set(),
  );
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(
    new Set(),
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
  const [desmosSize, setDesmosSize] = useState({ width: 480, height: 420 });
  const [showReferenceSheet, setShowReferenceSheet] = useState(false);
  const [referenceSheetSize, setReferenceSheetSize] = useState({
    width: 420,
    height: 520,
  });
  const [showNavigator, setShowNavigator] = useState(false);
  const [isMarkupEnabled, setIsMarkupEnabled] = useState(false);
  const [isTimerHidden, setIsTimerHidden] = useState(false);
  const [remainingTimeSeconds, setRemainingTimeSeconds] = useState<
    number | null
  >(null);
  const [isEliminationMode, setIsEliminationMode] = useState(false);
  const [eliminatedChoices, setEliminatedChoices] = useState<Set<string>>(
    new Set(),
  );
  const [questionNotes, setQuestionNotes] = useState<Map<number, string>>(
    new Map(),
  );
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [newNoteText, setNewNoteText] = useState("");
  const [isQuestionLoading, setIsQuestionLoading] = useState(false);

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
  /** Faqat so‘nggi so‘ralgan jump indexiga mos javobni state ga yozamiz – kechikkan/aralash javoblar e’tiborsiz */
  const latestRequestedJumpRef = useRef<number | null>(null);

  // Resizable 2-column layout state
  const [splitPosition, setSplitPosition] = useState(50); // percentage for left pane
  const layoutContainerRef = useRef<HTMLDivElement | null>(null);
  const isDraggingDividerRef = useRef(false);

  // localStorage key for answers (one key per attempt; inside we use s{section}_m{module}_{index})
  const getStorageKey = useCallback(
    () => `test_answers_${attemptId}`,
    [attemptId],
  );

  // Current module prefix so each module's answers are isolated (no carry-over to next module)
  const getCurrentModulePrefix = useCallback(() => {
    const s = testState?.currentSection?.orderIndex ?? 0;
    const m = testState?.currentModule?.moduleNumber ?? 1;
    return `s${s}_m${m}_`;
  }, [
    testState?.currentSection?.orderIndex,
    testState?.currentModule?.moduleNumber,
  ]);

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
    [getQuestionsStorageKey, questionsCache],
  );

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
        const key = getHighlightsStorageKey();
        const stored = localStorage.getItem(key);
        const allHighlights = stored ? JSON.parse(stored) : {};
        allHighlights[questionId] = highlights;
        localStorage.setItem(key, JSON.stringify(allHighlights));
      } catch (err) {
        console.error("Failed to save highlights to localStorage:", err);
      }
    },
    [getHighlightsStorageKey],
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

  // True only when user has selected an answer (choice or grid-in text)
  const hasActualAnswer = useCallback(
    (answer: { choiceId?: string; textAnswer?: string }) =>
      !!(
        answer.choiceId ||
        (answer.textAnswer != null && String(answer.textAnswer).trim() !== "")
      ),
    [],
  );

  // Save answer to localStorage (scoped by current module: s{section}_m{module}_{index})
  const saveAnswerToStorage = useCallback(
    (
      questionIndex: number,
      answer: {
        questionId: string;
        choiceId?: string;
        textAnswer?: string;
        markedForReview?: boolean;
        eliminatedChoices?: string[];
      },
    ) => {
      if (typeof window === "undefined") return;

      try {
        const key = getStorageKey();
        const prefix = getCurrentModulePrefix();
        const stored = localStorage.getItem(key);
        const answers: Record<string, unknown> = stored
          ? JSON.parse(stored)
          : {};
        answers[prefix + questionIndex] = answer;
        localStorage.setItem(key, JSON.stringify(answers));
      } catch (err) {
        console.error("Failed to save answer to localStorage:", err);
      }
    },
    [getStorageKey, getCurrentModulePrefix],
  );

  // Remove answer for one question from localStorage (so we don't submit empty)
  const removeAnswerFromStorage = useCallback(
    (questionIndex: number) => {
      if (typeof window === "undefined") return;
      try {
        const key = getStorageKey();
        const prefix = getCurrentModulePrefix();
        const stored = localStorage.getItem(key);
        if (!stored) return;
        const answers = JSON.parse(stored) as Record<string, unknown>;
        delete answers[prefix + questionIndex];
        localStorage.setItem(key, JSON.stringify(answers));
      } catch (err) {
        console.error("Failed to remove answer from localStorage:", err);
      }
    },
    [getStorageKey, getCurrentModulePrefix],
  );

  // Load answered set for current module only (so switching module shows 0 answered for new module)
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

  // Navigator ochilganda answered/unanswered yangilab ko‘rsatish
  useEffect(() => {
    if (showNavigator) syncAnsweredFromStorage();
  }, [showNavigator, syncAnsweredFromStorage]);

  // Get all answers from localStorage for current module only (so next module starts with 0 answered)
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
      const key = getStorageKey();
      const prefix = getCurrentModulePrefix();
      const stored = localStorage.getItem(key);
      if (!stored) return new Map();

      const answers = JSON.parse(stored) as Record<
        string,
        Record<string, unknown>
      >;
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
      Object.keys(answers).forEach((k) => {
        if (!k.startsWith(prefix)) return;
        const questionIndex = parseInt(k.slice(prefix.length), 10);
        if (Number.isNaN(questionIndex)) return;
        const entry = answers[k] as {
          questionId: string;
          choiceId?: string;
          textAnswer?: string;
          markedForReview?: boolean;
          eliminatedChoices?: string[];
        };
        map.set(questionIndex, entry);
      });
      return map;
    } catch (err) {
      console.error("Failed to get answers from localStorage:", err);
      return new Map();
    }
  }, [getStorageKey, getCurrentModulePrefix]);

  // All answers from all modules (for submit on time-up or finish page)
  const getAllAnswersForSubmit = useCallback((): Array<{
    questionId: string;
    choiceId?: string;
    textAnswer?: string;
    markedForReview?: boolean;
    eliminatedChoices?: string[];
  }> => {
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
        .map(
          (k) =>
            answers[k] as {
              questionId: string;
              choiceId?: string;
              textAnswer?: string;
              markedForReview?: boolean;
              eliminatedChoices?: string[];
            },
        );
    } catch (err) {
      console.error("Failed to get answers for submit:", err);
      return [];
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
    [getAllAnswersFromStorage],
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

  /** Goto so‘rovini ketma-ketlashtirish – 429 kamayadi. Backend modul ichidagi local index kutadi (0..totalQuestions-1). */
  const runGoto = useCallback(
    (localIndex: number): Promise<StartTestResponse> => {
      const prev = gotoMutexRef.current;
      // Use catch(() => {}) before then so a failed previous request doesn't break the entire chain
      const p = prev
        .catch(() => {})
        .then(() => practiceService.jumpToQuestion(attemptId, localIndex));
      gotoMutexRef.current = p.catch(() => {});
      return p as Promise<StartTestResponse>;
    },
    [attemptId],
  );

  // Keyingi savolni faqat cache'ga yuklash – runGoto modul ichidagi local index bilan
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
            if (
              nextState?.question &&
              nextState.currentQuestionIndex === nextIndex
            )
              saveQuestionToLocal(
                nextState.currentQuestionIndex,
                nextState.question,
              );
          })
          .catch(() => {})
          .finally(() => {
            preloadInFlightRef.current = false;
          });
      }, 3500);
    },
    [getQuestionFromLocal, saveQuestionToLocal, runGoto],
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
      if (state.question) {
        const qKey = `test_questions_${attemptId}_s${state.currentSection.orderIndex}_m${state.currentModule.moduleNumber}`;
        saveQuestionToLocal(state.currentQuestionIndex, state.question, qKey);
      }
      const statePrefix = `s${state.currentSection.orderIndex}_m${state.currentModule.moduleNumber}_`;
      const key = getStorageKey();
      const raw =
        typeof window !== "undefined" ? localStorage.getItem(key) : null;
      const savedEntry = raw
        ? (JSON.parse(raw) as Record<string, Record<string, unknown>>)[
            statePrefix + state.currentQuestionIndex
          ]
        : undefined;
      const savedAnswer = savedEntry as
        | {
            choiceId?: string;
            textAnswer?: string;
            eliminatedChoices?: string[];
          }
        | undefined;
      if (
        savedAnswer &&
        (savedAnswer.choiceId ||
          (savedAnswer.textAnswer != null &&
            String(savedAnswer.textAnswer).trim() !== ""))
      ) {
        setCurrentAnswer({
          choiceId: savedAnswer.choiceId,
          textAnswer: savedAnswer.textAnswer,
        });
        if (savedAnswer.eliminatedChoices?.length)
          setEliminatedChoices(new Set(savedAnswer.eliminatedChoices));
      } else setCurrentAnswer({});
      if (state?.currentModule?.totalQuestions) {
        const sectionType = state.currentSection?.type ?? "ENGLISH";
        const cap = QUESTIONS_PER_MODULE[sectionType] ?? 27;
        setTotalQuestions(Math.min(state.currentModule.totalQuestions, cap));
      }
      const statePrefixCache = `s${state.currentSection.orderIndex}_m${state.currentModule.moduleNumber}_`;
      try {
        const key = getStorageKey();
        const stored = localStorage.getItem(key);
        if (stored) {
          const answers = JSON.parse(stored) as Record<
            string,
            Record<string, unknown>
          >;
          const answeredSet = new Set<number>();
          Object.keys(answers).forEach((k) => {
            if (!k.startsWith(statePrefixCache)) return;
            const entry = answers[k] as {
              choiceId?: string;
              textAnswer?: string;
            };
            if (
              entry &&
              (!!entry.choiceId ||
                (entry.textAnswer != null &&
                  String(entry.textAnswer).trim() !== ""))
            ) {
              const idx = parseInt(k.slice(statePrefixCache.length), 10);
              if (!Number.isNaN(idx)) answeredSet.add(idx);
            }
          });
          setAnsweredQuestions(answeredSet);
        } else setAnsweredQuestions(new Set());
      } catch {
        setAnsweredQuestions(new Set());
      }
      const cacheTimerKey = `test_timer_${attemptId}_s${state.currentSection.orderIndex}_m${state.currentModule.moduleNumber}`;
      const cacheSavedTime =
        typeof window !== "undefined"
          ? sessionStorage.getItem(cacheTimerKey)
          : null;
      const cacheSavedSeconds =
        cacheSavedTime != null ? Number(cacheSavedTime) : NaN;
      if (
        typeof window !== "undefined" &&
        !Number.isNaN(cacheSavedSeconds) &&
        cacheSavedSeconds > 0
      ) {
        setRemainingTimeSeconds(cacheSavedSeconds);
      } else if (
        state?.currentModule?.duration &&
        remainingTimeSeconds === null
      ) {
        setRemainingTimeSeconds(state.currentModule.duration * 60);
      }
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
          "No current question available. The test may have been completed or abandoned.",
        );
        return;
      }

      setTestState(state);
      loadStateCache = { attemptId, state, ts: Date.now() };
      setEliminatedChoices(new Set()); // Clear eliminations when loading new question
      const qKey = `test_questions_${attemptId}_s${state.currentSection.orderIndex}_m${state.currentModule.moduleNumber}`;
      saveQuestionToLocal(state.currentQuestionIndex, state.question, qKey);

      // Load saved answer for current question from current module only (use state prefix, not testState)
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
        setCurrentAnswer({
          choiceId: savedAnswer.choiceId,
          textAnswer: savedAnswer.textAnswer,
        });
        if (savedAnswer.eliminatedChoices?.length)
          setEliminatedChoices(new Set(savedAnswer.eliminatedChoices));
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

        // Preloading disabled: it uses goto which advances server cursor and breaks /next//previous navigation
      } else {
        console.warn(
          "[Test Page] No totalQuestions in currentModule:",
          state.currentModule,
        );
      }

      // Initialize timer: restore from sessionStorage if returning from module review, else set from module duration
      const timerKey = `test_timer_${attemptId}_s${state.currentSection.orderIndex}_m${state.currentModule.moduleNumber}`;
      const savedTime =
        typeof window !== "undefined" ? sessionStorage.getItem(timerKey) : null;
      const savedSeconds = savedTime != null ? Number(savedTime) : NaN;
      if (
        typeof window !== "undefined" &&
        !Number.isNaN(savedSeconds) &&
        savedSeconds > 0
      ) {
        setRemainingTimeSeconds(savedSeconds);
      } else if (
        state?.currentModule?.duration &&
        remainingTimeSeconds === null
      ) {
        const durationSeconds = state.currentModule.duration * 60;
        setRemainingTimeSeconds(durationSeconds);
      }

      // Answered questions: only current module (prefix s{section}_m{module}_)
      const statePrefixApi = `s${state.currentSection.orderIndex}_m${state.currentModule.moduleNumber}_`;
      try {
        const key = getStorageKey();
        const raw = localStorage.getItem(key);
        if (raw) {
          const answers = JSON.parse(raw) as Record<
            string,
            Record<string, unknown>
          >;
          const answeredSet = new Set<number>();
          Object.keys(answers).forEach((k) => {
            if (!k.startsWith(statePrefixApi)) return;
            const entry = answers[k] as {
              choiceId?: string;
              textAnswer?: string;
            };
            if (
              entry &&
              (!!entry.choiceId ||
                (entry.textAnswer != null &&
                  String(entry.textAnswer).trim() !== ""))
            ) {
              const idx = parseInt(k.slice(statePrefixApi.length), 10);
              if (!Number.isNaN(idx)) answeredSet.add(idx);
            }
          });
          setAnsweredQuestions(answeredSet);
        } else setAnsweredQuestions(new Set());
      } catch {
        setAnsweredQuestions(new Set());
      }
    } catch (err) {
      console.error("[Test Page] Failed to load test state:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load test";
      setError(errorMessage);

      // If it's a 404 or 401, provide more specific error
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
      loadTestStateInFlightRef.current = false;
    }
  }

  async function loadAnsweredQuestions(
    currentState?: StartTestResponse,
    force = false,
  ) {
    // Throttle: don't load if called within cache duration
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
      const state = currentState || testState;

      if (!answers || !Array.isArray(answers.answers)) {
        setAnsweredQuestions(new Set());
        const raw =
          state?.currentModule?.totalQuestions ??
          testState?.currentModule?.totalQuestions ??
          answers?.totalQuestions ??
          0;
        const sectionType =
          state?.currentSection?.type ??
          testState?.currentSection?.type ??
          "ENGLISH";
        const cap = QUESTIONS_PER_MODULE[sectionType] ?? 27;
        setTotalQuestions(Math.min(raw, cap));
        return;
      }

      // Do not overwrite answeredQuestions from API – we use module-scoped localStorage only
      // (API may return global indices; would show wrong count in next module)

      const raw =
        state?.currentModule?.totalQuestions ??
        testState?.currentModule?.totalQuestions ??
        answers?.totalQuestions ??
        0;
      const sectionType =
        state?.currentSection?.type ??
        testState?.currentSection?.type ??
        "ENGLISH";
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

  // Save answer to localStorage only when user has actually selected an answer (no server request during test)
  const handleAnswer = useCallback(() => {
    if (!testState?.question) return;

    const currentIndex = testState.currentQuestionIndex;
    const questionId = testState.question.id;
    const hasAnswer = hasActualAnswer(currentAnswer);

    const answerData = {
      questionId,
      choiceId: currentAnswer.choiceId,
      textAnswer: currentAnswer.textAnswer,
      markedForReview: flaggedQuestions.has(currentIndex),
      eliminatedChoices: Array.from(eliminatedChoices),
    };

    if (hasAnswer) {
      saveAnswerToStorage(currentIndex, answerData);
      setPendingAnswers((prev) => {
        const next = new Map(prev);
        next.set(currentIndex, answerData);
        return next;
      });
      setAnsweredQuestions((prev) => {
        const next = new Set(prev);
        next.add(currentIndex);
        return next;
      });
    } else {
      removeAnswerFromStorage(currentIndex);
      setPendingAnswers((prev) => {
        const next = new Map(prev);
        next.delete(currentIndex);
        return next;
      });
      setAnsweredQuestions((prev) => {
        const next = new Set(prev);
        next.delete(currentIndex);
        return next;
      });
    }
    // NO SERVER REQUEST - answers will be submitted when test finishes
  }, [
    testState,
    currentAnswer,
    hasActualAnswer,
    saveAnswerToStorage,
    removeAnswerFromStorage,
    flaggedQuestions,
    eliminatedChoices,
  ]);

  // Navigate to module review page (no server calls, only local state). Persist timer so it is not reset on return.
  const handleGoToModuleReview = useCallback(() => {
    if (!testState?.currentModule || totalQuestions === null) return;
    handleAnswer();
    if (typeof window !== "undefined" && remainingTimeSeconds != null) {
      const key = `test_timer_${attemptId}_s${testState.currentSection.orderIndex}_m${testState.currentModule.moduleNumber}`;
      sessionStorage.setItem(key, String(remainingTimeSeconds));
    }
    const sectionNum = testState.currentSection.orderIndex + 1;
    const moduleNum = testState.currentModule.moduleNumber;
    const type = testState.currentSection.type;
    const total = totalQuestions;
    router.push(
      `/dashboard/practice/test/${attemptId}/module-review?section=${sectionNum}&module=${moduleNum}&type=${type}&total=${total}`,
    );
  }, [
    attemptId,
    handleAnswer,
    router,
    testState,
    totalQuestions,
    remainingTimeSeconds,
  ]);

  async function handleNext() {
    if (!testState?.question) return;
    if (navigationInFlightRef.current) return;

    const currentIndex = testState.currentQuestionIndex;
    const nextIndex = currentIndex + 1;
    const cap =
      totalQuestions ??
      QUESTIONS_PER_MODULE[testState.currentSection?.type ?? "ENGLISH"] ??
      27;
    if (nextIndex >= cap) {
      handleGoToModuleReview();
      return;
    }

    try {
      if (preloadTimeoutRef.current !== null) {
        window.clearTimeout(preloadTimeoutRef.current);
        preloadTimeoutRef.current = null;
      }
      navigationInFlightRef.current = true;
      setIsQuestionLoading(true);
      setSubmitting(true);

      handleAnswer();
      setIsMarkupEnabled(false);

      // Use /next endpoint for reliable sequential navigation (avoids goto index mismatch bugs)
      const nextState = await practiceService.nextQuestion(attemptId);
      setTestState(nextState);
      if (nextState.question)
        saveQuestionToLocal(nextState.currentQuestionIndex, nextState.question);
      applySavedAnswerForIndex(nextState.currentQuestionIndex);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to go to next question",
      );
    } finally {
      setSubmitting(false);
      setIsQuestionLoading(false);
      navigationInFlightRef.current = false;
    }
  }

  async function handlePrevious() {
    if (!testState?.question) return;
    if (navigationInFlightRef.current) return;

    try {
      if (preloadTimeoutRef.current !== null) {
        window.clearTimeout(preloadTimeoutRef.current);
        preloadTimeoutRef.current = null;
      }
      navigationInFlightRef.current = true;
      setIsQuestionLoading(true);
      setSubmitting(true);

      handleAnswer();
      setIsMarkupEnabled(false);

      // Use /previous endpoint for reliable sequential navigation
      const prevState = await practiceService.previousQuestion(attemptId);
      setTestState(prevState);
      if (prevState.question)
        saveQuestionToLocal(prevState.currentQuestionIndex, prevState.question);
      applySavedAnswerForIndex(prevState.currentQuestionIndex);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to go to previous question",
      );
    } finally {
      setSubmitting(false);
      setIsQuestionLoading(false);
      navigationInFlightRef.current = false;
    }
  }

  const handleJumpToQuestion = useCallback(
    async (index: number) => {
      if (!testState?.question) return;
      if (navigationInFlightRef.current) return;

      const cap =
        totalQuestions ??
        QUESTIONS_PER_MODULE[testState.currentSection?.type ?? "ENGLISH"] ??
        27;
      if (index < 0 || index >= cap) return;

      latestRequestedJumpRef.current = index;
      try {
        if (preloadTimeoutRef.current !== null) {
          window.clearTimeout(preloadTimeoutRef.current);
          preloadTimeoutRef.current = null;
        }
        navigationInFlightRef.current = true;
        setIsQuestionLoading(true);
        setSubmitting(true);

        handleAnswer();
        setIsMarkupEnabled(false);

        const state = await runGoto(index);
        // Faqat shu jump uchun so‘ralgan index bo‘lsa state yangilaymiz (kechikkan/boshqa savol javobini e’tiborsiz qilamiz)
        if (state.currentQuestionIndex !== index) {
          setError("Savol indexi mos kelmadi. Qayta urinib ko'ring.");
          return;
        }
        if (latestRequestedJumpRef.current !== index) return;
        setTestState(state);
        if (state.question)
          saveQuestionToLocal(state.currentQuestionIndex, state.question);
        applySavedAnswerForIndex(index);
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
        setSubmitting(false);
        setIsQuestionLoading(false);
        navigationInFlightRef.current = false;
      }
    },
    [
      testState?.question,
      testState?.currentSection?.type,
      totalQuestions,
      runGoto,
      handleAnswer,
      applySavedAnswerForIndex,
      preloadNextQuestions,
      saveQuestionToLocal,
    ],
  );

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
    if (index === testState.currentQuestionIndex) return;
    handleJumpToQuestion(index).catch((err) =>
      console.error("[Test Page] Failed to jump from module review:", err),
    );
  }, [attemptId, handleJumpToQuestion, testState]);

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
        err instanceof Error ? err.message : "Failed to toggle flag status",
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

  // Submit all pending answers from localStorage (all modules) to server (PRODUCTION-READY: Batch submission)
  const submitAllPendingAnswers = useCallback(async () => {
    const allAnswers = getAllAnswersForSubmit();

    if (allAnswers.length === 0) {
      console.log("[Test Page] No answers to submit");
      return;
    }

    console.log(
      `[Test Page] Submitting ${allAnswers.length} answers to server (batch mode)...`,
    );

    const batchAnswers = allAnswers.map((answer) => ({
      questionId: answer.questionId,
      choiceId: answer.choiceId,
      textAnswer: answer.textAnswer,
      markedForReview: answer.markedForReview,
      eliminatedChoices: answer.eliminatedChoices,
    }));

    try {
      // Submit in batches of 10 to avoid overwhelming server
      const BATCH_SIZE = 10;
      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < batchAnswers.length; i += BATCH_SIZE) {
        const batch = batchAnswers.slice(i, i + BATCH_SIZE);

        try {
          const result = await practiceService.submitAnswersBatch(
            attemptId,
            batch,
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
            err,
          );
          failCount += batch.length;
        }
      }

      console.log(
        `[Test Page] Batch submission complete: ${successCount} succeeded, ${failCount} failed`,
      );
    } catch (err) {
      console.error("[Test Page] Batch submission error:", err);
      // Fallback: individual submission (should rarely happen)
      console.warn("[Test Page] Falling back to individual submission...");

      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < allAnswers.length; i++) {
        const answer = allAnswers[i];
        try {
          await practiceService.submitAnswer(
            attemptId,
            answer.questionId,
            answer.choiceId,
            answer.textAnswer,
            answer.markedForReview,
            answer.eliminatedChoices,
          );
          successCount++;
          if (i < allAnswers.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 200));
          }
        } catch (submitErr) {
          console.error(
            `Failed to submit answer for question ${answer.questionId}:`,
            submitErr,
          );
          failCount++;
        }
      }

      console.log(
        `[Test Page] Fallback submission complete: ${successCount} succeeded, ${failCount} failed`,
      );
    }
  }, [attemptId, getAllAnswersForSubmit]);

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
              "[Test Page] Attempt already not in progress, skipping submitTest",
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
  const sectionType = testState.currentSection?.type ?? "ENGLISH";
  const cap = QUESTIONS_PER_MODULE[sectionType] ?? 27;
  const rawTotal =
    totalQuestions ?? testState.currentModule?.totalQuestions ?? 0;
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
    <div className="flex h-screen w-full bg-white overflow-hidden px-2 sm:px-4 md:px-5">
      {/* Desmos Calculator Panel (Math only, non-blocking, draggable, resizable from corner) */}
      {showCalculator && testState.currentSection.type === "MATH" && (
        <DesmosCalculatorPanel
          width={desmosSize.width}
          height={desmosSize.height}
          onSizeChange={setDesmosSize}
          onClose={() => setShowCalculator(false)}
        />
      )}
      {showReferenceSheet && testState.currentSection.type === "MATH" && (
        <ReferenceSheetPanel
          width={referenceSheetSize.width}
          height={referenceSheetSize.height}
          onSizeChange={setReferenceSheetSize}
          onClose={() => setShowReferenceSheet(false)}
        />
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

      <div className="flex-1 min-h-0 flex flex-col transition-all duration-300 relative overflow-hidden">
        {/* Watermark with glass blur effect */}
        <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center overflow-hidden">
          <div className="relative w-full h-full">
            {/* Glass blur background */}
            <div className="absolute inset-0 bg-white/5" aria-hidden="true"></div>
            {/* Watermark text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-7xl md:text-9xl lg:text-[12rem] font-extrabold text-gray-300/20 select-none transform -rotate-12 tracking-wider">
                SATZIYO
              </div>
            </div>
          </div>
        </div>

        <main className="flex-1 min-h-0 relative z-10 flex flex-col">
          <div
            className="flex-1 min-h-0 flex flex-col font-noto-serif transition-all duration-300 text-xs sm:text-sm md:text-base"
            style={{ lineHeight: "1.5" }}
          >
            {/* Header – doimiy balandlik, o‘zgarmaydi, yuqorida qotib turadi */}
            <div
              className="flex-shrink-0 flex-none h-14 bg-white text-gray-800 flex items-center justify-between border-b border-gray-300 relative"
              style={{
                minHeight: 56,
                maxHeight: 56,
                borderBottom: "2px dashed",
                borderImage:
                  "repeating-linear-gradient(to right, rgb(167, 56, 87) 0%, rgb(167, 56, 87) 3.5%, transparent 3.5%, transparent 4%, rgb(249, 223, 205) 4%, rgb(249, 223, 205) 7.5%, transparent 7.5%, transparent 8%, rgb(28, 17, 103) 8%, rgb(28, 17, 103) 11.5%, transparent 11.5%, transparent 12%, rgb(94, 147, 101) 12%, rgb(94, 147, 101) 15.5%, transparent 15.5%, transparent 16%) 1 / 1 / 0 stretch",
              }}
            >
              <div className="pl-3 flex items-center min-w-0">
                <p className="font-semibold text-sm truncate">
                  Section {testState.currentSection.orderIndex + 1}, Module{" "}
                  {testState.currentModule.moduleNumber}:{" "}
                  {testState.currentSection.type === "ENGLISH"
                    ? "Reading and Writing"
                    : "Math"}
                </p>
                <button className="text-sm text-blue-600 hover:underline ml-2 flex-shrink-0">
                  Directions
                </button>
              </div>

              {/* Timer - Centered */}
              {!isTimerHidden ? (
                <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-2">
                  <div className="text-base sm:text-lg font-bold text-black">
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
                    className="flex items-center justify-center text-gray-600 hover:text-blue-600 focus:outline-none rounded p-1"
                    aria-label="Show timer"
                    title="Show timer"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Right side buttons – doimiy o‘lcham */}
              <div className="flex items-center gap-2 flex-nowrap pr-3 shrink-0">
                {testState.currentSection.type !== "MATH" && (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowNotesModal(true)}
                      className="flex items-center gap-1.5 p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 text-xs whitespace-nowrap"
                      title="Open Notes"
                    >
                      <StickyNote className="w-5 h-5 shrink-0" />
                      <span className="hidden sm:inline">Notes</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsMarkupEnabled((prev) => !prev)}
                      className={`flex items-center gap-1.5 p-2 rounded-lg text-xs whitespace-nowrap ${
                        isMarkupEnabled
                          ? "text-blue-600 bg-gray-100"
                          : "text-gray-700 hover:text-blue-600 hover:bg-gray-100 bg-gray-100 hover:bg-gray-200"
                      }`}
                      aria-label="Highlights and Notes"
                    >
                      <Edit className="w-5 h-5 shrink-0" />
                      <span className="hidden sm:inline">Highlights</span>
                    </button>
                  </>
                )}
                {testState.currentSection.type === "MATH" && (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowReferenceSheet((prev) => !prev)}
                      className={`flex items-center gap-1.5 p-2 rounded-lg text-xs whitespace-nowrap ${
                        showReferenceSheet
                          ? "text-blue-600 bg-gray-100"
                          : "text-gray-700 hover:text-blue-600 hover:bg-gray-100 bg-gray-100 hover:bg-gray-200"
                      }`}
                      aria-label="Reference Sheet"
                      title="Reference Sheet"
                    >
                      <BookOpen className="w-5 h-5 shrink-0" />
                      <span className="hidden sm:inline">Reference</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCalculator((prev) => !prev)}
                      className={`flex items-center gap-1.5 p-2 rounded-lg text-xs whitespace-nowrap ${
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
                  </>
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

            {/* Markaz – katta ekranlarda (>= lg): Math = bitta ustun (ustma-ust), R&W = ikki ustun */}
            <div className="flex-1 min-h-0 flex flex-col relative min-w-0 overflow-hidden">
              {/* Desktop / large (>= lg) */}
              <div
                className="relative hidden lg:flex lg:flex-col flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden"
                ref={layoutContainerRef}
                style={{ WebkitOverflowScrolling: "touch" }}
              >
                {/* Math: bitta ustun, ustma-ust, o‘rtadagi column array yo‘q */}
                {testState.currentSection.type === "MATH" ? (
                  <div className="w-full flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
                    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 pb-6">
                      {isOpenAnswerQuestion(question) && (
                        <div className="p-3 sm:p-4 md:p-5 bg-gray-50/80 rounded-lg text-xs sm:text-sm md:text-base leading-relaxed mb-4">
                          <h2 className="text-sm sm:text-base md:text-lg font-bold text-black mb-2 sm:mb-3 md:mb-4">
                            Student-Produced Response Directions
                          </h2>
                          <ul className="list-disc pl-4 sm:pl-5 space-y-1 sm:space-y-2 mb-2 sm:mb-3 md:mb-4 text-gray-800">
                            <li>If you find more than one correct answer, enter only one answer.</li>
                            <li>You can enter up to 5 characters for a positive answer and up to 6 characters (including the negative sign) for a negative answer.</li>
                            <li>If your answer is a fraction that doesn&apos;t fit in the provided space, enter the decimal equivalent.</li>
                            <li>If your answer is a decimal that doesn&apos;t fit in the provided space, enter it by truncating or rounding at the fourth digit.</li>
                            <li>If your answer is a mixed number (such as 3½), enter it as an improper fraction (7/2) or its decimal equivalent (3.5).</li>
                            <li>Don&apos;t enter symbols such as a percent sign, comma, or dollar sign.</li>
                          </ul>
                          <p className="font-semibold text-black mb-1 sm:mb-2 text-xs sm:text-sm">Examples</p>
                          <div className="overflow-x-auto border border-gray-300 rounded-lg">
                            <table className="w-full text-xs sm:text-sm border-collapse">
                              <thead>
                                <tr className="bg-gray-100 border-b border-gray-300">
                                  <th className="text-left p-1 sm:p-2 font-semibold text-black border-r border-gray-300">Answer</th>
                                  <th className="text-left p-1 sm:p-2 font-semibold text-black border-r border-gray-300">Acceptable ways to enter answer</th>
                                  <th className="text-left p-1 sm:p-2 font-semibold text-black">Unacceptable: will NOT receive credit</th>
                                </tr>
                              </thead>
                              <tbody className="text-gray-800">
                                <tr className="border-b border-gray-200"><td className="p-1 sm:p-2 border-r border-gray-200">3.5</td><td className="p-1 sm:p-2 border-r border-gray-200">3.5, 3.50, 7/2</td><td className="p-1 sm:p-2">3 1/2</td></tr>
                                <tr className="border-b border-gray-200"><td className="p-1 sm:p-2 border-r border-gray-200">2/3</td><td className="p-1 sm:p-2 border-r border-gray-200">2/3, .6666, .6667, 0.666, 0.667</td><td className="p-1 sm:p-2">0.66, .66, 0.67, .67</td></tr>
                                <tr><td className="p-1 sm:p-2 border-r border-gray-200">-1/3</td><td className="p-1 sm:p-2 border-r border-gray-200">-1/3, -.3333, -0.333</td><td className="p-1 sm:p-2">-.33, -0.33</td></tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center justify-between bg-gray-200 rounded-lg mb-2 sm:mb-3 md:mb-4 py-0.5 sm:py-1">
                        <div className="flex items-center h-full">
                          <p className="question-index font-semibold bg-black text-white text-xs sm:text-sm h-full px-2 sm:px-3 py-1.5 sm:py-2 rounded-l rounded-r-none">
                            {testState.currentQuestionIndex + 1}
                          </p>
                          <button type="button" onClick={handleToggleFlag} className="flex items-center text-xs sm:text-sm text-gray-600 hover:text-black mr-1 sm:mr-2 h-full px-1 sm:px-2">
                            <Flag className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-500 ${isFlagged ? "fill-orange-500 text-orange-500" : ""}`} />
                            <span className="ml-0.5 sm:ml-1 text-xs sm:text-sm">Mark for Review</span>
                          </button>
                        </div>
                        {hasChoiceOptions(question) && (
                          <button type="button" onClick={() => { setIsEliminationMode((prev) => !prev); if (isEliminationMode) setEliminatedChoices(new Set()); }} className={`hidden xl:flex items-center text-sm text-gray-600 hover:text-black mr-2 h-full relative border border-gray-300 rounded w-8 h-8 justify-center bg-transparent ${isEliminationMode ? "bg-blue-100" : ""}`}>
                            <span className="text-[12px] font-medium text-gray-600">ABC</span>
                            {isEliminationMode && <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="absolute w-8 h-8 text-gray-500 pointer-events-none"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M18 6L6 18" /></svg>}
                          </button>
                        )}
                      </div>
                      <div className="prose prose-sm sm:prose max-w-none mb-2 sm:mb-3 md:mb-4 text-xs sm:text-sm md:text-base">
                        <QuestionDisplay key={question.id} question={question} selectedChoiceId={currentAnswer.choiceId} textAnswer={currentAnswer.textAnswer} onSelectChoice={(choiceId) => handleAnswerChange({ choiceId, textAnswer: currentAnswer.textAnswer })} onTextAnswerChange={(text) => handleAnswerChange({ textAnswer: text, choiceId: currentAnswer.choiceId })} isFlagged={isFlagged} hidePassage showOnlyQuestionText isMarkupEnabled={isMarkupEnabled} attemptId={attemptId} onHighlightsChange={(highlights) => { if (highlights.length > 0) saveHighlightsToStorage(question.id, highlights); else { const all = getAllHighlightsFromStorage(); all.delete(question.id); if (typeof window !== "undefined") try { const o = {}; all.forEach((v, k) => { (o as any)[k] = v; }); localStorage.setItem(getHighlightsStorageKey(), JSON.stringify(o)); } catch (e) { console.error(e); } } }} />
                      </div>
                      {getQuestionImageUrl(question) && (
                        <div className="mt-2 sm:mt-3 md:mt-4 p-2 sm:p-3 bg-white rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden mb-4">
                          <img src={getQuestionImageUrl(question)!} alt="Question" className="w-full h-auto rounded-lg object-contain max-h-[140px] sm:max-h-[180px] bg-white" loading="lazy" />
                        </div>
                      )}
                      {hasChoiceOptions(question) && (
                        <div className="space-y-2 sm:space-y-3 md:space-y-4">
                          {(question.choices ?? []).map((choice, index) => {
                            const isSelected = currentAnswer.choiceId === choice.id;
                            const letter = String.fromCharCode(65 + index);
                            const isEliminated = eliminatedChoices.has(choice.id);
                            const choiceImageUrl = getChoiceImageUrl(choice as Record<string, unknown>);
                            return (
                              <div key={choice.id || index} className="relative w-full">
                                <button type="button" onClick={() => { if (isEliminationMode) setEliminatedChoices((prev) => { const next = new Set(prev); if (next.has(choice.id)) next.delete(choice.id); else next.add(choice.id); return next; }); else handleAnswerChange({ choiceId: choice.id, textAnswer: currentAnswer.textAnswer }); }} className={`w-full p-2 sm:p-3 md:p-4 text-left border-2 rounded-lg text-xs sm:text-sm md:text-base flex items-start gap-2 md:gap-3 ${isSelected ? "border-black" : isEliminated ? "border-gray-300 bg-gray-100 opacity-60" : "border-gray-200 hover:bg-gray-200 cursor-pointer"}`}>
                                  <div className={`flex-shrink-0 flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full font-bold border border-black text-[10px] sm:text-xs ${isSelected ? "bg-black text-white" : "text-black"}`}><span className="text-xs">{letter}</span></div>
                                  <div className={`flex-1 min-w-0 ${isEliminated ? "line-through text-gray-500" : ""}`}>
                                    <span className="block">{getChoiceText(choice) || `Choice ${letter}`}</span>
                                    {choiceImageUrl && <span className="block mt-3 bg-white rounded border border-gray-200 overflow-hidden p-1"><img src={choiceImageUrl} alt={`Variant ${letter}`} className="rounded object-contain max-h-12 w-full bg-white min-h-[24px]" loading="lazy" /></span>}
                                  </div>
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {isOpenAnswerQuestion(question) && (
                        <div className="mt-3 pt-2 space-y-2">
                          <input type="text" value={currentAnswer.textAnswer || ""} onChange={(e) => handleAnswerChange({ textAnswer: e.target.value, choiceId: currentAnswer.choiceId })} placeholder="Enter your answer (e.g. 5.566, -5.566, 2/3, -2/3)" pattern="[0-9.\\-/]+" className="max-w-[180px] sm:max-w-[220px] md:max-w-[240px] w-full px-2 sm:px-3 py-1.5 sm:py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm md:text-base" />
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                <div
                  className="flex flex-1 gap-0 items-stretch"
                  style={{ minHeight: "min-content" }}
                >
                  {/* Left Column – passage (R&W) */}
                  <div
                    className="content-pane flex-shrink-0 pr-1 md:pr-2 min-w-0"
                    style={{
                      width: `calc(${splitPosition}% - 4px)`,
                      minWidth: 200,
                    }}
                  >
                    <div className="pr-2 md:pr-4 pb-4 md:pb-6 pl-0.5 md:pl-1">
                      {/* R&W: passage chapda */}
                      {question.sharedPassage?.content ||
                        question.passage ? (
                        <div className="p-3 sm:p-4 md:p-5 bg-gray-50/80 rounded-lg">
                          <p className="text-xs sm:text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                            {question.sharedPassage?.content ||
                              question.passage}
                          </p>
                        </div>
                      ) : (
                        <div className="text-gray-500 text-sm italic">
                          No passage for this question.
                        </div>
                      )}
                      {/* Savol rasmi passage/directions ostida chap ustunda */}
                      {getQuestionImageUrl(question) && (
                        <div className="mt-2 sm:mt-3 md:mt-4 p-2 sm:p-3 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                          <img
                            src={getQuestionImageUrl(question)!}
                            alt="Question"
                            className="w-full h-auto rounded-lg object-contain max-h-[100px] sm:max-h-[140px] md:max-h-[180px] bg-gray-100"
                            loading="lazy"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Resizable Divider (in-flow, scroll bilan birga harakat qiladi) */}
                  <div
                    className="divider-inline self-stretch"
                    onMouseDown={handleDividerMouseDown}
                    aria-label="Resize columns"
                  />

                  {/* Right Column – scroll yo‘q, kontent to‘liq ko‘rinadi */}
                  <div
                    className="content-pane flex-1 min-w-0 pl-1 md:pl-2"
                    style={{
                      width: `calc(${100 - splitPosition}% - 4px)`,
                      minWidth: 260,
                    }}
                  >
                    <div className="px-2 md:px-4 pb-4 md:pb-6">
                      {/* O'ng ustun: savol raqami + Mark for Review + ABC */}
                      <div className="flex items-center justify-between bg-gray-200 rounded-lg mb-2 sm:mb-3 md:mb-4 py-0.5 sm:py-1">
                        <div className="flex items-center h-full">
                          <p className="question-index font-semibold bg-black text-white text-xs sm:text-sm h-full px-2 sm:px-3 py-1.5 sm:py-2 rounded-l rounded-r-none">
                            {testState.currentQuestionIndex + 1}
                          </p>
                          <button
                            type="button"
                            onClick={handleToggleFlag}
                            className="flex items-center text-xs sm:text-sm text-gray-600 hover:text-black mr-1 sm:mr-2 h-full px-1 sm:px-2"
                          >
                            <Flag
                              className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-500 ${
                                isFlagged
                                  ? "fill-orange-500 text-orange-500"
                                  : ""
                              }`}
                            />
                            <span className="ml-0.5 sm:ml-1 text-xs sm:text-sm">
                              Mark for Review
                            </span>
                          </button>
                        </div>
                        {hasChoiceOptions(question) && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsEliminationMode((prev) => !prev);
                              if (isEliminationMode)
                                setEliminatedChoices(new Set());
                            }}
                            className={`hidden xl:flex items-center text-sm text-gray-600 hover:text-black mr-2 h-full relative border border-gray-300 rounded w-8 h-8 justify-center bg-transparent ${
                              isEliminationMode ? "bg-blue-100" : ""
                            }`}
                          >
                            <span className="text-[12px] font-medium text-gray-600">
                              ABC
                            </span>
                            {isEliminationMode && (
                              <svg
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                className="absolute w-8 h-8 text-gray-500 pointer-events-none"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="1"
                                  d="M18 6L6 18"
                                />
                              </svg>
                            )}
                          </button>
                        )}
                      </div>
                      {/* Savol matni – rasm chapda passage ostida */}
                      <div className="prose prose-sm sm:prose max-w-none mb-2 sm:mb-3 md:mb-4 text-xs sm:text-sm md:text-base">
                        <QuestionDisplay
                          key={question.id}
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
                              const allHighlights =
                                getAllHighlightsFromStorage();
                              allHighlights.delete(question.id);
                              if (typeof window !== "undefined") {
                                try {
                                  const highlightsObj: Record<string, any> = {};
                                  allHighlights.forEach((value, key) => {
                                    highlightsObj[key] = value;
                                  });
                                  localStorage.setItem(
                                    getHighlightsStorageKey(),
                                    JSON.stringify(highlightsObj),
                                  );
                                } catch (err) {
                                  console.error(
                                    "Failed to save highlights from localStorage:",
                                    err,
                                  );
                                }
                              }
                            }
                          }}
                        />
                      </div>

                      {hasChoiceOptions(question) && (
                        <div className="space-y-2 sm:space-y-3 md:space-y-4">
                          {(question.choices ?? []).map((choice, index) => {
                            const isSelected =
                              currentAnswer.choiceId === choice.id;
                            const letter = String.fromCharCode(65 + index);
                            const isEliminated = eliminatedChoices.has(
                              choice.id,
                            );
                            const choiceImageUrl = getChoiceImageUrl(
                              choice as Record<string, unknown>,
                            );

                            return (
                              <div
                                key={choice.id || index}
                                className="relative w-full"
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
                                  className={`w-full p-2 sm:p-3 md:p-4 text-left border-2 rounded-lg text-xs sm:text-sm md:text-base flex items-start gap-2 md:gap-3 ${
                                    isSelected
                                      ? "border-black"
                                      : isEliminated
                                        ? "border-gray-300 bg-gray-100 opacity-60"
                                        : "border-gray-200 hover:bg-gray-200 cursor-pointer"
                                  }`}
                                >
                                  <div
                                    className={`flex-shrink-0 flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full font-bold border border-black text-[10px] sm:text-xs ${
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
                                    <span className="block">
                                      {getChoiceText(choice) ||
                                        `Choice ${letter}`}
                                    </span>
                                    {choiceImageUrl && (
                                      <span className="block mt-3 bg-gray-100 rounded border border-gray-200 overflow-hidden p-1">
                                        {/* Oddiy img – GCS rasmlari ishonchli yuklansin (Next/Image baʼzan tashqi URL da muammo qiladi) */}
                                        <img
                                          src={choiceImageUrl}
                                          alt={`Variant ${letter}`}
                                          className="rounded object-contain max-h-12 w-full bg-gray-100 min-h-[24px]"
                                          loading="lazy"
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

                      {isOpenAnswerQuestion(question) && (
                        <div className="mt-3 pt-2 space-y-2">
                          <input
                            type="text"
                            value={currentAnswer.textAnswer || ""}
                            onChange={(e) =>
                              handleAnswerChange({
                                textAnswer: e.target.value,
                                choiceId: currentAnswer.choiceId,
                              })
                            }
                            placeholder="Enter your answer (e.g. 5.566, -5.566, 2/3, -2/3)"
                            pattern="[0-9.\\-/]+"
                            className="max-w-[180px] sm:max-w-[220px] md:max-w-[240px] w-full px-2 sm:px-3 py-1.5 sm:py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm md:text-base"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                )}
              </div>

              {/* Mobil / planshet (< lg) – bitta ustun, bitta scroll, to‘liq responsive */}
              <div className="flex lg:hidden flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden overscroll-contain">
                <div className="w-full min-w-0 px-2 sm:px-3 md:px-4 pb-4 sm:pb-6">
                  {/* Math + grid-in: mobil da ham directions */}
                  {testState.currentSection.type === "MATH" &&
                    isOpenAnswerQuestion(question) && (
                      <div className="p-3 sm:p-4 mb-3 sm:mb-5 bg-gray-50/80 rounded-lg text-xs sm:text-sm leading-relaxed">
                        <h2 className="text-sm sm:text-base md:text-lg font-bold text-black mb-2 sm:mb-3">
                          Student-Produced Response Directions
                        </h2>
                        <ul className="list-disc pl-4 sm:pl-5 space-y-1 sm:space-y-1.5 mb-2 sm:mb-3 text-gray-800 text-xs sm:text-sm">
                          <li>
                            If you find more than one correct answer, enter only
                            one answer.
                          </li>
                          <li>
                            You can enter up to 5 characters for a positive
                            answer and up to 6 (including the negative sign) for
                            a negative answer.
                          </li>
                          <li>
                            If your answer is a fraction that doesn&apos;t fit,
                            enter the decimal equivalent.
                          </li>
                          <li>
                            If your answer is a decimal that doesn&apos;t fit,
                            enter it by truncating or rounding at the fourth
                            digit.
                          </li>
                          <li>
                            If your answer is a mixed number (e.g. 3½), enter it
                            as an improper fraction (7/2) or decimal (3.5).
                          </li>
                          <li>
                            Don&apos;t enter symbols such as %, comma, or $.
                          </li>
                        </ul>
                        <p className="font-semibold text-black mb-1 sm:mb-1.5 text-xs sm:text-sm">
                          Examples
                        </p>
                        <div className="overflow-x-auto border border-gray-300 rounded text-xs sm:text-sm">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="bg-gray-100 border-b border-gray-300">
                                <th className="text-left p-1 sm:p-1.5 font-semibold border-r border-gray-300">
                                  Answer
                                </th>
                                <th className="text-left p-1 sm:p-1.5 font-semibold border-r border-gray-300">
                                  Acceptable
                                </th>
                                <th className="text-left p-1 sm:p-1.5 font-semibold">
                                  Unacceptable
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="border-b border-gray-200">
                                <td className="p-1 sm:p-1.5 border-r">3.5</td>
                                <td className="p-1 sm:p-1.5 border-r">
                                  3.5, 3.50, 7/2
                                </td>
                                <td className="p-1 sm:p-1.5">3 1/2</td>
                              </tr>
                              <tr className="border-b border-gray-200">
                                <td className="p-1 sm:p-1.5 border-r">2/3</td>
                                <td className="p-1 sm:p-1.5 border-r">
                                  2/3, .6666, .6667, 0.666, 0.667
                                </td>
                                <td className="p-1 sm:p-1.5">
                                  0.66, .66, 0.67, .67
                                </td>
                              </tr>
                              <tr>
                                <td className="p-1 sm:p-1.5 border-r">-1/3</td>
                                <td className="p-1 sm:p-1.5 border-r">
                                  -1/3, -.3333, -0.333
                                </td>
                                <td className="p-1 sm:p-1.5">-.33, -0.33</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  <div className="question-index-container flex items-center justify-between bg-gray-200 rounded-lg mb-3 sm:mb-5 py-0.5 sm:py-1">
                    <div className="flex items-center h-full">
                      <p className="question-index font-semibold bg-black text-white text-xs sm:text-sm h-full px-2 sm:px-3 py-1.5 sm:py-2 rounded-l">
                        {testState.currentQuestionIndex + 1}
                      </p>
                      <button
                        type="button"
                        onClick={handleToggleFlag}
                        className="flex items-center text-xs sm:text-sm text-gray-600 hover:text-black mr-1 sm:mr-2 h-full px-1 sm:px-2"
                      >
                        <Flag
                          className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-500 ${
                            isFlagged ? "fill-orange-500 text-orange-500" : ""
                          }`}
                        />
                        <span className="ml-0.5 sm:ml-1">Mark for Review</span>
                      </button>
                    </div>
                  </div>
                  <div className="prose prose-sm sm:prose max-w-none mt-0 mb-3 sm:mb-5 text-xs sm:text-sm">
                    <QuestionDisplay
                      key={question.id}
                      question={question}
                      selectedChoiceId={currentAnswer.choiceId}
                      textAnswer={currentAnswer.textAnswer}
                      onSelectChoice={(choiceId) =>
                        handleAnswerChange({
                          choiceId,
                          textAnswer: currentAnswer.textAnswer,
                        })
                      }
                      onTextAnswerChange={(text) =>
                        handleAnswerChange({
                          textAnswer: text,
                          choiceId: currentAnswer.choiceId,
                        })
                      }
                      isFlagged={isFlagged}
                      hidePassage={false}
                      isMarkupEnabled={isMarkupEnabled}
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
                              localStorage.setItem(
                                getHighlightsStorageKey(),
                                JSON.stringify(highlightsObj),
                              );
                            } catch (err) {
                              console.error(
                                "Failed to save highlights from localStorage:",
                                err,
                              );
                            }
                          }
                        }
                      }}
                    />
                  </div>
                  {getQuestionImageUrl(question) && (
                    <div className="my-3 sm:my-5 p-2 sm:p-3 bg-gray-100 rounded-lg min-h-[80px] sm:min-h-[120px] flex items-center justify-center overflow-hidden">
                      <img
                        src={getQuestionImageUrl(question)!}
                        alt="Savol rasmi"
                        className="w-full h-auto rounded-lg object-contain max-h-[120px] sm:max-h-[160px] md:max-h-[180px] bg-gray-100"
                        loading="lazy"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer – doimiy balandlik, o‘zgarmaydi, pastda qotib turadi */}
            <div
              className="flex-shrink-0 flex-none h-12 bg-blue-100 flex justify-between items-center"
              style={{
                minHeight: 48,
                maxHeight: 48,
                borderTop: "2px dashed",
                backgroundColor: "rgb(229, 235, 245)",
                borderImage:
                  "repeating-linear-gradient(to right, rgb(167, 56, 87) 0%, rgb(167, 56, 87) 3.5%, transparent 3.5%, transparent 4%, rgb(249, 223, 205) 4%, rgb(249, 223, 205) 7.5%, transparent 7.5%, transparent 8%, rgb(28, 17, 103) 8%, rgb(28, 17, 103) 11.5%, transparent 11.5%, transparent 12%, rgb(94, 147, 101) 12%, rgb(94, 147, 101) 15.5%, transparent 15.5%, transparent 16%) 1 / 1 / 0 stretch",
              }}
            >
              <p className="text-sm truncate max-w-[100px] sm:max-w-[120px]">
                {currentUser?.name ||
                  currentUser?.email?.split("@")[0] ||
                  "User"}
              </p>
              <div
                className="bg-black text-white px-3 py-1.5 flex items-center gap-2 rounded-xl cursor-pointer"
                style={{
                  position: "absolute",
                  left: "50%",
                  transform: "translateX(-50%)",
                }}
                onClick={() => setShowNavigator((prev) => !prev)}
              >
                <p className="text-white text-sm">
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
                  disabled={
                    testState.currentQuestionIndex === 0 ||
                    submitting ||
                    isQuestionLoading
                  }
                  className="px-4 py-2 text-sm text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
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
                    disabled={submitting || isQuestionLoading}
                    className="px-4 py-2 text-sm text-white rounded-md cursor-pointer"
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
                    disabled={submitting || isQuestionLoading}
                    className="px-4 py-2 text-sm text-white rounded-md cursor-pointer"
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
