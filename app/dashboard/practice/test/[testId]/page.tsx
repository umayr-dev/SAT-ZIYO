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

export default function TestTakingPage() {
  const router = useRouter();
  const params = useParams();
  // NOTE: Route segment is [testId], but here it actually represents attemptId
  const attemptId = params.testId as string;
  const { data: currentUser } = useCurrentUser();

  const [testState, setTestState] = useState<StartTestResponse | null>(null);
  // Local cache for all questions in current module
  const [questionsCache, setQuestionsCache] = useState<Map<number, Question>>(new Map());
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
  const [pendingAnswers, setPendingAnswers] = useState<Map<number, { questionId: string; choiceId?: string; textAnswer?: string }>>(new Map());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFullscreenWarning, setShowFullscreenWarning] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showNavigator, setShowNavigator] = useState(false);
  const [isMarkupEnabled, setIsMarkupEnabled] = useState(false);
  const [isTimerHidden, setIsTimerHidden] = useState(false);
  const [remainingTimeSeconds, setRemainingTimeSeconds] = useState<number | null>(null);
  const [isEliminationMode, setIsEliminationMode] = useState(false);
  const [eliminatedChoices, setEliminatedChoices] = useState<Set<string>>(new Set());
  const [questionNotes, setQuestionNotes] = useState<Map<number, string>>(new Map());
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [newNoteText, setNewNoteText] = useState("");
  
  // localStorage key for notes
  const getNotesStorageKey = useCallback(() => `test_notes_${attemptId}`, [attemptId]);
  
  // Save notes to localStorage
  const saveNotesToStorage = useCallback((notes: Map<number, string>) => {
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
  }, [getNotesStorageKey]);
  
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
  const ANSWERS_CACHE_DURATION = 3000; // 3 seconds cache
  const preloadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // localStorage key for answers
  const getStorageKey = useCallback(() => `test_answers_${attemptId}`, [attemptId]);

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
  const saveAnswerToStorage = (questionIndex: number, answer: { questionId: string; choiceId?: string; textAnswer?: string }) => {
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
  };

  // Get all answers from localStorage
  const getAllAnswersFromStorage = useCallback((): Map<number, { questionId: string; choiceId?: string; textAnswer?: string }> => {
    if (typeof window === "undefined") return new Map();
    
    try {
      const stored = localStorage.getItem(getStorageKey());
      if (!stored) return new Map();
      
      const answers = JSON.parse(stored);
      const map = new Map<number, { questionId: string; choiceId?: string; textAnswer?: string }>();
      Object.keys(answers).forEach((key) => {
        map.set(parseInt(key), answers[key]);
      });
      return map;
    } catch (err) {
      console.error("Failed to get answers from localStorage:", err);
      return new Map();
    }
  }, [getStorageKey]);

  // Clear localStorage on unmount (only if test is completed)
  useEffect(() => {
    return () => {
      if (loadAnswersTimeoutRef.current) {
        clearTimeout(loadAnswersTimeoutRef.current);
      }
      if (preloadTimeoutRef.current) {
        clearTimeout(preloadTimeoutRef.current);
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

  // Smart preload: preload next 3 questions in background
  async function preloadNextQuestions(currentIndex: number, totalQuestions: number) {
    // Clear existing preload timeout
    if (preloadTimeoutRef.current) {
      clearTimeout(preloadTimeoutRef.current);
    }

    // Wait 500ms before preloading to avoid blocking current navigation
    preloadTimeoutRef.current = setTimeout(async () => {
      const questionsToPreload = 3;
      const preloadPromises: Promise<void>[] = [];

      for (let i = 1; i <= questionsToPreload; i++) {
        const nextIndex = currentIndex + i;
        
        // Skip if beyond total questions
        if (nextIndex >= totalQuestions) break;
        
        // Skip if already in cache
        if (questionsCache.has(nextIndex)) continue;

        // Preload in background (don't await)
        preloadPromises.push(
          (async () => {
            try {
              const state = await practiceService.jumpToQuestion(attemptId, nextIndex);
              if (state.question) {
                setQuestionsCache((prev) => {
                  const next = new Map(prev);
                  next.set(nextIndex, state.question);
                  return next;
                });
              }
            } catch (err) {
              console.error(`Failed to preload question ${nextIndex}:`, err);
            }
          })()
        );
      }

      // Execute all preloads in parallel
      Promise.all(preloadPromises).catch(console.error);
    }, 500);
  }

  async function loadTestState() {
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
        setError("No current question available. The test may have been completed or abandoned.");
        return;
      }
      
      setTestState(state);
      setEliminatedChoices(new Set()); // Clear eliminations when loading new question
      
      // Set totalQuestions from current module if available
      if (state?.currentModule?.totalQuestions) {
        console.log("[Test Page] Setting totalQuestions from currentModule:", state.currentModule.totalQuestions);
        setTotalQuestions(state.currentModule.totalQuestions);
        
        // Preload next 3 questions in background
        preloadNextQuestions(state.currentQuestionIndex, state.currentModule.totalQuestions);
      } else {
        console.warn("[Test Page] No totalQuestions in currentModule:", state.currentModule);
      }
      
      // Initialize timer if module duration is available
      if (state?.currentModule?.duration && remainingTimeSeconds === null) {
        const durationSeconds = state.currentModule.duration * 60; // Convert minutes to seconds
        setRemainingTimeSeconds(durationSeconds);
      }
      
      // Load answered questions only once on initial load (force)
      loadAnsweredQuestions(state, true).catch(console.error);
    } catch (err) {
      console.error("[Test Page] Failed to load test state:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to load test";
      setError(errorMessage);
      
      // If it's a 404 or 401, provide more specific error
      if (err instanceof Error && err.message.includes("404")) {
        setError("Test attempt not found. It may have been deleted or expired.");
      } else if (err instanceof Error && err.message.includes("401")) {
        setError("Unauthorized. Please log in again.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadAnsweredQuestions(currentState?: StartTestResponse, force = false) {
    // Throttle: don't load if called within cache duration
    const now = Date.now();
    if (!force && now - lastAnswersLoadRef.current < ANSWERS_CACHE_DURATION) {
      console.log("[Test Page] Skipping loadAnsweredQuestions - too soon after last load");
      return;
    }

    try {
      lastAnswersLoadRef.current = now;
      const answers = await practiceService.getAnsweredQuestions(attemptId);
      const state = currentState || testState;

      if (!answers || !Array.isArray(answers.answers)) {
        setAnsweredQuestions(new Set());
        // Use totalQuestions from answers, then currentState, then testState, then currentModule
        const total = 
          answers?.totalQuestions ?? 
          state?.currentModule?.totalQuestions ?? 
          testState?.currentModule?.totalQuestions ?? 
          0;
        setTotalQuestions(total);
        return;
      }

      const answeredSet = new Set(
        answers.answers
          .filter((a) => a.answered)
          .map((a) => a.questionIndex)
      );
      setAnsweredQuestions(answeredSet);
      
      // Use totalQuestions from API response, with fallback to current module
      const total = 
        answers.totalQuestions ?? 
        state?.currentModule?.totalQuestions ?? 
        testState?.currentModule?.totalQuestions ?? 
        0;
      
      console.log("[Test Page] Setting totalQuestions from answers:", {
        fromAnswers: answers.totalQuestions,
        fromState: state?.currentModule?.totalQuestions,
        fromTestState: testState?.currentModule?.totalQuestions,
        final: total,
      });
      
      setTotalQuestions(total);
    } catch (err) {
      console.error("Failed to load answered questions:", err);
      // On error, still try to set totalQuestions from state
      const state = currentState || testState;
      if (state?.currentModule?.totalQuestions) {
        setTotalQuestions(state.currentModule.totalQuestions);
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
    
    setCurrentAnswer({});
    
    // NO SERVER REQUEST - answers will be submitted when test finishes
  }, [testState, currentAnswer, saveAnswerToStorage]);

  async function handleNext() {
    if (!testState?.question) return;

    try {
      setSubmitting(true);
      
      // Save current answer (no server request)
      handleAnswer();
      
      // Clear markup when moving to next question
      setIsMarkupEnabled(false);
      
      const currentIndex = testState.currentQuestionIndex;
      const nextIndex = currentIndex + 1;
      
      // Check if next question is in cache
      const cachedQuestion = questionsCache.get(nextIndex);
      
      if (cachedQuestion && testState.currentModule) {
        // Use cached question - instant navigation!
        setTestState({
          ...testState,
          currentQuestionIndex: nextIndex,
          question: cachedQuestion,
        });
        setCurrentAnswer({});
        setEliminatedChoices(new Set());
        setSubmitting(false);
        
        // Preload next 3 questions in background
        if (totalQuestions) {
          preloadNextQuestions(nextIndex, totalQuestions);
        }
        return;
      }
      
      // If not in cache, fetch from server
      const nextState = await practiceService.nextQuestion(attemptId);
      setTestState(nextState);
      
      // Add to cache
      if (nextState.question) {
        setQuestionsCache((prev) => {
          const next = new Map(prev);
          next.set(nextIndex, nextState.question);
          return next;
        });
      }
      
      setCurrentAnswer({});
      setEliminatedChoices(new Set());
      
      // Preload next 3 questions in background
      if (totalQuestions) {
        preloadNextQuestions(nextIndex, totalQuestions);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to go to next question"
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePrevious() {
    if (!testState?.question) return;

    try {
      setSubmitting(true);
      
      // Save current answer (no server request)
      handleAnswer();
      
      // Clear markup when moving to previous question
      setIsMarkupEnabled(false);
      
      const currentIndex = testState.currentQuestionIndex;
      const prevIndex = currentIndex - 1;
      
      // Check if previous question is in cache
      const cachedQuestion = questionsCache.get(prevIndex);
      
      if (cachedQuestion && testState.currentModule) {
        // Use cached question - instant navigation!
        setTestState({
          ...testState,
          currentQuestionIndex: prevIndex,
          question: cachedQuestion,
        });
        setCurrentAnswer({});
        setEliminatedChoices(new Set());
        setSubmitting(false);
        return;
      }
      
      // If not in cache, fetch from server
      const prevState = await practiceService.previousQuestion(attemptId);
      setTestState(prevState);
      
      // Add to cache
      if (prevState.question) {
        setQuestionsCache((prev) => {
          const next = new Map(prev);
          next.set(prevIndex, prevState.question);
          return next;
        });
      }
      
      setCurrentAnswer({});
      setEliminatedChoices(new Set());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to go to previous question"
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleJumpToQuestion(index: number) {
    if (!testState?.question) return;

    try {
      setSubmitting(true);
      
      // Save current answer (no server request)
      handleAnswer();
      
      // Clear markup when jumping to another question
      setIsMarkupEnabled(false);
      
      // Check if question is in cache
      const cachedQuestion = questionsCache.get(index);
      
      if (cachedQuestion && testState.currentModule) {
        // Use cached question - instant navigation!
        setTestState({
          ...testState,
          currentQuestionIndex: index,
          question: cachedQuestion,
        });
        setCurrentAnswer({});
        setEliminatedChoices(new Set());
        setSubmitting(false);
        
        // Preload next 3 questions in background
        if (totalQuestions) {
          preloadNextQuestions(index, totalQuestions);
        }
        return;
      }
      
      // If not in cache, fetch from server
      const state = await practiceService.jumpToQuestion(attemptId, index);
      setTestState(state);
      
      // Add to cache
      if (state.question) {
        setQuestionsCache((prev) => {
          const next = new Map(prev);
          next.set(index, state.question);
          return next;
        });
      }
      
      setCurrentAnswer({});
      setEliminatedChoices(new Set());
      
      // Preload next 3 questions in background
      if (totalQuestions) {
        preloadNextQuestions(index, totalQuestions);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to go to selected question"
      );
    } finally {
      setSubmitting(false);
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
      setSubmitting(true);
      // Save current answer before finishing
      handleAnswer();
      
      // Submit all pending answers to server before finishing section
      await submitAllPendingAnswers();
      
      const result = await practiceService.finishModule(attemptId);

      switch (result.nextStep) {
        case "BREAK":
          router.push(`/dashboard/practice/test/${attemptId}/break`);
          break;
        case "MODULE_2":
        case "NEW_SECTION": {
          const nextState = await practiceService.getCurrentQuestion(attemptId);
          setTestState(nextState);
          setCurrentAnswer({});
          
          // Clear cache for new module
          setQuestionsCache(new Map());
          
          // Update totalQuestions from new module
          if (nextState?.currentModule?.totalQuestions) {
            setTotalQuestions(nextState.currentModule.totalQuestions);
            
            // Preload next 3 questions for new module
            preloadNextQuestions(nextState.currentQuestionIndex, nextState.currentModule.totalQuestions);
          }
          
          // Force reload answered questions when module changes
          await loadAnsweredQuestions(nextState, true);
          break;
        }
        case "SUBMIT_TEST":
        case "COMPLETE":
        default:
          router.push(`/dashboard/practice/test/${attemptId}/finish`);
          break;
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to finish section"
      );
    } finally {
      setSubmitting(false);
    }
  }

  // Submit all pending answers from localStorage to server
  async function submitAllPendingAnswers() {
    const allAnswers = getAllAnswersFromStorage();
    
    if (allAnswers.size === 0) {
      console.log("[Test Page] No answers to submit");
      return;
    }

    console.log(`[Test Page] Submitting ${allAnswers.size} answers to server...`);

    // Submit all answers in parallel (but with rate limiting)
    const submitPromises: Promise<void>[] = [];
    let delay = 0;

    // Convert Map to Array to avoid iterator issues
    const answersArray = Array.from(allAnswers.entries());

    for (const [questionIndex, answer] of answersArray) {
      submitPromises.push(
        (async () => {
          // Stagger requests slightly to avoid overwhelming server
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay += 50; // 50ms delay between requests

          try {
            if (answer.choiceId) {
              await practiceService.submitAnswer(
                attemptId,
                answer.questionId,
                answer.choiceId
              );
            } else if (answer.textAnswer) {
              await practiceService.submitAnswer(
                attemptId,
                answer.questionId,
                undefined,
                answer.textAnswer
              );
            }
          } catch (err) {
            console.error(`Failed to submit answer for question ${questionIndex}:`, err);
            // Continue submitting other answers even if one fails
          }
        })()
      );
    }

    await Promise.all(submitPromises);
    console.log("[Test Page] All answers submitted successfully");
  }

  function handleAnswerChange(answer: { choiceId?: string; textAnswer?: string }) {
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
        
        // Submit all pending answers
        const allAnswers = getAllAnswersFromStorage();
        const answersArray = Array.from(allAnswers.entries());
        
        for (const [questionIndex, answer] of answersArray) {
          try {
            if (answer.choiceId) {
              await practiceService.submitAnswer(
                attemptId,
                answer.questionId,
                answer.choiceId
              );
            } else if (answer.textAnswer) {
              await practiceService.submitAnswer(
                attemptId,
                answer.questionId,
                undefined,
                answer.textAnswer
              );
            }
          } catch (err) {
            console.error(`Failed to submit answer for question ${questionIndex}:`, err);
          }
        }
        
        // Submit test
        await practiceService.submitTest(attemptId);
        router.push(`/dashboard/practice/test/${attemptId}/finish`);
      } catch (err) {
        console.error("Failed to finish section:", err);
        setError("Failed to finish section. Please try again.");
      } finally {
        setSubmitting(false);
      }
    }
  }, [testState, attemptId, router, getAllAnswersFromStorage, handleAnswer]);

  // Handle save and exit
  const handleSaveAndExit = useCallback(async () => {
    try {
      // Submit all pending answers before exiting
      const allAnswers = getAllAnswersFromStorage();
      const answersArray = Array.from(allAnswers.entries());
      
      for (const [questionIndex, answer] of answersArray) {
        try {
          if (answer.choiceId) {
            await practiceService.submitAnswer(
              attemptId,
              answer.questionId,
              answer.choiceId
            );
          } else if (answer.textAnswer) {
            await practiceService.submitAnswer(
              attemptId,
              answer.questionId,
              undefined,
              answer.textAnswer
            );
          }
        } catch (err) {
          console.error(`Failed to submit answer for question ${questionIndex}:`, err);
        }
      }

      // Navigate to practice page
      router.push("/dashboard/practice");
    } catch (err) {
      console.error("Failed to save and exit:", err);
      // Still navigate even if save fails
      router.push("/dashboard/practice");
    }
  }, [attemptId, router, getAllAnswersFromStorage]);

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
      if (showMoreMenu && !(event.target as Element).closest('.relative')) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
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
            <p className="text-gray-700 mb-6">{error || "Failed to load test"}</p>
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
    totalQuestions ?? testState.currentModule.totalQuestions ?? 0;
  
  // Debug logging
  if (totalQs === 0 || totalQs === 10) {
    console.warn("[Test Page] Suspicious totalQuestions value:", {
      totalQs,
      totalQuestions,
      currentModuleTotal: testState.currentModule.totalQuestions,
      currentModule: testState.currentModule,
      currentIndex: testState.currentQuestionIndex,
    });
  }
  
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
    <div className="flex min-h-screen bg-gray-50 px-4 md:px-5">
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
      {/* Fullscreen Warning Modal */}
      {showFullscreenWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-orange-500 text-white flex items-center justify-center text-2xl font-bold">
              {countdown > 0 ? countdown : "⚠"}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Fullscreen Required
              </h2>
              <p className="text-sm text-gray-600 mb-2">
                You must enable fullscreen mode to continue the test.
              </p>
              {countdown > 0 && (
                <p className="text-lg font-semibold text-orange-600 mb-2">
                  {countdown} seconds remaining
                </p>
              )}
              {countdown === 0 && (
                <p className="text-sm font-semibold text-red-600 mb-2">
                  Test cancelled. Redirecting...
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={handleEnterFullscreen}
                disabled={countdown === 0}
              >
                Enter Fullscreen
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 transition-all duration-300">
        <main className="flex-1">
          <div 
            className="min-h-screen flex flex-col font-noto-serif transition-all duration-300"
            style={{ fontSize: "15px", lineHeight: "24px" }}
          >
            {/* Header with dashed border */}
            <div 
              className="bg-white text-gray-800 p-2 flex justify-between items-center border-b border-gray-300 relative"
              style={{
                borderBottom: "2px dashed",
                borderImage: "repeating-linear-gradient(to right, rgb(167, 56, 87) 0%, rgb(167, 56, 87) 3.5%, transparent 3.5%, transparent 4%, rgb(249, 223, 205) 4%, rgb(249, 223, 205) 7.5%, transparent 7.5%, transparent 8%, rgb(28, 17, 103) 8%, rgb(28, 17, 103) 11.5%, transparent 11.5%, transparent 12%, rgb(94, 147, 101) 12%, rgb(94, 147, 101) 15.5%, transparent 15.5%, transparent 16%) 1 / 1 / 0 stretch"
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
                      if (remainingTimeSeconds !== null && remainingTimeSeconds <= 300) {
                        return;
                      }
                      setIsTimerHidden(true);
                    }}
                    disabled={remainingTimeSeconds !== null && remainingTimeSeconds <= 300}
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

              {/* Right side buttons */}
              <div className="flex items-center gap-4 pr-4">
                <button
                  type="button"
                  onClick={() => setShowNotesModal(true)}
                  className="relative p-2 rounded-lg transition-all duration-200 bg-gray-100 text-gray-600 hover:bg-gray-200"
                  title="Open Notes"
                >
                  <StickyNote className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsMarkupEnabled((prev) => !prev)}
                  className={`flex flex-col items-center justify-center text-xs focus:outline-none rounded-md px-2 py-1 transition-colors duration-200 ${
                    isMarkupEnabled
                      ? "text-blue-600 bg-gray-100"
                      : "text-gray-700 hover:text-blue-600 hover:bg-gray-100"
                  }`}
                  aria-label="Highlights and Notes"
                >
                  <Edit className="w-5 h-5 mb-1" />
                  Highlights & Notes
                </button>
                <div className="relative">
                  {testState.currentSection.type === "MATH" && (
                    <button
                      type="button"
                      onClick={() => setShowCalculator((prev) => !prev)}
                      className={`flex flex-col items-center justify-center text-xs focus:outline-none rounded-md px-2 py-1 transition-colors duration-200 ${
                        showCalculator
                          ? "text-blue-600 bg-gray-100"
                          : "text-gray-700 hover:text-blue-600 hover:bg-gray-100"
                      }`}
                      aria-label="Calculator"
                      title="Calculator"
                    >
                      <Calculator className="w-5 h-5 mb-1" />
                      Calculator
                    </button>
                  )}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowMoreMenu((prev) => !prev)}
                      className="flex flex-col items-center justify-center text-xs text-gray-700 hover:text-blue-600 focus:outline-none"
                      aria-label="More options"
                    >
                      <MoreVertical className="w-5 h-5 mb-1" />
                      More
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
            </div>

            {/* Main Content - 2 Column Layout with Resizable Divider */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              <div className="relative flex h-full">
                {/* Left Column: Question */}
                <div 
                  className="content-pane" 
                  style={{ 
                    width: "50%", 
                    minWidth: "20%"
                  }}
                >
                  {/* Question Index Container */}
                  <div className="mb-4">
                    <div className="question-index-container flex items-center justify-between bg-gray-200 rounded mb-2 top-0 z-5">
                      <div className="flex items-center h-full">
                        <p className="question-index font-semibold bg-black text-white text-sm h-full px-3 py-2 rounded-l">
                          {testState.currentQuestionIndex + 1}
                        </p>
                        <button
                          type="button"
                          onClick={handleToggleFlag}
                          className="flex items-center text-sm text-gray-600 hover:text-black mr-2 h-full px-2"
                        >
                          <Flag className={`w-5 h-5 text-gray-500 ${isFlagged ? "fill-orange-500 text-orange-500" : ""}`} />
                          <span className="ml-1">Mark for Review</span>
                        </button>
                      </div>
                      {question.questionType === "MULTIPLE_CHOICE" && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsEliminationMode((prev) => !prev);
                            if (isEliminationMode) {
                              setEliminatedChoices(new Set());
                            }
                          }}
                          className={`flex items-center text-sm text-gray-600 hover:text-black mr-2 h-full relative border border-gray-300 rounded-sm w-8 h-8 flex items-center justify-center bg-transparent ${
                            isEliminationMode ? "bg-blue-100" : ""
                          }`}
                        >
                          <span className="text-[12px] font-medium text-gray-600">ABC</span>
                          {isEliminationMode && (
                            <svg 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24" 
                              className="absolute w-8 h-8 text-gray-500"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M18 6L6 18" />
                            </svg>
                          )}
                        </button>
                      )}
                    </div>
                    
                    {/* Question Text */}
                    <div className="prose max-w-none mt-2">
                      <div>
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
                        />
                      </div>
                    </div>
                  </div>
                  
                </div>
                
                {/* Resizable Divider */}
                <div className="divider" style={{ left: "50%" }}></div>
                
                {/* Right Column: Passage + Choices */}
                <div 
                  className="content-pane" 
                  style={{ 
                    width: "calc(50% - 5px)", 
                    minWidth: "20%", 
                    position: "relative", 
                    left: "5px" 
                  }}
                >
                  {/* Passage */}
                  <div className="prose max-w-none mb-4">
                    <div>
                      {question.passage ? (
                        <div className="p-6">
                          <p className="text-base leading-relaxed whitespace-pre-wrap">
                            {question.passage}
                          </p>
                        </div>
                      ) : question.imageUrl ? (
                        <div className="p-6">
                          <Image
                            src={question.imageUrl}
                            alt="Question graphic"
                            width={800}
                            height={600}
                            className="w-full h-auto rounded-lg"
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>
                  
                  {/* Choices */}
                  {question.questionType === "MULTIPLE_CHOICE" && question.choices && question.choices.length > 0 && (
                    <div className="space-y-2">
                      {question.choices.map((choice, index) => {
                        const isSelected = currentAnswer.choiceId === choice.id;
                        const letter = String.fromCharCode(65 + index);
                        const isEliminated = eliminatedChoices.has(choice.id);

                        return (
                          <div key={choice.id || index} className="relative flex items-center w-full mb-2">
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
                              className={`w-full p-3 text-left border-2 rounded-lg text-base flex items-center gap-3 ${
                                isSelected
                                  ? "border-black"
                                  : isEliminated
                                  ? "border-gray-300 bg-gray-100 opacity-60"
                                  : "border-gray-200 hover:bg-gray-200 cursor-pointer"
                              }`}
                            >
                              <div className={`flex items-center justify-center w-6 h-6 rounded-full font-bold border border-black ${
                                isSelected ? "bg-black text-white" : "text-black"
                              }`}>
                                <span className="text-xs">{letter}</span>
                              </div>
                              <div className={`flex-1 ${isEliminated ? "line-through text-gray-500" : ""}`}>
                                {choice.choiceText || `Choice ${letter}`}
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
            
            {/* Footer with dashed border */}
            <div 
              className="bg-blue-100 p-2 flex justify-between items-center"
              style={{
                borderTop: "2px dashed",
                backgroundColor: "rgb(229, 235, 245)",
                borderImage: "repeating-linear-gradient(to right, rgb(167, 56, 87) 0%, rgb(167, 56, 87) 3.5%, transparent 3.5%, transparent 4%, rgb(249, 223, 205) 4%, rgb(249, 223, 205) 7.5%, transparent 7.5%, transparent 8%, rgb(28, 17, 103) 8%, rgb(28, 17, 103) 11.5%, transparent 11.5%, transparent 12%, rgb(94, 147, 101) 12%, rgb(94, 147, 101) 15.5%, transparent 15.5%, transparent 16%) 1 / 1 / 0 stretch"
              }}
            >
              <p>{currentUser?.name || currentUser?.email?.split("@")[0] || "User"}</p>
              <div 
                className="bg-black text-white p-2 flex items-center gap-2 rounded-xl cursor-pointer"
                style={{ position: "absolute", left: "50%", transform: "translateX(-50%)" }}
                onClick={() => setShowNavigator((prev) => !prev)}
              >
                <p className="text-white">Question {testState.currentQuestionIndex + 1} of {totalQs}</p>
                <button className="p-1 rounded" style={{ pointerEvents: "none" }}>
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
                    opacity: testState.currentQuestionIndex === 0 ? 0.5 : 1
                  }}
                >
                  Back
                </Button>
                {!isLastQuestion ? (
                  <Button
                    onClick={handleNext}
                    disabled={submitting}
                    className="px-4 py-2 text-white transition-opacity duration-200 rounded-md cursor-pointer"
                    style={{ backgroundColor: "rgb(51, 76, 199)", borderRadius: "30px" }}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    onClick={handleFinishSection}
                    disabled={submitting}
                    className="px-4 py-2 text-white transition-opacity duration-200 rounded-md cursor-pointer"
                    style={{ backgroundColor: "rgb(51, 76, 199)", borderRadius: "30px" }}
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
          sectionTitle={`Section ${testState.currentSection.orderIndex + 1}, Module ${testState.currentModule.moduleNumber}: ${testState.currentSection.type === "ENGLISH" ? "Reading and Writing" : "Math"} Questions`}
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
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Your Notes:</h3>
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
              <h3 className="text-sm font-medium text-gray-700 mb-2">Add Note:</h3>
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


