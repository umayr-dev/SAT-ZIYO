"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card } from "@/src/ui/card";
import { Button } from "@/src/ui/button";
import { Loading } from "@/src/ui/loading";
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
} from "lucide-react";

export default function TestTakingPage() {
  const router = useRouter();
  const params = useParams();
  // NOTE: Route segment is [testId], but here it actually represents attemptId
  const attemptId = params.testId as string;

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
  const [showNavigator, setShowNavigator] = useState(true);
  const [isMarkupEnabled, setIsMarkupEnabled] = useState(false);
  const wasFullscreenRef = useRef(false);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const loadAnswersTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastAnswersLoadRef = useRef<number>(0);
  const ANSWERS_CACHE_DURATION = 3000; // 3 seconds cache

  useEffect(() => {
    loadTestState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    
    // Cleanup on unmount
    return () => {
      if (loadAnswersTimeoutRef.current) {
        clearTimeout(loadAnswersTimeoutRef.current);
      }
    };
  }, [attemptId]);

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
  }, []);

  function startCountdown() {
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
  }

  async function handleCancelTest() {
    try {
      await practiceService.abandonAttempt(attemptId);
    } catch (err) {
      console.error("Failed to abandon attempt:", err);
    }
    router.push("/dashboard/practice");
  }

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
  }, []);

  // Preload all questions for current module - DISABLED to reduce server load
  // Instead, we'll load questions on-demand as user navigates
  async function preloadAllQuestions(moduleTotalQuestions: number, startIndex: number = 0) {
    // Don't preload - load on demand instead
    // This reduces initial server load significantly
    console.log("[Test Page] Skipping preload - will load questions on demand");
    return;
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
      
      // Set totalQuestions from current module if available
      if (state?.currentModule?.totalQuestions) {
        console.log("[Test Page] Setting totalQuestions from currentModule:", state.currentModule.totalQuestions);
        setTotalQuestions(state.currentModule.totalQuestions);
        
        // Preload all questions for this module in background
        preloadAllQuestions(state.currentModule.totalQuestions).catch(console.error);
      } else {
        console.warn("[Test Page] No totalQuestions in currentModule:", state.currentModule);
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

  // Submit answer in background (non-blocking)
  async function handleAnswer() {
    if (!testState?.question) return;

    const currentIndex = testState.currentQuestionIndex;
    const questionId = testState.question.id;
    
    // Store answer locally first
    setPendingAnswers((prev) => {
      const next = new Map(prev);
      next.set(currentIndex, {
        questionId,
        choiceId: currentAnswer.choiceId,
        textAnswer: currentAnswer.textAnswer,
      });
      return next;
    });

    // Optimistically update answered questions
    setAnsweredQuestions((prev) => {
      const next = new Set(prev);
      next.add(currentIndex);
      return next;
    });
    
    setCurrentAnswer({});

    // Submit in background (don't await)
    (async () => {
      try {
        if (testState.question.questionType === "MULTIPLE_CHOICE") {
          await practiceService.submitAnswer(
            attemptId,
            questionId,
            currentAnswer.choiceId
          );
        } else {
          await practiceService.submitAnswer(
            attemptId,
            questionId,
            undefined,
            currentAnswer.textAnswer || ""
          );
        }
        
        // Remove from pending after successful submit
        setPendingAnswers((prev) => {
          const next = new Map(prev);
          next.delete(currentIndex);
          return next;
        });
      } catch (err) {
        console.error("Failed to submit answer:", err);
        // Keep in pending for retry later
      }
    })();
  }

  async function handleNext() {
    if (!testState?.question) return;

    try {
      setSubmitting(true);
      
      // Submit current answer
      await handleAnswer();
      
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
        setSubmitting(false);
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
        setSubmitting(false);
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
      await handleAnswer();
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
            
            // Preload all questions for new module
            preloadAllQuestions(nextState.currentModule.totalQuestions).catch(console.error);
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

  function handleAnswerChange(answer: { choiceId?: string; textAnswer?: string }) {
    setCurrentAnswer(answer);
  }

  function getProgress() {
    const total =
      totalQuestions ?? testState?.currentModule?.totalQuestions ?? 0;
    if (!total) return 0;
    return Math.round((answeredQuestions.size / total) * 100);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  if (error || !testState?.question) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-red-700 mb-2">
                {error ? "Error Loading Test" : "Test Not Available"}
              </h2>
              <p className="text-red-700">
                {error || "Test not found or no current question"}
              </p>
            </div>
            
            {testState && !testState.question && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Debug Info:</strong> Test state loaded but no question found.
                  <br />
                  Attempt ID: {attemptId}
                  <br />
                  Test Title: {testState.testTitle || "N/A"}
                  <br />
                  Current Module: {testState.currentModule?.moduleNumber || "N/A"}
                  <br />
                  Question Index: {testState.currentQuestionIndex ?? "N/A"}
                </p>
              </div>
            )}
            
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

  const handleTimeUp = async () => {
    await handleFinishSection();
  };

  return (
    <div className="min-h-screen bg-gray-50">
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

      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              Section {testState.currentSection.orderIndex + 1}, Module{" "}
              {testState.currentModule.moduleNumber}:{" "}
              {testState.currentSection.type === "ENGLISH"
                ? "Reading and Writing"
                : "Math"}
            </h1>
            <p className="text-xs text-blue-600 mt-0.5">Directions</p>
          </div>
          <div className="flex items-center gap-3">
            <TestTimer
              durationSeconds={testState.currentModule.duration * 60}
              onTimeUp={handleTimeUp}
            />
            <button
              type="button"
              onClick={() => setIsMarkupEnabled((prev) => !prev)}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-xs ${
                isMarkupEnabled
                  ? "bg-yellow-100 border-yellow-500 text-yellow-900"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Highlighter className="w-4 h-4" />
              <span>Markup</span>
            </button>
            {testState.currentSection.type === "MATH" && (
              <button
                type="button"
                onClick={() => setShowCalculator(true)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white text-xs text-gray-700 hover:bg-gray-50"
              >
                <Calculator className="w-4 h-4" />
                <span>Calculator</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content - 2 Column Layout */}
      <div className="flex h-[calc(100vh-73px)]">
        {/* Left Column: Passage + Question Text */}
        <div className="w-1/2 border-r border-gray-200 overflow-y-auto bg-white">
          {/* Passage */}
          {question.passage && (
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">
                PASSAGE
              </h3>
              <div className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">
                {question.passage}
              </div>
            </div>
          )}
          {question.imageUrl && (
            <div className="p-6 border-b border-gray-200">
              <img
                src={question.imageUrl}
                alt="Question graphic"
                className="w-full h-auto rounded-lg"
              />
            </div>
          )}
          
          {/* Question Text */}
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded bg-black text-white flex items-center justify-center text-sm font-semibold">
                {testState.currentQuestionIndex + 1}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleFlag}
                className={isFlagged ? "text-orange-600" : "text-gray-600"}
              >
                <Flag className={`w-4 h-4 mr-1 ${isFlagged ? "fill-orange-500" : ""}`} />
                {isFlagged ? "Unmark" : "Mark"}
              </Button>
            </div>
            
            {/* Question Text with Markup */}
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

        {/* Right Column: Choices Only */}
        <div className="w-1/2 overflow-y-auto bg-gray-50">
          <div className="p-6 space-y-4">
            {/* Choices */}
            {question.questionType === "MULTIPLE_CHOICE" && question.choices && question.choices.length > 0 ? (
              <div className="space-y-3">
                {question.choices.map((choice, index) => {
                  const isSelected = currentAnswer.choiceId === choice.id;
                  const letter = String.fromCharCode(65 + index); // A, B, C, D

                  return (
                    <button
                      key={choice.id || index}
                      onClick={() =>
                        handleAnswerChange({
                          choiceId: choice.id,
                          textAnswer: currentAnswer.textAnswer,
                        })
                      }
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        isSelected
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                            isSelected
                              ? "bg-blue-500 text-white"
                              : "bg-gray-200 text-gray-700"
                          }`}
                        >
                          {letter}
                        </span>
                        <span className="flex-1 text-gray-900">
                          {choice.choiceText || `Choice ${letter}`}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : question.questionType === "STUDENT_PRODUCED" ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter your answer:
                  </label>
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                  />
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800 font-medium mb-1">
                    💡 Tips:
                  </p>
                  <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                    <li>Enter only the numerical answer</li>
                    <li>Use &quot;/&quot; for fractions (e.g., 3/4)</li>
                    <li>Use &quot;.&quot; for decimals (e.g., 0.75)</li>
                    <li>Use &quot;-&quot; for negative numbers (e.g., -5)</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠ No choices available for this question
                </p>
              </div>
            )}

            {/* Navigation Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Question {testState.currentQuestionIndex + 1} of {totalQs}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={testState.currentQuestionIndex === 0 || submitting}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
                {!isLastQuestion && (
                  <Button onClick={handleNext} disabled={submitting}>
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
                {isLastQuestion && (
                  <Button
                    onClick={handleFinishSection}
                    variant="destructive"
                    disabled={submitting}
                  >
                    Finish Section
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Question Navigator bar */}
      {showNavigator && (
        <div className="fixed bottom-10 left-0 right-0 z-30 bg-white border-t border-gray-200 shadow-inner max-h-[220px] overflow-y-auto px-4 py-3">
          <QuestionNavigator
            totalQuestions={totalQs}
            currentIndex={testState.currentQuestionIndex}
            answeredSet={answeredQuestions}
            flaggedSet={flaggedQuestions}
            onJump={handleJumpToQuestion}
          />
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 border-t border-gray-200 px-4 py-2 flex items-center justify-between">
        <div className="text-xs text-gray-600">
          Question {testState.currentQuestionIndex + 1} of {totalQs}
        </div>
        <button
          type="button"
          onClick={() => setShowNavigator((prev) => !prev)}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-full shadow-sm bg-gray-900 text-white text-xs hover:bg-gray-800"
        >
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[10px] font-semibold">
            {testState.currentQuestionIndex + 1}/{totalQs}
          </span>
          <Grid3X3 className="w-4 h-4" />
          <span>{showNavigator ? "Hide" : "Questions"}</span>
        </button>
      </div>
    </div>
  );
}


